import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalTwin } from '../../entities/digital-twin.entity';
import { DigitalTwinsService } from './digital-twins.service';
import { DigitalTwinsController } from './digital-twins.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DigitalTwin])],
  controllers: [DigitalTwinsController],
  providers: [DigitalTwinsService],
  exports: [DigitalTwinsService],
})
export class DigitalTwinsModule {}
