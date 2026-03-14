// src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminNotificationsGateway } from './admin-notifications.gateway';
import { AdminAlertingService } from './admin-alerting.service';
import { AdminCronService } from './admin-cron.service';
import { ActionEffectivenessMonitor } from './action-effectiveness-monitor.service';
import { User } from '../../entities/user.entity';
import { Farm } from '../farms/farm.entity';
import { Device } from '../../entities/device.entity';
import { Sensor } from '../../entities/sensor.entity';
import { ActionLog } from '../../entities/action-log.entity';
import { Notification } from '../../entities/notification.entity';
import { AdminNotification } from '../../entities/admin-notification.entity';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { SystemSettings } from '../../entities/system-settings.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { HealthModule } from '../health/health.module';
import { FarmsModule } from '../farms/farms.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Farm,
      Device,
      Sensor,
      ActionLog,
      Notification,
      AdminNotification,
      SensorReading,
      SystemSettings,
    ]),
    AuthModule,
    UsersModule,
    HealthModule,
    FarmsModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AdminController, AdminNotificationsController],
  providers: [AdminService, AdminNotificationsService, AdminNotificationsGateway, AdminAlertingService, AdminCronService, ActionEffectivenessMonitor],
  exports: [AdminService, AdminNotificationsService],
})
export class AdminModule {}

