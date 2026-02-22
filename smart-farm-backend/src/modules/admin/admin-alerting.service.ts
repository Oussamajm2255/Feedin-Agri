import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AdminNotificationsService } from './admin-notifications.service';
import { CreateAdminNotificationDto } from './dto/admin-notification.dto';

/**
 * Service that listens to system events and generates appropriate admin notifications.
 * Handles deduplication and grace periods to avoid notification spam.
 */
@Injectable()
export class AdminAlertingService implements OnModuleInit, OnModuleDestroy {
  // Track recent alerts to prevent duplicates
  private recentAlerts: Map<string, number> = new Map();
  private readonly DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    private readonly adminNotifications: AdminNotificationsService,
  ) {}

  onModuleInit() {
    console.log('🚨 [ADMIN-ALERTING] Service initialized');
    // Start cleanup interval (every 10 minutes)
    this.cleanupInterval = setInterval(() => this.cleanupDedupMap(), 10 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Check if we should create a notification (deduplication)
   */
  private shouldCreateAlert(alertKey: string): boolean {
    const now = Date.now();
    const lastAlert = this.recentAlerts.get(alertKey);
    
    if (lastAlert && (now - lastAlert) < this.DEDUP_WINDOW_MS) {
      return false; // Too soon, skip
    }
    
    this.recentAlerts.set(alertKey, now);
    return true;
  }

  /**
   * Clean up old entries from the dedup map
   */
  private cleanupDedupMap() {
    const now = Date.now();
    for (const [key, timestamp] of this.recentAlerts.entries()) {
      if (now - timestamp > this.DEDUP_WINDOW_MS * 2) {
        this.recentAlerts.delete(key);
      }
    }
  }

  // ========================================
  // 🟥 CRITICAL SYSTEM ALERTS
  // ========================================

  @OnEvent('mqtt.disconnected')
  async handleMqttDisconnected(data: { broker?: string; error?: string }) {
    const alertKey = 'mqtt_disconnected';
    if (!this.shouldCreateAlert(alertKey)) return;

    await this.adminNotifications.create({
      type: 'mqtt_disconnect',
      severity: 'critical',
      domain: 'system',
      title: 'MQTT Broker Disconnected',
      message: `Connection to MQTT broker lost. IoT devices may not receive commands. ${data.error || ''}`,
      context: {
        broker: data.broker,
        error: data.error,
        suggestedActions: [
          'Check MQTT broker status',
          'Verify network connectivity',
          'Review broker logs for errors',
        ],
      },
      pinned_until_resolved: true,
    });
  }

  @OnEvent('mqtt.reconnected')
  async handleMqttReconnected(data: { broker?: string }) {
    await this.adminNotifications.create({
      type: 'mqtt_reconnect',
      severity: 'success',
      domain: 'system',
      title: 'MQTT Broker Reconnected',
      message: 'Connection to MQTT broker restored. IoT communication is operational.',
      context: { broker: data.broker },
    });
  }

  @OnEvent('database.unhealthy')
  async handleDatabaseUnhealthy(data: { error?: string }) {
    const alertKey = 'database_unhealthy';
    if (!this.shouldCreateAlert(alertKey)) return;

    await this.adminNotifications.create({
      type: 'database_unhealthy',
      severity: 'critical',
      domain: 'system',
      title: 'Database Connection Issues',
      message: `Database health check failed. Application may experience issues. ${data.error || ''}`,
      context: {
        error: data.error,
        suggestedActions: [
          'Check database server status',
          'Verify connection pool settings',
          'Review database logs',
        ],
      },
      pinned_until_resolved: true,
    });
  }

  @OnEvent('health.degraded')
  async handleHealthDegraded(data: { service: string; details?: string }) {
    const alertKey = `health_degraded_${data.service}`;
    if (!this.shouldCreateAlert(alertKey)) return;

    await this.adminNotifications.create({
      type: 'service_degraded',
      severity: 'warning',
      domain: 'system',
      title: `Service Degraded: ${data.service}`,
      message: `The ${data.service} service is experiencing performance issues. ${data.details || ''}`,
      context: {
        service: data.service,
        details: data.details,
      },
    });
  }

  // ========================================
  // 🟧 PLATFORM INTEGRITY ISSUES
  // ========================================

  @OnEvent('device.offline_spike')
  async handleDeviceOfflineSpike(data: { count: number; threshold: number; farmId?: string }) {
    const alertKey = `device_offline_spike_${data.farmId || 'global'}`;
    if (!this.shouldCreateAlert(alertKey)) return;

    await this.adminNotifications.create({
      type: 'device_offline_spike',
      severity: 'warning',
      domain: 'devices',
      title: 'Device Offline Spike Detected',
      message: `${data.count} devices went offline (threshold: ${data.threshold}). Possible network or power issue.`,
      context: {
        offlineCount: data.count,
        threshold: data.threshold,
        farmId: data.farmId,
        suggestedActions: [
          'Check farm network connectivity',
          'Verify power supply to devices',
          'Contact farm operator',
        ],
      },
    });
  }

  @OnEvent('sensor.reading_delay')
  async handleSensorReadingDelay(data: { sensorId: string; lastReading: Date; farmId?: string }) {
    const alertKey = `sensor_delay_${data.sensorId}`;
    if (!this.shouldCreateAlert(alertKey)) return;

    await this.adminNotifications.create({
      type: 'sensor_reading_delay',
      severity: 'warning',
      domain: 'devices',
      title: 'Sensor Reading Delayed',
      message: `Sensor ${data.sensorId} has not reported data since ${data.lastReading.toISOString()}.`,
      context: {
        sensorId: data.sensorId,
        lastReading: data.lastReading,
        farmId: data.farmId,
      },
    });
  }

  @OnEvent('farm.orphan_entities')
  async handleOrphanEntities(data: { type: 'device' | 'crop' | 'sensor'; count: number; farmId?: string }) {
    const alertKey = `orphan_${data.type}_${data.farmId || 'global'}`;
    if (!this.shouldCreateAlert(alertKey)) return;

    const messages = {
      device: 'registered but no sensors attached',
      crop: 'exists without linked sensors',
      sensor: 'attached to non-existent device',
    };

    await this.adminNotifications.create({
      type: `orphan_${data.type}`,
      severity: 'info',
      domain: data.type === 'crop' ? 'crops' : 'devices',
      title: `Orphan ${data.type}s Detected`,
      message: `${data.count} ${data.type}(s) ${messages[data.type]}.`,
      context: {
        entityType: data.type,
        count: data.count,
        farmId: data.farmId,
      },
    });
  }

  // ========================================
  // 🟨 USER & SUBSCRIPTION EVENTS
  // ========================================

  @OnEvent('user.registered')
  async handleUserRegistered(data: { userId: string; email: string; role: string; firstName?: string; lastName?: string }) {
    await this.adminNotifications.create({
      type: 'user_registered',
      severity: 'info',
      domain: 'users',
      title: 'New User Registered',
      message: `${data.firstName || ''} ${data.lastName || ''} (${data.email}) registered as ${data.role}.`,
      context: {
        userId: data.userId,
        email: data.email,
        role: data.role,
        userName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      },
    });
  }

  @OnEvent('user.subscription_expired')
  async handleSubscriptionExpired(data: { userId: string; email: string; plan?: string }) {
    await this.adminNotifications.create({
      type: 'subscription_expired',
      severity: 'warning',
      domain: 'users',
      title: 'Subscription Expired',
      message: `User ${data.email}'s subscription (${data.plan || 'unknown plan'}) has expired.`,
      context: {
        userId: data.userId,
        email: data.email,
        plan: data.plan,
        suggestedActions: [
          'Send renewal reminder email',
          'Review account status',
        ],
      },
    });
  }

  @OnEvent('user.inactive')
  async handleUserInactive(data: { userId: string; email: string; inactiveDays: number }) {
    const alertKey = `user_inactive_${data.userId}`;
    if (!this.shouldCreateAlert(alertKey)) return;

    await this.adminNotifications.create({
      type: 'user_inactive',
      severity: 'info',
      domain: 'users',
      title: 'User Inactive',
      message: `User ${data.email} has been inactive for ${data.inactiveDays} days.`,
      context: {
        userId: data.userId,
        email: data.email,
        inactiveDays: data.inactiveDays,
      },
    });
  }

  @OnEvent('farm.created')
  async handleFarmCreated(data: { farmId: string; farmName: string; ownerId: string; ownerEmail?: string }) {
    await this.adminNotifications.create({
      type: 'farm_created',
      severity: 'info',
      domain: 'farms',
      title: 'New Farm Created',
      message: `Farm "${data.farmName}" created by ${data.ownerEmail || data.ownerId}.`,
      context: {
        farmId: data.farmId,
        farmName: data.farmName,
        userId: data.ownerId,
      },
    });
  }

  @OnEvent('user.farm_request')
  async handleFarmRequest(data: { userId: string; email: string; userName: string }) {
    await this.adminNotifications.create({
      type: 'user_farm_request',
      severity: 'info',
      domain: 'users',
      title: 'Farm Access Request',
      message: `User ${data.userName} (${data.email}) requested farm access.`,
      context: {
        userId: data.userId,
        email: data.email,
        userName: data.userName,
        suggestedActions: [
          'Review user profile',
          'Assign farm to user',
          'Contact user'
        ]
      },
    });
  }

  // ========================================
  // 🟦 AUTOMATION & ACTIONS OVERSIGHT
  // ========================================

  @OnEvent('action.execution_failed')
  async handleActionExecutionFailed(data: { actionId: string; deviceId: string; error: string; farmId?: string }) {
    const alertKey = `action_failed_${data.deviceId}`;
    if (!this.shouldCreateAlert(alertKey)) return;

    await this.adminNotifications.create({
      type: 'action_execution_failed',
      severity: 'warning',
      domain: 'automation',
      title: 'Action Execution Failed',
      message: `Failed to execute action on device ${data.deviceId}: ${data.error}`,
      context: {
        actionId: data.actionId,
        deviceId: data.deviceId,
        error: data.error,
        farmId: data.farmId,
        suggestedActions: [
          'Check device connectivity',
          'Verify actuator hardware',
          'Review action configuration',
        ],
      },
    });
  }

  @OnEvent('automation.manual_override')
  async handleManualOverride(data: { userId: string; deviceId: string; action: string; farmId?: string }) {
    await this.adminNotifications.create({
      type: 'automation_manual_override',
      severity: 'info',
      domain: 'automation',
      title: 'Manual Override Detected',
      message: `User manually triggered ${data.action} on device ${data.deviceId}.`,
      context: {
        userId: data.userId,
        deviceId: data.deviceId,
        action: data.action,
        farmId: data.farmId,
      },
    });
  }

  @OnEvent('automation.disabled')
  async handleAutomationDisabled(data: { userId: string; ruleId: string; ruleName: string; farmId?: string }) {
    await this.adminNotifications.create({
      type: 'automation_disabled',
      severity: 'info',
      domain: 'automation',
      title: 'Automation Rule Disabled',
      message: `Automation rule "${data.ruleName}" was disabled by user.`,
      context: {
        userId: data.userId,
        ruleId: data.ruleId,
        ruleName: data.ruleName,
        farmId: data.farmId,
      },
    });
  }

  @OnEvent('action.high_frequency')
  async handleHighFrequencyAction(data: { deviceId: string; actionCount: number; timeWindowMinutes: number }) {
    const alertKey = `high_freq_action_${data.deviceId}`;
    if (!this.shouldCreateAlert(alertKey)) return;

    await this.adminNotifications.create({
      type: 'action_high_frequency',
      severity: 'warning',
      domain: 'automation',
      title: 'High-Frequency Actions Detected',
      message: `Device ${data.deviceId} received ${data.actionCount} actions in ${data.timeWindowMinutes} minutes. Possible oscillation issue.`,
      context: {
        deviceId: data.deviceId,
        actionCount: data.actionCount,
        timeWindowMinutes: data.timeWindowMinutes,
        suggestedActions: [
          'Review sensor thresholds',
          'Check for sensor noise',
          'Consider adding hysteresis',
        ],
      },
    });
  }

  // ========================================
  // 🟩 INFORMATIONAL / INSIGHTS
  // ========================================

  @OnEvent('platform.weekly_summary')
  async handleWeeklySummary(data: { 
    newUsers: number; 
    newFarms: number; 
    sensorReadings: number; 
    actionsExecuted: number;
    weekStart: string;
    weekEnd: string;
  }) {
    await this.adminNotifications.create({
      type: 'weekly_summary',
      severity: 'success',
      domain: 'system',
      title: 'Weekly Platform Summary',
      message: `Week of ${data.weekStart}: ${data.newUsers} new users, ${data.newFarms} new farms, ${data.sensorReadings.toLocaleString()} sensor readings.`,
      context: {
        ...data,
        suggestedActions: [
          'Review growth trends',
          'Plan capacity if needed',
        ],
      },
    });
  }
}
