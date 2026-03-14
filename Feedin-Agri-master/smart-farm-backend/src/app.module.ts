import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { MqttModule } from './modules/mqtt/mqtt.module';
import { SensorsModule } from './modules/sensors/sensors.module';
import { FarmsModule } from './modules/farms/farms.module';
import { UsersModule } from './modules/users/users.module';
import { CropsModule } from './modules/crops/crops.module';
import { DevicesModule } from './modules/devices/devices.module';
import { SensorReadingsModule } from './modules/sensor-readings/sensor-readings.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ActionsModule } from './modules/actions/actions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ZonesModule } from './modules/zones/zones.module';
import { DigitalTwinsModule } from './modules/digital-twins/digital-twins.module';
import { typeOrmConfig } from './config/typeorm.config';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { CorsMiddleware } from './common/middleware/cors.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    FarmsModule,
    SensorsModule,
    CropsModule,
    DevicesModule,
    SensorReadingsModule,
    HealthModule,
    MqttModule,
    AuthModule,
    ActionsModule,
    NotificationsModule,
    AdminModule,
    DashboardModule,
    ZonesModule,
    DigitalTwinsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply CORS middleware first, then CSRF
    consumer.apply(CorsMiddleware, CsrfMiddleware).forRoutes('*');
  }
}