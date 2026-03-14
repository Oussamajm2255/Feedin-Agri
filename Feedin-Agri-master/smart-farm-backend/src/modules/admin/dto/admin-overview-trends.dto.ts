// src/modules/admin/dto/admin-overview-trends.dto.ts
export interface TrendDataPoint {
  date: string; // ISO date string
  value: number;
}

export class AdminOverviewTrendsDto {
  deviceUsage: TrendDataPoint[];
  userActivity: TrendDataPoint[];
  actionVolume: TrendDataPoint[];
  sensorReadings: TrendDataPoint[];
  period: '7days' | '30days' | '90days';
}

