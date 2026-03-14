import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, tap, catchError, shareReplay } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from './api.service';
import { Crop, CropStatus, Sensor, SensorReading, Device, Farm } from '../models/farm.model';

/**
 * Extended Crop Dashboard Data - Optimized structure
 * 
 * Business Rules:
 * - Crops belong to farms (farm included in response)
 * - Sensors belong to farms, not crops
 * - Dashboard shows farm sensors for context
 */
export interface CropDashboardData {
  crop: Crop;
  farm?: Farm;
  sensors: SensorWithReading[];
  devices: Device[];
  kpis: CropKPIs;
  healthStatus: HealthStatus;
  statistics: CropStatistics;
}

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

// Use intersection type for better TypeScript resolution
export type SensorWithReading = Sensor & {
  latestReading?: SensorReading;
  weeklyTrend?: number[]; // Last 7 readings for sparkline
  status: SensorStatus;
  isActive: boolean;
};

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type SensorStatus = 'normal' | 'warning' | 'critical' | 'offline';
export type KPIFilter = 'all' | 'healthy' | 'stressed' | 'moisture' | 'temperature' | 'humidity';

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

@Injectable({
  providedIn: 'root'
})
export class CropService {
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  // ============================================
  // SIGNALS - Single Source of Truth
  // ============================================
  private _selectedCropId = signal<string | null>(null);
  private _crops = signal<Crop[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _dashboardData = signal<CropDashboardData | null>(null);

  // Public readonly signals
  readonly selectedCropId = this._selectedCropId.asReadonly();
  readonly crops = this._crops.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly dashboardData = this._dashboardData.asReadonly();

  // ============================================
  // COMPUTED VALUES - Auto-memoized
  // ============================================
  readonly selectedCrop = computed(() => {
    const id = this._selectedCropId();
    return this._crops().find(c => c.crop_id === id) || null;
  });

  readonly healthyCrops = computed(() =>
    this._crops().filter(c =>
      c.status === CropStatus.GROWING || c.status === CropStatus.PLANTED
    )
  );

  readonly stressedCrops = computed(() =>
    this._crops().filter(c =>
      c.status === CropStatus.FAILED
    )
  );

  readonly totalCrops = computed(() => this._crops().length);

  readonly healthyRatio = computed(() => {
    const total = this.totalCrops();
    if (total === 0) return 0;
    return (this.healthyCrops().length / total) * 100;
  });

  readonly globalKPIs = computed((): CropKPIs => {
    const data = this._dashboardData();
    if (!data) {
      return {
        totalCrops: this.totalCrops(),
        healthyCount: this.healthyCrops().length,
        stressedCount: this.stressedCrops().length,
        avgSoilMoisture: null,
        avgTemperature: null,
        avgHumidity: null,
        totalSensors: 0,
        activeSensors: 0,
        lastUpdated: null,
        currentGrowthStage: 'Unknown'
      };
    }
    return data.kpis;
  });

  // ============================================
  // CACHE MANAGEMENT - Prevent Redundant Calls
  // ============================================
  private dashboardCache = new Map<string, Observable<CropDashboardData>>();
  private sensorReadingsCache = new Map<string, Observable<SensorReading[]>>();

  // Cache TTL (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000;
  private cacheTimestamps = new Map<string, number>();

  constructor() {}

  /**
   * Load all crops - called once on init
   */
  loadCrops(): Observable<Crop[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.apiService.getCrops().pipe(
      tap(crops => {
        this._crops.set(crops);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.message || 'Failed to load crops');
        this._loading.set(false);
        return of([]);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  /**
   * Select a crop by ID
   */
  selectCrop(cropId: string): void {
    this._selectedCropId.set(cropId);
  }

  /**
   * Clear selected crop
   */
  clearSelection(): void {
    this._selectedCropId.set(null);
    this._dashboardData.set(null);
  }

  /**
   * PRIMARY METHOD: Get full dashboard data
   * OPTIMIZED: Single backend call - all aggregation done server-side
   */
  getCropDashboard(cropId: string, forceRefresh = false): Observable<CropDashboardData> {
    // Check cache validity
    const cacheKey = `dashboard_${cropId}`;
    const cachedTime = this.cacheTimestamps.get(cacheKey);
    const isCacheValid = cachedTime && (Date.now() - cachedTime) < this.CACHE_TTL;

    if (!forceRefresh && isCacheValid && this.dashboardCache.has(cacheKey)) {
      return this.dashboardCache.get(cacheKey)!;
    }

    // Apply LRU cache eviction before adding new entry
    this.evictOldestCacheIfNeeded();

    this._loading.set(true);
    this._error.set(null);

    // OPTIMIZED: Single backend call - no N+1 queries
    const dashboard$ = this.apiService.getCropDashboard(cropId).pipe(
      map((data: CropDashboardData) => {
        // Backend returns pre-calculated data, just ensure types match
        return {
          crop: data.crop,
          sensors: data.sensors.map(s => ({
            ...s,
            // Ensure proper typing for frontend
            status: s.status as SensorStatus,
            isActive: s.isActive
          })),
          devices: [],
          kpis: data.kpis,
          healthStatus: data.healthStatus as HealthStatus,
          statistics: data.statistics
        } as CropDashboardData;
      }),
      tap(data => {
        this._dashboardData.set(data);
        this._loading.set(false);
        this.cacheTimestamps.set(cacheKey, Date.now());
      }),
      catchError(err => {
        this._error.set('Failed to load crop dashboard');
        this._loading.set(false);
        console.error('Dashboard error:', err);
        throw err;
      }),
      shareReplay(1),
      takeUntilDestroyed(this.destroyRef)
    );

    this.dashboardCache.set(cacheKey, dashboard$);
    return dashboard$;
  }

  /**
   * Get sustainability metrics for a crop
   * Returns real backend-calculated values
   */
  getSustainabilityMetrics(cropId: string): Observable<any> {
    return this.apiService.getCropSustainability(cropId).pipe(
      catchError(err => {
        console.error('Error loading sustainability metrics:', err);
        return of(null);
      })
    );
  }

  /**
   * Get comparison metrics for a crop
   * Returns real backend-calculated values
   */
  getCropComparison(
    cropId: string,
    mode: 'farm_avg' | 'last_season' | 'other_crop' = 'farm_avg',
    compareCropId?: string
  ): Observable<any> {
    return this.apiService.getCropComparison(cropId, mode, compareCropId).pipe(
      catchError(err => {
        console.error('Error loading comparison metrics:', err);
        return of(null);
      })
    );
  }

  /**
   * Get sensor readings for charts - with date range
   * OPTIMIZED: Cached, limited data points
   */
  getSensorReadingsForChart(
    sensorId: string,
    days: 7 | 30 = 7,
    forceRefresh = false
  ): Observable<SensorReading[]> {
    const cacheKey = `readings_${sensorId}_${days}`;
    const cachedTime = this.cacheTimestamps.get(cacheKey);
    const isCacheValid = cachedTime && (Date.now() - cachedTime) < this.CACHE_TTL;

    if (!forceRefresh && isCacheValid && this.sensorReadingsCache.has(cacheKey)) {
      return this.sensorReadingsCache.get(cacheKey)!;
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // CRITICAL: Limit data points to prevent freeze
    const maxPoints = days === 7 ? 168 : 720; // 1 per hour for 7 days, or 1 per hour for 30 days

    const readings$ = this.apiService.getReadingsByDateRange(
      sensorId,
      startDate,
      endDate,
      maxPoints
    ).pipe(
      map(readings => {
        // Downsample if too many points (prevent chart freeze)
        if (readings.length > maxPoints) {
          return this.downsampleReadings(readings, maxPoints);
        }
        return readings;
      }),
      tap(() => this.cacheTimestamps.set(cacheKey, Date.now())),
      shareReplay(1),
      catchError(err => {
        console.error('Error loading sensor readings:', err);
        return of([]);
      }),
      takeUntilDestroyed(this.destroyRef)
    );

    this.sensorReadingsCache.set(cacheKey, readings$);
    return readings$;
  }

  /**
   * Get sensor statistics (pre-aggregated by backend)
   */
  getSensorStatistics(sensorId: string, days = 7): Observable<any> {
    return this.apiService.getSensorStatistics(sensorId, days).pipe(
      catchError(err => {
        console.error('Error loading sensor statistics:', err);
        return of(null);
      })
    );
  }

  /**
   * Update crop - invalidates cache
   */
  updateCrop(cropId: string, updates: Partial<Crop>): Observable<Crop> {
    return this.apiService.updateCrop(cropId, updates).pipe(
      tap(updatedCrop => {
        // Update local state
        const current = this._crops();
        const index = current.findIndex(c => c.crop_id === cropId);
        if (index >= 0) {
          current[index] = updatedCrop;
          this._crops.set([...current]);
        }
        // Invalidate cache
        this.invalidateCache(cropId);
      })
    );
  }

  /**
   * Delete a crop
   */
  deleteCrop(cropId: string): Observable<void> {
    return this.apiService.deleteCrop(cropId).pipe(
      map(() => void 0),
      tap(() => {
        // Update local state
        this._crops.set(this._crops().filter(c => c.crop_id !== cropId));
        
        // If deleted crop was selected, clear selection
        if (this._selectedCropId() === cropId) {
          this.clearSelection();
        }
        
        // Invalidate cache
        this.invalidateCache(cropId);
      })
    );
  }

  /**
   * Delete multiple crops
   */
  deleteCrops(cropIds: string[]): Observable<void> {
    if (cropIds.length === 0) return of(void 0);
    
    // Convert to promise to handle sequential execution or use forkJoin
    // Since we don't have a bulk endpoint, we use loop
    const deleteObservables = cropIds.map(id => this.apiService.deleteCrop(id));
    
    return forkJoin(deleteObservables).pipe(
      map(() => void 0),
      tap(() => {
        // Update local state
        const currentIds = new Set(cropIds);
        this._crops.set(this._crops().filter(c => !currentIds.has(c.crop_id || '')));
        
        // If selected crop was in deleted list, clear selection
        if (this._selectedCropId() && currentIds.has(this._selectedCropId()!)) {
          this.clearSelection();
        }
        
        // Invalidate caches
        cropIds.forEach(id => this.invalidateCache(id));
      })
    );
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.dashboardCache.clear();
    this.sensorReadingsCache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Invalidate specific crop cache
   */
  private invalidateCache(cropId: string): void {
    const cacheKey = `dashboard_${cropId}`;
    this.dashboardCache.delete(cacheKey);
    this.cacheTimestamps.delete(cacheKey);
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  private readonly MAX_CACHE_SIZE = 50;

  /**
   * Evict oldest cache entries if cache is full (LRU strategy)
   */
  private evictOldestCacheIfNeeded(): void {
    if (this.dashboardCache.size >= this.MAX_CACHE_SIZE) {
      // Find oldest entry
      const entries = [...this.cacheTimestamps.entries()];
      if (entries.length > 0) {
        const oldestEntry = entries.sort(([, a], [, b]) => a - b)[0];
        const oldestKey = oldestEntry[0];
        this.dashboardCache.delete(oldestKey);
        this.cacheTimestamps.delete(oldestKey);
      }
    }

    if (this.sensorReadingsCache.size >= this.MAX_CACHE_SIZE) {
      const entries = [...this.cacheTimestamps.entries()]
        .filter(([key]) => key.startsWith('readings_'));
      if (entries.length > 0) {
        const oldestEntry = entries.sort(([, a], [, b]) => a - b)[0];
        const oldestKey = oldestEntry[0];
        this.sensorReadingsCache.delete(oldestKey);
        this.cacheTimestamps.delete(oldestKey);
      }
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Downsample readings to prevent chart freeze
   */
  private downsampleReadings(readings: SensorReading[], targetCount: number): SensorReading[] {
    if (readings.length <= targetCount) return readings;

    const step = Math.floor(readings.length / targetCount);
    return readings.filter((_, index) => index % step === 0);
  }
}
