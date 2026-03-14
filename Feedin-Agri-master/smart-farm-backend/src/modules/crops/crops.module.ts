import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Crop } from '../../entities/crop.entity';
import { Sensor } from '../../entities/sensor.entity';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { ActionLog } from '../../entities/action-log.entity';
import { Farm } from '../farms/farm.entity';
import { User } from '../../entities/user.entity';
import { CropsController } from './crops.controller';
import { CropsService } from './crops.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Crop, Sensor, SensorReading, ActionLog, Farm, User]),
  ],
  controllers: [CropsController],
  providers: [CropsService],
  exports: [CropsService],
})
export class CropsModule {}

