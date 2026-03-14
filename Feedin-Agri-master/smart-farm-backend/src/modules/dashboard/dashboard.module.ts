import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardAggregatorService } from './dashboard-aggregator.service';
import { Zone } from '../../entities/zone.entity';
import { Farm } from '../farms/farm.entity';
import { Sensor } from '../../entities/sensor.entity';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { Crop } from '../../entities/crop.entity';
import { AdminNotification } from '../../entities/admin-notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Zone, Farm, Sensor, SensorReading, Crop, AdminNotification]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardAggregatorService],
  exports: [DashboardAggregatorService],
})
export class DashboardModule {}
