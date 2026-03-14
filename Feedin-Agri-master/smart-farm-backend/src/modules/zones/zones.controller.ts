import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  /**
   * POST /zones
   * Create a new zone within a farm.
   */
  @Post()
  create(@Body() dto: CreateZoneDto) {
    return this.zonesService.create(dto);
  }

  /**
   * GET /zones?farmId=xxx
   * List all zones for a given farm.
   */
  @Get()
  findByFarm(@Query('farmId') farmId: string) {
    return this.zonesService.findByFarm(farmId);
  }

  /**
   * GET /zones/:id
   * Get a single zone with relations.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
  }

  /**
   * PATCH /zones/:id
   * Update zone metadata.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateZoneDto) {
    return this.zonesService.update(id, dto);
  }

  /**
   * DELETE /zones/:id
   * Soft-delete a zone.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.zonesService.remove(id);
  }

  /**
   * POST /zones/:id/assign-sensor
   * Assign a sensor to this zone.
   */
  @Post(':id/assign-sensor')
  assignSensor(@Param('id') id: string, @Body('sensorId') sensorId: string) {
    return this.zonesService.assignSensor(id, sensorId);
  }

  /**
   * POST /zones/:id/assign-device
   * Assign a device to this zone.
   */
  @Post(':id/assign-device')
  assignDevice(@Param('id') id: string, @Body('deviceId') deviceId: string) {
    return this.zonesService.assignDevice(id, deviceId);
  }
}
