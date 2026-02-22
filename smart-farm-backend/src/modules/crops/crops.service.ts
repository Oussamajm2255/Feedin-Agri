import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Crop } from '../../entities/crop.entity';
import { Farm } from '../farms/farm.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Sensor } from '../../entities/sensor.entity';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { ActionLog } from '../../entities/action-log.entity';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';

/**
 * CropsService
 * 
 * Business Rules Implemented:
 * - Rule 1: Crops belong directly to a Farm (farm_id required)
 * - Rule 2: Crops have NO relationship with Sensors
 * - Rule 3: Farm Owners see only crops on farms they own
 * - Rule 4: Farm Moderators see only crops on farms they moderate
 * - Rule 5: Admins see all crops with grouping capabilities
 * - Rule 6: Crop creation requires farm selection
 * - Rule 7: Farmers with no farms see empty list
 */
@Injectable()
export class CropsService {
  constructor(
    @InjectRepository(Crop)
    private readonly cropsRepository: Repository<Crop>,
    @InjectRepository(Farm)
    private readonly farmsRepository: Repository<Farm>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Sensor)
    private readonly sensorsRepository: Repository<Sensor>,
    @InjectRepository(SensorReading)
    private readonly readingsRepository: Repository<SensorReading>,
    @InjectRepository(ActionLog)
    private readonly actionLogsRepository: Repository<ActionLog>,
  ) {}

  // ============================================
  // ACCESS CONTROL HELPERS
  // ============================================

  /**
   * Get all farm IDs that a user has access to
   * - Owners: farms where owner_id = user_id
   * - Moderators: farms in farm_moderators junction table
   * - Admins: all farms (returns null to indicate no filter needed)
   */
  async getUserAccessibleFarmIds(userId: string): Promise<string[] | null> {
    const user = await this.usersRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Admins can see all crops
    if (user.role === UserRole.ADMIN) {
      return null; // null means no filter needed
    }

    // Get farms owned by user
    const ownedFarms = await this.farmsRepository.find({
      where: { owner_id: userId },
      select: ['farm_id'],
    });
    const ownedFarmIds = ownedFarms.map(f => f.farm_id);

    // Get farms moderated by user (if moderator)
    let moderatedFarmIds: string[] = [];
    if (user.role === UserRole.MODERATOR) {
      const userWithModeratedFarms = await this.usersRepository.findOne({
        where: { user_id: userId },
        relations: ['moderatedFarms'],
      });
      moderatedFarmIds = userWithModeratedFarms?.moderatedFarms?.map(f => f.farm_id) || [];
    }

    // Combine and deduplicate
    const allFarmIds = [...new Set([...ownedFarmIds, ...moderatedFarmIds])];
    return allFarmIds;
  }

  /**
   * Check if user has access to a specific farm
   */
  async userHasAccessToFarm(userId: string, farmId: string): Promise<boolean> {
    const accessibleFarmIds = await this.getUserAccessibleFarmIds(userId);
    
    // null means admin - has access to all
    if (accessibleFarmIds === null) {
      return true;
    }

    return accessibleFarmIds.includes(farmId);
  }

  /**
   * Check if user has access to a specific crop
   */
  async userHasAccessToCrop(userId: string, cropId: string): Promise<boolean> {
    const crop = await this.cropsRepository.findOne({
      where: { crop_id: cropId },
    });

    if (!crop) {
      throw new NotFoundException(`Crop with ID ${cropId} not found`);
    }

    return this.userHasAccessToFarm(userId, crop.farm_id);
  }

  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  /**
   * Create a new crop
   * Validates that the user has access to the specified farm
   */
  async create(createCropDto: CreateCropDto, userId: string): Promise<Crop> {
    // Validate farm exists
    const farm = await this.farmsRepository.findOne({
      where: { farm_id: createCropDto.farm_id },
    });

    if (!farm) {
      throw new NotFoundException(`Farm with ID ${createCropDto.farm_id} not found`);
    }

    // Validate user has access to this farm
    const hasAccess = await this.userHasAccessToFarm(userId, createCropDto.farm_id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to add crops to this farm');
    }

    const crop = this.cropsRepository.create({
      ...createCropDto,
      crop_id: uuidv4(),
    });
    return this.cropsRepository.save(crop);
  }

  /**
   * Find all crops accessible by the user
   * Returns crops filtered by user's accessible farms
   */
  async findAll(userId: string, includeFarm = false): Promise<Crop[]> {
    const accessibleFarmIds = await this.getUserAccessibleFarmIds(userId);
    const relations = includeFarm ? ['farm'] : [];

    // Admin sees all
    if (accessibleFarmIds === null) {
      return this.cropsRepository.find({
        relations,
        order: { created_at: 'DESC' },
      });
    }

    // No accessible farms - return empty array
    if (accessibleFarmIds.length === 0) {
      return [];
    }

    // Filter by accessible farms
    return this.cropsRepository.find({
      where: { farm_id: In(accessibleFarmIds) },
      relations,
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find all crops (admin only - no filtering)
   */
  async findAllAdmin(includeFarm = false): Promise<Crop[]> {
    const relations = includeFarm ? ['farm'] : [];
    return this.cropsRepository.find({
      relations,
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find a single crop by ID
   * Validates user has access
   */
  async findOne(id: string, userId: string, includeFarm = false): Promise<Crop> {
    const relations = includeFarm ? ['farm'] : [];

    const crop = await this.cropsRepository.findOne({
      where: { crop_id: id },
      relations,
    });

    if (!crop) {
      throw new NotFoundException(`Crop with ID ${id} not found`);
    }

    // Validate access
    const hasAccess = await this.userHasAccessToFarm(userId, crop.farm_id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to view this crop');
    }

    return crop;
  }

  /**
   * Find a single crop by ID (internal use, no access check)
   */
  async findOneInternal(id: string, includeFarm = false): Promise<Crop> {
    const relations = includeFarm ? ['farm'] : [];

    const crop = await this.cropsRepository.findOne({
      where: { crop_id: id },
      relations,
    });

    if (!crop) {
      throw new NotFoundException(`Crop with ID ${id} not found`);
    }

    return crop;
  }

  /**
   * Update a crop
   * Validates user has access
   */
  async update(id: string, updateCropDto: UpdateCropDto, userId: string): Promise<Crop> {
    const crop = await this.findOne(id, userId);

    // If changing farm, validate access to new farm
    if (updateCropDto.farm_id && updateCropDto.farm_id !== crop.farm_id) {
      const hasAccessToNewFarm = await this.userHasAccessToFarm(userId, updateCropDto.farm_id);
      if (!hasAccessToNewFarm) {
        throw new ForbiddenException('You do not have permission to move this crop to the specified farm');
      }
    }

    Object.assign(crop, updateCropDto);
    return this.cropsRepository.save(crop);
  }

  /**
   * Remove a crop
   * Validates user has access
   */
  async remove(id: string, userId: string): Promise<void> {
    const crop = await this.findOne(id, userId);
    await this.cropsRepository.remove(crop);
  }

  // ============================================
  // QUERY OPERATIONS WITH ACCESS CONTROL
  // ============================================

  /**
   * Get crops by status (filtered by user access)
   */
  async getCropsByStatus(status: string, userId: string): Promise<Crop[]> {
    const accessibleFarmIds = await this.getUserAccessibleFarmIds(userId);

    // Admin sees all
    if (accessibleFarmIds === null) {
      return this.cropsRepository.find({
        where: { status },
        order: { created_at: 'DESC' },
      });
    }

    if (accessibleFarmIds.length === 0) {
      return [];
    }

    return this.cropsRepository.find({
      where: { 
        status,
        farm_id: In(accessibleFarmIds),
      },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get crops by date range (filtered by user access)
   */
  async getCropsByDateRange(startDate: Date, endDate: Date, userId: string): Promise<Crop[]> {
    const accessibleFarmIds = await this.getUserAccessibleFarmIds(userId);

    const queryBuilder = this.cropsRepository
      .createQueryBuilder('crop')
      .where('crop.planting_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    // Admin sees all
    if (accessibleFarmIds !== null) {
      if (accessibleFarmIds.length === 0) {
        return [];
      }
      queryBuilder.andWhere('crop.farm_id IN (:...farmIds)', { farmIds: accessibleFarmIds });
    }

    return queryBuilder
      .orderBy('crop.planting_date', 'ASC')
      .getMany();
  }

  /**
   * Get crops by farm ID (validates user access to farm)
   */
  async getCropsByFarm(farmId: string, userId: string): Promise<Crop[]> {
    const hasAccess = await this.userHasAccessToFarm(userId, farmId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to view crops from this farm');
    }

    return this.cropsRepository.find({
      where: { farm_id: farmId },
      order: { created_at: 'DESC' },
    });
  }

  // ============================================
  // GROUPING OPERATIONS (ADMIN FEATURE)
  // ============================================

  /**
   * Get crops grouped by farm
   */
  async getCropsGroupedByFarm(userId: string): Promise<{ farm_id: string; farm_name: string; crops: Crop[] }[]> {
    const crops = await this.findAll(userId, true);
    
    const groupedMap = new Map<string, { farm_id: string; farm_name: string; crops: Crop[] }>();
    
    for (const crop of crops) {
      const farmId = crop.farm_id;
      if (!groupedMap.has(farmId)) {
        groupedMap.set(farmId, {
          farm_id: farmId,
          farm_name: crop.farm?.name || 'Unknown Farm',
          crops: [],
        });
      }
      groupedMap.get(farmId)!.crops.push(crop);
    }

    return Array.from(groupedMap.values());
  }

  /**
   * Get crops grouped by growth stage
   */
  async getCropsGroupedByGrowthStage(userId: string): Promise<{ stage: string; crops: Crop[] }[]> {
    const crops = await this.findAll(userId);
    
    const groupedMap = new Map<string, { stage: string; crops: Crop[] }>();
    
    for (const crop of crops) {
      const stage = this.determineGrowthStage(crop);
      if (!groupedMap.has(stage)) {
        groupedMap.set(stage, { stage, crops: [] });
      }
      groupedMap.get(stage)!.crops.push(crop);
    }

    return Array.from(groupedMap.values());
  }

  /**
   * Get crops grouped by planting month
   */
  async getCropsGroupedByPlantingDate(userId: string): Promise<{ month: string; crops: Crop[] }[]> {
    const crops = await this.findAll(userId);
    
    const groupedMap = new Map<string, { month: string; crops: Crop[] }>();
    
    for (const crop of crops) {
      const month = crop.planting_date 
        ? new Date(crop.planting_date).toLocaleString('en-US', { year: 'numeric', month: 'long' })
        : 'No Planting Date';
      
      if (!groupedMap.has(month)) {
        groupedMap.set(month, { month, crops: [] });
      }
      groupedMap.get(month)!.crops.push(crop);
    }

    return Array.from(groupedMap.values());
  }

  // ============================================
  // DASHBOARD - REFACTORED (NO SENSOR DEPENDENCY)
  // ============================================

  /**
   * Get crop dashboard data
   * Now based on farm sensors rather than crop sensors
   */
  async getCropDashboard(cropId: string, userId: string): Promise<any> {
    // 1. Get crop with farm relation
    const crop = await this.findOne(cropId, userId, true);

    // 2. Get all crops for this user for KPI calculation
    const allCrops = await this.findAll(userId);

    // 3. Get farm sensors (sensors belong to farms, not crops)
    const farmSensors = await this.sensorsRepository.find({
      where: { farm_id: crop.farm_id },
    });

    // 4. Get sensors with latest readings
    const sensorsWithReadings = await this.getSensorsWithLatestReadings(farmSensors);

    // 5. Calculate KPIs
    const kpis = this.calculateKPIs(crop, allCrops, sensorsWithReadings);

    // 6. Determine health status based on crop status
    const healthStatus = this.determineHealthStatus(crop);

    // 7. Calculate statistics from farm sensors
    const statistics = await this.calculateStatistics(farmSensors);

    return {
      crop,
      farm: crop.farm,
      sensors: sensorsWithReadings,
      kpis,
      healthStatus,
      statistics,
    };
  }

  private async getSensorsWithLatestReadings(sensors: Sensor[]): Promise<any[]> {
    if (!sensors.length) return [];

    const sensorIds = sensors.map(s => s.sensor_id);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Optimized: Fetch all latest readings in one query using DISTINCT ON
    const latestReadings = await this.readingsRepository
      .createQueryBuilder('reading')
      .distinctOn(['reading.sensor_id'])
      .where('reading.sensor_id IN (:...sensorIds)', { sensorIds })
      .orderBy('reading.sensor_id')
      .addOrderBy('reading.created_at', 'DESC')
      .getMany();

    // Create a map for O(1) lookup
    const readingsMap = new Map(latestReadings.map(r => [r.sensor_id, r]));

    return sensors.map(sensor => {
      const latestReading = readingsMap.get(sensor.sensor_id);
      const isActive = latestReading ? new Date(latestReading.created_at) > oneHourAgo : false;
      const status = this.getSensorStatus(sensor, latestReading || null);

      return {
        sensor_id: sensor.sensor_id,
        type: sensor.type,
        unit: sensor.unit,
        location: sensor.location,
        device_id: sensor.device_id,
        min_warning: sensor.min_warning,
        max_warning: sensor.max_warning,
        min_critical: sensor.min_critical,
        max_critical: sensor.max_critical,
        latestReading: latestReading
          ? {
              id: latestReading.id.toString(),
              value1: latestReading.value1,
              value2: latestReading.value2,
              createdAt: latestReading.created_at,
            }
          : undefined,
        status,
        isActive,
      };
    });
  }

  private getSensorStatus(
    sensor: Sensor,
    reading: SensorReading | null,
  ): 'normal' | 'warning' | 'critical' | 'offline' {
    if (!reading || reading.value1 === null || reading.value1 === undefined) {
      return 'offline';
    }

    const value = reading.value1;

    if (sensor.min_critical !== null && sensor.min_critical !== undefined && value < sensor.min_critical) {
      return 'critical';
    }
    if (sensor.max_critical !== null && sensor.max_critical !== undefined && value > sensor.max_critical) {
      return 'critical';
    }
    if (sensor.min_warning !== null && sensor.min_warning !== undefined && value < sensor.min_warning) {
      return 'warning';
    }
    if (sensor.max_warning !== null && sensor.max_warning !== undefined && value > sensor.max_warning) {
      return 'warning';
    }

    return 'normal';
  }

  private calculateKPIs(crop: Crop, allCrops: Crop[], sensors: any[]): any {
    const moistureSensors = sensors.filter(s => s.type?.toLowerCase().includes('moisture'));
    const tempSensors = sensors.filter(s => s.type?.toLowerCase().includes('temp'));
    const humiditySensors = sensors.filter(s => 
      s.type?.toLowerCase().includes('humidity') || s.type?.toLowerCase().includes('humid')
    );

    const avgMoisture = this.calculateAverage(moistureSensors);
    const avgTemp = this.calculateAverage(tempSensors);
    const avgHumidity = this.calculateAverage(humiditySensors);

    const activeSensors = sensors.filter(s => s.isActive).length;
    const latestTimestamp = this.getLatestTimestamp(sensors);
    const growthStage = this.determineGrowthStage(crop);

    const healthyStatuses = ['planted', 'growing'];
    const failedStatuses = ['failed'];

    return {
      totalCrops: allCrops.length,
      healthyCount: allCrops.filter(c => healthyStatuses.includes(c.status?.toLowerCase())).length,
      stressedCount: allCrops.filter(c => failedStatuses.includes(c.status?.toLowerCase())).length,
      avgSoilMoisture: avgMoisture,
      avgTemperature: avgTemp,
      avgHumidity: avgHumidity,
      totalSensors: sensors.length,
      activeSensors,
      lastUpdated: latestTimestamp,
      currentGrowthStage: growthStage,
    };
  }

  private calculateAverage(sensors: any[]): number | null {
    const validValues = sensors
      .filter(s => s.latestReading && s.latestReading.value1 !== null && s.latestReading.value1 !== undefined)
      .map(s => s.latestReading.value1);

    if (validValues.length === 0) return null;
    return validValues.reduce((a, b) => a + b, 0) / validValues.length;
  }

  private getLatestTimestamp(sensors: any[]): Date | null {
    const timestamps = sensors
      .filter(s => s.latestReading)
      .map(s => new Date(s.latestReading.createdAt).getTime());

    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  }

  private determineGrowthStage(crop: Crop): string {
    if (!crop.planting_date) return 'Unknown';

    const plantingDate = new Date(crop.planting_date);
    const daysSincePlanting = Math.floor(
      (Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSincePlanting < 7) return 'Germination';
    if (daysSincePlanting < 30) return 'Seedling';
    if (daysSincePlanting < 60) return 'Vegetative';
    if (daysSincePlanting < 90) return 'Flowering';
    return 'Mature';
  }

  private determineHealthStatus(crop: Crop): 'healthy' | 'warning' | 'critical' | 'unknown' {
    switch (crop.status?.toLowerCase()) {
      case 'growing':
      case 'planted':
        return 'healthy';
      case 'failed':
        return 'critical';
      case 'harvested':
        return 'healthy';
      default:
        return 'unknown';
    }
  }

  private async calculateStatistics(sensors: Sensor[]): Promise<any> {
    if (sensors.length === 0) {
      return this.getEmptyStatistics();
    }

    // Classify sensors in-memory (AVOIDS DB CALLS)
    const moistureIds = sensors.filter(s => s.type?.toLowerCase().includes('moisture')).map(s => s.sensor_id);
    const tempIds = sensors.filter(s => s.type?.toLowerCase().includes('temp')).map(s => s.sensor_id);
    const humidityIds = sensors.filter(s => 
      s.type?.toLowerCase().includes('humidity') || s.type?.toLowerCase().includes('humid')
    ).map(s => s.sensor_id);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel execution for faster response
    const [last7Days, last30Days] = await Promise.all([
      this.getAveragesForPeriod(moistureIds, tempIds, humidityIds, sevenDaysAgo, now),
      this.getAveragesForPeriod(moistureIds, tempIds, humidityIds, thirtyDaysAgo, now)
    ]);

    const recentPeriod = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const [recentAvg, olderAvg] = await Promise.all([
      this.getAveragesForPeriod(moistureIds, tempIds, humidityIds, recentPeriod, now),
      this.getAveragesForPeriod(moistureIds, tempIds, humidityIds, sevenDaysAgo, recentPeriod)
    ]);

    return {
      last7Days,
      last30Days,
      trends: {
        moisture: this.determineTrend(recentAvg.avgMoisture, olderAvg.avgMoisture),
        temperature: this.determineTrend(recentAvg.avgTemp, olderAvg.avgTemp),
        humidity: this.determineTrend(recentAvg.avgHumidity, olderAvg.avgHumidity),
      },
    };
  }

  private async getAveragesForPeriod(
    moistureIds: string[],
    tempIds: string[],
    humidityIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<{ avgMoisture: number | null; avgTemp: number | null; avgHumidity: number | null }> {
    
    // Internal helper to get average for a set of IDs
    const getAvg = async (ids: string[]): Promise<number | null> => {
      if (ids.length === 0) return null;

      const result = await this.readingsRepository
        .createQueryBuilder('reading')
        .select('AVG(reading.value1)', 'avg')
        .where('reading.sensor_id IN (:...ids)', { ids })
        .andWhere('reading.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne();

      return result?.avg !== null ? parseFloat(result.avg) : null;
    };

    // Parallelize these 3 internal queries
    const [avgMoisture, avgTemp, avgHumidity] = await Promise.all([
      getAvg(moistureIds),
      getAvg(tempIds),
      getAvg(humidityIds)
    ]);

    return { avgMoisture, avgTemp, avgHumidity };
  }

  private determineTrend(recent: number | null, older: number | null): 'up' | 'down' | 'stable' {
    if (recent === null || older === null) return 'stable';

    const diff = recent - older;
    const threshold = older * 0.05;

    if (diff > threshold) return 'up';
    if (diff < -threshold) return 'down';
    return 'stable';
  }

  private getEmptyStatistics(): any {
    return {
      last7Days: { avgMoisture: null, avgTemp: null, avgHumidity: null },
      last30Days: { avgMoisture: null, avgTemp: null, avgHumidity: null },
      trends: { moisture: 'stable', temperature: 'stable', humidity: 'stable' },
    };
  }

  // ============================================
  // SUSTAINABILITY METRICS
  // ============================================

  async getSustainabilityMetrics(cropId: string, userId: string): Promise<any> {
    const crop = await this.findOne(cropId, userId, true);
    
    // Get farm sensors and devices
    const sensors = await this.sensorsRepository.find({
      where: { farm_id: crop.farm_id },
    });
    const sensorIds = sensors.map(s => s.sensor_id);
    const deviceIds = [...new Set(sensors.map(s => s.device_id))];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const waterSaved = await this.calculateWaterSaved(deviceIds, thirtyDaysAgo, now);
    const energySaved = await this.calculateEnergySaved(deviceIds, thirtyDaysAgo, now);
    const carbonOffset = this.calculateCarbonOffset(waterSaved, energySaved);
    const efficiency = await this.calculateEfficiency(sensorIds, thirtyDaysAgo, now);
    const sustainabilityScore = this.calculateSustainabilityScore(efficiency.waterEfficiency, efficiency.energyEfficiency);

    return {
      waterSaved,
      energySaved,
      carbonOffset,
      sustainabilityScore,
      efficiency,
      period: {
        startDate: thirtyDaysAgo,
        endDate: now,
        daysAnalyzed: 30,
      },
    };
  }

  private async calculateWaterSaved(deviceIds: string[], startDate: Date, endDate: Date): Promise<number> {
    if (deviceIds.length === 0) return 0;

    const irrigationActions = await this.actionLogsRepository
      .createQueryBuilder('action')
      .where('action.device_id IN (:...deviceIds)', { deviceIds })
      .andWhere('action.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere("action.action_uri LIKE '%irrigation%' OR action.action_uri LIKE '%water%'")
      .andWhere("action.status = 'ack'")
      .getCount();

    const baselineWaterPerEvent = 50;
    const actualWaterPerEvent = 35;
    const savedPerEvent = baselineWaterPerEvent - actualWaterPerEvent;

    return irrigationActions * savedPerEvent;
  }

  private async calculateEnergySaved(deviceIds: string[], startDate: Date, endDate: Date): Promise<number> {
    if (deviceIds.length === 0) return 0;

    const autoActions = await this.actionLogsRepository
      .createQueryBuilder('action')
      .where('action.device_id IN (:...deviceIds)', { deviceIds })
      .andWhere('action.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere("action.trigger_source = 'auto'")
      .andWhere("action.status = 'ack'")
      .getCount();

    return autoActions * 0.1;
  }

  private calculateCarbonOffset(waterSaved: number, energySaved: number): number {
    return waterSaved * 0.001 + energySaved * 0.5;
  }

  private async calculateEfficiency(
    sensorIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<{ waterEfficiency: number; energyEfficiency: number; resourceScore: number }> {
    const waterEfficiency = await this.calculateWaterEfficiency(sensorIds, startDate, endDate);
    const energyEfficiency = 75;
    const resourceScore = Math.round((waterEfficiency + energyEfficiency) / 2);

    return { waterEfficiency, energyEfficiency, resourceScore };
  }

  private async calculateWaterEfficiency(sensorIds: string[], startDate: Date, endDate: Date): Promise<number> {
    if (sensorIds.length === 0) return 0;

    const moistureSensors = await this.sensorsRepository
      .createQueryBuilder('sensor')
      .where('sensor.sensor_id IN (:...sensorIds)', { sensorIds })
      .andWhere("sensor.type LIKE '%moisture%'")
      .getMany();

    if (moistureSensors.length === 0) return 50;

    const moistureIds = moistureSensors.map(s => s.sensor_id);

    const totalReadings = await this.readingsRepository
      .createQueryBuilder('reading')
      .where('reading.sensor_id IN (:...moistureIds)', { moistureIds })
      .andWhere('reading.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getCount();

    if (totalReadings === 0) return 50;

    const optimalReadings = await this.readingsRepository
      .createQueryBuilder('reading')
      .where('reading.sensor_id IN (:...moistureIds)', { moistureIds })
      .andWhere('reading.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('reading.value1 BETWEEN 40 AND 70')
      .getCount();

    return Math.round((optimalReadings / totalReadings) * 100);
  }

  private calculateSustainabilityScore(waterEfficiency: number, energyEfficiency: number): number {
    return Math.round(waterEfficiency * 0.6 + energyEfficiency * 0.4);
  }

  // ============================================
  // COMPARISON ENDPOINT
  // ============================================

  async getCropComparison(
    cropId: string,
    userId: string,
    mode: 'farm_avg' | 'last_season' | 'other_crop',
    compareCropId?: string,
  ): Promise<any> {
    const crop = await this.findOne(cropId, userId, true);
    const sensors = await this.sensorsRepository.find({ where: { farm_id: crop.farm_id } });
    const moistureIds = sensors.filter(s => s.type?.toLowerCase().includes('moisture')).map(s => s.sensor_id);
    const tempIds = sensors.filter(s => s.type?.toLowerCase().includes('temp')).map(s => s.sensor_id);
    const humidityIds = sensors.filter(s => 
      s.type?.toLowerCase().includes('humidity') || s.type?.toLowerCase().includes('humid')
    ).map(s => s.sensor_id);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const currentAvg = await this.getAveragesForPeriod(moistureIds, tempIds, humidityIds, thirtyDaysAgo, now);

    let compareAvg: { avgMoisture: number | null; avgTemp: number | null; avgHumidity: number | null };

    switch (mode) {
      case 'farm_avg':
        compareAvg = await this.getFarmAverages(crop.farm_id, thirtyDaysAgo, now);
        break;
      case 'last_season':
        const lastSeasonStart = new Date(thirtyDaysAgo.getTime() - 365 * 24 * 60 * 60 * 1000);
        const lastSeasonEnd = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        compareAvg = await this.getAveragesForPeriod(moistureIds, tempIds, humidityIds, lastSeasonStart, lastSeasonEnd);
        break;
      case 'other_crop':
        if (!compareCropId) {
          compareAvg = { avgMoisture: null, avgTemp: null, avgHumidity: null };
        } else {
          const otherCrop = await this.findOne(compareCropId, userId, true);
          const otherSensors = await this.sensorsRepository.find({ where: { farm_id: otherCrop.farm_id } });
          
          const otherMoistureIds = otherSensors.filter(s => s.type?.toLowerCase().includes('moisture')).map(s => s.sensor_id);
          const otherTempIds = otherSensors.filter(s => s.type?.toLowerCase().includes('temp')).map(s => s.sensor_id);
          const otherHumidityIds = otherSensors.filter(s => 
            s.type?.toLowerCase().includes('humidity') || s.type?.toLowerCase().includes('humid')
          ).map(s => s.sensor_id);
          
          compareAvg = await this.getAveragesForPeriod(otherMoistureIds, otherTempIds, otherHumidityIds, thirtyDaysAgo, now);
        }
        break;
      default:
        compareAvg = { avgMoisture: null, avgTemp: null, avgHumidity: null };
    }

    const metrics = [
      this.createComparisonMetric('Soil Moisture', 'water_drop', currentAvg.avgMoisture, compareAvg.avgMoisture, '%'),
      this.createComparisonMetric('Temperature', 'thermostat', currentAvg.avgTemp, compareAvg.avgTemp, '°C'),
      this.createComparisonMetric('Humidity', 'cloud', currentAvg.avgHumidity, compareAvg.avgHumidity, '%'),
    ];

    const betterCount = metrics.filter(m => m.status === 'better').length;
    const worseCount = metrics.filter(m => m.status === 'worse').length;
    const sameCount = metrics.filter(m => m.status === 'same').length;

    let overallStatus: 'better' | 'worse' | 'same' | 'unknown';
    if (betterCount > worseCount) {
      overallStatus = 'better';
    } else if (worseCount > betterCount) {
      overallStatus = 'worse';
    } else if (sameCount > 0 || (betterCount === 0 && worseCount === 0)) {
      overallStatus = 'same';
    } else {
      overallStatus = 'unknown';
    }

    return {
      mode,
      compareCropId,
      metrics,
      overallStatus,
      summary: { betterCount, worseCount, sameCount },
      period: { startDate: thirtyDaysAgo, endDate: now },
    };
  }

  private async getFarmAverages(
    farmId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ avgMoisture: number | null; avgTemp: number | null; avgHumidity: number | null }> {
    const sensors = await this.sensorsRepository.find({ where: { farm_id: farmId } });
    
    const moistureIds = sensors.filter(s => s.type?.toLowerCase().includes('moisture')).map(s => s.sensor_id);
    const tempIds = sensors.filter(s => s.type?.toLowerCase().includes('temp')).map(s => s.sensor_id);
    const humidityIds = sensors.filter(s => 
      s.type?.toLowerCase().includes('humidity') || s.type?.toLowerCase().includes('humid')
    ).map(s => s.sensor_id);
    
    return this.getAveragesForPeriod(moistureIds, tempIds, humidityIds, startDate, endDate);
  }

  private createComparisonMetric(
    label: string,
    icon: string,
    currentValue: number | null,
    compareValue: number | null,
    unit: string,
  ): any {
    if (currentValue === null || compareValue === null) {
      return {
        label,
        icon,
        currentValue,
        compareValue,
        unit,
        status: 'unknown',
        difference: 0,
        percentChange: 0,
      };
    }

    const difference = currentValue - compareValue;
    const percentChange = compareValue !== 0 ? (difference / compareValue) * 100 : 0;

    let status: 'better' | 'worse' | 'same';
    if (Math.abs(percentChange) < 5) {
      status = 'same';
    } else if (percentChange > 0) {
      status = 'better';
    } else {
      status = 'worse';
    }

    return {
      label,
      icon,
      currentValue,
      compareValue,
      unit,
      status,
      difference,
      percentChange,
    };
  }
}
