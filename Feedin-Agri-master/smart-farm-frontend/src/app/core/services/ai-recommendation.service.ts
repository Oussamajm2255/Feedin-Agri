import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, interval } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { LanguageService } from './language.service';
import { WeatherService } from './weather.service';

/**
 * 🤖 AI Recommendation Service
 * 
 * Provides intelligent, actionable recommendations for farmers based on:
 * - Current sensor readings (moisture, temperature, humidity)
 * - Crop type and growth stage
 * - Weather forecasts
 * - Historical patterns
 * - Configurable thresholds
 * 
 * KEY PHILOSOPHY: Transform data into action
 * ❌ "Moisture is 28%" → ✅ "Water your tomatoes NOW to prevent crop stress"
 */

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationType = 'irrigation' | 'fertilizer' | 'harvest' | 'protection' | 'monitoring' | 'optimization';

export interface SmartRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  reason: string;
  impact: string;
  icon: string;
  color: string;
  actionLabel: string;
  actionType: string;
  deviceId?: string;
  metadata: {
    sensorType?: string;
    currentValue?: number;
    optimalRange?: { min: number; max: number };
    unit?: string;
    cropName?: string;
    weatherFactor?: boolean;
  };
  createdAt: Date;
  expiresAt?: Date;
  dismissed: boolean;
  executed: boolean;
}

export interface CropThresholds {
  moisture: { critical_low: number; warning_low: number; optimal_min: number; optimal_max: number; warning_high: number; critical_high: number };
  temperature: { critical_low: number; warning_low: number; optimal_min: number; optimal_max: number; warning_high: number; critical_high: number };
  humidity: { critical_low: number; warning_low: number; optimal_min: number; optimal_max: number; warning_high: number; critical_high: number };
}

export interface SensorReading {
  sensor_id: string;
  type: string;
  value: number;
  unit: string;
  timestamp: Date;
}

export interface CropContext {
  cropId: string;
  cropName: string;
  variety?: string;
  status: string;
  plantingDate?: Date;
  expectedHarvestDate?: Date;
  growthStage?: string;
}

// Default thresholds for common crops - can be customized
const DEFAULT_CROP_THRESHOLDS: Record<string, Partial<CropThresholds>> = {
  'tomato': {
    moisture: { critical_low: 20, warning_low: 30, optimal_min: 40, optimal_max: 70, warning_high: 80, critical_high: 90 },
    temperature: { critical_low: 5, warning_low: 10, optimal_min: 18, optimal_max: 27, warning_high: 32, critical_high: 38 },
    humidity: { critical_low: 30, warning_low: 40, optimal_min: 50, optimal_max: 70, warning_high: 80, critical_high: 90 }
  },
  'wheat': {
    moisture: { critical_low: 15, warning_low: 25, optimal_min: 35, optimal_max: 65, warning_high: 75, critical_high: 85 },
    temperature: { critical_low: 0, warning_low: 5, optimal_min: 12, optimal_max: 25, warning_high: 30, critical_high: 35 },
    humidity: { critical_low: 25, warning_low: 35, optimal_min: 45, optimal_max: 65, warning_high: 75, critical_high: 85 }
  },
  'default': {
    moisture: { critical_low: 20, warning_low: 30, optimal_min: 40, optimal_max: 70, warning_high: 80, critical_high: 90 },
    temperature: { critical_low: 5, warning_low: 10, optimal_min: 15, optimal_max: 30, warning_high: 35, critical_high: 40 },
    humidity: { critical_low: 30, warning_low: 40, optimal_min: 50, optimal_max: 75, warning_high: 85, critical_high: 95 }
  }
};

@Injectable({
  providedIn: 'root'
})
export class AiRecommendationService {
  private languageService = inject(LanguageService);
  private weatherService = inject(WeatherService);

  // State signals
  private _recommendations = signal<SmartRecommendation[]>([]);
  private _loading = signal(false);
  private _lastUpdate = signal<Date | null>(null);

  // Public computed signals
  recommendations = computed(() => this._recommendations().filter(r => !r.dismissed && !r.executed));
  criticalRecommendations = computed(() => this.recommendations().filter(r => r.priority === 'critical'));
  highPriorityRecommendations = computed(() => this.recommendations().filter(r => r.priority === 'high'));
  allRecommendations = computed(() => this._recommendations());
  loading = computed(() => this._loading());
  hasRecommendations = computed(() => this.recommendations().length > 0);
  recommendationCount = computed(() => this.recommendations().length);
  criticalCount = computed(() => this.criticalRecommendations().length);

  /**
   * Generate smart recommendations based on current sensor data and crop context
   */
  generateRecommendations(
    sensors: SensorReading[],
    cropContext: CropContext,
    devices?: any[],
    weatherData?: any
  ): Observable<SmartRecommendation[]> {
    this._loading.set(true);

    // Use provided weather data or skip weather analysis
    return of(weatherData || null).pipe(
      map(weather => {
        const recommendations: SmartRecommendation[] = [];
        const thresholds = this.getThresholdsForCrop(cropContext.cropName);

        // Analyze each sensor reading
        sensors.forEach(sensor => {
          const sensorRecommendations = this.analyzeSensorReading(sensor, thresholds, cropContext, weather, devices);
          recommendations.push(...sensorRecommendations);
        });

        // Add growth stage recommendations
        const growthRecommendations = this.analyzeGrowthStage(cropContext, sensors);
        recommendations.push(...growthRecommendations);

        // Add weather-based recommendations
        if (weather) {
          const weatherRecommendations = this.analyzeWeather(weather, cropContext, sensors);
          recommendations.push(...weatherRecommendations);
        }

        // Sort by priority
        recommendations.sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        this._recommendations.set(recommendations);
        this._lastUpdate.set(new Date());
        this._loading.set(false);

        return recommendations;
      })
    );
  }

  /**
   * Analyze a single sensor reading and generate relevant recommendations
   */
  private analyzeSensorReading(
    sensor: SensorReading,
    thresholds: CropThresholds,
    context: CropContext,
    weather: any,
    devices?: any[]
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    const sensorType = sensor.type.toLowerCase();
    const value = sensor.value;

    // MOISTURE ANALYSIS
    if (sensorType.includes('moisture') || sensorType.includes('soil')) {
      const t = thresholds.moisture;
      
      if (value <= t.critical_low) {
        recommendations.push(this.createRecommendation({
          type: 'irrigation',
          priority: 'critical',
          titleKey: 'ai.recommendations.moisture.criticalLow.title',
          descriptionKey: 'ai.recommendations.moisture.criticalLow.description',
          reasonKey: 'ai.recommendations.moisture.criticalLow.reason',
          impactKey: 'ai.recommendations.moisture.criticalLow.impact',
          icon: 'water_drop',
          color: '#ef4444',
          actionLabel: 'ai.recommendations.actions.waterNow',
          actionType: 'irrigate',
          metadata: {
            sensorType: 'moisture',
            currentValue: value,
            optimalRange: { min: t.optimal_min, max: t.optimal_max },
            unit: '%',
            cropName: context.cropName
          }
        }));
      } else if (value <= t.warning_low) {
        recommendations.push(this.createRecommendation({
          type: 'irrigation',
          priority: 'high',
          titleKey: 'ai.recommendations.moisture.warningLow.title',
          descriptionKey: 'ai.recommendations.moisture.warningLow.description',
          reasonKey: 'ai.recommendations.moisture.warningLow.reason',
          impactKey: 'ai.recommendations.moisture.warningLow.impact',
          icon: 'water_drop',
          color: '#f59e0b',
          actionLabel: 'ai.recommendations.actions.scheduleWatering',
          actionType: 'schedule_irrigation',
          metadata: {
            sensorType: 'moisture',
            currentValue: value,
            optimalRange: { min: t.optimal_min, max: t.optimal_max },
            unit: '%',
            cropName: context.cropName
          }
        }));
      } else if (value >= t.critical_high) {
        recommendations.push(this.createRecommendation({
          type: 'irrigation',
          priority: 'high',
          titleKey: 'ai.recommendations.moisture.criticalHigh.title',
          descriptionKey: 'ai.recommendations.moisture.criticalHigh.description',
          reasonKey: 'ai.recommendations.moisture.criticalHigh.reason',
          impactKey: 'ai.recommendations.moisture.criticalHigh.impact',
          icon: 'water_damage',
          color: '#3b82f6',
          actionLabel: 'ai.recommendations.actions.checkDrainage',
          actionType: 'check_drainage',
          metadata: {
            sensorType: 'moisture',
            currentValue: value,
            optimalRange: { min: t.optimal_min, max: t.optimal_max },
            unit: '%',
            cropName: context.cropName
          }
        }));
      } else if (value >= t.optimal_min && value <= t.optimal_max) {
        // Crop is in optimal range - add positive feedback
        recommendations.push(this.createRecommendation({
          type: 'monitoring',
          priority: 'low',
          titleKey: 'ai.recommendations.moisture.optimal.title',
          descriptionKey: 'ai.recommendations.moisture.optimal.description',
          reasonKey: 'ai.recommendations.moisture.optimal.reason',
          impactKey: 'ai.recommendations.moisture.optimal.impact',
          icon: 'check_circle',
          color: '#10b981',
          actionLabel: 'ai.recommendations.actions.viewDetails',
          actionType: 'view_details',
          metadata: {
            sensorType: 'moisture',
            currentValue: value,
            optimalRange: { min: t.optimal_min, max: t.optimal_max },
            unit: '%',
            cropName: context.cropName
          }
        }));
      }
    }

    // TEMPERATURE ANALYSIS
    if (sensorType.includes('temperature') || sensorType.includes('temp')) {
      const t = thresholds.temperature;

      if (value <= t.critical_low) {
        recommendations.push(this.createRecommendation({
          type: 'protection',
          priority: 'critical',
          titleKey: 'ai.recommendations.temperature.criticalLow.title',
          descriptionKey: 'ai.recommendations.temperature.criticalLow.description',
          reasonKey: 'ai.recommendations.temperature.criticalLow.reason',
          impactKey: 'ai.recommendations.temperature.criticalLow.impact',
          icon: 'ac_unit',
          color: '#3b82f6',
          actionLabel: 'ai.recommendations.actions.protectFromFrost',
          actionType: 'activate_heating',
          metadata: {
            sensorType: 'temperature',
            currentValue: value,
            optimalRange: { min: t.optimal_min, max: t.optimal_max },
            unit: '°C',
            cropName: context.cropName
          }
        }));
      } else if (value >= t.critical_high) {
        recommendations.push(this.createRecommendation({
          type: 'protection',
          priority: 'critical',
          titleKey: 'ai.recommendations.temperature.criticalHigh.title',
          descriptionKey: 'ai.recommendations.temperature.criticalHigh.description',
          reasonKey: 'ai.recommendations.temperature.criticalHigh.reason',
          impactKey: 'ai.recommendations.temperature.criticalHigh.impact',
          icon: 'thermostat',
          color: '#ef4444',
          actionLabel: 'ai.recommendations.actions.activateCooling',
          actionType: 'activate_ventilation',
          metadata: {
            sensorType: 'temperature',
            currentValue: value,
            optimalRange: { min: t.optimal_min, max: t.optimal_max },
            unit: '°C',
            cropName: context.cropName
          }
        }));
      } else if (value <= t.warning_low) {
        recommendations.push(this.createRecommendation({
          type: 'monitoring',
          priority: 'medium',
          titleKey: 'ai.recommendations.temperature.warningLow.title',
          descriptionKey: 'ai.recommendations.temperature.warningLow.description',
          reasonKey: 'ai.recommendations.temperature.warningLow.reason',
          impactKey: 'ai.recommendations.temperature.warningLow.impact',
          icon: 'device_thermostat',
          color: '#6366f1',
          actionLabel: 'ai.recommendations.actions.monitorTemperature',
          actionType: 'monitor',
          metadata: {
            sensorType: 'temperature',
            currentValue: value,
            optimalRange: { min: t.optimal_min, max: t.optimal_max },
            unit: '°C',
            cropName: context.cropName
          }
        }));
      }
    }

    // HUMIDITY ANALYSIS
    if (sensorType.includes('humidity') || sensorType.includes('humid')) {
      const t = thresholds.humidity;

      if (value >= t.critical_high) {
        recommendations.push(this.createRecommendation({
          type: 'protection',
          priority: 'high',
          titleKey: 'ai.recommendations.humidity.criticalHigh.title',
          descriptionKey: 'ai.recommendations.humidity.criticalHigh.description',
          reasonKey: 'ai.recommendations.humidity.criticalHigh.reason',
          impactKey: 'ai.recommendations.humidity.criticalHigh.impact',
          icon: 'air',
          color: '#8b5cf6',
          actionLabel: 'ai.recommendations.actions.improveVentilation',
          actionType: 'activate_ventilation',
          metadata: {
            sensorType: 'humidity',
            currentValue: value,
            optimalRange: { min: t.optimal_min, max: t.optimal_max },
            unit: '%',
            cropName: context.cropName,
            weatherFactor: true
          }
        }));
      } else if (value <= t.critical_low) {
        recommendations.push(this.createRecommendation({
          type: 'irrigation',
          priority: 'medium',
          titleKey: 'ai.recommendations.humidity.criticalLow.title',
          descriptionKey: 'ai.recommendations.humidity.criticalLow.description',
          reasonKey: 'ai.recommendations.humidity.criticalLow.reason',
          impactKey: 'ai.recommendations.humidity.criticalLow.impact',
          icon: 'water',
          color: '#0ea5e9',
          actionLabel: 'ai.recommendations.actions.mistCrop',
          actionType: 'mist',
          metadata: {
            sensorType: 'humidity',
            currentValue: value,
            optimalRange: { min: t.optimal_min, max: t.optimal_max },
            unit: '%',
            cropName: context.cropName
          }
        }));
      }
    }

    return recommendations;
  }

  /**
   * Analyze growth stage and provide stage-specific recommendations
   */
  private analyzeGrowthStage(context: CropContext, sensors: SensorReading[]): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    
    if (context.plantingDate && context.expectedHarvestDate) {
      const now = new Date();
      const plantingDate = new Date(context.plantingDate);
      const harvestDate = new Date(context.expectedHarvestDate);
      const totalDays = (harvestDate.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysSincePlanting = (now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysToHarvest = (harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      const progress = Math.min(100, Math.max(0, (daysSincePlanting / totalDays) * 100));

      // Harvest readiness recommendation
      if (daysToHarvest <= 7 && daysToHarvest > 0) {
        recommendations.push(this.createRecommendation({
          type: 'harvest',
          priority: 'high',
          titleKey: 'ai.recommendations.harvest.soon.title',
          descriptionKey: 'ai.recommendations.harvest.soon.description',
          reasonKey: 'ai.recommendations.harvest.soon.reason',
          impactKey: 'ai.recommendations.harvest.soon.impact',
          icon: 'agriculture',
          color: '#f59e0b',
          actionLabel: 'ai.recommendations.actions.prepareHarvest',
          actionType: 'prepare_harvest',
          metadata: {
            cropName: context.cropName
          }
        }));
      } else if (daysToHarvest <= 0 && daysToHarvest > -7) {
        recommendations.push(this.createRecommendation({
          type: 'harvest',
          priority: 'critical',
          titleKey: 'ai.recommendations.harvest.ready.title',
          descriptionKey: 'ai.recommendations.harvest.ready.description',
          reasonKey: 'ai.recommendations.harvest.ready.reason',
          impactKey: 'ai.recommendations.harvest.ready.impact',
          icon: 'eco',
          color: '#10b981',
          actionLabel: 'ai.recommendations.actions.harvestNow',
          actionType: 'harvest',
          metadata: {
            cropName: context.cropName
          }
        }));
      }

      // Growth stage specific recommendations
      if (progress < 25) {
        // Germination/Seedling stage
        recommendations.push(this.createRecommendation({
          type: 'monitoring',
          priority: 'low',
          titleKey: 'ai.recommendations.growthStage.seedling.title',
          descriptionKey: 'ai.recommendations.growthStage.seedling.description',
          reasonKey: 'ai.recommendations.growthStage.seedling.reason',
          impactKey: 'ai.recommendations.growthStage.seedling.impact',
          icon: 'spa',
          color: '#84cc16',
          actionLabel: 'ai.recommendations.actions.viewGrowthTips',
          actionType: 'view_tips',
          metadata: {
            cropName: context.cropName
          }
        }));
      } else if (progress >= 50 && progress < 75) {
        // Flowering/Fruiting stage
        recommendations.push(this.createRecommendation({
          type: 'fertilizer',
          priority: 'medium',
          titleKey: 'ai.recommendations.growthStage.flowering.title',
          descriptionKey: 'ai.recommendations.growthStage.flowering.description',
          reasonKey: 'ai.recommendations.growthStage.flowering.reason',
          impactKey: 'ai.recommendations.growthStage.flowering.impact',
          icon: 'local_florist',
          color: '#ec4899',
          actionLabel: 'ai.recommendations.actions.applyFertilizer',
          actionType: 'fertilize',
          metadata: {
            cropName: context.cropName
          }
        }));
      }
    }

    return recommendations;
  }

  /**
   * Analyze weather and provide weather-aware recommendations
   */
  private analyzeWeather(weather: any, context: CropContext, sensors: SensorReading[]): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];

    if (!weather) return recommendations;

    // Rain forecast - reduce watering
    if (weather.forecast?.includes('rain') || weather.condition?.includes('rain')) {
      const moistureSensor = sensors.find(s => 
        s.type.toLowerCase().includes('moisture') || s.type.toLowerCase().includes('soil')
      );
      
      if (moistureSensor && moistureSensor.value < 50) {
        recommendations.push(this.createRecommendation({
          type: 'optimization',
          priority: 'medium',
          titleKey: 'ai.recommendations.weather.rainExpected.title',
          descriptionKey: 'ai.recommendations.weather.rainExpected.description',
          reasonKey: 'ai.recommendations.weather.rainExpected.reason',
          impactKey: 'ai.recommendations.weather.rainExpected.impact',
          icon: 'water',
          color: '#0ea5e9',
          actionLabel: 'ai.recommendations.actions.skipWatering',
          actionType: 'skip_irrigation',
          metadata: {
            cropName: context.cropName,
            weatherFactor: true
          }
        }));
      }
    }

    // Frost warning
    if (weather.temperature < 5 || weather.forecast?.includes('frost')) {
      recommendations.push(this.createRecommendation({
        type: 'protection',
        priority: 'critical',
        titleKey: 'ai.recommendations.weather.frostWarning.title',
        descriptionKey: 'ai.recommendations.weather.frostWarning.description',
        reasonKey: 'ai.recommendations.weather.frostWarning.reason',
        impactKey: 'ai.recommendations.weather.frostWarning.impact',
        icon: 'severe_cold',
        color: '#60a5fa',
        actionLabel: 'ai.recommendations.actions.protectFromFrost',
        actionType: 'protect_frost',
        metadata: {
          cropName: context.cropName,
          weatherFactor: true
        }
      }));
    }

    // Extreme heat warning
    if (weather.temperature > 35) {
      recommendations.push(this.createRecommendation({
        type: 'protection',
        priority: 'high',
        titleKey: 'ai.recommendations.weather.heatWarning.title',
        descriptionKey: 'ai.recommendations.weather.heatWarning.description',
        reasonKey: 'ai.recommendations.weather.heatWarning.reason',
        impactKey: 'ai.recommendations.weather.heatWarning.impact',
        icon: 'wb_sunny',
        color: '#f97316',
        actionLabel: 'ai.recommendations.actions.provideShade',
        actionType: 'shade_crop',
        metadata: {
          cropName: context.cropName,
          weatherFactor: true
        }
      }));
    }

    return recommendations;
  }

  /**
   * Get thresholds for a specific crop type
   */
  private getThresholdsForCrop(cropName: string): CropThresholds {
    const name = cropName.toLowerCase();
    const cropThresholds = DEFAULT_CROP_THRESHOLDS[name] || DEFAULT_CROP_THRESHOLDS['default'];
    return cropThresholds as CropThresholds;
  }

  /**
   * Create a recommendation object with translations
   */
  private createRecommendation(config: {
    type: RecommendationType;
    priority: RecommendationPriority;
    titleKey: string;
    descriptionKey: string;
    reasonKey: string;
    impactKey: string;
    icon: string;
    color: string;
    actionLabel: string;
    actionType: string;
    deviceId?: string;
    metadata: SmartRecommendation['metadata'];
  }): SmartRecommendation {
    const params = {
      cropName: config.metadata.cropName || '',
      value: config.metadata.currentValue?.toString() || '',
      unit: config.metadata.unit || '',
      optimalMin: config.metadata.optimalRange?.min?.toString() || '',
      optimalMax: config.metadata.optimalRange?.max?.toString() || ''
    };

    return {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: config.type,
      priority: config.priority,
      title: this.languageService.translate(config.titleKey, params),
      description: this.languageService.translate(config.descriptionKey, params),
      reason: this.languageService.translate(config.reasonKey, params),
      impact: this.languageService.translate(config.impactKey, params),
      icon: config.icon,
      color: config.color,
      actionLabel: this.languageService.translate(config.actionLabel),
      actionType: config.actionType,
      deviceId: config.deviceId,
      metadata: config.metadata,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours expiry
      dismissed: false,
      executed: false
    };
  }

  /**
   * Dismiss a recommendation
   */
  dismissRecommendation(id: string): void {
    const recommendations = this._recommendations();
    const index = recommendations.findIndex(r => r.id === id);
    if (index !== -1) {
      recommendations[index].dismissed = true;
      this._recommendations.set([...recommendations]);
    }
  }

  /**
   * Mark a recommendation as executed
   */
  markAsExecuted(id: string): void {
    const recommendations = this._recommendations();
    const index = recommendations.findIndex(r => r.id === id);
    if (index !== -1) {
      recommendations[index].executed = true;
      this._recommendations.set([...recommendations]);
    }
  }

  /**
   * Clear all recommendations
   */
  clearRecommendations(): void {
    this._recommendations.set([]);
  }

  /**
   * Get priority badge class
   */
  getPriorityClass(priority: RecommendationPriority): string {
    const classes: Record<RecommendationPriority, string> = {
      critical: 'priority-critical',
      high: 'priority-high',
      medium: 'priority-medium',
      low: 'priority-low'
    };
    return classes[priority] || 'priority-low';
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority: RecommendationPriority): string {
    return this.languageService.translate(`ai.recommendations.priority.${priority}`);
  }
}
