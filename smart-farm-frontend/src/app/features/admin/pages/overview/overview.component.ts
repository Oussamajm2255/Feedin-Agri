import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { forkJoin, catchError, of } from 'rxjs';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';
import { ApiService } from '../../../../core/services/api.service';
import { User, UserRole } from '../../../../core/models/user.model';
import { Farm, Device, DeviceStatus } from '../../../../core/models/farm.model';
import { ActionLog } from '../../../../core/models/action-log.model';
import { AppNotification } from '../../../../core/models/notification.model';

type DateRange = 'today' | '7days' | '30days';

interface KPICard {
  label: string;
  value: number | string;
  icon: string;
  route?: string;
  isLoading: boolean;
  hasError: boolean;
  trend?: number | null;
  trendDirection?: 'up' | 'down' | 'flat' | 'up-right' | 'down-right';
  trendColor?: 'success' | 'danger' | 'neutral';
  trendArrow?: string | null;
  performanceClass?: 'perf-low' | 'perf-medium' | 'perf-high' | 'perf-critical' | 'perf-neutral';
  performanceValue?: number; // For threshold-based conditional formatting
  subtitle?: string;
}

interface RecentActivity {
  id: string;
  type: 'action' | 'notification';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
  metadata?: {
    status?: string;
    trigger?: string;
    deviceName?: string;
    farmName?: string;
    level?: string;
    read?: boolean;
  };
}

interface FarmNeedingAttention {
  farm_id: string;
  name: string;
  issue: string;
  deviceCount: number;
  offlineDeviceCount: number;
}

/**
 * Admin Overview Component
 * Dashboard overview with real data from existing APIs
 */
@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    BaseChartDirective,
    TranslatePipe
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewComponent implements OnInit {
  private readonly adminApiService = inject(AdminApiService);
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  // State signals
  isLoading = signal(true);
  dateRange = signal<DateRange>('today');
  selectedFarmId = signal<string | null>(null);
  selectedFarmerId = signal<string | null>(null);
  isActivityExpanded = signal(true);

  // Computed filtered data based on selected farm and farmer
  filteredFarms = computed(() => {
    const farmId = this.selectedFarmId();
    const farmerId = this.selectedFarmerId();
    let farms = this.farms();

    // Filter by farmer (owner_id) if selected
    if (farmerId) {
      farms = farms.filter(f => f.owner_id === farmerId);
    }

    // Filter by specific farm if selected
    if (farmId) {
      farms = farms.filter(f => f.farm_id === farmId);
    }

    return farms;
  });

  filteredDevices = computed(() => {
    const farmId = this.selectedFarmId();
    const farmerId = this.selectedFarmerId();
    let devices = this.devices();

    // Filter by farmer's farms if farmer is selected
    if (farmerId && !farmId) {
      const farmerFarms = this.farms().filter(f => f.owner_id === farmerId).map(f => f.farm_id);
      devices = devices.filter(d => farmerFarms.includes(d.farm_id));
    }

    // Filter by specific farm if selected
    if (farmId) {
      devices = devices.filter(d => d.farm_id === farmId);
    }

    return devices;
  });

  filteredActions = computed(() => {
    const farmId = this.selectedFarmId();
    const farmerId = this.selectedFarmerId();
    let actions = this.recentActions();

    // Filter by farmer's farms if farmer is selected
    if (farmerId && !farmId) {
      const farmerFarms = this.farms().filter(f => f.owner_id === farmerId).map(f => f.farm_id);
      const farmerDevices = this.devices()
        .filter(d => farmerFarms.includes(d.farm_id))
        .map(d => d.device_id);
      actions = actions.filter(a => farmerDevices.includes(a.device_id));
    }

    // Filter by specific farm if selected
    if (farmId) {
      const farmDevices = this.devices().filter(d => d.farm_id === farmId).map(d => d.device_id);
      actions = actions.filter(a => farmDevices.includes(a.device_id));
    }

    return actions;
  });

  // Get unique farmers from farms
  availableFarmers = computed(() => {
    const farms = this.farms();
    const users = this.users();
    const farmerIds = new Set(farms.map(f => f.owner_id).filter(id => id));

    return users
      .filter(u => u.role === UserRole.FARMER && farmerIds.has(u.user_id))
      .map(u => ({
        user_id: u.user_id,
        name: `${u.first_name} ${u.last_name}`,
        email: u.email
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  // Computed signal for selected farmer name
  selectedFarmerName = computed(() => {
    const farmerId = this.selectedFarmerId();
    if (!farmerId) return null;
    const farmer = this.availableFarmers().find(f => f.user_id === farmerId);
    return farmer?.name || 'Unknown';
  });

  // Data signals
  farms = signal<Farm[]>([]);
  devices = signal<Device[]>([]);
  users = signal<User[]>([]);
  recentActions = signal<ActionLog[]>([]);
  recentNotifications = signal<AppNotification[]>([]);
  deviceStats = signal<any>(null);
  overviewSummary = signal<any>(null);
  overviewTrends = signal<any>(null);

  // Chart configurations
  public lineChartType: ChartType = 'line';
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Count'
        },
        beginAtZero: true
      }
    }
  };

  // Chart data computed from trends
  chartData = computed<ChartData<'line'>>(() => {
    const trends = this.overviewTrends();
    if (!trends) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Extract dates from first dataset (all should have same dates)
    const labels = trends.deviceUsage?.map((d: { date: string; value: number }) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }) || [];

    return {
      labels,
      datasets: [
        {
          data: trends.deviceUsage?.map((d: { date: string; value: number }) => d.value) || [],
          label: 'Device Usage',
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          data: trends.userActivity?.map((d: { date: string; value: number }) => d.value) || [],
          label: 'User Activity',
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          data: trends.actionVolume?.map((d: { date: string; value: number }) => d.value) || [],
          label: 'Action Volume',
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          data: trends.sensorReadings?.map((d: { date: string; value: number }) => d.value) || [],
          label: 'Sensor Readings',
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ]
    };
  });

  // Computed KPIs with filtering support
  kpiCards = computed<KPICard[]>(() => {
    const summary = this.overviewSummary();
    const farmId = this.selectedFarmId();
    const farmerId = this.selectedFarmerId();

    // Use filtered data when filters are active
    const farmsData = (farmId || farmerId) ? this.filteredFarms() : this.farms();
    const devicesData = (farmId || farmerId) ? this.filteredDevices() : this.devices();
    const actionsData = (farmId || farmerId) ? this.filteredActions() : this.recentActions();
    const notificationsData = this.recentNotifications();

    // Calculate filtered counts
    const dateRange = this.dateRange();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate: Date;
    if (dateRange === 'today') {
      startDate = today;
    } else if (dateRange === '7days') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
    }

    const filteredActionsToday = actionsData.filter(a => {
      const actionDate = new Date(a.created_at);
      return actionDate >= startDate;
    });

    const filteredNotificationsToday = notificationsData.filter(n => {
      const notifDate = new Date(n.createdAt);
      return notifDate >= startDate;
    });

    const onlineDevices = devicesData.filter(d => d.status === DeviceStatus.ONLINE || d.status === DeviceStatus.ACTIVE);

    // Use summary data if available and no filter, otherwise use filtered data
    const useSummary = summary && !farmId;

    // Helper to determine trend direction and color with arrow symbol
    const getTrendInfo = (trend: number | null, isPositiveGood: boolean = true) => {
      if (trend === null || trend === undefined) return { direction: undefined, color: undefined, arrow: undefined };

      let direction: 'up' | 'down' | 'flat' | 'up-right' | 'down-right' = 'flat';
      let arrow: string = '→';

      if (trend > 5) {
        direction = 'up';
        arrow = '↑';
      } else if (trend > 0) {
        direction = 'up-right';
        arrow = '↗';
      } else if (trend < -5) {
        direction = 'down';
        arrow = '↓';
      } else if (trend < 0) {
        direction = 'down-right';
        arrow = '↘';
      } else {
        direction = 'flat';
        arrow = '→';
      }

      let color: 'success' | 'danger' | 'neutral' = 'neutral';
      if (trend > 0) color = isPositiveGood ? 'success' : 'danger';
      else if (trend < 0) color = isPositiveGood ? 'danger' : 'success';

      return { direction, color, arrow };
    };

    // Helper to determine performance class
    const getPerformanceClass = (value: number, thresholdLow: number, thresholdHigh: number, isHigherBetter: boolean = true) => {
      if (isHigherBetter) {
        if (value >= thresholdHigh) return 'perf-high';
        if (value >= thresholdLow) return 'perf-medium';
        return 'perf-low';
      } else {
        if (value <= thresholdLow) return 'perf-high'; // Low value is good (e.g. alerts)
        if (value <= thresholdHigh) return 'perf-medium';
        return 'perf-critical';
      }
    };

    const onlinePercentage = devicesData.length > 0 ? (onlineDevices.length / devicesData.length) * 100 : 0;
    const onlineTrend = devicesData.length > 0 ? (onlineDevices.length / devicesData.length) * 100 : 0; // Placeholder for actual trend
    const onlineTrendInfo = getTrendInfo(onlineTrend, true);

    const alertsCount = filteredNotificationsToday.length;
    // Assume some thresholds for alerts
    const alertsPerformance = getPerformanceClass(alertsCount, 5, 15, false);

    // Calculate trend for actions (placeholder - would need historical data)
    const actionsCount = filteredActionsToday.length;
    const actionsTrendInfo = getTrendInfo(null, true); // Would calculate from historical data

    return [
      {
        label: 'Total Farms',
        value: useSummary ? summary.totalFarms : farmsData.length,
        icon: 'agriculture',
        route: '/admin/farms',
        isLoading: false,
        hasError: false,
        trend: null,
        performanceClass: 'perf-neutral',
        subtitle: farmId ? 'Filtered' : 'All farms'
      },
      {
        label: 'Total Farmers',
        value: useSummary ? summary.totalFarmers : this.users().filter(u => u.role === UserRole.FARMER).length,
        icon: 'people',
        route: '/admin/farmers',
        isLoading: false,
        hasError: false,
        trend: null,
        performanceClass: 'perf-neutral',
        subtitle: 'Active farmers'
      },
      {
        label: 'Total Devices',
        value: useSummary ? summary.totalDevices : devicesData.length,
        icon: 'devices',
        route: '/admin/devices',
        isLoading: false,
        hasError: false,
        trend: null,
        performanceClass: 'perf-neutral',
        subtitle: `${onlineDevices.length} online`
      },
      {
        label: 'Online Devices',
        value: useSummary ? summary.onlineDevices : onlineDevices.length,
        icon: 'check_circle',
        route: '/admin/devices',
        isLoading: false,
        hasError: false,
        trend: onlineTrend,
        trendDirection: onlineTrendInfo.direction,
        trendColor: onlineTrendInfo.color,
        trendArrow: onlineTrendInfo.arrow,
        performanceClass: getPerformanceClass(onlinePercentage, 50, 80, true),
        performanceValue: onlinePercentage,
        subtitle: `${devicesData.length - onlineDevices.length} offline`
      },
      {
        label: 'Alerts Today',
        value: useSummary ? summary.alertsToday : filteredNotificationsToday.length,
        icon: 'notifications',
        route: '/admin/logs',
        isLoading: false,
        hasError: false,
        trend: null, // Could calculate if we had yesterday's data
        trendArrow: null,
        performanceClass: alertsPerformance,
        performanceValue: alertsCount,
        subtitle: filteredNotificationsToday.filter(n => !n.read).length > 0 ? `${filteredNotificationsToday.filter(n => !n.read).length} unread` : 'All read'
      },
      {
        label: 'Actions Today',
        value: useSummary ? summary.actionsToday : filteredActionsToday.length,
        icon: 'bolt',
        route: '/admin/logs',
        isLoading: false,
        hasError: false,
        trend: null,
        trendArrow: null,
        performanceClass: 'perf-neutral',
        performanceValue: actionsCount,
        subtitle: `${filteredActionsToday.filter(a => a.status === 'ack').length} acknowledged`
      }
    ];
  });


  // Helper to format MQTT topic
  private formatMqttTopic(topic: string): string {
    if (!topic) return 'Unknown Action';

    // Example: mqtt:smartfarm/actuators/dht11h/ventilator_off
    // Remove prefix
    let cleanTopic = topic.replace(/^mqtt:/, '').replace(/^smartfarm\//, '');

    // Split parts
    const parts = cleanTopic.split('/').filter(p => p);

    if (parts.length >= 2) {
      // Get device name (usually second to last) and action (last)
      const deviceName = parts.length > 2 ? parts[parts.length - 2] : '';
      const action = parts[parts.length - 1];

      // Format action: ventilator_off -> Ventilator Off
      const formattedAction = action.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Format device name if available: dht11h -> DHT11H
      const formattedDevice = deviceName
        ? deviceName.split('_')
            .map(word => word.toUpperCase())
            .join(' ')
        : '';

      // Return formatted string
      return formattedDevice
        ? `${formattedAction} (${formattedDevice})`
        : formattedAction;
    }

    // Fallback: try to format the whole topic
    return cleanTopic.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Computed recent activity with filtering and enhanced info
  recentActivity = computed<RecentActivity[]>(() => {
    const farmId = this.selectedFarmId();
    const actions = farmId ? this.filteredActions() : this.recentActions();
    const notifications = this.recentNotifications()
      .filter(n => {
        // Filter notifications by farm if farm is selected
        if (farmId) {
          // Try to match notification to farm via devices
          const farmDevices = this.devices().filter(d => d.farm_id === farmId).map(d => d.device_id);
          // For now, include all notifications if we can't match by device
          return true;
        }
        return n.level === 'critical' || n.level === 'warning' || n.level === 'info';
      });

    const activities: RecentActivity[] = [];

    // Add actions with enhanced info
    actions.forEach(action => {
      const device = this.devices().find(d => d.device_id === action.device_id);
      const farm = device ? this.farms().find(f => f.farm_id === device.farm_id) : null;

      const formattedTitle = this.formatMqttTopic(action.action_uri || action.topic || 'Unknown Action');

      activities.push({
        id: action.id?.toString() || '',
        type: 'action',
        title: formattedTitle,
        description: farm
          ? `${farm.name} • ${device?.name || action.device_id}`
          : `Device: ${action.device_id}`,
        timestamp: new Date(action.created_at),
        icon: action.trigger_source === 'auto' ? 'auto_awesome' : 'touch_app',
        color: action.status === 'ack' ? 'success' : action.status === 'error' ? 'danger' : 'warning',
        metadata: {
          status: action.status,
          trigger: action.trigger_source,
          deviceName: device?.name,
          farmName: farm?.name
        }
      });
    });

    // Add notifications with enhanced info
    notifications.forEach(notif => {
      activities.push({
        id: notif.id,
        type: 'notification',
        title: notif.title || 'Notification',
        description: notif.message || 'No message',
        timestamp: new Date(notif.createdAt),
        icon: this.getNotificationIcon(notif.level),
        color: notif.level === 'critical' ? 'danger' : notif.level === 'warning' ? 'warning' : 'info',
        metadata: {
          level: notif.level,
          read: notif.read
        }
      });
    });

    // Sort by timestamp
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  // Computed farms needing attention
  farmsNeedingAttention = computed<FarmNeedingAttention[]>(() => {
    const farmsData = this.farms();
    const devicesData = this.devices();

    return farmsData
      .map(farm => {
        const farmDevices = devicesData.filter(d => d.farm_id === farm.farm_id);
        const offlineDevices = farmDevices.filter(
          d => d.status === DeviceStatus.OFFLINE || d.status === DeviceStatus.MAINTENANCE
        );

        if (offlineDevices.length === 0) return null;

        return {
          farm_id: farm.farm_id,
          name: farm.name,
          issue: `${offlineDevices.length} offline device${offlineDevices.length > 1 ? 's' : ''}`,
          deviceCount: farmDevices.length,
          offlineDeviceCount: offlineDevices.length
        };
      })
      .filter((f): f is FarmNeedingAttention => f !== null)
      .slice(0, 5);
  });

  // Computed top farms (by device count)
  topFarms = computed(() => {
    const farmsData = this.farms();
    const devicesData = this.devices();

    return farmsData
      .map(farm => ({
        farm_id: farm.farm_id,
        name: farm.name,
        deviceCount: devicesData.filter(d => d.farm_id === farm.farm_id).length
      }))
      .sort((a, b) => b.deviceCount - a.deviceCount)
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    const dateRange = this.dateRange();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate: Date;
    if (dateRange === 'today') {
      startDate = today;
    } else if (dateRange === '7days') {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 30);
    }

    // Determine trends period based on date range
    const trendsPeriod = dateRange === 'today' ? '7days' : dateRange === '7days' ? '7days' : '30days';

    // Use new admin endpoints for summary and trends
    forkJoin({
      summary: this.adminApiService.getOverviewSummary().pipe(
        catchError(() => of(null))
      ),
      trends: this.adminApiService.getOverviewTrends(trendsPeriod).pipe(
        catchError(() => of(null))
      ),
      // Still fetch individual data for detailed views (farms needing attention, top farms, recent activity)
      farms: this.apiService.getFarms().pipe(catchError(() => of([]))),
      devices: this.apiService.getDevices().pipe(catchError(() => of([]))),
      users: this.apiService.getUsers().pipe(catchError(() => of([]))),
      actions: this.apiService.getActions({
        limit: 20,
        from: startDate.toISOString()
      }).pipe(
        catchError(() => of({ items: [], total: 0 }))
      ),
      notifications: this.apiService.getNotifications({
        limit: 20,
        from: startDate.toISOString()
      }).pipe(
        catchError(() => of({ items: [], total: 0 }))
      ),
      deviceStats: this.apiService.getDeviceStatistics().pipe(
        catchError(() => of(null))
      )
    }).subscribe({
      next: (data) => {
        this.overviewSummary.set(data.summary);
        this.overviewTrends.set(data.trends);
        this.farms.set(data.farms);
        this.devices.set(data.devices);
        this.users.set(data.users);
        this.recentActions.set(data.actions.items || []);
        this.recentNotifications.set(data.notifications.items || []);
        this.deviceStats.set(data.deviceStats);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onDateRangeChange(range: DateRange): void {
    this.dateRange.set(range);
    this.loadData();
  }

  onFarmFilterChange(farmId: string | null): void {
    this.selectedFarmId.set(farmId);
    // Filtering is now handled by computed signals
    // No need to reload data, just update the filter
  }

  clearFarmFilter(): void {
    this.selectedFarmId.set(null);
  }

  onFarmerFilterChange(farmerId: string | null): void {
    this.selectedFarmerId.set(farmerId);
    // If farmer is selected, clear farm filter to show all farms for that farmer
    if (farmerId) {
      this.selectedFarmId.set(null);
    }
  }

  clearFarmerFilter(): void {
    this.selectedFarmerId.set(null);
  }

  clearAllFilters(): void {
    this.selectedFarmId.set(null);
    this.selectedFarmerId.set(null);
  }

  // Computed signal for selected farm name
  selectedFarmName = computed(() => {
    const farmId = this.selectedFarmId();
    if (!farmId) return null;
    const farm = this.farms().find(f => f.farm_id === farmId);
    return farm?.name || 'Unknown';
  });

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  toggleActivityExpansion(): void {
    this.isActivityExpanded.update(v => !v);
  }

  private getNotificationIcon(level: string): string {
    switch (level) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'check_circle';
      default:
        return 'notifications';
    }
  }

  // Quick Actions configuration
  quickActions = computed(() => {
    const summary = this.overviewSummary();
    const devicesData = this.devices();
    const notificationsData = this.recentNotifications();

    const offlineDevices = devicesData.filter(
      d => d.status === DeviceStatus.OFFLINE || d.status === DeviceStatus.MAINTENANCE
    );
    const criticalAlerts = notificationsData.filter(n => n.level === 'critical' && !n.read).length;

    return [
      {
        label: 'Invite Farmer',
        icon: 'person_add',
        route: '/admin/users',
        color: 'primary',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        badge: null as number | null,
        tooltip: 'Add a new farmer to the system',
        urgent: false
      },
      {
        label: 'View All Farms',
        icon: 'agriculture',
        route: '/admin/farms',
        color: 'accent',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        badge: summary?.totalFarms || null,
        tooltip: `View all ${summary?.totalFarms || 0} farms in the system`,
        urgent: false
      },
      {
        label: 'Offline Devices',
        icon: 'devices_off',
        route: '/admin/devices',
        color: 'warn',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        badge: offlineDevices.length > 0 ? offlineDevices.length : null,
        tooltip: `${offlineDevices.length} device${offlineDevices.length !== 1 ? 's' : ''} need attention`,
        urgent: offlineDevices.length > 0
      },
      {
        label: 'System Health',
        icon: 'monitor_heart',
        route: '/admin/system-health',
        color: 'primary',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        badge: null as number | null,
        tooltip: 'Monitor system performance and health metrics',
        urgent: false
      },
      {
        label: 'View Logs',
        icon: 'article',
        route: '/admin/logs',
        color: 'primary',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        badge: summary?.actionsToday || null,
        tooltip: `View ${summary?.actionsToday || 0} actions logged today`,
        urgent: false
      },
      {
        label: 'Critical Alerts',
        icon: 'error',
        route: '/admin/logs',
        color: 'warn',
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        badge: criticalAlerts > 0 ? criticalAlerts : null,
        tooltip: `${criticalAlerts} critical alert${criticalAlerts !== 1 ? 's' : ''} require attention`,
        urgent: criticalAlerts > 0
      }
    ];
  });

  // TrackBy functions for ngFor performance optimization
  trackByKpiLabel = (_index: number, kpi: KPICard): string => kpi.label;
  trackByActivityId = (_index: number, activity: RecentActivity): string => activity.id;
  trackByFarmId = (_index: number, farm: { farm_id: string }): string => farm.farm_id;
  trackByActionRoute = (_index: number, action: { route: string }): string => action.route;
  trackByFarmerId = (_index: number, farmer: { user_id: string }): string => farmer.user_id;
}

