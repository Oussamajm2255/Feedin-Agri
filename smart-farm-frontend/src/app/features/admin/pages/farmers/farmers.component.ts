import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
  HostListener,
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
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, forkJoin } from 'rxjs';
import { catchError, finalize, debounceTime, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';
import { FarmerDialogComponent } from './components/farmer-dialog/farmer-dialog.component';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Farmer Model
 */
export interface Farmer {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  status?: string;
  assigned_farms: Array<{
    farm_id: string;
    farm_name: string;
    area_hectares: number;
    device_count: number;
  }>;
  total_devices: number;
  last_active: Date | string;
  created_at?: Date | string;
}

/**
 * Farm with full details
 */
export interface FarmerFarm {
  farm_id: string;
  farm_name: string;
  area_hectares: number;
  device_count: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  created_at?: Date | string;
  status?: string;
}

/**
 * Moderator assigned to farms
 */
export interface FarmModerator {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  farm_id: string;
  farm_name: string;
}

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: string;
  timestamp: Date | string;
  action: string;
  trigger_source: string;
  status: string;
  device_id?: string;
  sensor_id?: string;
  metadata?: any;
}

/**
 * Farmers Management Component
 * Premium two-panel layout with farmer list and tabbed details
 */
@Component({
  selector: 'app-farmers',
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
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
  ],
  templateUrl: './farmers.component.html',
  styleUrl: './farmers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('panelSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(40px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class FarmersComponent implements OnInit {
  private adminApiService = inject(AdminApiService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private languageService = inject(LanguageService);

  /**
   * Translation helper - uses LanguageService.t() signal
   * Usage in template: {{ t('admin.farmers.title') }}
   */
  t = this.languageService.t();

  // ========================================
  // STATE SIGNALS
  // ========================================

  /** All farmers loaded */
  farmers = signal<Farmer[]>([]);

  /** Loading state */
  loading = signal<boolean>(true);

  /** Error state */
  error = signal<string | null>(null);

  /** Total farmers count */
  totalFarmers = signal<number>(0);

  /** Pagination */
  pageIndex = signal<number>(0);
  pageSize = signal<number>(100);

  /** Selected farmer for details panel */
  selectedFarmer = signal<Farmer | null>(null);

  /** Search query */
  searchQuery = signal<string>('');

  /** Status filter */
  selectedStatus = signal<string>('');

  /** Active tab in details panel */
  activeTab = signal<number>(0);

  /** Context menu position */
  contextMenuPosition = signal<{ x: number; y: number } | null>(null);
  contextMenuFarmer = signal<Farmer | null>(null);

  // Tab data signals
  farmerFarms = signal<FarmerFarm[]>([]);
  farmerDevices = signal<any[]>([]);
  farmerSensors = signal<any[]>([]);
  farmerModerators = signal<FarmModerator[]>([]);
  farmerActivity = signal<ActivityLog[]>([]);

  // Tab loading states
  loadingFarms = signal<boolean>(false);
  loadingDevices = signal<boolean>(false);
  loadingSensors = signal<boolean>(false);
  loadingModerators = signal<boolean>(false);
  loadingActivity = signal<boolean>(false);

  // ========================================
  // COMPUTED SIGNALS
  // ========================================

  /** Filtered farmers based on search and filters */
  filteredFarmers = computed(() => {
    let result = this.farmers();

    // Status filter
    const status = this.selectedStatus();
    if (status) {
      result = result.filter(farmer => {
        const farmerStatus = farmer.status?.toLowerCase() || 'active';
        return farmerStatus === status;
      });
    }

    // Search filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(farmer => {
        const searchableText = [
          farmer.first_name,
          farmer.last_name,
          farmer.email,
          farmer.city || '',
          farmer.country || '',
          ...farmer.assigned_farms.map(f => f.farm_name)
        ].join(' ').toLowerCase();

        return searchableText.includes(query);
      });
    }

    return result;
  });

  /** Has active filters */
  hasActiveFilters = computed(() => {
    return !!(this.searchQuery() || this.selectedStatus());
  });

  /** Total filtered count */
  totalFiltered = computed(() => this.filteredFarmers().length);

  /** Whether details panel is open */
  isPanelOpen = computed(() => !!this.selectedFarmer());

  /** Summary statistics */
  totalFarmsCount = computed(() =>
    this.farmers().reduce((sum, f) => sum + f.assigned_farms.length, 0)
  );

  totalDevicesCount = computed(() =>
    this.farmers().reduce((sum, f) => sum + f.total_devices, 0)
  );

  activeFarmersCount = computed(() =>
    this.farmers().filter(f => (f.status?.toLowerCase() || 'active') === 'active').length
  );

  // ========================================
  // SEARCH DEBOUNCE
  // ========================================

  private searchSubject = new Subject<string>();

  // ========================================
  // LIFECYCLE
  // ========================================

  ngOnInit(): void {
    this.loadFarmers();
    this.setupSearchDebounce();
  }

  // ========================================
  // DATA LOADING
  // ========================================

  loadFarmers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminApiService
      .getFarmers(this.pageIndex() + 1, this.pageSize())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.error.set(err.message || 'Failed to load farmers');
          return of({ items: [], total: 0, page: 1, limit: 100, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe(result => {
        this.farmers.set(result.items as Farmer[]);
        this.totalFarmers.set(result.total);
      });
  }

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

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  selectFarmer(farmer: Farmer): void {
    this.selectedFarmer.set(farmer);
    this.activeTab.set(0);
    this.clearTabData();
    // Load overview data (farms for quick stats)
    this.loadFarmerFarms(farmer.user_id);
  }

  closePanel(): void {
    this.selectedFarmer.set(null);
    this.clearTabData();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('');
  }

  refresh(): void {
    this.loadFarmers();
    if (this.selectedFarmer()) {
      this.clearTabData();
      this.loadFarmerFarms(this.selectedFarmer()!.user_id);
    }
  }

  private clearTabData(): void {
    this.farmerFarms.set([]);
    this.farmerDevices.set([]);
    this.farmerSensors.set([]);
    this.farmerModerators.set([]);
    this.farmerActivity.set([]);
  }

  // ========================================
  // TAB DATA LOADING
  // ========================================

  onTabChange(index: number): void {
    this.activeTab.set(index);
    const farmer = this.selectedFarmer();
    if (!farmer) return;

    switch (index) {
      case 1: // Farms tab
        if (this.farmerFarms().length === 0) {
          this.loadFarmerFarms(farmer.user_id);
        }
        break;
      case 2: // Devices tab
        if (this.farmerDevices().length === 0) {
          this.loadFarmerDevices(farmer);
        }
        break;
      case 3: // Sensors tab
        if (this.farmerSensors().length === 0) {
          this.loadFarmerSensors(farmer);
        }
        break;
      case 4: // Moderators tab
        if (this.farmerModerators().length === 0) {
          this.loadFarmerModerators(farmer);
        }
        break;
      case 5: // Activity tab
        if (this.farmerActivity().length === 0) {
          this.loadFarmerActivity(farmer);
        }
        break;
    }
  }

  loadFarmerFarms(farmerId: string): void {
    this.loadingFarms.set(true);

    this.adminApiService
      .getFarmerFarms(farmerId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of([])),
        finalize(() => this.loadingFarms.set(false))
      )
      .subscribe(farms => {
        this.farmerFarms.set(farms as FarmerFarm[]);
      });
  }

  loadFarmerDevices(farmer: Farmer): void {
    if (farmer.assigned_farms.length === 0) {
      this.farmerDevices.set([]);
      return;
    }

    this.loadingDevices.set(true);

    // Load devices for all farms
    const deviceRequests = farmer.assigned_farms.map(farm =>
      this.adminApiService.getDevices({ farm_id: farm.farm_id, limit: 100 }).pipe(
        catchError(() => of({ devices: [], total: 0, page: 1, limit: 100, totalPages: 0 }))
      )
    );

    forkJoin(deviceRequests)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingDevices.set(false))
      )
      .subscribe(results => {
        const allDevices = results.flatMap(r => r.devices);
        this.farmerDevices.set(allDevices);
      });
  }

  loadFarmerSensors(farmer: Farmer): void {
    if (farmer.assigned_farms.length === 0) {
      this.farmerSensors.set([]);
      return;
    }

    this.loadingSensors.set(true);

    // Load sensors for all farms
    const sensorRequests = farmer.assigned_farms.map(farm =>
      this.adminApiService.getSensors({ farm_id: farm.farm_id, limit: 100 }).pipe(
        catchError(() => of({ sensors: [], total: 0, page: 1, limit: 100, totalPages: 0 }))
      )
    );

    forkJoin(sensorRequests)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingSensors.set(false))
      )
      .subscribe(results => {
        const allSensors = results.flatMap(r => r.sensors);
        this.farmerSensors.set(allSensors);
      });
  }

  loadFarmerModerators(farmer: Farmer): void {
    if (farmer.assigned_farms.length === 0) {
      this.farmerModerators.set([]);
      return;
    }

    this.loadingModerators.set(true);

    // First get all farms with their details, then get moderators for each
    const farmIds = farmer.assigned_farms.map(f => f.farm_id);

    // Load moderators for each farm
    const moderatorRequests = farmer.assigned_farms.map(farm =>
      this.adminApiService.getUsers({ role: 'moderator', farm_id: farm.farm_id, limit: 100 }).pipe(
        catchError(() => of({ items: [], total: 0, page: 1, limit: 100, totalPages: 0 }))
      )
    );

    forkJoin(moderatorRequests)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingModerators.set(false))
      )
      .subscribe(results => {
        const moderatorsMap = new Map<string, FarmModerator>();

        results.forEach((result, index) => {
          const farm = farmer.assigned_farms[index];
          result.items.forEach((mod: any) => {
            if (!moderatorsMap.has(mod.user_id)) {
              moderatorsMap.set(mod.user_id, {
                user_id: mod.user_id,
                email: mod.email,
                first_name: mod.first_name,
                last_name: mod.last_name,
                farm_id: farm.farm_id,
                farm_name: farm.farm_name
              });
            }
          });
        });

        this.farmerModerators.set(Array.from(moderatorsMap.values()));
      });
  }

  loadFarmerActivity(farmer: Farmer): void {
    if (farmer.assigned_farms.length === 0) {
      this.farmerActivity.set([]);
      return;
    }

    this.loadingActivity.set(true);

    // Load activity for all farms
    const activityRequests = farmer.assigned_farms.map(farm =>
      this.adminApiService.getFarmActivity(farm.farm_id, 20).pipe(
        catchError(() => of([]))
      )
    );

    forkJoin(activityRequests)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingActivity.set(false))
      )
      .subscribe(results => {
        const allActivity = results.flatMap(r => r as ActivityLog[]);
        // Sort by timestamp descending
        allActivity.sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA;
        });
        this.farmerActivity.set(allActivity.slice(0, 50));
      });
  }

  // ========================================
  // CONTEXT MENU
  // ========================================

  onContextMenu(event: MouseEvent, farmer: Farmer): void {
    event.preventDefault();
    this.contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    this.contextMenuFarmer.set(farmer);
  }

  @HostListener('document:click')
  closeContextMenu(): void {
    this.contextMenuPosition.set(null);
    this.contextMenuFarmer.set(null);
  }

  // ========================================
  // FARMER ACTIONS
  // ========================================

  viewFarmer(farmer: Farmer): void {
    this.selectFarmer(farmer);
  }

  editFarmer(farmer: Farmer): void {
    const dialogRef = this.dialog.open(FarmerDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        mode: 'edit',
        farmerId: farmer.user_id
      },
      panelClass: 'farmer-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Farmer updated successfully', 'Close', { duration: 3000 });
        this.loadFarmers();
        if (this.selectedFarmer()?.user_id === farmer.user_id) {
          // Refresh selected farmer data
          this.clearTabData();
          this.loadFarmerFarms(farmer.user_id);
        }
      }
    });
  }

  assignFarm(farmer: Farmer): void {
    // Simple prompt for farm ID - could be enhanced with a dialog
    const farmId = prompt('Enter Farm ID to assign:');
    if (farmId) {
      this.adminApiService.assignFarmToFarmer(farmer.user_id, farmId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(err => {
            this.snackBar.open(err.error?.message || 'Failed to assign farm', 'Close', { duration: 3000 });
            return of(null);
          })
        )
        .subscribe(result => {
          if (result) {
            this.snackBar.open('Farm assigned successfully', 'Close', { duration: 3000 });
            this.loadFarmers();
            if (this.selectedFarmer()?.user_id === farmer.user_id) {
              this.clearTabData();
              this.loadFarmerFarms(farmer.user_id);
            }
          }
        });
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  getStatusColor(status: string | undefined): string {
    const s = status?.toLowerCase() || 'active';
    return s === 'active' ? 'status-active' : 'status-inactive';
  }

  formatRelativeTime(date: string | Date | undefined): string {
    if (!date) return 'Never';
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  highlightSearch(text: string): string {
    const query = this.searchQuery().trim();
    if (!query) return text;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  getDeviceStatusIcon(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'online':
      case 'active':
        return 'check_circle';
      case 'offline':
      case 'inactive':
        return 'cancel';
      case 'maintenance':
        return 'build_circle';
      default:
        return 'help';
    }
  }

  getDeviceStatusClass(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'online':
      case 'active':
        return 'status-online';
      case 'offline':
      case 'inactive':
        return 'status-offline';
      case 'maintenance':
        return 'status-maintenance';
      default:
        return 'status-unknown';
    }
  }

  getActivityIcon(action: string): string {
    const lowerAction = action?.toLowerCase() || '';
    if (lowerAction.includes('create')) return 'add_circle';
    if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'edit';
    if (lowerAction.includes('delete')) return 'delete';
    if (lowerAction.includes('sensor')) return 'sensors';
    if (lowerAction.includes('device')) return 'devices';
    if (lowerAction.includes('actuator')) return 'toggle_on';
    return 'history';
  }

  getActivityStatusClass(status: string | undefined): string {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'ack':
      case 'sent':
        return 'activity-success';
      case 'error':
      case 'failed':
        return 'activity-error';
      case 'warning':
      case 'queued':
        return 'activity-warning';
      default:
        return 'activity-info';
    }
  }

  trackByFarmerId(index: number, farmer: Farmer): string {
    return farmer.user_id;
  }

  trackByDeviceId(index: number, device: any): string {
    return device.device_id || index.toString();
  }

  trackBySensorId(index: number, sensor: any): string {
    return sensor.sensor_id || index.toString();
  }

  trackByModeratorId(index: number, mod: FarmModerator): string {
    return mod.user_id;
  }

  trackByActivityId(index: number, activity: ActivityLog): string {
    return activity.id;
  }

  /**
   * Helper method to filter out falsy values from arrays
   * Used in templates where Boolean constructor is not available
   */
  filterFalsy<T>(arr: (T | null | undefined | '' | 0 | false)[]): T[] {
    return arr.filter((item): item is T => Boolean(item));
  }
}
