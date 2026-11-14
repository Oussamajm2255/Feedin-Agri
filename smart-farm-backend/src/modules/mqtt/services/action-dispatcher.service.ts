// src/modules/mqtt/services/action-dispatcher.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionLog } from '../../../entities/action-log.entity';
import { Device } from '../../../entities/device.entity';
import { Farm } from '../../farms/farm.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ThresholdViolation } from './threshold-monitor.service';
import { MqttConnectionService } from '../mqtt-connection.service'; // Add this import

export interface ActionContext {
  sensorId: string;
  sensorType: string;
  deviceId: string;
  value: number;
  unit: string;
  violationType?: string;
  timestamp: Date;
}

export interface ActionResult {
  success: boolean;
  action: string;
  context: ActionContext;
  executedAt: Date;
  error?: string;
}

@Injectable()
export class ActionDispatcherService {
  private readonly logger = new Logger(ActionDispatcherService.name);
  // Minimum gap between identical automatic (threshold-triggered) commands to
  // the same device. Manual commands from the dashboard are not throttled.
  private readonly autoActionCooldownMs = Number(process.env.AUTO_ACTION_COOLDOWN_MS) || 5 * 60 * 1000;
  private readonly lastAutoAction = new Map<string, number>();

  constructor(
    private eventEmitter: EventEmitter2,
    private mqttConnectionService: MqttConnectionService, // Add MQTT service
    @InjectRepository(ActionLog) private readonly actionLogRepo: Repository<ActionLog>,
    @InjectRepository(Device) private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Farm) private readonly farmRepo: Repository<Farm>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Execute an action with context
   */
  async executeAction(action: string, context: ActionContext): Promise<ActionResult> {
    const result: ActionResult = {
      success: false,
      action,
      context,
      executedAt: new Date()
    };

    try {
      this.logger.log(`⚙️ Executing action: ${action}`, context);

      // Parse and execute the action
      const success = await this.processAction(action, context);
      
      result.success = success;
      
      // Emit action execution event
      this.eventEmitter.emit('action.executed', result);
      
      // The farmer notification for this result is created by
      // ActionNotificationsService (listens to 'action.executed'); creating
      // one here as well produced two notifications per command.
      if (success) {
        this.logger.log(`✅ Action executed successfully: ${action}`);
      } else {
        this.logger.warn(`⚠️ Action execution failed: ${action}`);
      }

    } catch (error) {
      result.error = error.message;
      this.logger.error(`❌ Error executing action: ${action}`, error);
      this.eventEmitter.emit('action.failed', result);
    }

    return result;
  }

  /**
   * Process different types of actions
   */
  private async processAction(action: string, context: ActionContext): Promise<boolean> {
    // Only the scheme is case-insensitive. MQTT topics are case-sensitive:
    // lowercasing the whole URI turned smartfarm/actuators/dht11H/... into
    // .../dht11h/..., which the device (id "dht11H") never receives.
    const { scheme: actionType, param: actionParam } = this.splitActionUri(action);
    const lowerParam = actionParam?.toLowerCase();

    switch (actionType) {
      case 'alert':
        return this.sendAlert(lowerParam || 'general', context);

      case 'email':
        return this.sendEmail(actionParam, context);

      case 'sms':
        return this.sendSMS(actionParam, context);

      case 'actuator':
        return this.controlActuator(lowerParam, context);

      case 'webhook':
        return this.callWebhook(actionParam, context);

      case 'log':
        return this.logAction(lowerParam || 'info', context);
      
      case 'mqtt':
        // Handle multiple topics separated by commas
        const topics = actionParam ? actionParam.split(',').map(topic => topic.trim()) : [];
        const actionType = this.classifyAutomatedActionType(context, actionParam);
        
        // Execute all topics and return true only if all succeed
        const results = await Promise.all(
          topics.map(topic => this.publishMqttMessage(topic, context, actionType))
        );
        
        return results.every(result => result === true);
      
      default:
        this.logger.warn(`Unknown action type: ${actionType}`);
        return false;
    }
  }

  /**
   * Split "scheme:param" keeping the param's case (topics, URLs, emails).
   */
  private splitActionUri(uri: string): { scheme: string; param: string | undefined } {
    const sep = uri.indexOf(':');
    if (sep === -1) return { scheme: uri.trim().toLowerCase(), param: undefined };
    return { scheme: uri.slice(0, sep).trim().toLowerCase(), param: uri.slice(sep + 1).trim() };
  }

  /**
   * Send alert notification
   */
  private async sendAlert(alertType: string, context: ActionContext): Promise<boolean> {
    this.logger.log(`📢 Sending ${alertType} alert for ${context.sensorType}`);
    
    const alertData = {
      type: alertType,
      message: this.generateAlertMessage(context),
      context,
      timestamp: new Date()
    };

    this.eventEmitter.emit('alert.sent', alertData);
    return true;
  }

  /**
   * Send email notification
   */
  private async sendEmail(recipient: string, context: ActionContext): Promise<boolean> {
    this.logger.log(`📧 Sending email to: ${recipient}`);
    
    // Future: Integrate with email service (SendGrid, AWS SES, etc.)
    const emailData = {
      to: recipient,
      subject: `Smart Farm Alert: ${context.sensorType} Threshold Violation`,
      body: this.generateAlertMessage(context),
      context
    };

    this.eventEmitter.emit('email.queued', emailData);
    return true;
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(phoneNumber: string, context: ActionContext): Promise<boolean> {
    this.logger.log(`📱 Sending SMS to: ${phoneNumber}`);
    
    // Future: Integrate with SMS service (Twilio, AWS SNS, etc.)
    const smsData = {
      to: phoneNumber,
      message: this.generateShortAlertMessage(context),
      context
    };

    this.eventEmitter.emit('sms.queued', smsData);
    return true;
  }

  /**
   * Control actuator device
   */
  private async controlActuator(actuatorCommand: string, context: ActionContext): Promise<boolean> {
    this.logger.log(`🔧 Controlling actuator: ${actuatorCommand}`);
    
    // Future: Integrate with actuator control system
    const actuatorData = {
      command: actuatorCommand,
      deviceId: context.deviceId,
      trigger: context,
      timestamp: new Date()
    };

    this.eventEmitter.emit('actuator.command', actuatorData);
    return true;
  }

  /**
   * Call external webhook
   */
  private async callWebhook(url: string, context: ActionContext): Promise<boolean> {
    this.logger.log(`🔗 Calling webhook: ${url}`);
    
    // Future: Make HTTP request to webhook URL
    const webhookData = {
      url,
      payload: {
        event: 'threshold_violation',
        sensor: context.sensorType,
        value: context.value,
        unit: context.unit,
        timestamp: context.timestamp
      },
      context
    };

    this.eventEmitter.emit('webhook.called', webhookData);
    return true;
  }

  /**
   * Log action with specific level
   */
  private async logAction(level: string, context: ActionContext): Promise<boolean> {
    const message = `Action Log [${level.toUpperCase()}]: ${this.generateAlertMessage(context)}`;
    
    switch (level.toLowerCase()) {
      case 'error':
        this.logger.error(message);
        break;
      case 'warn':
        this.logger.warn(message);
        break;
      case 'debug':
        this.logger.debug(message);
        break;
      default:
        this.logger.log(message);
    }

    return true;
  }

  /**
   * Publish MQTT message with production-ready QoS and Retain strategies
   */
  private async publishMqttMessage(topic: string, context: ActionContext, actionType: 'critical' | 'important' | 'normal' = 'normal', frontendActionId?: string): Promise<boolean> {
    try {
      this.logger.log(`📡 Publishing MQTT message to: ${topic} (Type: ${actionType})`);
      
      // Extract the actual action command from the topic
      // Gets "fan_on" from "smartfarm/actuators/dht11H/fan_on". Commands are
      // matched lowercase; only the topic itself keeps its case.
      const actionCommand = (topic.split('/').pop() || '').toLowerCase();
      
      // Use frontend action ID if provided, otherwise generate one
      const actionId = frontendActionId || `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (frontendActionId) {
        this.logger.log(`🆔 Using frontend action ID: ${frontendActionId}`);
      } else {
        this.logger.log(`🆔 Generated backend action ID: ${actionId}`);
      }
      
      // Create the message payload with enhanced metadata
      const messagePayload = {
        event: 'action_triggered',
        actionId, // Unique identifier for this action
        sensor: context.sensorType,
        sensorId: context.sensorId,
        deviceId: context.deviceId,
        value: context.value,
        unit: context.unit,
        violationType: context.violationType,
        timestamp: context.timestamp.toISOString(),
        action: actionCommand,
        actionType, // Criticality level
        requiresConfirmation: this.requiresConfirmation(actionCommand),
        retryCount: 0,
        maxRetries: this.getMaxRetries(actionType)
      };

      // Log queued action before publish
      const queued = this.actionLogRepo.create({
        trigger_source: 'auto',
        device_id: context.deviceId,
        sensor_id: context.sensorId,
        sensor_type: context.sensorType,
        value: context.value,
        unit: context.unit,
        violation_type: context.violationType || null,
        action_uri: `mqtt:${topic}`,
        status: 'queued',
        topic,
        payload: messagePayload,
        action_id: actionId,
        action_type: actionType,
        qos_level: this.getQosLevel(actionType),
        retain_flag: this.getRetainFlag(actionType)
      });
      const saved = await this.actionLogRepo.save(queued);

      try {
        // Publish with production-ready settings
        await this.mqttConnectionService.publishAction(topic, JSON.stringify(messagePayload), actionType);
        
        await this.actionLogRepo.update(saved.id, { 
          status: 'sent',
          sent_at: new Date()
        });
        
        this.logger.log(`✅ MQTT message published successfully to ${topic} [${saved.id}] (QoS: ${this.getQosLevel(actionType)}, Retain: ${this.getRetainFlag(actionType)})`);
        
        // Set up confirmation timeout for critical actions or actions requiring confirmation
        if (actionType === 'critical' || this.requiresConfirmation(actionCommand)) {
          this.setupConfirmationTimeout(saved.id.toString(), actionId, actionCommand, context.deviceId);
        } else {
          // For actions that don't require confirmation, mark as successful after a short delay
          // This allows the device to receive and process the action
          const timeoutId = setTimeout(async () => {
            // Check if action is still in 'sent' status (not already processed by device)
            const currentAction = await this.actionLogRepo.findOne({ where: { id: saved.id } });
            if (currentAction && currentAction.status === 'sent') {
              await this.actionLogRepo.update(saved.id, { 
                status: 'ack',
                ack_at: new Date()
              });
              
              this.logger.log(`✅ Action ${actionId} marked as successful (no confirmation required)`);
              
              // Emit success event
              this.eventEmitter.emit('action.acknowledged', {
                actionId,
                deviceId: context.deviceId,
                status: 'success',
                actionLogId: saved.id
              });
            } else {
              this.logger.log(`ℹ️ Action ${actionId} already processed by device, skipping timeout success`);
            }
          }, 2000); // 2 second delay to allow device processing
          
          // Store timeout ID for potential cancellation (optional enhancement)
          // this.pendingTimeouts.set(actionId, timeoutId);
        }
        
        // Emit event for other services
        this.eventEmitter.emit('mqtt.published', {
          topic,
          message: messagePayload,
          context,
          actionId,
          actionType
        });

        return true;

      } catch (publishError) {
        // Update status to failed
        await this.actionLogRepo.update(saved.id, { 
          status: 'failed',
          error_message: publishError.message,
          failed_at: new Date()
        });
        
        this.logger.error(`❌ Failed to publish MQTT message to ${topic}:`, publishError);
        throw publishError;
      }

    } catch (error) {
      this.logger.error(`❌ Error publishing MQTT message to ${topic}:`, error);
      return false;
    }
  }

  /**
   * Determine if action requires confirmation based on command
   */
  private requiresConfirmation(actionCommand: string): boolean {
    const confirmationRequired = [
      'irrigation_on', 'heater_on', 'open_roof', 'close_roof', 
      'restart_device', 'alarm_on', 'calibrate_sensors'
    ];
    return confirmationRequired.includes(actionCommand);
  }

  /**
   * Get QoS level based on action type
   */
  private getQosLevel(actionType: 'critical' | 'important' | 'normal'): number {
    switch (actionType) {
      case 'critical': return 2; // Exactly once
      case 'important': return 1; // At least once
      case 'normal': return 1; // At least once
      default: return 1;
    }
  }

  /**
   * Get retain flag based on action type
   */
  private getRetainFlag(_actionType: 'critical' | 'important' | 'normal'): boolean {
    // Commands are never retained (see MqttConnectionService.getActionPublishOptions);
    // this value is only recorded in action_logs.
    return false;
  }

  /**
   * Get max retries based on action type
   */
  private getMaxRetries(actionType: 'critical' | 'important' | 'normal'): number {
    switch (actionType) {
      case 'critical': return 3;
      case 'important': return 2;
      case 'normal': return 1;
      default: return 1;
    }
  }

  /**
   * Set up confirmation timeout for critical actions
   */
  private setupConfirmationTimeout(actionLogId: string, actionId: string, actionCommand: string, deviceId: string): void {
    const timeoutMs = 30000; // 30 seconds timeout
    
    setTimeout(async () => {
      try {
        const actionLog = await this.actionLogRepo.findOne({ where: { id: parseInt(actionLogId) } });
        
        if (actionLog && actionLog.status === 'sent') {
          // No confirmation received within timeout
          await this.actionLogRepo.update(actionLogId, {
            status: 'timeout',
            timeout_at: new Date(),
            error_message: 'Confirmation timeout - no response from device'
          });
          
          this.logger.warn(`⏰ Action confirmation timeout for ${actionCommand} on device ${deviceId} [${actionLogId}]`);
          
          // Emit timeout event for notifications
          this.eventEmitter.emit('action.timeout', {
            actionId,
            actionCommand,
            deviceId,
            actionLogId
          });
        }
      } catch (error) {
        this.logger.error(`Error handling confirmation timeout for action ${actionId}:`, error);
      }
    }, timeoutMs);
  }

  /**
   * Public manual execution with logging (for API-triggered actions)
   */
  async executeManual(actionUri: string, context: ActionContext, actionType: 'critical' | 'important' | 'normal' = 'normal', frontendActionId?: string): Promise<boolean> {
    // Expecting actionUri like 'mqtt:smartfarm/actuators/<device>/<action>' or 'mqtt:topic1,topic2,topic3'
    const { scheme, param } = this.splitActionUri(actionUri);
    if (scheme !== 'mqtt') {
      // Fallback to generic executor (non-MQTT action types)
      return (await this.executeAction(actionUri, context)).success;
    }
    // Keep the topic's case (MQTT topics are case-sensitive).
    const topicString = param ?? '';
    
    // Handle multiple topics separated by commas
    const topics = topicString.split(',').map(topic => topic.trim());
    
    // Auto-classify action type if not provided
    const finalActionType = this.classifyActionType(actionUri, actionType);
    
    this.logger.log(`🔧 Manual action execution: ${actionUri} (Type: ${finalActionType})`);
    this.logger.log(`📋 Context: ${JSON.stringify(context)}`);
    this.logger.log(`📡 Topics to execute: ${topics.join(', ')}`);
    
    if (frontendActionId) {
      this.logger.log(`🆔 Frontend Action ID: ${frontendActionId}`);
    }

    // Update context for manual execution
    const manualContext: ActionContext = {
      ...context,
      timestamp: new Date(),
      sensorType: context.sensorType || 'manual',
      sensorId: context.sensorId || 'manual_trigger',
      violationType: context.violationType || 'manual'
    };

    // Execute all topics and return true only if all succeed
    const results = await Promise.all(
      topics.map(topic => this.publishMqttMessage(topic, manualContext, finalActionType, frontendActionId))
    );
    
    const success = results.every(result => result === true);
    
    if (success) {
      this.logger.log(`✅ Manual action executed successfully: ${actionUri} (${topics.length} topics, QoS: ${this.getQosLevel(finalActionType)}, Retain: ${this.getRetainFlag(finalActionType)})`);
    } else {
      this.logger.error(`❌ Manual action execution failed: ${actionUri} (${results.filter(r => !r).length}/${topics.length} topics failed)`);
    }

    return success;
  }

  /**
   * Classify automated action type based on violation context and action command
   */
  private classifyAutomatedActionType(context: ActionContext, actionParam: string): 'critical' | 'important' | 'normal' {
    // Critical actions based on violation type
    if (context.violationType?.includes('critical')) {
      return 'critical';
    }
    
    // Important actions based on action command
    const actionCommand = actionParam.split('/').pop()?.toLowerCase() || '';
    const criticalActions = ['restart', 'emergency_stop', 'alarm_on', 'shutdown'];
    const importantActions = ['open_roof', 'close_roof', 'heater_on', 'irrigation_on', 'ventilator_on', 'humidifier_on'];
    
    if (criticalActions.some(action => actionCommand.includes(action))) {
      return 'critical';
    }
    
    if (importantActions.some(action => actionCommand.includes(action))) {
      return 'important';
    }
    
    // Default to normal for other automated actions
    return 'normal';
  }

  /**
   * Auto-classify action type based on action URI and command
   */
  private classifyActionType(actionUri: string, providedType: 'critical' | 'important' | 'normal'): 'critical' | 'important' | 'normal' {
    // If explicitly provided, use it
    if (providedType !== 'normal') {
      return providedType;
    }

    // Auto-classify based on action command
    const actionCommand = actionUri.toLowerCase().split('/').pop();
    
    const criticalActions = [
      'irrigation_on', 'heater_on', 'open_roof', 'close_roof', 
      'restart_device', 'alarm_on', 'emergency_stop'
    ];
    
    const importantActions = [
      'fan_on', 'fan_off', 'lights_on', 'lights_off', 
      'calibrate_sensors', 'system_reset'
    ];

    if (criticalActions.includes(actionCommand)) {
      return 'critical';
    } else if (importantActions.includes(actionCommand)) {
      return 'important';
    } else {
      return 'normal';
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(context: ActionContext): string {
    return `ALERT: ${context.sensorType} sensor (ID: ${context.sensorId}) ` +
           `reported ${context.value}${context.unit} at ${context.timestamp.toISOString()}. ` +
           `Device: ${context.deviceId}. Violation: ${context.violationType || 'threshold'}`;
  }

  /**
   * Generate short alert message for SMS
   */
  private generateShortAlertMessage(context: ActionContext): string {
    return `${context.sensorType}: ${context.value}${context.unit} - ${context.violationType}`;
  }

  /**
   * Event listener for threshold violations
   */
  @OnEvent('threshold.violation')
  async handleThresholdViolation(violation: ThresholdViolation) {
    if (violation.action) {
      // A sensor that stays past a threshold violates it on every reading
      // (every ~15s). Re-send the same automatic command to the same device
      // at most once per cooldown window.
      const key = `${violation.sensor.device_id}|${violation.action}`;
      const now = Date.now();
      const last = this.lastAutoAction.get(key);
      if (last !== undefined && now - last < this.autoActionCooldownMs) {
        this.logger.debug(`⏸️ Skipping ${violation.action} for ${violation.sensor.device_id}: sent ${Math.round((now - last) / 1000)}s ago (cooldown ${this.autoActionCooldownMs / 1000}s)`);
        return;
      }
      this.lastAutoAction.set(key, now);

      const context: ActionContext = {
        sensorId: violation.sensor.sensor_id,
        sensorType: violation.sensor.type,
        deviceId: violation.sensor.device_id,
        value: violation.value,
        unit: violation.sensor.unit,
        violationType: violation.violationType,
        timestamp: violation.timestamp
      };

      await this.executeAction(violation.action, context);
    }
  }


  /**
   * Get action execution statistics
   */
  getActionStats() {
    // Future: Implement action execution tracking
    return {
      totalActions: 0,
      successfulActions: 0,
      failedActions: 0,
      actionTypes: {}
    };
  }
}