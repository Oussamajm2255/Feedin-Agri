import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AdminNotificationsService } from './admin-notifications.service';
import { Device } from '../../entities/device.entity';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { Sensor } from '../../entities/sensor.entity';
import { User, UserStatus } from '../../entities/user.entity';

/**
 * AdminCronService — Scheduled jobs for platform health monitoring
 * 
 * Runs periodic checks and emits events that the AdminAlertingService
 * already has listeners for. These were previously dead listeners
 * because no emitter existed.
 */
@Injectable()
export class AdminCronService {
  private readonly logger = new Logger(AdminCronService.name);

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Sensor)
    private readonly sensorRepo: Repository<Sensor>,
    @InjectRepository(SensorReading)
    private readonly readingRepo: Repository<SensorReading>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
    private readonly adminNotifications: AdminNotificationsService,
  ) {}

  // ========================================
  // EVERY 5 MINUTES: Device Offline Spike Detection
  // ========================================
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkDeviceOfflineSpike() {
    try {
      const totalDevices = await this.deviceRepo.count();
      if (totalDevices === 0) return;

      const offlineDevices = await this.deviceRepo.count({
        where: { status: 'offline' },
      });

      // Alert if > 30% of devices are offline (minimum 3 devices)
      const offlinePercentage = (offlineDevices / totalDevices) * 100;
      const threshold = Math.max(3, Math.floor(totalDevices * 0.3));

      if (offlineDevices >= threshold) {
        this.logger.warn(`🚨 Device offline spike: ${offlineDevices}/${totalDevices} devices offline (${offlinePercentage.toFixed(1)}%)`);
        this.eventEmitter.emit('device.offline_spike', {
          count: offlineDevices,
          threshold,
          totalDevices,
          offlinePercentage: Math.round(offlinePercentage),
        });
      }
    } catch (error) {
      this.logger.error('Failed to check device offline spike:', error);
    }
  }

  // ========================================
  // EVERY 10 MINUTES: Sensor Reading Delay Detection
  // ========================================
  @Cron(CronExpression.EVERY_10_MINUTES)
  async checkSensorReadingDelays() {
    try {
      // Find sensors that should be reporting but haven't in the last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      // Get all active sensors
      const sensors = await this.sensorRepo.find({
        select: ['sensor_id', 'farm_id', 'device_id', 'type'],
      });

      for (const sensor of sensors) {
        // Check the latest reading for this sensor
        const latestReading = await this.readingRepo.findOne({
          where: { sensor_id: sensor.sensor_id },
          order: { created_at: 'DESC' },
        });

        if (latestReading && latestReading.created_at < thirtyMinutesAgo) {
          this.eventEmitter.emit('sensor.reading_delay', {
            sensorId: sensor.sensor_id,
            sensorType: sensor.type,
            lastReading: latestReading.created_at,
            farmId: sensor.farm_id,
            deviceId: sensor.device_id,
            delayMinutes: Math.round((Date.now() - latestReading.created_at.getTime()) / 60000),
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to check sensor reading delays:', error);
    }
  }

  // ========================================
  // DAILY AT 8:00 AM: Cleanup Old Resolved Notifications
  // ========================================
  @Cron('0 8 * * *')
  async cleanupOldNotifications() {
    try {
      const result = await this.adminNotifications.cleanupOldResolved(90);
      this.logger.log(`🧹 Daily cleanup: removed ${result.deleted} old resolved notifications`);
    } catch (error) {
      this.logger.error('Failed to cleanup old notifications:', error);
    }
  }

  // ========================================
  // WEEKLY ON MONDAY AT 9:00 AM: Platform Summary
  // ========================================
  @Cron('0 9 * * 1') // Monday 9:00 AM
  async generateWeeklySummary() {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const now = new Date();

      // Count new users this week
      const newUsers = await this.userRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :weekAgo', { weekAgo })
        .getCount();

      // Count new sensor readings this week
      const sensorReadings = await this.readingRepo
        .createQueryBuilder('r')
        .where('r.created_at >= :weekAgo', { weekAgo })
        .getCount();

      const weekStart = weekAgo.toISOString().split('T')[0];
      const weekEnd = now.toISOString().split('T')[0];

      this.eventEmitter.emit('platform.weekly_summary', {
        newUsers,
        newFarms: 0, // Would need farm creation tracking
        sensorReadings,
        actionsExecuted: 0, // Would need action log aggregation
        weekStart,
        weekEnd,
      });

      this.logger.log(`📊 Weekly summary generated: ${newUsers} new users, ${sensorReadings} readings`);
    } catch (error) {
      this.logger.error('Failed to generate weekly summary:', error);
    }
  }
}
