import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  signal, computed, inject, DestroyRef, ElementRef, AfterViewInit, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, ChartOptions, Plugin } from 'chart.js';
import { forkJoin, catchError, of, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { AdminApiService } from '../../admin/core/services/admin-api.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { User, UserRole } from '../../core/models/user.model';
import { Farm, Device, Sensor, SensorReading, DeviceStatus } from '../../core/models/farm.model';
import { ExportButtonComponent } from '../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../shared/services/export.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

// ─── Type Definitions ───────────────────────────────────────────────────────

type DatePreset = 'today' | '7days' | '30days' | '90days' | 'custom';
type ActiveTab = 'overview' | 'readings' | 'comparison' | 'health';
type SortField = 'timestamp' | 'value' | 'sensor' | 'farm';
type SortDirection = 'asc' | 'desc';

interface AnalyticsKPI {
  label: string;
  value: number | string;
  rawValue: number;
  icon: string;
  subtitle: string;
  trend: number | null;
  trendDirection: 'up' | 'down' | 'flat';
  trendColor: 'success' | 'danger' | 'neutral';
  trendArrow: string;
  performanceClass: string;
  unit?: string;
  sparklineData?: number[];
}

interface SensorGroup {
  farmId: string;
  farmName: string;
  ownerId: string;
  ownerName: string;
  sensors: SensorWithReadings[];
  isExpanded: boolean;
  sensorCount: number;
  onlineSensors: number;
  latestReading?: Date;
  avgHealth: number;
}

interface SensorWithReadings extends Sensor {
  latestValue?: number;
  latestTimestamp?: Date;
  averageValue?: number;
  minValue?: number;
  maxValue?: number;
  readingCount?: number;
  healthScore?: number;
  status?: 'normal' | 'warning' | 'critical' | 'offline';
  farmName?: string;
  ownerName?: string;
  deviceName?: string;
  sparklineData?: number[];
}

interface FarmComparison {
  farmId: string;
  farmName: string;
  ownerName: string;
  sensorCount: number;
  avgReadingValue: number;
  readingCount: number;
  alertCount: number;
  healthScore: number;
  uptimePercent: number;
}

interface AnomalyRecord {
  sensorId: string;
  sensorType: string;
  farmName: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: Date;
  deviceName: string;
}

// ─── Animated Counter Helper ─────────────────────────────────────────────────
function animateCounter(
  element: HTMLElement,
  target: number,
  duration: number = 800,
  prefix: string = '',
  suffix: string = ''
): void {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    element.textContent = prefix + current.toLocaleString() + suffix;
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}

// ─── Chart Plugins ───────────────────────────────────────────────────────────

// Crosshair plugin for line charts
const crosshairPlugin: Plugin = {
  id: 'crosshair',
  afterDraw(chart: any) {
    if (chart._active && chart._active.length) {
      const activePoint = chart._active[0];
      const { ctx } = chart;
      const x = activePoint.element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    }
  }
};

// Threshold line plugin for sensor detail chart
const thresholdPlugin: (thresholds: { warning?: number; critical?: number }) => Plugin =
  (thresholds) => ({
    id: 'thresholdLines',
    afterDraw(chart: any) {
      const { ctx, scales } = chart;
      if (!scales.y) return;

      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;

      if (thresholds.critical !== undefined) {
        const y = scales.y.getPixelForValue(thresholds.critical);
        ctx.beginPath();
        ctx.moveTo(scales.x.left, y);
        ctx.lineTo(scales.x.right, y);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.stroke();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.font = '11px Inter';
        ctx.fillText(`Critical: ${thresholds.critical}`, scales.x.right - 90, y - 6);
      }

      if (thresholds.warning !== undefined) {
        const y = scales.y.getPixelForValue(thresholds.warning);
        ctx.beginPath();
        ctx.moveTo(scales.x.left, y);
        ctx.lineTo(scales.x.right, y);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.stroke();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.font = '11px Inter';
        ctx.fillText(`Warning: ${thresholds.warning}`, scales.x.right - 85, y - 6);
      }

      ctx.restore();
    }
  });

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-sensor-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatBadgeModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSortModule,
    MatPaginatorModule,
    BaseChartDirective,
    ExportButtonComponent,
    TranslatePipe
  ],
  templateUrl: './sensor-analytics.component.html',
  styleUrl: './sensor-analytics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SensorAnalyticsComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly adminApiService = inject(AdminApiService);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  // ─── Role-Based Access ─────────────────────────────────────────────────
  isAdmin = computed(() => this.authService.user()?.role === UserRole.ADMIN);
  currentUserId = computed(() => this.authService.user()?.user_id || '');

  // ─── State Signals ──────────────────────────────────────────────────────
  isLoading = signal(true);
  isRefreshing = signal(false);
  activeTab = signal<ActiveTab>('overview');
  datePreset = signal<DatePreset>('7days');
  customStartDate = signal<Date | null>(null);
  customEndDate = signal<Date | null>(null);
  searchQuery = signal('');
  selectedFarmIds = signal<string[]>([]);
  selectedFarmerIds = signal<string[]>([]);
  selectedSensorTypes = signal<string[]>([]);
  selectedSeverity = signal<string[]>([]);
  showAnomaliesOnly = signal(false);
  sortField = signal<SortField>('timestamp');
  sortDirection = signal<SortDirection>('desc');
  currentPage = signal(0);
  pageSize = signal(25);
  expandedFarms = signal<Set<string>>(new Set());
  selectedSensorId = signal<string | null>(null);
  isDrawerOpen = signal(false);
  liveMode = signal(false);

  // KPI animation state
  animatedKpiValues = signal<Map<string, number>>(new Map());
  kpiAnimationComplete = signal(false);

  // ─── Data Signals ───────────────────────────────────────────────────────
  farms = signal<Farm[]>([]);
  devices = signal<Device[]>([]);
  sensors = signal<Sensor[]>([]);
  readings = signal<SensorReading[]>([]);
  users = signal<User[]>([]);
  overviewTrends = signal<any>(null);

  searchControl = new FormControl('');
  private liveInterval: any = null;
  private kpiAnimationTimeout: any = null;

  // ─── Ordered sensor list for drawer navigation ──────────────────────────
  orderedSensorIds = computed(() => {
    return this.filteredSensors().map(s => s.sensor_id);
  });

  // ─── Previous/Next sensor for drawer ────────────────────────────────────
  currentSensorIndex = computed(() => {
    const id = this.selectedSensorId();
    if (!id) return -1;
    return this.orderedSensorIds().indexOf(id);
  });

  hasPreviousSensor = computed(() => this.currentSensorIndex() > 0);
  hasNextSensor = computed(() => {
    const idx = this.currentSensorIndex();
    return idx >= 0 && idx < this.orderedSensorIds().length - 1;
  });

  // ─── Reduced motion preference ──────────────────────────────────────────
  prefersReducedMotion = signal(false);

  // ─── Computed: Available Farmers ─────────────────────────────────────────
  availableFarmers = computed(() => {
    const farms = this.farms();
    const users = this.users();
    const farmerIds = new Set(farms.map(f => f.owner_id).filter(Boolean));
    return users
      .filter(u => u.role === UserRole.FARMER && farmerIds.has(u.user_id))
      .map(u => ({
        user_id: u.user_id,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // ─── Computed: Available Sensor Types ───────────────────────────────────
  availableSensorTypes = computed(() => {
    const types = new Set(this.sensors().map(s => s.type).filter(Boolean));
    return Array.from(types).sort();
  });

  // ─── Computed: Date Range ───────────────────────────────────────────────
  dateRange = computed(() => {
    const preset = this.datePreset();
    const now = new Date();
    let start: Date;
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    switch (preset) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case '30days':
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case '90days':
        start = new Date(now);
        start.setDate(start.getDate() - 90);
        start.setHours(0, 0, 0, 0);
        break;
      case 'custom':
        start = this.customStartDate() || new Date(now.setDate(now.getDate() - 7));
        break;
    }
    return { start, end };
  });

  // ─── Computed: Filtered Sensors ─────────────────────────────────────────
  filteredSensors = computed<SensorWithReadings[]>(() => {
    let sensorList = this.sensorsWithReadings();
    const farmIds = this.selectedFarmIds();
    const farmerIds = this.selectedFarmerIds();
    const sensorTypes = this.selectedSensorTypes();
    const search = this.searchQuery().toLowerCase().trim();
    const anomaliesOnly = this.showAnomaliesOnly();

    if (farmIds.length > 0) {
      sensorList = sensorList.filter(s => farmIds.includes(s.farm_id));
    }

    if (farmerIds.length > 0) {
      const farmerFarmIds = this.farms()
        .filter(f => farmerIds.includes(f.owner_id))
        .map(f => f.farm_id);
      sensorList = sensorList.filter(s => farmerFarmIds.includes(s.farm_id));
    }

    if (sensorTypes.length > 0) {
      sensorList = sensorList.filter(s => sensorTypes.includes(s.type));
    }

    if (search) {
      sensorList = sensorList.filter(s =>
        s.sensor_id.toLowerCase().includes(search) ||
        s.type.toLowerCase().includes(search) ||
        (s.farmName || '').toLowerCase().includes(search) ||
        (s.deviceName || '').toLowerCase().includes(search) ||
        (s.location || '').toLowerCase().includes(search)
      );
    }

    if (anomaliesOnly) {
      sensorList = sensorList.filter(s =>
        s.status === 'warning' || s.status === 'critical'
      );
    }

    return sensorList;
  });

  // ─── Computed: Sensors with Reading Aggregates + Sparklines ─────────────
  sensorsWithReadings = computed<SensorWithReadings[]>(() => {
    const allSensors = this.sensors();
    const allReadings = this.readings();
    const farms = this.farms();
    const devices = this.devices();
    const users = this.users();

    return allSensors.map(sensor => {
      const sensorReadings = allReadings
        .filter(r => r.sensor_id === sensor.sensor_id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const values = sensorReadings
        .map(r => r.value1)
        .filter((v): v is number => v !== undefined && v !== null);

      const farm = farms.find(f => f.farm_id === sensor.farm_id);
      const device = devices.find(d => d.device_id === sensor.device_id);
      const owner = farm ? users.find(u => u.user_id === farm.owner_id) : null;

      const latestReading = sensorReadings.length > 0
        ? sensorReadings.reduce((max, r) => {
            const t1 = new Date(r.createdAt).getTime();
            const t2 = new Date(max.createdAt).getTime();
            const v1 = isNaN(t1) ? 0 : t1;
            const v2 = isNaN(t2) ? 0 : t2;
            return v1 > v2 ? r : max;
          })
        : null;

      const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const min = values.length > 0 ? Math.min(...values) : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;

      // Sparkline: last 12 readings for mini chart
      const sparklineData = values.slice(-12);

      let status: 'normal' | 'warning' | 'critical' | 'offline' = 'normal';
      if (!latestReading) {
        status = 'offline';
      } else if (latestReading.value1 !== undefined) {
        const val = latestReading.value1;
        if (sensor.max_critical !== undefined && val >= sensor.max_critical) status = 'critical';
        else if (sensor.min_critical !== undefined && val <= sensor.min_critical) status = 'critical';
        else if (sensor.max_warning !== undefined && val >= sensor.max_warning) status = 'warning';
        else if (sensor.min_warning !== undefined && val <= sensor.min_warning) status = 'warning';
      }

      const healthScore = status === 'normal' ? 100 :
                          status === 'warning' ? 60 :
                          status === 'critical' ? 20 : 0;

      const latestTs = latestReading ? new Date(latestReading.createdAt).getTime() : NaN;

      return {
        ...sensor,
        latestValue: latestReading?.value1,
        latestTimestamp: !isNaN(latestTs) ? new Date(latestTs) : undefined,
        averageValue: Math.round(avg * 100) / 100,
        minValue: Math.round(min * 100) / 100,
        maxValue: Math.round(max * 100) / 100,
        readingCount: sensorReadings.length,
        healthScore,
        status,
        farmName: farm?.name || 'Unknown Farm',
        ownerName: owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown',
        deviceName: device?.name || sensor.device_id,
        sparklineData
      };
    });
  });

  // ─── Computed: Grouped by Farm ──────────────────────────────────────────
  sensorGroups = computed<SensorGroup[]>(() => {
    const sensors = this.filteredSensors();
    const farms = this.farms();
    const users = this.users();
    const expanded = this.expandedFarms();

    const groupMap = new Map<string, SensorWithReadings[]>();
    sensors.forEach(sensor => {
      const list = groupMap.get(sensor.farm_id) || [];
      list.push(sensor);
      groupMap.set(sensor.farm_id, list);
    });

    return Array.from(groupMap.entries()).map(([farmId, farmSensors]) => {
      const farm = farms.find(f => f.farm_id === farmId);
      const owner = farm ? users.find(u => u.user_id === farm.owner_id) : null;
      const onlineSensors = farmSensors.filter(s => s.status !== 'offline').length;
      const avgHealth = farmSensors.length > 0
        ? farmSensors.reduce((sum, s) => sum + (s.healthScore || 0), 0) / farmSensors.length
        : 0;

      const latestTimestamps = farmSensors
        .filter(s => s.latestTimestamp)
        .map(s => s.latestTimestamp!.getTime());
      const latestReading = latestTimestamps.length > 0
        ? new Date(Math.max(...latestTimestamps))
        : undefined;

      return {
        farmId,
        farmName: farm?.name || 'Unknown Farm',
        ownerId: farm?.owner_id || '',
        ownerName: owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown',
        sensors: farmSensors,
        isExpanded: expanded.has(farmId),
        sensorCount: farmSensors.length,
        onlineSensors,
        latestReading,
        avgHealth: Math.round(avgHealth)
      };
    }).sort((a, b) => a.farmName.localeCompare(b.farmName));
  });

  // ─── Computed: KPI Cards with Sparklines ────────────────────────────────
  kpiCards = computed<AnalyticsKPI[]>(() => {
    const sensors = this.filteredSensors();
    const readings = this.readings();
    const totalSensors = sensors.length;
    const activeSensors = sensors.filter(s => s.status !== 'offline').length;
    const totalReadings = readings.length;
    const anomalies = sensors.filter(s => s.status === 'warning' || s.status === 'critical');

    const avgValue = sensors.length > 0
      ? sensors.reduce((sum, s) => sum + (s.averageValue || 0), 0) / sensors.length
      : 0;

    const uptimePercent = totalSensors > 0
      ? Math.round((activeSensors / totalSensors) * 100)
      : 0;

    // Generate sparkline data from readings grouped by time buckets
    const generateSparkline = (data: number[], points: number = 8): number[] => {
      if (data.length === 0) return Array(points).fill(0);
      const chunkSize = Math.max(1, Math.floor(data.length / points));
      const result: number[] = [];
      for (let i = 0; i < points; i++) {
        const start = i * chunkSize;
        const chunk = data.slice(start, start + chunkSize);
        result.push(chunk.length > 0 ? chunk.reduce((a, b) => a + b, 0) / chunk.length : 0);
      }
      return result;
    };

    const allValues = readings.map(r => r.value1).filter((v): v is number => v !== null && v !== undefined);

    return [
      {
        label: 'Total Sensors',
        value: totalSensors,
        rawValue: totalSensors,
        icon: 'sensors',
        subtitle: `${activeSensors} active`,
        trend: null,
        trendDirection: 'flat',
        trendColor: 'neutral',
        trendArrow: '→',
        performanceClass: 'perf-neutral',
        sparklineData: generateSparkline(
          sensors.map(s => s.readingCount || 0)
        )
      },
      {
        label: 'Total Readings',
        value: this.formatLargeNumber(totalReadings),
        rawValue: totalReadings,
        icon: 'analytics',
        subtitle: `In selected period`,
        trend: null,
        trendDirection: 'flat',
        trendColor: 'neutral',
        trendArrow: '→',
        performanceClass: 'perf-neutral',
        sparklineData: generateSparkline(allValues)
      },
      {
        label: 'Sensor Uptime',
        value: `${uptimePercent}%`,
        rawValue: uptimePercent,
        icon: 'speed',
        subtitle: `${totalSensors - activeSensors} offline`,
        trend: uptimePercent,
        trendDirection: uptimePercent >= 80 ? 'up' : uptimePercent >= 50 ? 'flat' : 'down',
        trendColor: uptimePercent >= 80 ? 'success' : uptimePercent >= 50 ? 'neutral' : 'danger',
        trendArrow: uptimePercent >= 80 ? '↑' : uptimePercent >= 50 ? '→' : '↓',
        performanceClass: uptimePercent >= 80 ? 'perf-high' : uptimePercent >= 50 ? 'perf-medium' : 'perf-low',
        unit: '%',
        sparklineData: [uptimePercent]
      },
      {
        label: 'Anomalies',
        value: anomalies.length,
        rawValue: anomalies.length,
        icon: 'warning',
        subtitle: `${anomalies.filter(a => a.status === 'critical').length} critical`,
        trend: anomalies.length > 0 ? anomalies.length : null,
        trendDirection: anomalies.length === 0 ? 'flat' : 'up',
        trendColor: anomalies.length === 0 ? 'success' : 'danger',
        trendArrow: anomalies.length === 0 ? '→' : '↑',
        performanceClass: anomalies.length === 0 ? 'perf-high' :
                          anomalies.length <= 3 ? 'perf-medium' : 'perf-critical',
        sparklineData: generateSparkline(
          anomalies.map(a => a.status === 'critical' ? 2 : 1)
        )
      },
      {
        label: 'Avg Reading',
        value: Math.round(avgValue * 100) / 100,
        rawValue: Math.round(avgValue * 100) / 100,
        icon: 'equalizer',
        subtitle: this.isAdmin() ? 'Across all sensors' : 'Across your sensors',
        trend: null,
        trendDirection: 'flat',
        trendColor: 'neutral',
        trendArrow: '→',
        performanceClass: 'perf-neutral',
        sparklineData: generateSparkline(
          sensors.map(s => s.averageValue || 0)
        )
      },
      {
        label: this.isAdmin() ? 'Active Farms' : 'Your Farms',
        value: new Set(sensors.map(s => s.farm_id)).size,
        rawValue: new Set(sensors.map(s => s.farm_id)).size,
        icon: 'agriculture',
        subtitle: 'With sensor data',
        trend: null,
        trendDirection: 'flat',
        trendColor: 'neutral',
        trendArrow: '→',
        performanceClass: 'perf-neutral',
        sparklineData: generateSparkline(
          Array.from(new Set(sensors.map(s => s.farm_id))).map(() => 1)
        )
      }
    ];
  });

  // ─── Computed: Anomaly Records ──────────────────────────────────────────
  anomalyRecords = computed<AnomalyRecord[]>(() => {
    return this.filteredSensors()
      .filter(s => s.status === 'warning' || s.status === 'critical')
      .map(s => ({
        sensorId: s.sensor_id,
        sensorType: s.type,
        farmName: s.farmName || '',
        value: s.latestValue || 0,
        threshold: s.status === 'critical'
          ? (s.max_critical || s.min_critical || 0)
          : (s.max_warning || s.min_warning || 0),
        severity: s.status as 'warning' | 'critical',
        timestamp: s.latestTimestamp || new Date(),
        deviceName: s.deviceName || ''
      }))
      .sort((a, b) => {
        if (a.severity === 'critical' && b.severity !== 'critical') return -1;
        if (b.severity === 'critical' && a.severity !== 'critical') return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  });

  // ─── Computed: Farm Comparison Data ─────────────────────────────────────
  farmComparisons = computed<FarmComparison[]>(() => {
    const groups = this.sensorGroups();
    return groups.map(g => ({
      farmId: g.farmId,
      farmName: g.farmName,
      ownerName: g.ownerName,
      sensorCount: g.sensorCount,
      avgReadingValue: g.sensors.length > 0
        ? Math.round(g.sensors.reduce((sum, s) => sum + (s.averageValue || 0), 0) / g.sensors.length * 100) / 100
        : 0,
      readingCount: g.sensors.reduce((sum, s) => sum + (s.readingCount || 0), 0),
      alertCount: g.sensors.filter(s => s.status === 'warning' || s.status === 'critical').length,
      healthScore: g.avgHealth,
      uptimePercent: g.sensorCount > 0
        ? Math.round((g.onlineSensors / g.sensorCount) * 100)
        : 0
    })).sort((a, b) => b.healthScore - a.healthScore);
  });

  // ─── Computed: Selected Sensor Detail ───────────────────────────────────
  selectedSensorDetail = computed<SensorWithReadings | null>(() => {
    const id = this.selectedSensorId();
    if (!id) return null;
    return this.sensorsWithReadings().find(s => s.sensor_id === id) || null;
  });

  // ─── Chart Configurations ───────────────────────────────────────────────

  lineChartType: ChartType = 'line';
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 12, family: "'Inter', sans-serif" },
          color: '#64748b'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleFont: { size: 13, family: "'Inter', sans-serif", weight: '600' },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 14,
        cornerRadius: 10,
        displayColors: true,
        boxPadding: 4
      }
    } as any,
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'Time', font: { size: 12, weight: 'normal' as any }, color: '#64748b' },
        grid: { color: 'rgba(0,0,0,0.03)' }
      },
      y: {
        display: true,
        title: { display: true, text: 'Value', font: { size: 12, weight: 'normal' as any }, color: '#64748b' },
        grid: { color: 'rgba(0,0,0,0.04)' },
        beginAtZero: false,
        ticks: { font: { size: 11 }, color: '#94a3b8' }
      }
    },
    elements: {
      point: { radius: 2, hoverRadius: 7, hitRadius: 10 },
      line: { tension: 0.4, borderWidth: 2.5 }
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart'
    }
  };

  // Trend chart data
  trendChartData = computed<ChartData<'line'>>(() => {
    const trends = this.overviewTrends();
    if (!trends) return { labels: [], datasets: [] };

    const labels = trends.sensorReadings?.map((d: any) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [];

    return {
      labels,
      datasets: [
        {
          data: trends.sensorReadings?.map((d: any) => d.value) || [],
          label: 'Sensor Readings',
          borderColor: '#10b981',
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const { ctx: context, chartArea } = chart;
            if (!chartArea) return 'rgba(16, 185, 129, 0.1)';
            const gradient = context.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 2.5
        },
        {
          data: trends.deviceUsage?.map((d: any) => d.value) || [],
          label: 'Device Activity',
          borderColor: '#3b82f6',
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const { ctx: context, chartArea } = chart;
            if (!chartArea) return 'rgba(59, 130, 246, 0.1)';
            const gradient = context.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 2.5
        }
      ]
    };
  });

  // Bar chart for farm comparison
  barChartType: ChartType = 'bar';
  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 16,
          font: { size: 12, family: "'Inter', sans-serif" },
          color: '#64748b'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleFont: { size: 13, family: "'Inter', sans-serif", weight: 'bold' as any },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 14,
        cornerRadius: 10,
        displayColors: true,
        boxPadding: 4
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#94a3b8' }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 11 }, color: '#94a3b8' }
      }
    },
    animation: {
      duration: 600,
      easing: 'easeOutQuart'
    }
  };

  farmComparisonChartData = computed<ChartData<'bar'>>(() => {
    const comparisons = this.farmComparisons();
    return {
      labels: comparisons.map(c => c.farmName.length > 15 ? c.farmName.substring(0, 15) + '…' : c.farmName),
      datasets: [
        {
          data: comparisons.map(c => c.sensorCount),
          label: 'Sensors',
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false
        },
        {
          data: comparisons.map(c => c.readingCount),
          label: 'Readings',
          backgroundColor: 'rgba(59, 130, 246, 0.75)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false
        },
        {
          data: comparisons.map(c => c.alertCount),
          label: 'Alerts',
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    };
  });

  // Health distribution doughnut
  healthChartType: 'doughnut' = 'doughnut';
  healthChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: "'Inter', sans-serif" },
          color: '#64748b',
          generateLabels: (chart: any) => {
            const data = chart.data;
            return data.labels.map((label: string, i: number) => ({
              text: ` ${label} (${data.datasets[0].data[i]})`,
              fillStyle: data.datasets[0].backgroundColor[i],
              strokeStyle: data.datasets[0].borderColor[i],
              lineWidth: 2,
              hidden: !chart.getDataVisibility(i),
              index: i
            }));
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: 14,
        cornerRadius: 10,
        titleFont: { size: 13, weight: 'bold' as any },
        bodyFont: { size: 12 },
        displayColors: true,
        boxPadding: 4,
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: 'easeOutQuart'
    }
  };

  healthDistributionData = computed<ChartData<'doughnut'>>(() => {
    const sensors = this.filteredSensors();
    const normal = sensors.filter(s => s.status === 'normal').length;
    const warning = sensors.filter(s => s.status === 'warning').length;
    const critical = sensors.filter(s => s.status === 'critical').length;
    const offline = sensors.filter(s => s.status === 'offline').length;

    return {
      labels: [
        this.languageService.translate('sensorAnalytics.health.normal'),
        this.languageService.translate('sensorAnalytics.health.warning'),
        this.languageService.translate('sensorAnalytics.health.critical'),
        this.languageService.translate('sensorAnalytics.health.offline')
      ],
      datasets: [{
        data: [normal, warning, critical, offline],
        backgroundColor: [
          'rgba(16, 185, 129, 0.85)',
          'rgba(245, 158, 11, 0.85)',
          'rgba(239, 68, 68, 0.85)',
          'rgba(148, 163, 184, 0.6)'
        ],
        borderColor: ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
        borderWidth: 2,
        hoverOffset: 8,
        hoverBorderWidth: 3
      }]
    };
  });

  // Sensor detail chart for drawer
  sensorDetailChartData = computed<ChartData<'line'>>(() => {
    const sensorId = this.selectedSensorId();
    if (!sensorId) return { labels: [], datasets: [] };

    const sensorReadings = this.readings()
      .filter(r => r.sensor_id === sensorId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const labels = sensorReadings.map(r =>
      new Date(r.createdAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    );

    const sensor = this.sensors().find(s => s.sensor_id === sensorId);

    return {
      labels,
      datasets: [
        {
          data: sensorReadings.map(r => r.value1 || 0),
          label: `${sensor?.type || 'Sensor'} (${sensor?.unit || ''})`,
          borderColor: '#10b981',
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const { ctx: context, chartArea } = chart;
            if (!chartArea) return 'rgba(16, 185, 129, 0.1)';
            const gradient = context.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 7,
          pointHitRadius: 10,
          borderWidth: 2.5
        }
      ]
    };
  });

  // Threshold plugin config for sensor detail
  sensorDetailThresholds = computed(() => {
    const sensor = this.selectedSensorDetail();
    if (!sensor) return {};
    return {
      warning: sensor.max_warning ?? sensor.min_warning,
      critical: sensor.max_critical ?? sensor.min_critical
    };
  });

  // ─── Export Configuration ───────────────────────────────────────────────
  exportColumns: ExportColumn[] = [
    { key: 'sensor_id', header: 'Sensor ID', format: 'text' },
    { key: 'type', header: 'Type', format: 'text' },
    { key: 'farmName', header: 'Farm', format: 'text' },
    { key: 'ownerName', header: 'Owner', format: 'text' },
    { key: 'deviceName', header: 'Device', format: 'text' },
    { key: 'latestValue', header: 'Latest Value', format: 'number' },
    { key: 'averageValue', header: 'Average', format: 'number' },
    { key: 'minValue', header: 'Min', format: 'number' },
    { key: 'maxValue', header: 'Max', format: 'number' },
    { key: 'unit', header: 'Unit', format: 'text' },
    { key: 'readingCount', header: 'Readings', format: 'number' },
    { key: 'status', header: 'Status', format: 'status' },
    { key: 'latestTimestamp', header: 'Last Reading', format: 'datetime' }
  ];

  exportData = computed(() => this.filteredSensors());

  // ─── Active Filters Count ───────────────────────────────────────────────
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedFarmIds().length) count++;
    if (this.selectedFarmerIds().length) count++;
    if (this.selectedSensorTypes().length) count++;
    if (this.showAnomaliesOnly()) count++;
    if (this.searchControl.value) count++; // Use searchControl.value instead of searchQuery
    return count;
  });

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  private motionMediaQuery: MediaQueryList | null = null;

  ngOnInit(): void {
    // Read reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion.set(this.motionMediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => this.prefersReducedMotion.set(e.matches);
      this.motionMediaQuery.addEventListener('change', handler);
      // Cleanup listener
      this.destroyRef.onDestroy(() => {
        this.motionMediaQuery?.removeEventListener('change', handler);
      });
    }

    // Restore filters from URL params
    this.restoreFiltersFromUrl();

    this.loadData();

    // Setup search debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.searchQuery.set(value || '');
      this.syncFiltersToUrl();
    });
  }

  ngAfterViewInit(): void {
    // Trigger KPI count-up animation after view init
    if (!this.prefersReducedMotion()) {
      this.kpiAnimationTimeout = setTimeout(() => this.animateKpiCards(), 300);
    }
  }

  ngOnDestroy(): void {
    this.stopLiveMode();
    if (this.kpiAnimationTimeout) {
      clearTimeout(this.kpiAnimationTimeout);
      this.kpiAnimationTimeout = null;
    }
  }

  // ─── Keyboard Navigation ────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Only handle when drawer is open
    if (!this.isDrawerOpen()) return;

    // Don't handle if user is typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.closeSensorDrawer();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.navigateToPreviousSensor();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.navigateToNextSensor();
        break;
    }
  }

  // ─── KPI Animation ──────────────────────────────────────────────────────

  private animateKpiCards(): void {
    const kpiElements = this.elementRef.nativeElement.querySelectorAll('.kpi-value-animated');
    const kpis = this.kpiCards();

    kpiElements.forEach((el: HTMLElement, index: number) => {
      const kpi = kpis[index];
      if (!kpi) return;

      const delay = this.prefersReducedMotion() ? 0 : index * 100;
      setTimeout(() => {
        animateCounter(el, kpi.rawValue, 800, '', kpi.unit === '%' ? '%' : '');
      }, delay);
    });

    this.kpiAnimationComplete.set(true);
  }

  // ─── URL Filter Persistence ─────────────────────────────────────────────

  private restoreFiltersFromUrl(): void {
    const params = this.route.snapshot.queryParams;

    if (params['tab']) this.activeTab.set(params['tab'] as ActiveTab);
    if (params['period']) this.datePreset.set(params['period'] as DatePreset);
    if (params['farm']) this.selectedFarmIds.set(params['farm'].split(','));
    if (params['farmer'] && this.isAdmin()) this.selectedFarmerIds.set(params['farmer'].split(','));
    if (params['type']) this.selectedSensorTypes.set(params['type'].split(','));
    if (params['anomalies'] === 'true') this.showAnomaliesOnly.set(true);
    if (params['search']) this.searchControl.setValue(params['search']);
  }

  syncFiltersToUrl(): void {
    const params: any = {};

    if (this.activeTab() !== 'overview') params['tab'] = this.activeTab();
    if (this.datePreset() !== '7days') params['period'] = this.datePreset();
    if (this.selectedFarmIds().length) params['farm'] = this.selectedFarmIds().join(',');
    if (this.selectedFarmerIds().length) params['farmer'] = this.selectedFarmerIds().join(',');
    if (this.selectedSensorTypes().length) params['type'] = this.selectedSensorTypes().join(',');
    if (this.showAnomaliesOnly()) params['anomalies'] = 'true';
    if (this.searchQuery()) params['search'] = this.searchQuery();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  // ─── Data Loading ──────────────────────────────────────────────────────

  loadData(): void {
    this.isLoading.set(true);
    this.kpiAnimationComplete.set(false);

    if (this.isAdmin()) {
      this.loadAdminData();
    } else {
      this.loadFarmerData();
    }
  }

  private loadAdminData(): void {
    const trendsPeriod = this.datePreset() === 'today' ? '7days' :
                         this.datePreset() === '90days' ? '90days' : '30days';

    forkJoin({
      farms: this.apiService.getFarms().pipe(catchError((err) => { console.error('Failed to load farms:', err); return of([]); })),
      devices: this.apiService.getDevices(true).pipe(catchError((err) => { console.error('Failed to load devices:', err); return of([]); })),
      sensors: this.apiService.getSensors().pipe(catchError((err) => { console.error('Failed to load sensors:', err); return of([]); })),
      readings: this.apiService.getSensorReadings(500, 0).pipe(catchError((err) => { console.error('Failed to load readings:', err); return of([]); })),
      users: this.apiService.getUsers().pipe(catchError((err) => { console.error('Failed to load users:', err); return of([]); })),
      trends: this.adminApiService.getOverviewTrends(trendsPeriod as any).pipe(catchError((err) => { console.error('Failed to load trends:', err); return of(null); }))
    }).subscribe({
      next: (data) => {
        this.farms.set(data.farms);
        this.devices.set(data.devices);
        this.sensors.set(data.sensors);
        this.readings.set(data.readings);
        this.users.set(data.users);
        this.overviewTrends.set(data.trends);
        this.isLoading.set(false);
        this.isRefreshing.set(false);

        // Trigger KPI animation after data loads
        if (!this.prefersReducedMotion()) {
          // Clear existing timeout before setting new one
          if (this.kpiAnimationTimeout) {
            clearTimeout(this.kpiAnimationTimeout);
          }
          this.kpiAnimationTimeout = setTimeout(() => this.animateKpiCards(), 200);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      }
    });
  }

  private loadFarmerData(): void {
    const userId = this.currentUserId();
    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    forkJoin({
      farms: this.apiService.getUserFarms(userId).pipe(catchError((err) => { console.error('Failed to load user farms:', err); return of([]); })),
      devices: this.apiService.getDevices(true).pipe(catchError((err) => { console.error('Failed to load devices:', err); return of([]); })),
      sensors: this.apiService.getSensors().pipe(catchError((err) => { console.error('Failed to load sensors:', err); return of([]); })),
      readings: this.apiService.getSensorReadings(500, 0).pipe(catchError((err) => { console.error('Failed to load readings:', err); return of([]); }))
    }).subscribe({
      next: (data) => {
        const farmerFarmIds = new Set(data.farms.map(f => f.farm_id));
        this.farms.set(data.farms);

        const filteredDevices = data.devices.filter(d => farmerFarmIds.has(d.farm_id));
        this.devices.set(filteredDevices);

        const filteredSensors = data.sensors.filter(s => farmerFarmIds.has(s.farm_id));
        this.sensors.set(filteredSensors);

        const farmerSensorIds = new Set(filteredSensors.map(s => s.sensor_id));
        const filteredReadings = data.readings.filter(r => farmerSensorIds.has(r.sensor_id));
        this.readings.set(filteredReadings);

        const currentUser = this.authService.user();
        this.users.set(currentUser ? [currentUser] : []);
        this.overviewTrends.set(null);

        this.isLoading.set(false);
        this.isRefreshing.set(false);

        if (!this.prefersReducedMotion()) {
          // Clear existing timeout before setting new one
          if (this.kpiAnimationTimeout) {
            clearTimeout(this.kpiAnimationTimeout);
          }
          this.kpiAnimationTimeout = setTimeout(() => this.animateKpiCards(), 200);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      }
    });
  }

  refreshData(): void {
    this.isRefreshing.set(true);
    this.loadData();
  }

  // ─── Filter Actions ─────────────────────────────────────────────────────

  onDatePresetChange(preset: DatePreset): void {
    this.datePreset.set(preset);
    this.syncFiltersToUrl();
    this.loadData();
  }

  onFarmFilterChange(farmIds: string[]): void {
    this.selectedFarmIds.set(farmIds);
    this.syncFiltersToUrl();
  }

  onFarmerFilterChange(farmerIds: string[]): void {
    this.selectedFarmerIds.set(farmerIds);
    this.syncFiltersToUrl();
    if (farmerIds.length > 0) {
      this.selectedFarmIds.set([]);
    }
  }

  onSensorTypeChange(types: string[]): void {
    this.selectedSensorTypes.set(types);
    this.syncFiltersToUrl();
  }

  toggleAnomaliesOnly(): void {
    this.showAnomaliesOnly.update(v => !v);
    this.syncFiltersToUrl();
  }

  clearAllFilters(): void {
    this.selectedFarmIds.set([]);
    this.selectedFarmerIds.set([]);
    this.selectedSensorTypes.set([]);
    this.showAnomaliesOnly.set(false);
    this.searchControl.setValue('');
    this.searchQuery.set('');
    this.syncFiltersToUrl();
  }

  // ─── Tab Navigation ─────────────────────────────────────────────────────

  onTabChange(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.syncFiltersToUrl();
  }

  // ─── Sensor Group Actions ───────────────────────────────────────────────

  toggleFarmExpansion(farmId: string): void {
    this.expandedFarms.update(set => {
      const newSet = new Set(set);
      if (newSet.has(farmId)) {
        newSet.delete(farmId);
      } else {
        newSet.add(farmId);
      }
      return newSet;
    });
  }

  expandAllFarms(): void {
    const allFarmIds = this.sensorGroups().map(g => g.farmId);
    this.expandedFarms.set(new Set(allFarmIds));
  }

  collapseAllFarms(): void {
    this.expandedFarms.set(new Set());
  }

  // ─── Sensor Detail Drawer ───────────────────────────────────────────────

  openSensorDrawer(sensorId: string): void {
    this.selectedSensorId.set(sensorId);
    this.isDrawerOpen.set(true);
  }

  closeSensorDrawer(): void {
    this.isDrawerOpen.set(false);
    setTimeout(() => this.selectedSensorId.set(null), 300);
  }

  navigateToPreviousSensor(): void {
    const idx = this.currentSensorIndex();
    if (idx > 0) {
      this.selectedSensorId.set(this.orderedSensorIds()[idx - 1]);
    }
  }

  navigateToNextSensor(): void {
    const idx = this.currentSensorIndex();
    if (idx >= 0 && idx < this.orderedSensorIds().length - 1) {
      this.selectedSensorId.set(this.orderedSensorIds()[idx + 1]);
    }
  }

  // ─── Live Mode ──────────────────────────────────────────────────────────

  toggleLiveMode(): void {
    if (this.liveMode()) {
      this.stopLiveMode();
    } else {
      this.startLiveMode();
    }
  }

  private startLiveMode(): void {
    this.liveMode.set(true);
    this.liveInterval = setInterval(() => {
      this.refreshData();
    }, 30000);
  }

  private stopLiveMode(): void {
    this.liveMode.set(false);
    if (this.liveInterval) {
      clearInterval(this.liveInterval);
      this.liveInterval = null;
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  countByStatus(status: string): number {
    return this.filteredSensors().filter(s => s.status === status).length;
  }

  formatLargeNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  getSensorTypeIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'temperature': 'thermostat',
      'humidity': 'water_drop',
      'soil_moisture': 'grass',
      'ph': 'science',
      'co2': 'air',
      'light': 'light_mode',
      'pressure': 'compress',
      'wind': 'air',
      'rainfall': 'water',
      'soil_temperature': 'thermostat',
      'nitrogen': 'biotech',
      'phosphorus': 'biotech',
      'potassium': 'biotech'
    };
    return iconMap[type.toLowerCase()] || 'sensors';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'normal': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      case 'offline': return '#94a3b8';
      default: return '#94a3b8';
    }
  }

  getHealthColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    if (score >= 20) return '#ef4444';
    return '#94a3b8';
  }

  getHealthLabel(score: number): string {
    if (score >= 80) return this.languageService.translate('sensorAnalytics.health.healthy');
    if (score >= 50) return this.languageService.translate('sensorAnalytics.health.degraded');
    if (score >= 20) return this.languageService.translate('sensorAnalytics.health.critical');
    return this.languageService.translate('sensorAnalytics.health.offline');
  }

  getSparklineColor(status: string): string {
    switch (status) {
      case 'normal': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#94a3b8';
    }
  }

  trackByFarmId(index: number, item: SensorGroup): string {
    return item.farmId;
  }

  trackBySensorId(index: number, item: SensorWithReadings): string {
    return item.sensor_id;
  }

  trackByKpi(index: number, item: AnalyticsKPI): string {
    return item.label;
  }

  trackByAnomaly(index: number, item: AnomalyRecord): string {
    return item.sensorId + item.timestamp;
  }

  /** Generate inline SVG sparkline for table rows */
  getSparklineSvg(data: number[], color: string, width: number = 60, height: number = 20): string {
    if (!data || data.length === 0) return '';

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);

    const points = data.map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  /** Generate sparkline points for SVG polyline in template */
  _getSparklinePoints(data: number[]): string {
    if (!data || data.length < 2) return '0,12 80,12';
    const width = 80;
    const height = 24;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);

    return data.map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  /** Get sparkline color based on KPI type */
  _getKpiSparklineColor(kpi: AnalyticsKPI): string {
    if (kpi.label === 'Anomalies') {
      return (kpi.trendDirection === 'up' && kpi.rawValue > 0) ? '#ef4444' : '#10b981';
    }
    if (kpi.label === 'Sensor Uptime') {
      return kpi.rawValue >= 80 ? '#10b981' : kpi.rawValue >= 50 ? '#f59e0b' : '#ef4444';
    }
    return '#10b981';
  }

  /** Safe sparkline HTML binding for innerHTML */
  _getSafeSparkline(data: number[], color: string): string {
    return this.getSparklineSvg(data, color, 60, 20);
  }
}
