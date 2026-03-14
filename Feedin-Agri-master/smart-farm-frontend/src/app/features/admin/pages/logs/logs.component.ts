import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { catchError, finalize, debounceTime } from 'rxjs/operators';
import { of } from 'rxjs';
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

/**
 * System Log Entry Model
 * Based on the data model specified in requirements
 */
export interface SystemLog {
  id: string;
  created_at: string | Date;
  action_uri: string;
  source_type: 'system' | 'device' | 'sensor' | 'user' | 'auto';
  source_id: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  error_message?: string | null;
  device_id?: string | null;
  sensor_id?: string | null;
  user_id?: string | null;
  farm_id?: string | null;
  payload?: any;
}

/**
 * Related Object Models
 */
export interface RelatedDevice {
  device_id: string;
  device_type: string;
  status: string;
  last_seen?: string | Date;
}

export interface RelatedSensor {
  sensor_id: string;
  sensor_type: string;
  unit?: string;
}

export interface RelatedUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface RelatedFarm {
  farm_id: string;
  farm_name: string;
  owner_id: string;
}

/**
 * Date Group for organizing logs with collapsible state
 */
interface DateGroup {
  label: string;
  logs: SystemLog[];
  isExpanded: boolean;
  timeRange?: string;
}

/**
 * System Logs Component
 * Production-ready admin logs viewer with two-panel layout
 */
@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    FormsModule,
    TranslatePipe,
  ],
  templateUrl: './logs.component.html',
  styleUrl: './logs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsComponent implements OnInit {
  private adminApiService = inject(AdminApiService);
  private destroyRef = inject(DestroyRef);

  // ========================================
  // STATE SIGNALS
  // ========================================

  /** All logs loaded */
  logs = signal<SystemLog[]>([]);

  /** Loading state */
  loading = signal<boolean>(true);

  /** Error state */
  error = signal<string | null>(null);

  /** Selected log for details panel */
  selectedLog = signal<SystemLog | null>(null);

  /** Search query */
  searchQuery = signal<string>('');

  /** Type filter */
  selectedType = signal<string>('');

  /** Status filter */
  selectedStatus = signal<string>('');

  /** Date range filter */
  selectedDateRange = signal<string>('all');

  /** Active tab in details panel */
  activeTab = signal<number>(0);

  /** Related objects loading states */
  loadingRelatedDevice = signal<boolean>(false);
  loadingRelatedSensor = signal<boolean>(false);
  loadingRelatedUser = signal<boolean>(false);
  loadingRelatedFarm = signal<boolean>(false);

  /** Related objects data */
  relatedDevice = signal<RelatedDevice | null>(null);
  relatedSensor = signal<RelatedSensor | null>(null);
  relatedUser = signal<RelatedUser | null>(null);
  relatedFarm = signal<RelatedFarm | null>(null);

  /** Timeline logs (related logs) */
  timelineLogs = signal<SystemLog[]>([]);
  loadingTimeline = signal<boolean>(false);

  /** Collapsed groups state - using object for better reactivity */
  collapsedGroups = signal<Record<string, boolean>>({});

  // ========================================
  // COMPUTED SIGNALS
  // ========================================

  /** Filtered logs based on search and filters */
  filteredLogs = computed(() => {
    let result = this.logs();

    // Type filter
    const type = this.selectedType();
    if (type) {
      result = result.filter(log => log.source_type === type);
    }

    // Status filter
    const status = this.selectedStatus();
    if (status) {
      result = result.filter(log => log.status === status);
    }

    // Date range filter
    const dateRange = this.selectedDateRange();
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();

      switch (dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case '24h':
          cutoff.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoff.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoff.setDate(now.getDate() - 30);
          break;
      }

      result = result.filter(log => {
        const logDate = new Date(log.created_at);
        return logDate >= cutoff;
      });
    }

    // Search filter (deep search in message, action_uri, error_message, payload)
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(log => {
        const searchableText = [
          log.message,
          log.action_uri,
          log.error_message || '',
          JSON.stringify(log.payload || {}),
        ].join(' ').toLowerCase();

        return searchableText.includes(query);
      });
    }

    return result;
  });

  /** Grouped logs by date with premium timeline grouping */
  groupedLogs = computed<DateGroup[]>(() => {
    const logs = this.filteredLogs();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const groups: { [key: string]: SystemLog[] } = {
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      older: [],
    };

    // Sort logs by date (newest first) before grouping
    const sortedLogs = [...logs].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    sortedLogs.forEach(log => {
      const logDate = new Date(log.created_at);
      const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
      const logTime = logDate.getTime();

      if (logDay.getTime() === today.getTime()) {
        groups['today'].push(log);
      } else if (logDay.getTime() === yesterday.getTime()) {
        groups['yesterday'].push(log);
      } else if (logTime >= last7Days.getTime()) {
        groups['last7Days'].push(log);
      } else if (logTime >= last30Days.getTime()) {
        groups['last30Days'].push(log);
      } else {
        groups['older'].push(log);
      }
    });

    // Sort logs within each group (newest first)
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });

    const collapsed = this.collapsedGroups();
    const result: DateGroup[] = [];

    // Today
    if (groups['today'].length > 0) {
      const groupLogs = groups['today'];
      const timeRange = this.getTimeRange(groupLogs);
      result.push({
        label: 'Today',
        logs: groupLogs,
        isExpanded: !collapsed['Today'],
        timeRange,
      });
    }

    // Yesterday
    if (groups['yesterday'].length > 0) {
      const groupLogs = groups['yesterday'];
      const timeRange = this.getTimeRange(groupLogs);
      result.push({
        label: 'Yesterday',
        logs: groupLogs,
        isExpanded: !collapsed['Yesterday'],
        timeRange,
      });
    }

    // Last 7 Days
    if (groups['last7Days'].length > 0) {
      const groupLogs = groups['last7Days'];
      const timeRange = this.getTimeRange(groupLogs);
      result.push({
        label: 'Last 7 Days',
        logs: groupLogs,
        isExpanded: !collapsed['Last 7 Days'],
        timeRange,
      });
    }

    // Last 30 Days
    if (groups['last30Days'].length > 0) {
      const groupLogs = groups['last30Days'];
      const timeRange = this.getTimeRange(groupLogs);
      result.push({
        label: 'Last 30 Days',
        logs: groupLogs,
        isExpanded: !collapsed['Last 30 Days'],
        timeRange,
      });
    }

    // Older
    if (groups['older'].length > 0) {
      const groupLogs = groups['older'];
      const timeRange = this.getTimeRange(groupLogs);
      result.push({
        label: 'Older',
        logs: groupLogs,
        isExpanded: !collapsed['Older'],
        timeRange,
      });
    }

    return result;
  });

  /** Has active filters */
  hasActiveFilters = computed(() => {
    return !!(
      this.searchQuery() ||
      this.selectedType() ||
      this.selectedStatus() ||
      this.selectedDateRange() !== 'all'
    );
  });

  /** Total filtered count */
  totalFiltered = computed(() => this.filteredLogs().length);

  /** Whether details panel is open */
  isPanelOpen = computed(() => !!this.selectedLog());

  // ========================================
  // SEARCH DEBOUNCE
  // ========================================

  private searchSubject = new Subject<string>();

  // ========================================
  // LIFECYCLE
  // ========================================

  ngOnInit(): void {
    this.loadLogs();
    this.setupSearchDebounce();
  }

  // ========================================
  // DATA LOADING
  // ========================================

  /**
   * Load system logs from backend
   */
  loadLogs(): void {
    this.loading.set(true);
    this.error.set(null);

    // Note: Using getAuditLogs as a proxy for system logs
    // In production, you would use a dedicated getSystemLogs endpoint
    this.adminApiService
      .getAuditLogs({ limit: 500, page: 1 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.error.set(err.message || 'Failed to load system logs');
          return of({ logs: [], total: 0, page: 1, limit: 500 });
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe(result => {
        // Transform audit logs to system logs format
        const transformedLogs: SystemLog[] = result.logs.map(log => ({
          id: log.id,
          created_at: log.timestamp,
          action_uri: log.action,
          source_type: log.trigger_source === 'auto' ? 'auto' : 'user',
          source_id: log.device_id,
          status: this.mapAuditStatusToSystemStatus(log.status),
          message: log.action,
          error_message: log.metadata?.error || null,
          device_id: log.device_id,
          sensor_id: log.sensor_id,
          user_id: log.metadata?.user_id || null,
          farm_id: log.metadata?.farm_id || null,
          payload: log.metadata,
        }));

        this.logs.set(transformedLogs);
      });
  }

  /**
   * Map audit log status to system log status
   */
  private mapAuditStatusToSystemStatus(status: string): 'success' | 'error' | 'warning' | 'info' {
    switch (status.toLowerCase()) {
      case 'ack':
      case 'sent':
        return 'success';
      case 'error':
      case 'failed':
      case 'timeout':
        return 'error';
      case 'queued':
        return 'warning';
      default:
        return 'info';
    }
  }

  /**
   * Setup search debounce
   */
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(query => {
        this.searchQuery.set(query);
      });
  }

  // ========================================
  // USER ACTIONS
  // ========================================

  /**
   * Handle search input
   */
  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  /**
   * Select a log entry
   */
  selectLog(log: SystemLog): void {
    this.selectedLog.set(log);
    this.activeTab.set(0);
    this.loadRelatedObjects(log);
    this.loadTimelineLogs(log);
  }

  /**
   * Close details panel
   */
  closePanel(): void {
    this.selectedLog.set(null);
    this.clearRelatedObjects();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedType.set('');
    this.selectedStatus.set('');
    this.selectedDateRange.set('all');
  }

  /**
   * Refresh logs
   */
  refresh(): void {
    this.loadLogs();
  }

  // ========================================
  // RELATED OBJECTS
  // ========================================

  /**
   * Load all related objects for a log entry
   */
  private loadRelatedObjects(log: SystemLog): void {
    this.clearRelatedObjects();

    if (log.device_id) {
      this.loadRelatedDevice(log.device_id);
    }

    if (log.sensor_id) {
      this.loadRelatedSensor(log.sensor_id);
    }

    if (log.user_id) {
      this.loadRelatedUser(log.user_id);
    }

    if (log.farm_id) {
      this.loadRelatedFarm(log.farm_id);
    }
  }

  /**
   * Load related device
   */
  private loadRelatedDevice(deviceId: string): void {
    this.loadingRelatedDevice.set(true);

    this.adminApiService
      .getDevice(deviceId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null)),
        finalize(() => this.loadingRelatedDevice.set(false))
      )
      .subscribe(device => {
        if (device) {
          this.relatedDevice.set({
            device_id: device.device_id,
            device_type: device.device_type ?? 'unknown',
            status: device.status,
            last_seen: device.last_seen,
          });
        }
      });
  }

  /**
   * Load related sensor
   */
  private loadRelatedSensor(sensorId: string): void {
    this.loadingRelatedSensor.set(true);

    // Note: Implement sensor fetching when endpoint is available
    // For now, extract from device sensors
    const log = this.selectedLog();
    if (log?.device_id) {
      this.adminApiService
        .getDevice(log.device_id)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(() => of(null)),
          finalize(() => this.loadingRelatedSensor.set(false))
        )
        .subscribe(device => {
          if (device?.sensors) {
            const sensor = device.sensors.find(s => s.sensor_id === sensorId);
            if (sensor) {
              this.relatedSensor.set({
                sensor_id: sensor.sensor_id,
                sensor_type: sensor.type,
                unit: sensor.unit,
              });
            }
          }
        });
    } else {
      this.loadingRelatedSensor.set(false);
    }
  }

  /**
   * Load related user
   */
  private loadRelatedUser(userId: string): void {
    this.loadingRelatedUser.set(true);

    this.adminApiService
      .getUser(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null)),
        finalize(() => this.loadingRelatedUser.set(false))
      )
      .subscribe(user => {
        if (user) {
          this.relatedUser.set({
            user_id: user.user_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
          });
        }
      });
  }

  /**
   * Load related farm
   */
  private loadRelatedFarm(farmId: string): void {
    this.loadingRelatedFarm.set(true);

    // Note: Implement when getFarm endpoint is available
    // For now, we'll skip this
    this.loadingRelatedFarm.set(false);
  }

  /**
   * Load timeline logs (related logs from same source)
   */
  private loadTimelineLogs(log: SystemLog): void {
    this.loadingTimeline.set(true);

    // Filter logs from the same source
    const relatedLogs = this.logs().filter(
      l => l.source_id === log.source_id && l.id !== log.id
    );

    // Sort by date descending
    relatedLogs.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Take only the most recent 20
    this.timelineLogs.set(relatedLogs.slice(0, 20));
    this.loadingTimeline.set(false);
  }

  /**
   * Clear related objects
   */
  private clearRelatedObjects(): void {
    this.relatedDevice.set(null);
    this.relatedSensor.set(null);
    this.relatedUser.set(null);
    this.relatedFarm.set(null);
    this.timelineLogs.set([]);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get icon for source type
   */
  getSourceIcon(sourceType: string): string {
    const icons: { [key: string]: string } = {
      system: 'settings',
      device: 'devices',
      sensor: 'sensors',
      user: 'person',
      auto: 'auto_mode',
    };
    return icons[sourceType] || 'info';
  }

  /**
   * Get color for status
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };
    return colors[status] || 'default';
  }

  /**
   * Format relative time
   */
  formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const logDate = new Date(date);
    const diff = now.getTime() - logDate.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  /**
   * Format absolute time
   */
  formatAbsoluteTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString();
  }

  /**
   * Get short title from action_uri
   */
  getShortTitle(actionUri: string): string {
    // Clean up action URI to make it readable
    return actionUri
      .replace(/^\//, '')
      .replace(/_/g, ' ')
      .replace(/\//g, ' › ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get short description from message
   */
  getShortDescription(message: string): string {
    if (message.length <= 60) return message;
    return message.substring(0, 60) + '...';
  }

  /**
   * Copy to clipboard
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  /**
   * Get metadata keys
   */
  getMetadataKeys(log: SystemLog): string[] {
    return [
      'id',
      'created_at',
      'action_uri',
      'source_type',
      'source_id',
      'status',
      'device_id',
      'sensor_id',
      'user_id',
      'farm_id',
    ];
  }

  /**
   * Get metadata value
   */
  getMetadataValue(log: SystemLog, key: string): any {
    return (log as any)[key];
  }

  /**
   * Format metadata value
   */
  formatMetadataValue(value: any): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value;
    if (value instanceof Date) return this.formatAbsoluteTime(value);
    return String(value);
  }

  /**
   * Stringify JSON for display
   */
  stringifyJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  // ========================================
  // PREMIUM LOG FORMATTING
  // ========================================

  /**
   * Format text to human-readable format
   * Converts: "mqtt:smartfarm/actuators/dht11h/ventilator_off"
   * To: "MQTT: Smartfarm → Actuators → DHT11H → Ventilator Off"
   */
  private formatHumanReadable(text: string): string {
    if (!text) return '';

    // Handle colon-separated prefix (e.g., "mqtt:smartfarm")
    let parts: string[] = [];
    if (text.includes(':')) {
      const [prefix, rest] = text.split(':');
      const formattedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
      if (rest) {
        parts = [formattedPrefix, ...rest.split(/[\/›]/).filter(p => p.trim())];
      } else {
        return formattedPrefix;
      }
    } else {
      // Split by / or ›
      parts = text.split(/[\/›]/).filter(p => p.trim());
    }

    // Format each part: capitalize first letter, replace underscores with spaces
    const formatted = parts.map(part => {
      return part
        .trim()
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    });

    return formatted.join(' → ');
  }

  /**
   * Format log entry into structured, readable format
   * Transforms: "Mqtt:smartfarm › Actuators › Dht11h › Ventilator Off"
   * Into structured object with category, farm, path, action
   */
  formatLogEntry(log: SystemLog): {
    category: string;
    farm?: string;
    path?: string[];
    action: string;
    icon: string;
    type: 'mqtt' | 'ui' | 'auto' | 'device' | 'sensor' | 'system';
    formattedTitle: string;
  } {
    const message = log.message || log.action_uri || '';
    const actionUri = log.action_uri || '';

    // Determine type and icon
    let type: 'mqtt' | 'ui' | 'auto' | 'device' | 'sensor' | 'system' = 'system';
    let icon = 'info';

    if (log.source_type === 'auto') {
      type = 'auto';
      icon = 'bolt';
    } else if (log.source_type === 'user') {
      type = 'ui';
      icon = 'touch_app';
    } else if (log.source_type === 'sensor') {
      type = 'sensor';
      icon = 'sensors';
    } else if (log.source_type === 'device') {
      type = 'device';
      icon = 'devices';
    }

    // Check if it's MQTT (common patterns)
    if (message.toLowerCase().includes('mqtt') || actionUri.toLowerCase().includes('mqtt')) {
      type = 'mqtt';
      icon = 'signal_wifi_4_bar';
    }

    // Create formatted title for display
    const formattedTitle = this.formatHumanReadable(actionUri || message);

    // Parse structured message format: "Mqtt:smartfarm › Actuators › Dht11h › Ventilator Off"
    const parts = message.split('›').map(p => p.trim());
    let category = '';
    let farm: string | undefined;
    let path: string[] = [];
    let action = '';

    if (parts.length > 0) {
      // First part usually contains category and farm
      const firstPart = parts[0];
      if (firstPart.includes(':')) {
        const [cat, farmName] = firstPart.split(':').map(p => p.trim());
        category = cat || 'System';
        farm = farmName || undefined;
      } else {
        category = firstPart || 'System';
      }

      // Middle parts are path segments
      if (parts.length > 2) {
        path = parts.slice(1, -1);
      } else if (parts.length === 2) {
        path = [];
      }

      // Last part is the action
      action = parts[parts.length - 1] || message;
    } else {
      // Fallback: use action_uri or message
      if (actionUri) {
        const uriParts = actionUri.split('/').filter(p => p);
        if (uriParts.length > 0) {
          category = uriParts[0].charAt(0).toUpperCase() + uriParts[0].slice(1);
          path = uriParts.slice(1, -1);
          action = uriParts[uriParts.length - 1] || message;
        } else {
          action = message || actionUri;
        }
      } else {
        action = message;
      }
    }

    return {
      category,
      farm,
      path,
      action,
      icon,
      type,
      formattedTitle,
    };
  }

  /**
   * Get time range string for a group of logs
   */
  private getTimeRange(logs: SystemLog[]): string {
    if (logs.length === 0) return '';
    if (logs.length === 1) {
      return this.formatAbsoluteTime(logs[0].created_at);
    }

    const sorted = [...logs].sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const earliest = new Date(sorted[0].created_at);
    const latest = new Date(sorted[sorted.length - 1].created_at);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isSameDay = earliest.toDateString() === latest.toDateString();
    if (isSameDay) {
      return `${formatTime(earliest)} - ${formatTime(latest)}`;
    }

    return `${formatDate(earliest)} - ${formatDate(latest)}`;
  }

  /**
   * Toggle group collapse state
   */
  toggleGroup(label: string): void {
    const currentCollapsed = this.collapsedGroups();
    
    // Create a new object to ensure change detection
    const newCollapsed = { ...currentCollapsed };
    
    // Toggle the collapsed state (default to false if undefined, meaning expanded by default)
    newCollapsed[label] = !(newCollapsed[label] ?? false);
    
    // Update the signal with the new object
    this.collapsedGroups.set(newCollapsed);
  }
}
