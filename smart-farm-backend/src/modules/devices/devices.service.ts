import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../../entities/device.entity';
import { Farm } from '../farms/farm.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    // Validate that farm exists
    const farm = await this.farmRepository.findOne({
      where: { farm_id: createDeviceDto.farm_id }
    });
    if (!farm) {
      throw new BadRequestException(`Farm with ID ${createDeviceDto.farm_id} not found`);
    }

    // Check if device_id already exists
    const existingDevice = await this.devicesRepository.findOne({
      where: { device_id: createDeviceDto.device_id }
    });
    if (existingDevice) {
      throw new BadRequestException(`Device with ID ${createDeviceDto.device_id} already exists`);
    }

    const device = this.devicesRepository.create(createDeviceDto);
    return this.devicesRepository.save(device);
  }

  async findAll(includeSensors = false, ownerId?: string): Promise<Device[]> {
    console.log('🔍 DevicesService.findAll called with:', { includeSensors, ownerId, isAdmin: !ownerId });
    
    const relations = includeSensors ? ['sensors'] : [];
    relations.push('farm');
    
    let devices: Device[];
    
    if (ownerId) {
      // Filter by owner (regular user case)
      console.log('🔍 Filtering devices by owner:', ownerId);
      devices = await this.devicesRepository.find({
        where: { farm: { owner_id: ownerId } },
        relations,
        order: { created_at: 'DESC' }
      });
    } else {
      // Get all devices (admin/moderator case)
      console.log('🔍 Getting ALL devices (admin/moderator access)');
      
      // First, check total count
      const totalCount = await this.devicesRepository.count();
      console.log(`🔍 Total devices in database: ${totalCount}`);
      
      if (totalCount === 0) {
        console.log('⚠️ No devices in database');
        return [];
      }
      
      // Try simple find first (most reliable)
      console.log('🔍 Trying simple find with relations...');
      devices = await this.devicesRepository.find({
        relations,
        order: { created_at: 'DESC' }
      });
      console.log(`🔍 Simple find returned ${devices.length} devices`);
      
      // If simple find returns empty but devices exist, try without relations
      if (devices.length === 0 && totalCount > 0) {
        console.log('🔍 Simple find returned 0, trying without relations...');
        const devicesNoRelations = await this.devicesRepository.find({
          order: { created_at: 'DESC' }
        });
        console.log(`🔍 Found ${devicesNoRelations.length} devices without relations`);
        
        if (devicesNoRelations.length > 0) {
          // If we got devices without relations, manually load farm relation
          console.log('🔍 Manually loading farm relations...');
          for (const device of devicesNoRelations) {
            if (device.farm_id) {
              try {
                const farm = await this.farmRepository.findOne({
                  where: { farm_id: device.farm_id }
                });
                (device as any).farm = farm || null;
              } catch (error) {
                console.warn(`⚠️ Could not load farm for device ${device.device_id}:`, error);
              }
            }
          }
          devices = devicesNoRelations;
        }
      }
      
      // If still empty, try query builder as last resort
      if (devices.length === 0 && totalCount > 0) {
        console.log('🔍 Trying query builder as fallback...');
        const queryBuilder = this.devicesRepository
          .createQueryBuilder('device')
          .leftJoinAndSelect('device.farm', 'farm')
          .orderBy('device.created_at', 'DESC');
        
        if (includeSensors) {
          queryBuilder.leftJoinAndSelect('device.sensors', 'sensors');
        }
        
        devices = await queryBuilder.getMany();
        console.log(`🔍 Query builder returned ${devices.length} devices`);
      }
    }
    
    console.log(`✅ Found ${devices.length} devices`, ownerId ? `for owner ${ownerId}` : '(all devices - admin access)');
    
    // Log sample device data if we have devices
    if (devices.length > 0) {
      console.log('🔍 Sample device data:', {
        device_id: devices[0].device_id,
        name: devices[0].name,
        farm_id: devices[0].farm_id,
        status: devices[0].status,
        hasFarm: !!(devices[0] as any).farm,
        farmName: (devices[0] as any).farm?.name || 'N/A'
      });
    }
    
    // Debug: Check total devices in database if none found
    if (devices.length === 0) {
      const allDevicesCount = await this.devicesRepository.count();
      console.log(`⚠️ No devices found${ownerId ? ` for owner ${ownerId}` : ''}, but there are ${allDevicesCount} total devices in database`);
      
      if (allDevicesCount > 0) {
        // Try to get devices without relations to debug
        const devicesWithoutRelations = await this.devicesRepository.find({
          take: 5,
          order: { created_at: 'DESC' }
        });
        console.log(`🔍 Sample devices (first 5): ${devicesWithoutRelations.length}`);
        if (devicesWithoutRelations.length > 0) {
          console.log('🔍 Sample device (raw):', {
            device_id: devicesWithoutRelations[0].device_id,
            name: devicesWithoutRelations[0].name,
            farm_id: devicesWithoutRelations[0].farm_id,
            status: devicesWithoutRelations[0].status
          });
        }
      }
    }
    
    // Ensure we return a proper array
    const result = Array.isArray(devices) ? devices : [];
    console.log(`📤 Returning ${result.length} devices to controller`);
    return result;
  }

  async findOne(id: string, includeSensors = false): Promise<Device> {
    const relations = includeSensors ? ['sensors'] : [];
    
    const device = await this.devicesRepository.findOne({
      where: { device_id: id },
      relations,
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    return device;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id);
    
    Object.assign(device, updateDeviceDto);
    return this.devicesRepository.save(device);
  }

  async remove(id: string): Promise<void> {
    const device = await this.findOne(id);
    await this.devicesRepository.remove(device);
  }

  async getDevicesByFarm(farmId: string): Promise<Device[]> {
    // Validate farm exists
    const farm = await this.farmRepository.findOne({
      where: { farm_id: farmId }
    });
    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found`);
    }

    return this.devicesRepository.find({
      where: { farm_id: farmId },
      relations: ['sensors'],
      order: { created_at: 'DESC' }
    });
  }

  async getDevicesByStatus(status: string): Promise<Device[]> {
    return this.devicesRepository.find({
      where: { status },
      relations: ['farm'],
      order: { created_at: 'DESC' }
    });
  }

  async updateDeviceStatus(deviceId: string, status: string): Promise<Device> {
    const device = await this.findOne(deviceId);
    device.status = status;
    // device.last_seen = new Date(); // Commented out - column doesn't exist
    return this.devicesRepository.save(device);
  }

  async getDeviceStatistics(): Promise<any> {
    const totalDevices = await this.devicesRepository.count();
    const onlineDevices = await this.devicesRepository.count({ where: { status: 'online' } });
    const offlineDevices = await this.devicesRepository.count({ where: { status: 'offline' } });
    const maintenanceDevices = await this.devicesRepository.count({ where: { status: 'maintenance' } });

    return {
      total: totalDevices,
      online: onlineDevices,
      offline: offlineDevices,
      maintenance: maintenanceDevices,
      onlinePercentage: totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0
    };
  }

  // async getDevicesByType(deviceType: string): Promise<Device[]> {
  //   return this.devicesRepository.find({
  //     where: { device_type: deviceType },
  //     relations: ['farm'],
  //     order: { created_at: 'DESC' }
  //   });
  // }
}
