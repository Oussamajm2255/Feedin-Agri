export interface AdminFarmDetailsDto {
  farm_id: string;
  farm_name: string;
  name: string;
  owner_id: string;
  owner_name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country?: string;
  description?: string;
  status?: 'active' | 'inactive';
  
  // Metrics
  device_count?: number;
  sensor_count: number;
  health_score: number;
  
  // Moderators
  assigned_moderators: Array<{
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
  }>;
  moderator_ids?: string[];
  
  // Alerts
  alerts_summary: {
    critical: number;
    warning: number;
    info: number;
  };
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  last_activity?: Date;
  
  // Relations
  devices?: any[];
  sensors?: any[];
  activity?: any[];
}














