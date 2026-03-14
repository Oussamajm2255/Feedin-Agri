import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from '../../entities/zone.entity';
import { Farm } from '../farms/farm.entity';
import { Sensor } from '../../entities/sensor.entity';
import { Crop } from '../../entities/crop.entity';
import { Device } from '../../entities/device.entity';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';

@Module({
  imports: [TypeOrmModule.forFeature([Zone, Farm, Sensor, Crop, Device])],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [ZonesService],
})
export class ZonesModule {}
