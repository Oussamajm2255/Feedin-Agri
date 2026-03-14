import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  signal, computed, inject, DestroyRef
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
import { ChartConfiguration, ChartData, ChartType, ChartOptions } from 'chart.js';
import { forkJoin, catchError, of, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AdminApiService } from '../../admin/core/services/admin-api.service';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
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
  icon: string;
  subtitle: string;
  trend: number | null;
  trendDirection: 'up' | 'down' | 'flat';
  trendColor: 'success' | 'danger' | 'neutral';
  trendArrow: string;
  performanceClass: string;
  unit?: string;
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
export class SensorAnalyticsComponent implements OnInit, OnDestroy {
  private readonly adminApiService = inject(AdminApiService);
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

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

  // ─── Data Signals ───────────────────────────────────────────────────────
  farms = signal<Farm[]>([]);
  devices = signal<Device[]>([]);
  sensors = signal<Sensor[]>([]);
  readings = signal<SensorReading[]>([]);
  users = signal<User[]>([]);
  overviewTrends = signal<any>(null);

  searchControl = new FormControl('');
  private liveInterval: any = null;

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

    // Filter by farm
    if (farmIds.length > 0) {
      sensorList = sensorList.filter(s => farmIds.includes(s.farm_id));
    }

    // Filter by farmer
    if (farmerIds.length > 0) {
      const farmerFarmIds = this.farms()
        .filter(f => farmerIds.includes(f.owner_id))
        .map(f => f.farm_id);
      sensorList = sensorList.filter(s => farmerFarmIds.includes(s.farm_id));
    }

    // Filter by sensor type
    if (sensorTypes.length > 0) {
      sensorList = sensorList.filter(s => sensorTypes.includes(s.type));
    }

    // Filter by search
    if (search) {
      sensorList = sensorList.filter(s =>
        s.sensor_id.toLowerCase().includes(search) ||
        s.type.toLowerCase().includes(search) ||
        (s.farmName || '').toLowerCase().includes(search) ||
        (s.deviceName || '').toLowerCase().includes(search) ||
        (s.location || '').toLowerCase().includes(search)
      );
    }

    // Filter anomalies only
    if (anomaliesOnly) {
      sensorList = sensorList.filter(s =>
        s.status === 'warning' || s.status === 'critical'
      );
    }

    return sensorList;
  });

  // ─── Computed: Sensors with Reading Aggregates ──────────────────────────
  sensorsWithReadings = computed<SensorWithReadings[]>(() => {
    const allSensors = this.sensors();
    const allReadings = this.readings();
    const farms = this.farms();
    const devices = this.devices();
    const users = this.users();

    return allSensors.map(sensor => {
      const sensorReadings = allReadings.filter(r => r.sensor_id === sensor.sensor_id);
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

      // Determine sensor health status
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
        deviceName: device?.name || sensor.device_id
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

  // ─── Computed: KPI Cards ────────────────────────────────────────────────
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

    return [
      {
        label: 'Total Sensors',
        value: totalSensors,
        icon: 'sensors',
        subtitle: `${activeSensors} active`,
        trend: null,
        trendDirection: 'flat',
        trendColor: 'neutral',
        trendArrow: '→',
        performanceClass: 'perf-neutral'
      },
      {
        label: 'Total Readings',
        value: this.formatLargeNumber(totalReadings),
        icon: 'analytics',
        subtitle: `In selected period`,
        trend: null,
        trendDirection: 'flat',
        trendColor: 'neutral',
        trendArrow: '→',
        performanceClass: 'perf-neutral'
      },
      {
        label: 'Sensor Uptime',
        value: `${uptimePercent}%`,
        icon: 'speed',
        subtitle: `${totalSensors - activeSensors} offline`,
        trend: uptimePercent,
        trendDirection: uptimePercent >= 80 ? 'up' : uptimePercent >= 50 ? 'flat' : 'down',
        trendColor: uptimePercent >= 80 ? 'success' : uptimePercent >= 50 ? 'neutral' : 'danger',
        trendArrow: uptimePercent >= 80 ? '↑' : uptimePercent >= 50 ? '→' : '↓',
        performanceClass: uptimePercent >= 80 ? 'perf-high' : uptimePercent >= 50 ? 'perf-medium' : 'perf-low',
        unit: '%'
      },
      {
        label: 'Anomalies',
        value: anomalies.length,
        icon: 'warning',
        subtitle: `${anomalies.filter(a => a.status === 'critical').length} critical`,
        trend: anomalies.length > 0 ? anomalies.length : null,
        trendDirection: anomalies.length === 0 ? 'flat' : 'up',
        trendColor: anomalies.length === 0 ? 'success' : 'danger',
        trendArrow: anomalies.length === 0 ? '→' : '↑',
        performanceClass: anomalies.length === 0 ? 'perf-high' :
                          anomalies.length <= 3 ? 'perf-medium' : 'perf-critical'
      },
      {
        label: 'Avg Reading',
        value: Math.round(avgValue * 100) / 100,
        icon: 'equalizer',
        subtitle: this.isAdmin() ? 'Across all sensors' : 'Across your sensors',
        trend: null,
        trendDirection: 'flat',
        trendColor: 'neutral',
        trendArrow: '→',
        performanceClass: 'perf-neutral'
      },
      {
        label: this.isAdmin() ? 'Active Farms' : 'Your Farms',
        value: new Set(sensors.map(s => s.farm_id)).size,
        icon: 'agriculture',
        subtitle: 'With sensor data',
        trend: null,
        trendDirection: 'flat',
        trendColor: 'neutral',
        trendArrow: '→',
        performanceClass: 'perf-neutral'
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

  // Time-series line chart
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
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, family: "'Inter', sans-serif" },
        bodyFont: { size: 12, family: "'Inter', sans-serif" },
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        display: true,
        title: { display: true, text: 'Time', font: { size: 12 } },
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { size: 11 }, maxTicksLimit: 12 }
      },
      y: {
        display: true,
        title: { display: true, text: 'Value', font: { size: 12 } },
        grid: { color: 'rgba(0,0,0,0.06)' },
        beginAtZero: false,
        ticks: { font: { size: 11 } }
      }
    },
    elements: {
      point: { radius: 2, hoverRadius: 6 },
      line: { tension: 0.35 }
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
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.4
        },
        {
          data: trends.deviceUsage?.map((d: any) => d.value) || [],
          label: 'Device Activity',
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          fill: true,
          tension: 0.4
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
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { font: { size: 11 } }
      }
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
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: '#10b981',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          data: comparisons.map(c => c.readingCount),
          label: 'Readings',
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          data: comparisons.map(c => c.alertCount),
          label: 'Alerts',
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };
  });

  // Health distribution doughnut
  healthChartType: 'doughnut' = 'doughnut';
  healthChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, family: "'Inter', sans-serif" }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8
      }
    }
  };

  healthDistributionData = computed<ChartData<'doughnut'>>(() => {
    const sensors = this.filteredSensors();
    const normal = sensors.filter(s => s.status === 'normal').length;
    const warning = sensors.filter(s => s.status === 'warning').length;
    const critical = sensors.filter(s => s.status === 'critical').length;
    const offline = sensors.filter(s => s.status === 'offline').length;

    return {
      labels: ['Normal', 'Warning', 'Critical', 'Offline'],
      datasets: [{
        data: [normal, warning, critical, offline],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(148, 163, 184, 0.8)'
        ],
        borderColor: ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
        borderWidth: 2,
        hoverOffset: 6
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
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
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
    if (this.searchQuery()) count++;
    return count;
  });

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadData();

    // Setup search debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.searchQuery.set(value || '');
    });
  }

  ngOnDestroy(): void {
    this.stopLiveMode();
  }

  // ─── Data Loading ──────────────────────────────────────────────────────

  loadData(): void {
    this.isLoading.set(true);

    if (this.isAdmin()) {
      this.loadAdminData();
    } else {
      this.loadFarmerData();
    }
  }

  /**
   * ADMIN MODE: Load ALL data from the entire database.
   * Admin sees every farm, every sensor, every reading, every user.
   */
  private loadAdminData(): void {
    const trendsPeriod = this.datePreset() === 'today' ? '7days' :
                         this.datePreset() === '90days' ? '90days' : '30days';

    forkJoin({
      farms: this.apiService.getFarms().pipe(catchError(() => of([]))),
      devices: this.apiService.getDevices(true).pipe(catchError(() => of([]))),
      sensors: this.apiService.getSensors().pipe(catchError(() => of([]))),
      readings: this.apiService.getSensorReadings(500, 0).pipe(catchError(() => of([]))),
      users: this.apiService.getUsers().pipe(catchError(() => of([]))),
      trends: this.adminApiService.getOverviewTrends(trendsPeriod as any).pipe(catchError(() => of(null)))
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
      },
      error: () => {
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      }
    });
  }

  /**
   * FARMER MODE: Load ONLY the farmer's own farms and their related data.
   * 1. Fetch the farmer's farms via getUserFarms(userId)
   * 2. Fetch global sensors, devices, readings
   * 3. Filter everything down to only the farmer's farm IDs
   */
  private loadFarmerData(): void {
    const userId = this.currentUserId();
    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    forkJoin({
      farms: this.apiService.getUserFarms(userId).pipe(catchError(() => of([]))),
      devices: this.apiService.getDevices(true).pipe(catchError(() => of([]))),
      sensors: this.apiService.getSensors().pipe(catchError(() => of([]))),
      readings: this.apiService.getSensorReadings(500, 0).pipe(catchError(() => of([])))
    }).subscribe({
      next: (data) => {
        // Only the farmer's own farms
        const farmerFarmIds = new Set(data.farms.map(f => f.farm_id));
        this.farms.set(data.farms);

        // Filter devices to only those belonging to farmer's farms
        const filteredDevices = data.devices.filter(d => farmerFarmIds.has(d.farm_id));
        this.devices.set(filteredDevices);

        // Filter sensors to only those belonging to farmer's farms
        const filteredSensors = data.sensors.filter(s => farmerFarmIds.has(s.farm_id));
        this.sensors.set(filteredSensors);

        // Filter readings to only those from farmer's sensors
        const farmerSensorIds = new Set(filteredSensors.map(s => s.sensor_id));
        const filteredReadings = data.readings.filter(r => farmerSensorIds.has(r.sensor_id));
        this.readings.set(filteredReadings);

        // Set users to just the current farmer (no need to load all users)
        const currentUser = this.authService.user();
        this.users.set(currentUser ? [currentUser] : []);

        // No admin trends endpoint for farmer
        this.overviewTrends.set(null);

        this.isLoading.set(false);
        this.isRefreshing.set(false);
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
    this.loadData();
  }

  onFarmFilterChange(farmIds: string[]): void {
    this.selectedFarmIds.set(farmIds);
  }

  onFarmerFilterChange(farmerIds: string[]): void {
    this.selectedFarmerIds.set(farmerIds);
    // Clear farm filter when farmer changes
    if (farmerIds.length > 0) {
      this.selectedFarmIds.set([]);
    }
  }

  onSensorTypeChange(types: string[]): void {
    this.selectedSensorTypes.set(types);
  }

  toggleAnomaliesOnly(): void {
    this.showAnomaliesOnly.update(v => !v);
  }

  clearAllFilters(): void {
    this.selectedFarmIds.set([]);
    this.selectedFarmerIds.set([]);
    this.selectedSensorTypes.set([]);
    this.showAnomaliesOnly.set(false);
    this.searchControl.setValue('');
    this.searchQuery.set('');
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

  // ─── Tab Navigation ─────────────────────────────────────────────────────

  onTabChange(tab: ActiveTab): void {
    this.activeTab.set(tab);
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
    }, 30000); // Refresh every 30 seconds
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
    if (score >= 80) return 'Healthy';
    if (score >= 50) return 'Degraded';
    if (score >= 20) return 'Critical';
    return 'Offline';
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
}
