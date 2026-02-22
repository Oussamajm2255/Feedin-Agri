import { Injectable } from '@nestjs/common';

export interface DashboardOverview {
  briefing: {
    summary: string;
    status: 'optimal' | 'warning' | 'critical';
  };
  alerts: any[];
  healthScore: {
    score: number; // 0-100
    trend: 'up' | 'down' | 'stable';
    factors: string[];
  };
  recommendations: any[];
  weatherImpact: {
    condition: string;
    impact: string;
  };
  savings: {
    waterSavedLitres: number;
    energySavedKwh: number;
  };
}

@Injectable()
export class DashboardService {
  getOverview(): DashboardOverview {
    // TODO: Aggregate data from Alerts, Sensors, Actions, and Weather services
    // For now, returning a structure that the frontend expects
    return {
      briefing: {
        summary: 'Farm is currently healthy. Irrigation scheduled for 2 PM.',
        status: 'optimal',
      },
      alerts: [], // Critical alerts from AlertsService
      healthScore: {
        score: 92,
        trend: 'up',
        factors: ['Soil Moisture (+)', 'Temp (-)'],
      },
      recommendations: [], // Actionable insights
      weatherImpact: {
        condition: 'Clear',
        impact: 'High evaporation expected. Monitor soil moisture.',
      },
      savings: {
        waterSavedLitres: 1450,
        energySavedKwh: 120,
      },
    };
  }
}
