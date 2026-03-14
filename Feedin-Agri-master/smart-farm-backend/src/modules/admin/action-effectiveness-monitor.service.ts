import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActionLog } from '../../entities/action-log.entity';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { Sensor } from '../../entities/sensor.entity';
import { Device } from '../../entities/device.entity';
import { Farm } from '../farms/farm.entity';
import { Notification } from '../../entities/notification.entity';
import { AdminNotificationsService } from './admin-notifications.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * ActionEffectivenessMonitor
 * 
 * SMART MONITORING: After a device acknowledges an action (status = 'ack'),
 * this service monitors whether the related sensor readings actually changed
 * in the expected direction within a configurable timeframe.
 * 
 * If the readings DON'T change → the action didn't work in real life:
 *   - Farmer gets a specific WARNING notification with details
 *   - Admin gets a notification with full user + farm + device context
 * 
 * This catches real-world failures like:
 *   - Broken actuators (valve stuck, pump burned out)
 *   - Wiring disconnections
 *   - Sensor drift / incorrect calibration
 *   - Software acknowledged but hardware didn't execute
 */

interface TrackedAction {
  actionLogId: number;
  actionId: string;
  deviceId: string;
  sensorId: string | null;
  sensorType: string | null;
  farmId: string;
  triggerValue: number | null;     // The sensor value that triggered the action
  violationType: string | null;    // 'above_max_critical', 'below_min_critical', etc.
  actionUri: string;               // What command was sent
  ackedAt: Date;                   // When the device acknowledged
  checkAfter: Date;                // When to check effectiveness
  checked: boolean;
}

@Injectable()
export class ActionEffectivenessMonitor {
  private readonly logger = new Logger(ActionEffectivenessMonitor.name);

  // In-memory tracking of actions awaiting effectiveness check
  private trackedActions: Map<number, TrackedAction> = new Map();

  // How long to wait after ACK before checking sensor readings (in minutes)
  private readonly CHECK_DELAY_MINUTES = 30;

  // Minimum reading change percentage to consider the action "effective"
  private readonly MIN_CHANGE_PERCENT = 5;

  constructor(
    @InjectRepository(ActionLog)
    private readonly actionLogRepo: Repository<ActionLog>,
    @InjectRepository(SensorReading)
    private readonly readingRepo: Repository<SensorReading>,
    @InjectRepository(Sensor)
    private readonly sensorRepo: Repository<Sensor>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
    private readonly eventEmitter: EventEmitter2,
    private readonly adminNotifications: AdminNotificationsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ========================================
  // STEP 1: Track acknowledged actions
  // ========================================

  /**
   * When an action is acknowledged by a device, start tracking it
   * to verify the sensor readings actually change.
   */
  @OnEvent('action.acknowledged')
  async handleActionAcknowledged(data: any) {
    try {
      const actionLogId = data.actionLogId || data.id;
      if (!actionLogId) return;

      // Load the full action log to get sensor context
      const actionLog = await this.actionLogRepo.findOne({
        where: { id: actionLogId },
      });

      if (!actionLog || !actionLog.sensor_id) {
        // No sensor context — can't verify effectiveness
        return;
      }

      const checkAfter = new Date(Date.now() + this.CHECK_DELAY_MINUTES * 60 * 1000);

      const tracked: TrackedAction = {
        actionLogId: actionLog.id,
        actionId: actionLog.action_id || `action-${actionLog.id}`,
        deviceId: actionLog.device_id,
        sensorId: actionLog.sensor_id,
        sensorType: actionLog.sensor_type,
        farmId: '', // Will be resolved from device
        triggerValue: actionLog.value,
        violationType: actionLog.violation_type,
        actionUri: actionLog.action_uri,
        ackedAt: actionLog.ack_at || new Date(),
        checkAfter,
        checked: false,
      };

      // Resolve farm_id from device
      const device = await this.deviceRepo.findOne({
        where: { device_id: actionLog.device_id },
      });
      if (device) {
        tracked.farmId = device.farm_id;
      }

      this.trackedActions.set(actionLog.id, tracked);
      this.logger.log(
        `📋 Tracking action #${actionLog.id} on sensor ${actionLog.sensor_id} ` +
        `(${actionLog.sensor_type}). Will check effectiveness at ${checkAfter.toISOString()}`
      );
    } catch (error) {
      this.logger.error('Failed to track acknowledged action:', error);
    }
  }

  // ========================================
  // STEP 2: Also track action failures immediately  
  // ========================================

  /**
   * When an action fails (error, timeout), immediately notify the farmer
   * with specific, actionable information.
   */
  @OnEvent('action.failed')
  async handleActionFailed(data: any) {
    await this.notifyFarmerAboutFailure(data, 'failed');
  }

  @OnEvent('action.timeout')
  async handleActionTimeout(data: any) {
    await this.notifyFarmerAboutFailure(data, 'timeout');
  }

  private async notifyFarmerAboutFailure(data: any, failureType: 'failed' | 'timeout') {
    try {
      const deviceId = data.deviceId || data.device_id;
      if (!deviceId) return;

      // Get device + farm + owner info
      const device = await this.deviceRepo.findOne({
        where: { device_id: deviceId },
      });
      if (!device) return;

      const farm = await this.farmRepo.findOne({
        where: { farm_id: device.farm_id },
      });
      if (!farm) return;

      const ownerId = farm.owner_id;
      const errorMsg = data.error || data.message || data.error_message || 'Unknown error';
      const actionUri = data.action_uri || data.actionUri || 'Unknown action';
      const sensorType = data.sensor_type || data.sensorType || '';
      const sensorId = data.sensor_id || data.sensorId || '';

      // Build specific failure message based on type
      let title: string;
      let message: string;

      if (failureType === 'timeout') {
        title = `⏱️ Action Timeout — ${device.name}`;
        message = `The command "${actionUri}" was sent to device "${device.name}" ` +
          `but the device did not respond within the expected time. ` +
          `This could mean the device is offline or the network is unstable. ` +
          (sensorType ? `Related sensor: ${sensorType} (${sensorId}).` : '');
      } else {
        title = `❌ Action Failed — ${device.name}`;
        message = `The command "${actionUri}" sent to device "${device.name}" ` +
          `failed with error: "${errorMsg}". ` +
          `Please check the device hardware and connection. ` +
          (sensorType ? `Related sensor: ${sensorType} (${sensorId}).` : '');
      }

      // Notify the FARMER (user notification)
      if (ownerId) {
        await this.notificationsService.create({
          user_id: ownerId,
          level: 'warning',
          source: 'action',
          title,
          message,
          context: {
            deviceId: device.device_id,
            deviceName: device.name,
            farmId: farm.farm_id,
            farmName: farm.name,
            sensorId,
            sensorType,
            actionUri,
            error: errorMsg,
            failureType,
          },
        });
      }

      this.logger.warn(`🔔 Farmer ${ownerId} notified about ${failureType} on device ${device.name}`);
    } catch (error) {
      this.logger.error('Failed to notify farmer about action failure:', error);
    }
  }

  // ========================================
  // STEP 3: Check effectiveness of tracked actions (every 5 minutes)
  // ========================================

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkActionEffectiveness() {
    const now = new Date();
    const actionsToCheck: TrackedAction[] = [];

    // Find actions ready for effectiveness check
    for (const [id, tracked] of this.trackedActions.entries()) {
      if (!tracked.checked && now >= tracked.checkAfter) {
        actionsToCheck.push(tracked);
      }
    }

    if (actionsToCheck.length === 0) return;

    this.logger.log(`🔍 Checking effectiveness of ${actionsToCheck.length} tracked action(s)...`);

    for (const tracked of actionsToCheck) {
      try {
        await this.evaluateEffectiveness(tracked);
        tracked.checked = true;
      } catch (error) {
        this.logger.error(`Failed to evaluate effectiveness for action #${tracked.actionLogId}:`, error);
        tracked.checked = true; // Mark as checked to avoid infinite retries
      }
    }

    // Cleanup old tracked actions (older than 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    for (const [id, tracked] of this.trackedActions.entries()) {
      if (tracked.ackedAt < twoHoursAgo) {
        this.trackedActions.delete(id);
      }
    }
  }

  /**
   * Evaluate whether a specific action actually worked by comparing
   * sensor readings before and after the action.
   */
  private async evaluateEffectiveness(tracked: TrackedAction): Promise<void> {
    if (!tracked.sensorId) return;

    // Get the sensor to understand thresholds and expected behavior
    const sensor = await this.sensorRepo.findOne({
      where: { sensor_id: tracked.sensorId },
    });
    if (!sensor) return;

    // Get the reading at the time of action
    const readingAtAction = tracked.triggerValue;
    if (readingAtAction === null || readingAtAction === undefined) return;

    // Get the latest reading AFTER the action was acknowledged
    const latestReading = await this.readingRepo.findOne({
      where: {
        sensor_id: tracked.sensorId,
        created_at: MoreThan(tracked.ackedAt),
      },
      order: { created_at: 'DESC' },
    });

    if (!latestReading) {
      // No readings since the action — sensor might be offline
      await this.reportIneffectiveAction(tracked, sensor, {
        reason: 'no_readings',
        detail: `No sensor readings received since the action was acknowledged at ${tracked.ackedAt.toISOString()}. The sensor may be offline or disconnected.`,
        triggerValue: readingAtAction,
        currentValue: null,
      });
      return;
    }

    const currentValue = latestReading.value1;
    if (currentValue === null || currentValue === undefined) return;

    // Determine expected direction of change based on violation type
    const changePercent = Math.abs(((currentValue - readingAtAction) / readingAtAction) * 100);
    let actionWorked = false;

    switch (tracked.violationType) {
      case 'above_max_critical':
      case 'above_max_warning':
        // Value was too HIGH → action should LOWER it
        actionWorked = currentValue < readingAtAction && changePercent >= this.MIN_CHANGE_PERCENT;
        break;

      case 'below_min_critical':
      case 'below_min_warning':
        // Value was too LOW → action should RAISE it
        actionWorked = currentValue > readingAtAction && changePercent >= this.MIN_CHANGE_PERCENT;
        break;

      default:
        // General action — any significant change means it worked
        actionWorked = changePercent >= this.MIN_CHANGE_PERCENT;
        break;
    }

    if (!actionWorked) {
      const direction = tracked.violationType?.includes('above') ? 'decrease' : 
                        tracked.violationType?.includes('below') ? 'increase' : 'change';
      
      await this.reportIneffectiveAction(tracked, sensor, {
        reason: 'no_change',
        detail: `After ${this.CHECK_DELAY_MINUTES} minutes, the ${sensor.type} reading ` +
          `has not shown a significant ${direction}. ` +
          `Value at action: ${readingAtAction}${sensor.unit || ''} → ` +
          `Current: ${currentValue}${sensor.unit || ''} ` +
          `(${changePercent.toFixed(1)}% change, minimum required: ${this.MIN_CHANGE_PERCENT}%).`,
        triggerValue: readingAtAction,
        currentValue: currentValue,
      });
    } else {
      this.logger.log(
        `✅ Action #${tracked.actionLogId} effective! ` +
        `${sensor.type}: ${readingAtAction} → ${currentValue} (${changePercent.toFixed(1)}% change)`
      );
    }
  }

  /**
   * Report an ineffective action to both the farmer and the admin
   */
  private async reportIneffectiveAction(
    tracked: TrackedAction,
    sensor: Sensor,
    analysis: {
      reason: 'no_change' | 'no_readings';
      detail: string;
      triggerValue: number;
      currentValue: number | null;
    }
  ): Promise<void> {
    this.logger.warn(
      `⚠️ Action #${tracked.actionLogId} INEFFECTIVE on ${sensor.type} ` +
      `(${tracked.sensorId}): ${analysis.reason}`
    );

    // Get device and farm info for full context
    const device = await this.deviceRepo.findOne({
      where: { device_id: tracked.deviceId },
    });

    const farm = device
      ? await this.farmRepo.findOne({ where: { farm_id: device.farm_id } })
      : null;

    const deviceName = device?.name || tracked.deviceId;
    const farmName = farm?.name || tracked.farmId;
    const ownerId = farm?.owner_id;

    // ========================================
    // NOTIFY THE FARMER (User Notification)
    // ========================================
    if (ownerId) {
      const farmerTitle = analysis.reason === 'no_readings'
        ? `🔇 No Sensor Response — ${sensor.type} on ${deviceName}`
        : `⚠️ Action Not Effective — ${sensor.type} on ${deviceName}`;

      const farmerMessage = analysis.reason === 'no_readings'
        ? `The command "${tracked.actionUri}" was successfully sent to and acknowledged by ` +
          `device "${deviceName}", but no sensor readings were received afterwards. ` +
          `Please check:\n` +
          `• Is the sensor "${sensor.type}" still physically connected?\n` +
          `• Is the device "${deviceName}" still powered on?\n` +
          `• Check for loose wires or damaged cables on farm "${farmName}".`
        : `The command "${tracked.actionUri}" was sent to device "${deviceName}" and the device ` +
          `confirmed it received the command. However, after ${this.CHECK_DELAY_MINUTES} minutes ` +
          `the ${sensor.type} reading hasn't changed significantly.\n\n` +
          `📊 ${sensor.type}: ${analysis.triggerValue}${sensor.unit || ''} → ` +
          `${analysis.currentValue}${sensor.unit || ''}\n\n` +
          `This usually means the actuator didn't work. Please check:\n` +
          `• Is the valve/pump/relay physically functioning?\n` +
          `• Check for blockages, burned-out motors, or stuck valves\n` +
          `• Verify wiring connections on farm "${farmName}"`;

      await this.notificationsService.create({
        user_id: ownerId,
        level: 'warning',
        source: 'action',
        title: farmerTitle,
        message: farmerMessage,
        context: {
          type: 'action_ineffective',
          deviceId: tracked.deviceId,
          deviceName,
          farmId: tracked.farmId,
          farmName,
          sensorId: tracked.sensorId,
          sensorType: sensor.type,
          actionUri: tracked.actionUri,
          violationType: tracked.violationType,
          triggerValue: analysis.triggerValue,
          currentValue: analysis.currentValue,
          unit: sensor.unit,
          checkDelayMinutes: this.CHECK_DELAY_MINUTES,
          actionLogId: tracked.actionLogId,
          reason: analysis.reason,
        },
      });
    }

    // ========================================
    // NOTIFY THE ADMIN (Admin Notification)
    // ========================================
    await this.adminNotifications.create({
      type: 'action_ineffective',
      severity: 'warning',
      domain: 'automation',
      title: `Action Ineffective — ${sensor.type} on ${deviceName}`,
      message: analysis.detail + ` Farm: "${farmName}".` +
        (ownerId ? ` Farm owner has been notified.` : ' Unable to identify farm owner for notification.'),
      context: {
        // Device context
        deviceId: tracked.deviceId,
        deviceName,
        // Farm context
        farmId: tracked.farmId,
        farmName,
        // Sensor context
        sensorId: tracked.sensorId,
        sensorType: sensor.type,
        sensorUnit: sensor.unit,
        // Action context
        actionUri: tracked.actionUri,
        actionLogId: tracked.actionLogId,
        violationType: tracked.violationType,
        // Readings comparison
        triggerValue: analysis.triggerValue,
        currentValue: analysis.currentValue,
        changePercent: analysis.currentValue !== null
          ? Math.abs(((analysis.currentValue - analysis.triggerValue) / analysis.triggerValue) * 100).toFixed(1)
          : 'N/A',
        // User context
        userId: ownerId,
        farmerNotified: !!ownerId,
        // Analysis
        reason: analysis.reason,
        checkDelayMinutes: this.CHECK_DELAY_MINUTES,
        ackedAt: tracked.ackedAt.toISOString(),
        suggestedActions: [
          'Contact the farm operator to check hardware',
          `Verify ${sensor.type} sensor calibration`,
          `Check actuator wiring on device "${deviceName}"`,
          'Review action logs for recurring failures',
          'Consider dispatching maintenance team',
        ],
      },
    });
  }
}
