import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { Sensor } from '../../entities/sensor.entity';
import { CreateSensorReadingDto } from './dto/create-sensor-reading.dto';

@Injectable()
export class SensorReadingsService {
  private readonly logger = new Logger(SensorReadingsService.name);

  constructor(
    @InjectRepository(SensorReading)
    private readonly sensorReadingRepository: Repository<SensorReading>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
  ) {}

  async create(createSensorReadingDto: CreateSensorReadingDto): Promise<SensorReading> {
    // Validate that sensor exists
    const sensor = await this.sensorRepository.findOne({
      where: { sensor_id: createSensorReadingDto.sensor_id },
    });
    if (!sensor) {
      throw new NotFoundException(`Sensor with ID ${createSensorReadingDto.sensor_id} not found`);
    }

    const reading = this.sensorReadingRepository.create(createSensorReadingDto);
    return this.sensorReadingRepository.save(reading);
  }

  /**
   * Find all sensor readings, optionally filtered by farm owner.
   *
   * ✅ Performance: when ownerId is provided, uses a single JOIN query
   * to avoid fetching all readings + all sensors separately (N+1 fix).
   */
  async findAll(limit = 100, offset = 0, ownerId?: string): Promise<SensorReading[]> {
    const cappedLimit = Math.min(limit, 1000);

    try {
      if (ownerId) {
        // ✅ Single JOIN query — filter by owner directly in SQL
        return await this.sensorReadingRepository
          .createQueryBuilder('reading')
          .innerJoin('reading.sensor', 'sensor')
          .innerJoin('sensor.farm', 'farm')
          .where('farm.owner_id = :ownerId', { ownerId })
          .orderBy('reading.created_at', 'DESC')
          .take(cappedLimit)
          .skip(offset)
          .getMany();
      }

      // No owner filter — return all readings
      return await this.sensorReadingRepository.find({
        take: cappedLimit,
        skip: offset,
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      this.logger.error('Error in findAll:', error?.message);
      // Return empty array — prevents 500 errors; frontend handles empty state
      return [];
    }
  }

  async findOne(id: number): Promise<SensorReading> {
    const reading = await this.sensorReadingRepository.findOne({
      where: { id },
      relations: ['sensor'],
    });

    if (!reading) {
      throw new NotFoundException(`Sensor reading with ID ${id} not found`);
    }

    return reading;
  }

  async findBySensor(sensorId: string, limit = 100, offset = 0): Promise<SensorReading[]> {
    // Validate that sensor exists
    const sensor = await this.sensorRepository.findOne({
      where: { sensor_id: sensorId },
    });
    if (!sensor) {
      throw new NotFoundException(`Sensor with ID ${sensorId} not found`);
    }

    return this.sensorReadingRepository.find({
      where: { sensor_id: sensorId },
      relations: ['sensor'],
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getLatestReading(sensorId: string): Promise<SensorReading | null> {
    return this.sensorReadingRepository.findOne({
      where: { sensor_id: sensorId },
      relations: ['sensor'],
      order: { created_at: 'DESC' },
    });
  }

  async getReadingsByDateRange(
    sensorId: string,
    startDate: Date,
    endDate: Date,
    limit = 1000,
  ): Promise<SensorReading[]> {
    return this.sensorReadingRepository.find({
      where: {
        sensor_id: sensorId,
        created_at: Between(startDate, endDate),
      },
      relations: ['sensor'],
      order: { created_at: 'ASC' },
      take: limit,
    });
  }

  async getReadingsByFarm(farmId: string, limit = 100, offset = 0): Promise<SensorReading[]> {
    return this.sensorReadingRepository
      .createQueryBuilder('reading')
      .innerJoin('reading.sensor', 'sensor')
      .where('sensor.farm_id = :farmId', { farmId })
      .orderBy('reading.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  async getReadingsByDevice(deviceId: string, limit = 100, offset = 0): Promise<SensorReading[]> {
    return this.sensorReadingRepository
      .createQueryBuilder('reading')
      .innerJoin('reading.sensor', 'sensor')
      .where('sensor.device_id = :deviceId', { deviceId })
      .orderBy('reading.created_at', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  async getReadingsByDeviceDateRange(
    deviceId: string,
    startDate: Date,
    endDate: Date,
    limit = 1000,
  ): Promise<SensorReading[]> {
    return this.sensorReadingRepository
      .createQueryBuilder('reading')
      .innerJoin('reading.sensor', 'sensor')
      .where('sensor.device_id = :deviceId', { deviceId })
      .andWhere('reading.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('reading.created_at', 'ASC')
      .take(limit)
      .getMany();
  }

  async getSensorStatistics(sensorId: string, days = 7): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const readings = await this.sensorReadingRepository.find({
      where: {
        sensor_id: sensorId,
        created_at: Between(startDate, endDate),
      },
      // ✅ Only select the columns we actually need — reduces payload
      select: ['id', 'sensor_id', 'value1', 'created_at'],
      order: { created_at: 'ASC' },
    });

    if (readings.length === 0) {
      return {
        sensorId,
        period: `${days} days`,
        count: 0,
        average: null,
        min: null,
        max: null,
        latest: null,
      };
    }

    const values = readings.map((r) => r.value1).filter((v) => v !== null && v !== undefined);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = values.length > 0 ? sum / values.length : null;
    const min = values.length > 0 ? Math.min(...values) : null;
    const max = values.length > 0 ? Math.max(...values) : null;
    const latest = readings[readings.length - 1];

    return {
      sensorId,
      period: `${days} days`,
      count: readings.length,
      average: average !== null ? Math.round(average * 100) / 100 : null,
      min,
      max,
      latest: {
        value: latest.value1,
        timestamp: latest.created_at,
      },
    };
  }

  async getFarmStatistics(farmId: string, days = 7): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ✅ Only select needed columns to reduce payload
    const readings = await this.sensorReadingRepository
      .createQueryBuilder('reading')
      .select(['reading.sensor_id', 'reading.value1'])
      .innerJoin('reading.sensor', 'sensor')
      .where('sensor.farm_id = :farmId', { farmId })
      .andWhere('reading.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const sensorStats = new Map<string, { values: number[]; count: number }>();

    for (const reading of readings) {
      if (!sensorStats.has(reading.sensor_id)) {
        sensorStats.set(reading.sensor_id, { values: [], count: 0 });
      }

      const stats = sensorStats.get(reading.sensor_id)!;
      if (reading.value1 !== null && reading.value1 !== undefined) {
        stats.values.push(reading.value1);
        stats.count++;
      }
    }

    const result = Array.from(sensorStats.entries()).map(([sensorId, stats]) => {
      const { values } = stats;
      const avg =
        values.length > 0
          ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100) / 100
          : null;

      return {
        sensorId,
        count: stats.count,
        average: avg,
        min: values.length > 0 ? Math.min(...values) : null,
        max: values.length > 0 ? Math.max(...values) : null,
      };
    });

    return {
      farmId,
      period: `${days} days`,
      totalReadings: readings.length,
      sensors: result,
    };
  }

  async remove(id: number): Promise<void> {
    const reading = await this.findOne(id);
    await this.sensorReadingRepository.remove(reading);
  }

  async removeOldReadings(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.sensorReadingRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
