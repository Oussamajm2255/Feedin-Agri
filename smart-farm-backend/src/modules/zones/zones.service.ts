import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Zone } from '../../entities/zone.entity';
import { Farm } from '../farms/farm.entity';
import { Sensor } from '../../entities/sensor.entity';
import { Crop } from '../../entities/crop.entity';
import { Device } from '../../entities/device.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
    @InjectRepository(Sensor)
    private readonly sensorRepo: Repository<Sensor>,
    @InjectRepository(Crop)
    private readonly cropRepo: Repository<Crop>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  /**
   * Create a new Zone within a Farm.
   * Enforces unique name per farm.
   */
  async create(dto: CreateZoneDto): Promise<Zone> {
    // Verify farm exists
    const farm = await this.farmRepo.findOne({ where: { farm_id: dto.farm_id } });
    if (!farm) {
      throw new NotFoundException(`Farm ${dto.farm_id} not found`);
    }

    // Check uniqueness of name within farm
    const existing = await this.zoneRepo.findOne({
      where: { farm_id: dto.farm_id, name: dto.name, deleted_at: IsNull() },
    });
    if (existing) {
      throw new ConflictException(`Zone "${dto.name}" already exists in this farm`);
    }

    const zone = this.zoneRepo.create({
      id: uuidv4(),
      farm_id: dto.farm_id,
      name: dto.name,
      type: dto.type || 'outdoor',
      area_m2: dto.area_m2 ?? null,
      coordinates: dto.coordinates ?? null,
      description: dto.description ?? null,
      status: 'active',
    });

    return this.zoneRepo.save(zone);
  }

  /**
   * List all active zones for a farm.
   * Includes related counts for dashboard aggregation.
   */
  async findByFarm(farmId: string): Promise<Zone[]> {
    const farm = await this.farmRepo.findOne({ where: { farm_id: farmId } });
    if (!farm) {
      throw new NotFoundException(`Farm ${farmId} not found`);
    }

    return this.zoneRepo.find({
      where: { farm_id: farmId, deleted_at: IsNull() },
      relations: ['sensors', 'crops', 'devices'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Get a single zone by ID with all relations loaded.
   */
  async findOne(id: string): Promise<Zone> {
    const zone = await this.zoneRepo.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['sensors', 'crops', 'devices', 'farm'],
    });
    if (!zone) {
      throw new NotFoundException(`Zone ${id} not found`);
    }
    return zone;
  }

  /**
   * Update zone metadata.
   * Re-validates unique name constraint if name is changing.
   */
  async update(id: string, dto: UpdateZoneDto): Promise<Zone> {
    const zone = await this.findOne(id);

    if (dto.name && dto.name !== zone.name) {
      const duplicate = await this.zoneRepo.findOne({
        where: { farm_id: zone.farm_id, name: dto.name, deleted_at: IsNull() },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(`Zone "${dto.name}" already exists in this farm`);
      }
    }

    Object.assign(zone, dto);
    return this.zoneRepo.save(zone);
  }

  /**
   * Soft-delete a zone.
   * Detaches sensors, crops, and devices before deleting.
   */
  async remove(id: string): Promise<{ message: string }> {
    const zone = await this.findOne(id);

    // Detach children — set zone_id to null
    await this.sensorRepo.update({ zone_id: id }, { zone_id: null as any });
    await this.cropRepo.update({ zone_id: id }, { zone_id: null as any });
    await this.deviceRepo.update({ zone_id: id }, { zone_id: null as any });

    // Soft delete
    zone.deleted_at = new Date();
    zone.status = 'inactive';
    await this.zoneRepo.save(zone);

    return { message: `Zone "${zone.name}" deleted successfully` };
  }

  /**
   * Assign a sensor to a zone.
   */
  async assignSensor(zoneId: string, sensorId: string): Promise<{ message: string }> {
    await this.findOne(zoneId); // validates zone exists
    const result = await this.sensorRepo.update({ sensor_id: sensorId }, { zone_id: zoneId });
    if (result.affected === 0) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }
    return { message: 'Sensor assigned to zone' };
  }

  /**
   * Assign a device to a zone.
   */
  async assignDevice(zoneId: string, deviceId: string): Promise<{ message: string }> {
    await this.findOne(zoneId);
    const result = await this.deviceRepo.update({ device_id: deviceId }, { zone_id: zoneId });
    if (result.affected === 0) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }
    return { message: 'Device assigned to zone' };
  }
}
