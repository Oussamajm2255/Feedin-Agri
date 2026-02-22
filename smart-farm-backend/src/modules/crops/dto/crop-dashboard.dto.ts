import { Crop } from '../../../entities/crop.entity';
import { Sensor } from '../../../entities/sensor.entity';

/**
 * Sensor with latest reading attached
 */
export interface SensorWithReading {
  sensor_id: string;
  type: string;
  unit: string;
  location?: string;
  device_id: string;
  min_warning?: number;
  max_warning?: number;
  min_critical?: number;
  max_critical?: number;
  latestReading?: {
    id: string;
    value1: number | null;
    value2?: number | null;
    createdAt: Date;
  };
  status: 'normal' | 'warning' | 'critical' | 'offline';
  isActive: boolean;
}

/**
 * Pre-calculated KPIs for the crop dashboard
 */
export interface CropKPIs {
  totalCrops: number;
  healthyCount: number;
  stressedCount: number;
  avgSoilMoisture: number | null;
  avgTemperature: number | null;
  avgHumidity: number | null;
  totalSensors: number;
  activeSensors: number;
  lastUpdated: Date | null;
  currentGrowthStage: string;
}

/**
 * Health status type
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

/**
 * Statistics for the crop
 */
export interface CropStatistics {
  last7Days: {
    avgMoisture: number | null;
    avgTemp: number | null;
    avgHumidity: number | null;
  };
  last30Days: {
    avgMoisture: number | null;
    avgTemp: number | null;
    avgHumidity: number | null;
  };
  trends: {
    moisture: 'up' | 'down' | 'stable';
    temperature: 'up' | 'down' | 'stable';
    humidity: 'up' | 'down' | 'stable';
  };
}

/**
 * Complete dashboard response DTO
 */
export class CropDashboardDto {
  crop: Crop;
  sensors: SensorWithReading[];
  kpis: CropKPIs;
  healthStatus: HealthStatus;
  statistics: CropStatistics;
}


