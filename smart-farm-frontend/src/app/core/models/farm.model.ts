import { Zone } from './zone.model';

export interface Farm {
  farm_id: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  owner_id: string;
  created_at?: Date;
  updated_at?: Date;
  devices?: Device[];
  sensors?: Sensor[];
  crops?: Crop[];
  zones?: Zone[];
}

export interface Device {
  device_id: string;
  name: string;
  location: string;
  status: DeviceStatus;
  farm_id: string;
  device_type?: string;
  description?: string;
  ip_address?: string;
  mac_address?: string;
  firmware_version?: string;
  last_seen?: Date;
  created_at?: Date;
  updated_at?: Date;
  sensors?: Sensor[];
  
  // Extended fields for Create Device
  protocol?: 'MQTT' | 'HTTP' | 'LoRaWAN' | 'Modbus' | 'Custom';
  mqtt_broker?: string;
  mqtt_port?: number;
  mqtt_username?: string;
  mqtt_password?: string;
  mqtt_topic?: string;
  tags?: string[];
  health_score?: number;
  install_date?: Date;
  warranty_date?: Date;
  notes?: string;
}

export enum DeviceStatus {
  ONLINE = 'online',
  ACTIVE = 'active',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance'
}

/**
 * Sensor Interface
 * 
 * Business Rules:
 * - Sensors belong to farms (farm_id required)
 * - Sensors are attached to devices
 * - Sensors have NO relationship with crops
 */
export interface Sensor {
  id: number;
  sensor_id: string;
  farm_id: string;
  type: string;
  unit: string;
  device_id: string;
  location?: string;
  zone_id?: string;
  min_critical?: number;
  min_warning?: number;
  max_warning?: number;
  max_critical?: number;
  action_low?: string;
  action_high?: string;
  readings?: SensorReading[];
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  value1?: number;
  value2?: number;
  createdAt: Date;
  sensor?: Sensor; // optional relation when backend includes relations
}

/**
 * Crop Interface
 * 
 * Business Rules:
 * - Every crop MUST belong to a farm (farm_id required)
 * - Crops have NO relationship with sensors
 * - Farmers can only see crops from their farms
 */
export interface Crop {
  crop_id: string;
  farm_id: string; // Required - every crop belongs to a farm
  zone_id?: string;
  name: string;
  description?: string;
  variety?: string;
  planting_date?: Date;
  expected_harvest_date?: Date;
  status: CropStatus;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  farm?: Farm; // Optional relation when loaded
}

export enum CropStatus {
  PLANTED = 'planted',
  GROWING = 'growing',
  HARVESTED = 'harvested',
  FAILED = 'failed'
}

// Extended Farm Details Interface for Admin Dialog
export interface AdminFarmDetails {
  farm_id: string;
  farm_name: string;
  owner_id: string;
  owner_name?: string;
  location?: {
    lat: number;
    lng: number;
  };
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country?: string;
  area_hectares?: number;
  description?: string;
  status?: 'active' | 'inactive';
  
  // Metrics
  device_count?: number;
  sensor_count?: number;
  health_score?: number;
  
  // Moderators
  assigned_moderators?: Array<{
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
  }>;
  moderator_ids?: string[];
  
  // Alerts
  alerts_summary?: {
    critical: number;
    warning: number;
    info: number;
  };
  
  // Timestamps
  created_at?: Date | string;
  updated_at?: Date | string;
  last_activity?: Date | string;
  
  // Relations
  devices?: Device[];
  sensors?: Sensor[];
}
