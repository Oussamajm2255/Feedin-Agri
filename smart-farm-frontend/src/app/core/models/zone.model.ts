export interface Zone {
  id: string;
  farm_id: string;
  name: string;
  type: ZoneType;
  area_m2?: number | null;
  coordinates?: Record<string, any> | null;
  description?: string | null;
  status: 'active' | 'inactive';
  created_at?: Date;
  updated_at?: Date;
  // Relations (optionally loaded)
  sensors?: any[];
  crops?: any[];
  devices?: any[];
}

export type ZoneType = 'indoor' | 'outdoor' | 'greenhouse' | 'hydroponic';

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
