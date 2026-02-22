import { Component, OnInit, AfterViewInit, signal, computed, effect, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, catchError, finalize, of, map } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

// Services
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';
import { ApiService } from '../../../../core/services/api.service';
import { LanguageService } from '../../../../core/services/language.service';
import { BreakpointService } from '../../../../core/services/breakpoint.service';

// Pipes
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

// Models
import { Device, DeviceStatus, Sensor, Farm } from '../../../../core/models/farm.model';
import { ActionLog } from '../../../../core/models/action-log.model';
import { User } from '../../../../core/models/user.model';

// Dialogs
import { SensorRegistrationDialogComponent, SensorRegistrationResult } from './components/sensor-registration-dialog/sensor-registration-dialog.component';
import { DeviceDialogComponent, CreateDeviceDto, UpdateDeviceDto, DialogMode } from './components/device-dialog/device-dialog.component';

// Export Components
import { ExportButtonComponent } from '../../../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../../../shared/services/export.service';

// Types
interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  byType: {
    sensor?: number;
    actuator?: number;
    gateway?: number;
  };
}

interface KpiCard {
  label: string;
  value: number;
  icon: string;
  subtitle?: string;
  trend?: number;
  trendArrow?: string;
  trendColor?: 'success' | 'danger' | 'neutral';
  performanceClass?: 'perf-low' | 'perf-medium' | 'perf-high' | 'perf-critical' | 'perf-neutral';
  route?: string;
}

@Component({
  selector: 'app-admin-devices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
    TranslatePipe,
    ExportButtonComponent
  ],
  templateUrl: './admin-devices.component.html',
  styleUrl: './admin-devices.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('floatIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px) scale(0.9)' }),
        animate('0.6s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class AdminDevicesComponent implements OnInit, AfterViewInit {
  // Services
  private adminApiService = inject(AdminApiService)
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);
  private breakpointService = inject(BreakpointService);

  // View mode: 'table' for large screens, 'grid' for smaller screens
  viewMode = signal<'table' | 'grid'>(
    typeof window !== 'undefined' && window.innerWidth < 1400 ? 'grid' : 'table'
  );

  // State Signals
  loading = signal<boolean>(true);
  loadingStats = signal<boolean>(true);
  devices = signal<Device[]>([]);
  totalDevices = signal<number>(0);
  deviceStats = signal<DeviceStats | null>(null);

  // Farms and Crops for filters
  farms = signal<Farm[]>([]);
  crops = signal<any[]>([]);
  loadingFarms = signal<boolean>(false);

  // Users for owner information
  users = signal<User[]>([]);
  loadingUsers = signal<boolean>(false);

  // Grouped devices by farm and owner
  groupedDevices = signal<Map<string, Device[]>>(new Map());
  expandedGroups = signal<Set<string>>(new Set());

  // Pagination
  pageIndex = signal<number>(0);
  pageSize = signal<number>(20);

  // Sorting
  sortBy = signal<string>('name');
  sortOrder = signal<'ASC' | 'DESC'>('ASC');

  // Filters
  selectedStatuses = signal<string[]>([]);
  selectedTypes = signal<string[]>([]);
  selectedFarmId = signal<string | null>(null);
  searchControl = new FormControl('');

  // Filter Options
  statusOptions = [
    { value: 'online', label: 'Online', color: 'success' },
    { value: 'offline', label: 'Offline', color: 'error' },
    { value: 'maintenance', label: 'Maintenance', color: 'warn' },
  ];

  typeOptions = [
    { value: 'sensor', label: 'Sensor', icon: 'sensors' },
    { value: 'actuator', label: 'Actuator', icon: 'settings' },
    { value: 'gateway', label: 'Gateway', icon: 'router' },
  ];

  // Table columns
  displayedColumns: string[] = [
    'device_id',
    'name',
    'farm',
    'location',
    'status',
    'device_type',
    'last_seen',
    'actions',
  ];

  // Export columns configuration
  exportColumns: ExportColumn[] = [
    { key: 'device_id', header: 'Device ID', format: 'text' },
    { key: 'name', header: 'Device Name', format: 'text' },
    { key: 'device_type', header: 'Type', format: 'text' },
    { key: 'status', header: 'Status', format: 'status' },
    { key: 'location', header: 'Location', format: 'text' },
    { key: 'last_seen', header: 'Last Seen', format: 'datetime' },
    { key: 'firmware_version', header: 'Firmware', format: 'text' },
  ];

  // Computed
  kpiCards = computed<KpiCard[]>(() => {
    const stats = this.deviceStats();
    if (!stats) return [];

    const total = stats.total || 0;
    const online = stats.online || 0;
    const offline = stats.offline || 0;
    const maintenance = stats.maintenance || 0;

    // Calculate percentages
    const onlinePct = total > 0 ? (online / total) * 100 : 0;
    const offlinePct = total > 0 ? (offline / total) * 100 : 0;
    const maintenancePct = total > 0 ? (maintenance / total) * 100 : 0;

    return [
      {
        label: 'Total Devices',
        value: total,
        icon: 'devices',
        subtitle: 'All registered devices',
        trend: 12.5, // Simulated trend
        trendArrow: '↑',
        trendColor: 'success',
        performanceClass: 'perf-neutral'
      },
      {
        label: 'Online Devices',
        value: online,
        icon: 'check_circle',
        subtitle: `${onlinePct.toFixed(1)}% of total devices`,
        trend: 5.2, // Simulated trend
        trendArrow: '↑',
        trendColor: 'success',
        performanceClass: onlinePct > 80 ? 'perf-high' : onlinePct > 50 ? 'perf-medium' : 'perf-low'
      },
      {
        label: 'Offline Devices',
        value: offline,
        icon: 'cancel',
        subtitle: `${offlinePct.toFixed(1)}% of total devices`,
        trend: -2.1, // Simulated trend (negative is good for offline)
        trendArrow: '↓',
        trendColor: 'success',
        performanceClass: offlinePct < 10 ? 'perf-high' : offlinePct < 30 ? 'perf-medium' : 'perf-critical'
      },
      {
        label: 'Maintenance',
        value: maintenance,
        icon: 'build',
        subtitle: `${maintenancePct.toFixed(1)}% of total devices`,
        trend: 0,
        trendArrow: '→',
        trendColor: 'neutral',
        performanceClass: maintenancePct < 5 ? 'perf-high' : 'perf-medium'
      }
    ];
  });

  hasActiveFilters = computed(() => {
    return (
      this.selectedStatuses().length > 0 ||
      this.selectedTypes().length > 0 ||
      this.selectedFarmId() !== null ||
      (this.searchControl.value?.trim() || '').length > 0
    );
  });

  filteredDevicesCount = computed(() => this.devices().length);

  activeFiltersCount = computed(() => {
    let count = 0;
    count += this.selectedStatuses().length;
    count += this.selectedTypes().length;
    if (this.selectedFarmId()) count += 1;
    if (this.searchControl.value?.trim()) count += 1;
    return count;
  });

  filteredDevices = computed(() => {
    let devices = this.devices();
    const search = (this.searchControl.value?.trim() || '').toLowerCase();
    const farmId = this.selectedFarmId();
    const statuses = this.selectedStatuses();
    const types = this.selectedTypes();

    if (search) {
      devices = devices.filter(d =>
        d.device_id.toLowerCase().includes(search) ||
        d.name.toLowerCase().includes(search) ||
        (d.location?.toLowerCase().includes(search) || false) ||
        (d.device_type?.toLowerCase().includes(search) || false)
      );
    }

    if (farmId) {
      devices = devices.filter(d => d.farm_id === farmId);
    }

    if (statuses.length > 0) {
      devices = devices.filter(d => statuses.includes(d.status));
    }

    if (types.length > 0) {
      devices = devices.filter(d => types.includes(d.device_type || ''));
    }

    return devices;
  });

  groupedDevicesArray = computed(() => {
    const devices = this.filteredDevices();
    const farms = this.farms();
    const users = this.users();

    // Group devices by farm and owner (pure computation, no signal writes)
    const grouped = new Map<string, Device[]>();

    devices.forEach(device => {
      const farm = farms.find(f => f.farm_id === device.farm_id);
      const ownerId = farm?.owner_id || 'unknown';
      const owner = users.find(u => u.user_id === ownerId);
      const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown Owner';
      const farmName = farm?.name || 'Unknown Farm';

      // Create a key: "farmName|ownerName|farmId"
      const groupKey = `${farmName}|${ownerName}|${device.farm_id}`;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(device);
    });

    // Convert Map to array format
    const result: Array<{ key: string; farmName: string; ownerName: string; farmId: string; devices: Device[] }> = [];

    grouped.forEach((devices, key) => {
      const [farmName, ownerName, farmId] = key.split('|');
      result.push({
        key,
        farmName,
        ownerName,
        farmId,
        devices
      });
    });

    // Sort by farm name, then owner name
    return result.sort((a, b) => {
      if (a.farmName !== b.farmName) {
        return a.farmName.localeCompare(b.farmName);
      }
      return a.ownerName.localeCompare(b.ownerName);
    });
  });

  paginatedDevices = computed(() => {
    const devices = this.filteredDevices();
    const page = this.pageIndex();
    const size = this.pageSize();
    const start = page * size;
    const end = start + size;
    return devices.slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredDevices().length / this.pageSize()));

  // Effect to update groupedDevices signal and handle auto-expand
  private groupedDevicesEffect = effect(() => {
    const groupedArray = this.groupedDevicesArray();

    // Convert array back to Map for the signal (if needed elsewhere)
    const grouped = new Map<string, Device[]>();
    groupedArray.forEach(group => {
      grouped.set(group.key, group.devices);
    });
    this.groupedDevices.set(grouped);

    // Auto-expand all groups on first load or when groups change
    if (this.expandedGroups().size === 0 && grouped.size > 0) {
      const allKeys = Array.from(grouped.keys());
      this.expandedGroups.set(new Set(allKeys));
    }
  });

  // Animation state for staggered table rows
  animationDelay = (index: number) => `${index * 50}ms`;

  // Counter animation for stats
  ngAfterViewInit(): void {
    if (!this.loadingStats()) {
      this.animateCounters();
    }
  }

  private animateCounters(): void {
    const counters = document.querySelectorAll('.counter');
    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute('data-target') || '0', 10);
      const duration = 2000;
      const increment = target / (duration / 16);
      let current = 0;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          counter.textContent = Math.floor(current).toString();
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target.toString();
        }
      };

      updateCounter();
    });
  }

  ngOnInit(): void {
    this.loadStats();
    this.setupSearchListener();
    this.setupBreakpointListener();

    // Load farms and users first, then devices (for proper grouping)
    this.loadFarms();
    this.loadUsers();

    // Load devices after a short delay to ensure farms and users are loaded
    setTimeout(() => {
      this.loadDevices();
    }, 200);

    this.loadCrops();
  }

  /**
   * Setup listener for breakpoint changes to auto-switch view mode
   */
  private setupBreakpointListener(): void {
    // Initial check - switch to grid on smaller screens
    this.updateViewModeForBreakpoint();
  }

  /**
   * Effect to auto-switch view mode based on breakpoint
   * Note: This needs to be called separately or use a different pattern
   */
  private viewModeBreakpointEffect = effect(() => {
    const isLargeDesktop = this.breakpointService.isLargeDesktop();
    // Only auto-switch to grid when moving from large to smaller screens
    // and user hasn't manually selected a view
    if (!isLargeDesktop && this.viewMode() === 'table') {
      // Auto-switch to grid on smaller screens for better UX
      this.viewMode.set('grid');
    }
  }, { allowSignalWrites: true });

  /**
   * Update view mode based on current breakpoint
   */
  private updateViewModeForBreakpoint(): void {
    if (!this.breakpointService.isLargeDesktop()) {
      this.viewMode.set('grid');
    }
  }

  /**
   * Set view mode manually
   */
  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode.set(mode);
  }

  // ==================== DATA LOADING ====================

  loadDevices(): void {
    this.loading.set(true);
    console.log('🔄 Starting to load devices...');

    this.adminApiService
      .getDevices({})
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((response: any) => {
          console.log('📦 Raw API response:', response);
          console.log('📦 Response type:', typeof response);
          console.log('📦 Is array?', Array.isArray(response));

          // Handle different response formats
          let devices: Device[] = [];
          if (response && response.devices && Array.isArray(response.devices)) {
            devices = response.devices;
          } else if (Array.isArray(response)) {
            devices = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            devices = response.data;
          } else {
            console.warn('⚠️ Unexpected response format:', response);
            devices = [];
          }
          return devices;
        }),
        catchError((error) => {
          console.error('❌ Error loading devices:', error);
          console.error('❌ Error status:', error?.status);
          console.error('❌ Error message:', error?.message);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
          this.showSnackbar('Failed to load devices', 'error');
          return of([]);
        }),
        finalize(() => {
          this.loading.set(false);
          console.log('✅ Device loading completed. Total devices:', this.devices().length);
        })
      )
      .subscribe((devices: Device[]) => {
        console.log('📊 Processed devices:', devices.length, devices);
        const deviceArray = devices || [];
        this.devices.set(deviceArray);
        this.totalDevices.set(deviceArray.length);

        if (deviceArray.length === 0) {
          console.warn('⚠️ No devices loaded. Check backend response and filters.');
          console.warn('⚠️ Farms loaded:', this.farms().length);
          console.warn('⚠️ Users loaded:', this.users().length);
          console.warn('⚠️ Stats total:', this.deviceStats()?.total);
        } else {
          console.log('✅ Devices loaded successfully. Farms:', this.farms().length, 'Users:', this.users().length);
        }
      });
  }

  loadStats(): void {
    this.loadingStats.set(true);

    this.adminApiService
      .getDeviceStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null)),
        finalize(() => {
          this.loadingStats.set(false);
          setTimeout(() => this.animateCounters(), 100);
        })
      )
      .subscribe((stats: DeviceStats | null) => {
        if (stats) {
          this.deviceStats.set(stats);
        }
      });
  }

  loadFarms(): void {
    this.loadingFarms.set(true);
    this.apiService
      .getFarms()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of([])),
        finalize(() => this.loadingFarms.set(false))
      )
      .subscribe((farms: Farm[]) => {
        this.farms.set(farms);
      });
  }

  loadCrops(): void {
    this.apiService
      .getCrops()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of([]))
      )
      .subscribe((crops: any[]) => {
        this.crops.set(crops);
      });
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.apiService
      .getUsers(false)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error loading users:', error);
          return of([]);
        }),
        finalize(() => this.loadingUsers.set(false))
      )
      .subscribe((users: User[]) => {
        this.users.set(users || []);
        console.log('Loaded users:', users.length);
      });
  }

  groupDevicesByFarmAndOwner(devices: Device[]): void {
    const grouped = new Map<string, Device[]>();

    devices.forEach(device => {
      const farm = this.farms().find(f => f.farm_id === device.farm_id);
      const ownerId = farm?.owner_id || 'unknown';
      const owner = this.users().find(u => u.user_id === ownerId);
      const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown Owner';
      const farmName = farm?.name || 'Unknown Farm';

      // Create a key: "farmName|ownerName|farmId"
      const groupKey = `${farmName}|${ownerName}|${device.farm_id}`;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(device);
    });

    this.groupedDevices.set(grouped);

    // Auto-expand all groups on first load or when groups change
    if (this.expandedGroups().size === 0 && grouped.size > 0) {
      const allKeys = Array.from(grouped.keys());
      this.expandedGroups.set(new Set(allKeys));
    }
  }

  getGroupedDevicesArray(): Array<{ key: string; farmName: string; ownerName: string; farmId: string; devices: Device[] }> {
    const grouped = this.groupedDevices();
    const result: Array<{ key: string; farmName: string; ownerName: string; farmId: string; devices: Device[] }> = [];

    grouped.forEach((devices, key) => {
      const [farmName, ownerName, farmId] = key.split('|');
      result.push({
        key,
        farmName,
        ownerName,
        farmId,
        devices
      });
    });

    // Sort by farm name, then owner name
    return result.sort((a, b) => {
      if (a.farmName !== b.farmName) {
        return a.farmName.localeCompare(b.farmName);
      }
      return a.ownerName.localeCompare(b.ownerName);
    });
  }

  setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.pageIndex.set(0);
      });
  }

  // ==================== DEVICE ACTIONS ====================

  onRowClick(device: Device): void {
    // TODO: Implement dedicated device details panel for this page
    console.log('Device clicked:', device);
  }

  // ==================== TABLE ACTIONS ====================

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  onSortChange(sort: Sort): void {
    if (sort.direction) {
      this.sortBy.set(sort.active);
      this.sortOrder.set(sort.direction.toUpperCase() as 'ASC' | 'DESC');
    } else {
      this.sortBy.set('name');
      this.sortOrder.set('ASC');
    }
  }

  // ==================== FILTER ACTIONS ====================

  toggleStatusFilter(status: string): void {
    const current = this.selectedStatuses();
    if (current.includes(status)) {
      this.selectedStatuses.set(current.filter((s) => s !== status));
    } else {
      this.selectedStatuses.set([...current, status]);
    }
    this.pageIndex.set(0);
  }

  toggleTypeFilter(type: string): void {
    const current = this.selectedTypes();
    if (current.includes(type)) {
      this.selectedTypes.set(current.filter((t) => t !== type));
    } else {
      this.selectedTypes.set([...current, type]);
    }
    this.pageIndex.set(0);
  }

  onFarmFilterChange(farmId: string | null): void {
    this.selectedFarmId.set(farmId);
    this.pageIndex.set(0);
  }

  clearAllFilters(): void {
    this.selectedStatuses.set([]);
    this.selectedTypes.set([]);
    this.selectedFarmId.set(null);
    this.searchControl.setValue('');
    this.pageIndex.set(0);
  }

  // ==================== DEVICE CRUD ACTIONS ====================

  onNewDevice(): void {
    const dialogRef = this.dialog.open(DeviceDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'premium-dialog',
      data: {
        mode: 'create' as const,
        farms: this.farms(),
        users: this.users(),
      },
    });

    dialogRef.afterClosed().subscribe((result: { mode: 'create', data: CreateDeviceDto } | undefined) => {
      if (result && result.mode === 'create') {
        // Create the device via API
        this.adminApiService
          .createDevice(result.data)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError((error) => {
              console.error('Error creating device:', error);
              const errorMsg = error?.error?.message || 'Failed to create device';
              this.showSnackbar(errorMsg, 'error');
              return of(null);
            })
          )
          .subscribe((device: Device | null) => {
            if (device) {
              this.showSnackbar(`Device "${device.name}" created successfully`, 'success');
              
              // Refresh devices list
              this.loadDevices();
              this.loadStats();
            }
          });
      }
    });
  }

  onRegisterSensor(device?: Device): void {
    const dialogRef = this.dialog.open(SensorRegistrationDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        device: device || null,
        farms: this.farms(),
        crops: this.crops(),
      },
    });

    dialogRef.afterClosed().subscribe((result: SensorRegistrationResult | undefined) => {
      if (result) {
        this.apiService
          .createSensor(result)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError((error) => {
              console.error('Error creating sensor:', error);
              this.showSnackbar('Failed to register sensor', 'error');
              return of(null);
            })
          )
          .subscribe((sensor: Sensor | null) => {
            if (sensor) {
              this.showSnackbar('Sensor registered successfully', 'success');
              this.loadDevices();
            }
          });
      }
    });
  }

  onEditDevice(device: Device, event: Event): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(DeviceDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'premium-dialog',
      data: {
        mode: 'edit' as const,
        farms: this.farms(),
        users: this.users(),
        device: device,
      },
    });

    dialogRef.afterClosed().subscribe((result: { mode: 'edit', data: UpdateDeviceDto, deviceId: string } | undefined) => {
      if (result && result.mode === 'edit') {
        // Update the device via API (only sends changed fields)
        this.adminApiService
          .updateDevice(result.deviceId, result.data)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError((error) => {
              console.error('Error updating device:', error);
              const errorMsg = error?.error?.message || 'Failed to update device';
              this.showSnackbar(errorMsg, 'error');
              return of(null);
            })
          )
          .subscribe((updatedDevice: Device | null) => {
            if (updatedDevice) {
              this.showSnackbar(`Device "${updatedDevice.name}" updated successfully`, 'success');
              
              // Refresh devices list
              this.loadDevices();
              this.loadStats();
            }
          });
      }
    });
  }

  onDeleteDevice(device: Device, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete device "${device.name}"?`)) {
      this.adminApiService.deleteDevice(device.device_id).pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error deleting device:', error);
          this.showSnackbar('Failed to delete device', 'error');
          return of(null);
        })
      ).subscribe(() => {
        this.showSnackbar('Device deleted successfully', 'success');
        this.loadDevices();
      });
    }
  }

  onViewDetails(device: Device, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    
    // Open device dialog in VIEW mode
    const dialogRef = this.dialog.open(DeviceDialogComponent, {
      width: '950px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'premium-dialog',
      data: {
        mode: 'view' as DialogMode,
        farms: this.farms(),
        users: this.users(),
        device: device,
      },
    });

    // Handle dialog close - may return edit result if user switched to edit mode
    dialogRef.afterClosed().subscribe((result: { mode: 'edit', data: UpdateDeviceDto, deviceId: string } | undefined) => {
      if (result && result.mode === 'edit') {
        // Update the device via API (only sends changed fields)
        this.adminApiService
          .updateDevice(result.deviceId, result.data)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError((error) => {
              console.error('Error updating device:', error);
              const errorMsg = error?.error?.message || 'Failed to update device';
              this.showSnackbar(errorMsg, 'error');
              return of(null);
            })
          )
          .subscribe((updatedDevice: Device | null) => {
            if (updatedDevice) {
              this.showSnackbar(`Device "${updatedDevice.name}" updated successfully`, 'success');
              
              // Refresh devices list
              this.loadDevices();
              this.loadStats();
            }
          });
      }
    });
  }

  // ==================== HELPERS ====================

  getFarmName(farmId: string): string {
    const farm = this.farms().find(f => f.farm_id === farmId);
    return farm?.name || farmId;
  }

  getOwnerName(farmId: string): string {
    const farm = this.farms().find(f => f.farm_id === farmId);
    if (!farm?.owner_id) return 'Unknown Owner';
    const owner = this.users().find(u => u.user_id === farm.owner_id);
    return owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown Owner';
  }

  toggleGroup(groupKey: string): void {
    const expanded = new Set(this.expandedGroups());
    if (expanded.has(groupKey)) {
      expanded.delete(groupKey);
    } else {
      expanded.add(groupKey);
    }
    this.expandedGroups.set(expanded);
  }

  isGroupExpanded(groupKey: string): boolean {
    return this.expandedGroups().has(groupKey);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'online':
        return 'check_circle';
      case 'offline':
        return 'cancel';
      case 'maintenance':
        return 'build';
      default:
        return 'help';
    }
  }

  getStatusColor(status: string): string {
    const statusOption = this.statusOptions.find((s) => s.value === status);
    return statusOption?.color || 'default';
  }

  getTypeIcon(type: string): string {
    const typeOption = this.typeOptions.find((t) => t.value === type);
    return typeOption?.icon || 'devices';
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString(this.languageService.getCurrentLanguageCode() || 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  }

  formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleString(this.languageService.getCurrentLanguageCode() || 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'warn' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`],
    });
  }

  // ==================== SKELETON LOADERS ====================

  get skeletonRows(): number[] {
    return Array.from({ length: 5 }, (_, i) => i);
  }
}

