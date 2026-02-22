// src/modules/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminNotificationsGateway } from './admin-notifications.gateway';
import { AdminAlertingService } from './admin-alerting.service';
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
import { JwtModule } from '@nestjs/jwt';

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
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AdminController, AdminNotificationsController],
  providers: [AdminService, AdminNotificationsService, AdminNotificationsGateway, AdminAlertingService],
  exports: [AdminService, AdminNotificationsService],
})
export class AdminModule {}

