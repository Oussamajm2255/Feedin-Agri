import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Zone } from '../../entities/zone.entity';
import { Farm } from '../farms/farm.entity';
import { Sensor } from '../../entities/sensor.entity';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { Crop } from '../../entities/crop.entity';
import { AdminNotification } from '../../entities/admin-notification.entity';

// ── Response interfaces ──────────────────────────────────────

export interface ZoneSensorSnapshot {
  sensor_id: string;
  type: string;
  unit: string;
  latest_value: number | null;
  latest_timestamp: Date | null;
}

export interface ZoneAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message?: string;
  created_at: Date;
  status: string;
}

export interface ZoneRecommendation {
  id: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ZoneDashboardData {
  zone: {
    id: string;
    name: string;
    type: string;
    status: string;
    area_m2: number | null;
  };
  crops: Array<{
    crop_id: string;
    name: string;
    variety?: string;
    status: string;
    planting_date?: Date;
  }>;
  sensors: ZoneSensorSnapshot[];
  alerts: ZoneAlert[];
  recommendations: ZoneRecommendation[];
  deviceCount: number;
  healthScore: number;
}

export interface FarmDashboardAggregation {
  farm: {
    farm_id: string;
    name: string;
    location?: string;
  };
  zones: ZoneDashboardData[];
  summary: {
    totalZones: number;
    totalSensors: number;
    totalCrops: number;
    totalDevices: number;
    criticalAlerts: number;
    overallHealth: number;
  };
}

// ── Service ──────────────────────────────────────────────────

@Injectable()
export class DashboardAggregatorService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
    @InjectRepository(Sensor)
    private readonly sensorRepo: Repository<Sensor>,
    @InjectRepository(SensorReading)
    private readonly readingRepo: Repository<SensorReading>,
    @InjectRepository(Crop)
    private readonly cropRepo: Repository<Crop>,
    @InjectRepository(AdminNotification)
    private readonly notifRepo: Repository<AdminNotification>,
  ) {}

  /**
   * Aggregate dashboard data for an entire farm, grouped by Zone.
   *
   * Strategy:
   * 1. Load all active zones for the farm.
   * 2. For each zone, batch-load sensors, crops, latest readings, and alerts.
   * 3. Generate simple recommendations from threshold violations.
   * 4. Return a flat structure the frontend can render directly.
   */
  async aggregateByFarm(farmId: string): Promise<FarmDashboardAggregation> {
    const farm = await this.farmRepo.findOne({ where: { farm_id: farmId } });
    if (!farm) {
      throw new NotFoundException(`Farm ${farmId} not found`);
    }

    const zones = await this.zoneRepo.find({
      where: { farm_id: farmId, deleted_at: IsNull() },
      relations: ['sensors', 'crops', 'devices'],
      order: { name: 'ASC' },
    });

    // Collect all sensor IDs across zones for a single batch reading query
    const allSensorIds = zones.flatMap((z) => z.sensors.map((s) => s.sensor_id));

    // Batch-load latest readings for all sensors in one query
    const latestReadings = await this.batchLatestReadings(allSensorIds);

    // Load alerts that reference zones in this farm
    const zoneIds = zones.map((z) => z.id);
    const alerts = await this.loadZoneAlerts(farmId, zoneIds);

    // Build per-zone dashboard data
    const zoneDashboards: ZoneDashboardData[] = zones.map((zone) => {
      const zoneAlerts = alerts.filter(
        (a) => a.context?.zoneId === zone.id || a.context?.farmId === farmId,
      );

      const sensorSnapshots: ZoneSensorSnapshot[] = zone.sensors.map((sensor) => {
        const reading = latestReadings.get(sensor.sensor_id);
        return {
          sensor_id: sensor.sensor_id,
          type: sensor.type,
          unit: sensor.unit,
          latest_value: reading?.value1 ?? null,
          latest_timestamp: reading?.created_at ?? null,
        };
      });

      const activeCrops = zone.crops.filter(
        (c) => c.status === 'planted' || c.status === 'growing',
      );

      const recommendations = this.generateRecommendations(sensorSnapshots, activeCrops);

      const criticalCount = zoneAlerts.filter((a) => a.severity === 'critical').length;
      const healthScore = this.calculateHealth(sensorSnapshots, criticalCount);

      return {
        zone: {
          id: zone.id,
          name: zone.name,
          type: zone.type,
          status: zone.status,
          area_m2: zone.area_m2,
        },
        crops: activeCrops.map((c) => ({
          crop_id: c.crop_id,
          name: c.name,
          variety: c.variety,
          status: c.status,
          planting_date: c.planting_date,
        })),
        sensors: sensorSnapshots,
        alerts: zoneAlerts.map((a) => ({
          id: a.id,
          severity: a.severity,
          title: a.title,
          message: a.message,
          created_at: a.created_at,
          status: a.status,
        })),
        recommendations,
        deviceCount: zone.devices?.length ?? 0,
        healthScore,
      };
    });

    // Summary
    const totalCritical = zoneDashboards.reduce(
      (sum, z) => sum + z.alerts.filter((a) => a.severity === 'critical').length,
      0,
    );
    const avgHealth =
      zoneDashboards.length > 0
        ? Math.round(zoneDashboards.reduce((s, z) => s + z.healthScore, 0) / zoneDashboards.length)
        : 100;

    return {
      farm: {
        farm_id: farm.farm_id,
        name: farm.name,
        location: farm.location,
      },
      zones: zoneDashboards,
      summary: {
        totalZones: zones.length,
        totalSensors: allSensorIds.length,
        totalCrops: zones.reduce((s, z) => s + z.crops.length, 0),
        totalDevices: zones.reduce((s, z) => s + (z.devices?.length ?? 0), 0),
        criticalAlerts: totalCritical,
        overallHealth: avgHealth,
      },
    };
  }

  /**
   * Aggregate for a single zone (detailed view).
   */
  async aggregateByZone(zoneId: string): Promise<ZoneDashboardData> {
    const zone = await this.zoneRepo.findOne({
      where: { id: zoneId, deleted_at: IsNull() },
      relations: ['sensors', 'crops', 'devices', 'farm'],
    });
    if (!zone) {
      throw new NotFoundException(`Zone ${zoneId} not found`);
    }

    const sensorIds = zone.sensors.map((s) => s.sensor_id);
    const latestReadings = await this.batchLatestReadings(sensorIds);
    const alerts = await this.loadZoneAlerts(zone.farm_id, [zoneId]);

    const sensorSnapshots: ZoneSensorSnapshot[] = zone.sensors.map((sensor) => {
      const reading = latestReadings.get(sensor.sensor_id);
      return {
        sensor_id: sensor.sensor_id,
        type: sensor.type,
        unit: sensor.unit,
        latest_value: reading?.value1 ?? null,
        latest_timestamp: reading?.created_at ?? null,
      };
    });

    const activeCrops = zone.crops.filter(
      (c) => c.status === 'planted' || c.status === 'growing',
    );
    const recommendations = this.generateRecommendations(sensorSnapshots, activeCrops);

    const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
    const healthScore = this.calculateHealth(sensorSnapshots, criticalCount);

    return {
      zone: {
        id: zone.id,
        name: zone.name,
        type: zone.type,
        status: zone.status,
        area_m2: zone.area_m2,
      },
      crops: activeCrops.map((c) => ({
        crop_id: c.crop_id,
        name: c.name,
        variety: c.variety,
        status: c.status,
        planting_date: c.planting_date,
      })),
      sensors: sensorSnapshots,
      alerts: alerts.map((a) => ({
        id: a.id,
        severity: a.severity,
        title: a.title,
        message: a.message,
        created_at: a.created_at,
        status: a.status,
      })),
      recommendations,
      deviceCount: zone.devices?.length ?? 0,
      healthScore,
    };
  }

  // ── Private helpers ──────────────────────────────────────────

  /**
   * Batch-load the latest reading for each sensor in a single query.
   * Uses a correlated subquery to get the MAX id per sensor.
   */
  private async batchLatestReadings(
    sensorIds: string[],
  ): Promise<Map<string, SensorReading>> {
    const map = new Map<string, SensorReading>();
    if (sensorIds.length === 0) return map;

    // Get latest reading per sensor using a simple approach
    const readings = await this.readingRepo
      .createQueryBuilder('r')
      .where('r.sensor_id IN (:...sensorIds)', { sensorIds })
      .andWhere(
        'r.id = (SELECT MAX(r2.id) FROM sensor_readings r2 WHERE r2.sensor_id = r.sensor_id)',
      )
      .getMany();

    for (const r of readings) {
      map.set(r.sensor_id, r);
    }
    return map;
  }

  /**
   * Load admin notifications relevant to the given zones.
   */
  private async loadZoneAlerts(
    farmId: string,
    zoneIds: string[],
  ): Promise<AdminNotification[]> {
    if (zoneIds.length === 0) return [];

    // Load notifications with zone context or farm-level notifications
    return this.notifRepo
      .createQueryBuilder('n')
      .where('n.status != :resolved', { resolved: 'resolved' })
      .andWhere(
        `(n.context->>'zoneId' IN (:...zoneIds) OR (n.context->>'farmId' = :farmId AND n.context->>'zoneId' IS NULL))`,
        { zoneIds, farmId },
      )
      .orderBy('n.created_at', 'DESC')
      .limit(50)
      .getMany();
  }

  /**
   * Simple recommendation engine based on sensor data and active crops.
   * Advisory only — no automated actions.
   */
  private generateRecommendations(
    sensors: ZoneSensorSnapshot[],
    crops: Array<{ crop_id: string; name: string; status: string }>,
  ): ZoneRecommendation[] {
    const recs: ZoneRecommendation[] = [];

    if (sensors.length === 0 && crops.length > 0) {
      recs.push({
        id: `rec-no-sensors-${Date.now()}`,
        title: 'No sensors in zone',
        message: `This zone has ${crops.length} active crop(s) but no sensors. Consider adding monitoring.`,
        priority: 'high',
      });
    }

    if (crops.length === 0 && sensors.length > 0) {
      recs.push({
        id: `rec-no-crops-${Date.now()}`,
        title: 'No active crops',
        message: 'Sensors are active but no crops are planted. Data is being collected for future use.',
        priority: 'low',
      });
    }

    // Stale reading detection (>1 hour old)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const s of sensors) {
      if (s.latest_timestamp && s.latest_timestamp < oneHourAgo) {
        recs.push({
          id: `rec-stale-${s.sensor_id}`,
          title: `Stale readings: ${s.type}`,
          message: `Sensor ${s.sensor_id} (${s.type}) hasn't reported in over an hour. Check connectivity.`,
          priority: 'medium',
        });
      }
    }

    return recs;
  }

  /**
   * Calculate a simple health score (0-100) for a zone.
   */
  private calculateHealth(sensors: ZoneSensorSnapshot[], criticalAlerts: number): number {
    let score = 100;

    // Deduct for critical alerts
    score -= criticalAlerts * 15;

    // Deduct for sensors with no readings
    const noData = sensors.filter((s) => s.latest_value === null).length;
    score -= noData * 5;

    // Deduct for stale readings
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const stale = sensors.filter(
      (s) => s.latest_timestamp && s.latest_timestamp < oneHourAgo,
    ).length;
    score -= stale * 3;

    return Math.max(0, Math.min(100, score));
  }
}
