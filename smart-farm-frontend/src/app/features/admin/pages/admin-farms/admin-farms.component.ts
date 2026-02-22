import { Component, OnInit, signal, inject, DestroyRef, computed, effect, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, debounceTime, distinctUntilChanged, of } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';
import { FarmDialogComponent } from './components/farm-dialog/farm-dialog.component';

// Export Components
import { ExportButtonComponent } from '../../../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../../../shared/services/export.service';

interface AdminFarm {
  farm_id: string;
  farm_name: string;
  owner_id: string;
  owner_name: string;
  location?: { lat: number; lng: number };
  area_hectares: number;
  device_count: number;
  status: 'active' | 'inactive';
  created_at: Date | string;
}

type ViewMode = 'table' | 'grid' | 'map';

/**
 * Enhanced Admin Farms Component
 * Premium UI/UX with interactive map, advanced filtering, and comprehensive farm management
 */
@Component({
  selector: 'app-admin-farms',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    FormsModule,
    ExportButtonComponent,
  ],
  templateUrl: './admin-farms.component.html',
  styleUrl: './admin-farms.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('staggerFadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class AdminFarmsComponent implements OnInit, AfterViewInit, OnDestroy {
  private adminApiService = inject(AdminApiService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // State signals
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  farms = signal<AdminFarm[]>([]);
  totalFarms = signal<number>(0);
  pageIndex = signal<number>(0);
  pageSize = signal<number>(25);
  searchQuery = '';
  statusFilter = '';
  sortBy = 'name';
  showFilters = signal<boolean>(false);
  viewMode = signal<ViewMode>(
    (typeof window !== 'undefined' && window.innerWidth < 1400) ? 'grid' : 'table'
  );
  selectedFarms = signal<AdminFarm[]>([]);
  selectedMapFarm = signal<AdminFarm | null>(null);

  // Map instance
  private map: any = null;
  private markers: any[] = [];
  private mapInitialized = false;

  // Trend tracking - store previous values for comparison
  private previousValues = signal<{
    totalFarms: number;
    activeFarms: number;
    totalDevices: number;
    totalArea: number;
  }>({
    totalFarms: 0,
    activeFarms: 0,
    totalDevices: 0,
    totalArea: 0
  });

  // Export columns configuration
  exportColumns: ExportColumn[] = [
    { key: 'farm_name', header: 'Farm Name', format: 'text' },
    { key: 'owner_name', header: 'Owner', format: 'text' },
    { key: 'area_hectares', header: 'Area (ha)', format: 'number' },
    { key: 'device_count', header: 'Devices', format: 'number' },
    { key: 'status', header: 'Status', format: 'status' },
    { key: 'created_at', header: 'Created', format: 'date' },
  ];

  // Computed values
  activeFarms = computed(() =>
    this.farms().filter(f => f.status === 'active').length
  );

  totalDevices = computed(() =>
    this.farms().reduce((sum, farm) => sum + (farm.device_count || 0), 0)
  );

  totalArea = computed(() =>
    this.farms().reduce((sum, farm) => sum + (farm.area_hectares || 0), 0)
  );

  // KPI Cards Configuration (Matching Admin Devices)
  kpiCards = computed(() => {
    const total = this.totalFarms();
    const active = this.activeFarms();
    const devices = this.totalDevices();
    const area = this.totalArea();
    const prev = this.previousValues();

    return [
      {
        label: 'Total Farms',
        value: total,
        icon: 'agriculture',
        subtitle: 'Registered farms',
        performanceClass: 'perf-neutral',
        trend: this.calculateTrend(total, prev.totalFarms),
        trendArrow: this.getTrendArrowSimple(total, prev.totalFarms),
        trendColor: this.getTrendColorSimple(total, prev.totalFarms)
      },
      {
        label: 'Active Farms',
        value: active,
        icon: 'check_circle',
        subtitle: 'Currently active',
        performanceClass: 'perf-high',
        trend: this.calculateTrend(active, prev.activeFarms),
        trendArrow: this.getTrendArrowSimple(active, prev.activeFarms),
        trendColor: this.getTrendColorSimple(active, prev.activeFarms)
      },
      {
        label: 'Connected Devices',
        value: devices,
        icon: 'devices',
        subtitle: 'Total devices installed',
        performanceClass: 'perf-medium',
        trend: this.calculateTrend(devices, prev.totalDevices),
        trendArrow: this.getTrendArrowSimple(devices, prev.totalDevices),
        trendColor: this.getTrendColorSimple(devices, prev.totalDevices)
      },
      {
        label: 'Total Coverage',
        value: area,
        icon: 'square_foot',
        subtitle: 'Hectares covered',
        performanceClass: 'perf-low',
        trend: this.calculateTrend(area, prev.totalArea),
        trendArrow: this.getTrendArrowSimple(area, prev.totalArea),
        trendColor: this.getTrendColorSimple(area, prev.totalArea)
      }
    ];
  });

  allFarmsSelected = computed(() =>
    this.farms().length > 0 && this.selectedFarms().length === this.farms().length
  );

  someFarmsSelected = computed(() =>
    this.selectedFarms().length > 0 && this.selectedFarms().length < this.farms().length
  );

  // Theme detection for UI
  isDarkTheme = computed(() => document.body.classList.contains('dark-theme'));

  displayedColumns: string[] = [
    'select',
    'farm_name',
    'owner',
    'location',
    'area',
    'devices',
    'status',
    'created_at',
    'actions'
  ];

  constructor() {
    // Effect to initialize map when view mode changes to map
    effect(() => {
      if (this.viewMode() === 'map' && !this.mapInitialized) {
        setTimeout(() => this.initializeMap(), 100);
      }
    });

    // Effect to update map when farms change
    effect(() => {
      if (this.viewMode() === 'map' && this.mapInitialized && this.farms().length > 0) {
        setTimeout(() => this.updateMapMarkers(), 100);
      }
    });
  }

  ngOnInit() {
    this.loadFarms();
    this.initializeCounterAnimation();
  }

  ngAfterViewInit() {
    // Leaflet is already loaded in index.html, no need to load it again
    // Wait for Leaflet to be available
    if (typeof (window as any).L === 'undefined') {
      // Leaflet should be loaded via script tag in index.html
      console.warn('Leaflet not available. Make sure Leaflet script is loaded in index.html');
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadFarms() {
    this.loading.set(true);
    this.error.set(null);

    this.adminApiService.getFarms({
      page: this.pageIndex() + 1,
      limit: this.pageSize(),
      search: this.searchQuery || undefined,
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.error.set(err.message || 'Failed to load farms');
          return of({ items: [], total: 0, page: 1, limit: 25, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe(result => {
        let farms: AdminFarm[] = result.items;

        // Apply status filter
        if (this.statusFilter) {
          farms = farms.filter(f => f.status === this.statusFilter);
        }

        // Apply sorting
        farms = this.sortFarms(farms);

        // Update previous values before setting new ones for trend calculation
        const prevValues = {
          totalFarms: this.totalFarms(),
          activeFarms: this.activeFarms(),
          totalDevices: this.totalDevices(),
          totalArea: this.totalArea()
        };

        this.farms.set(farms);
        this.totalFarms.set(result.total);

        // Update previous values after a delay to allow computed values to update
        setTimeout(() => {
          this.previousValues.set({
            totalFarms: this.totalFarms(),
            activeFarms: this.activeFarms(),
            totalDevices: this.totalDevices(),
            totalArea: this.totalArea()
          });
        }, 100);
      });
  }

  sortFarms(farms: AdminFarm[]): AdminFarm[] {
    const sorted = [...farms];
    switch (this.sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.farm_name.localeCompare(b.farm_name));
      case 'created':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
      case 'devices':
        return sorted.sort((a, b) => (b.device_count || 0) - (a.device_count || 0));
      case 'area':
        return sorted.sort((a, b) => (b.area_hectares || 0) - (a.area_hectares || 0));
      default:
        return sorted;
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadFarms();
  }

  onSearchChange() {
    this.pageIndex.set(0);
    this.loadFarms();
  }

  applyFilters() {
    this.pageIndex.set(0);
    this.loadFarms();
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.sortBy = 'name';
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters.update(v => !v);
  }

  /**
   * Get count of active filters for UI badge
   */
  getActiveFiltersCount(): number {
    let count = 0;
    if (this.searchQuery) count++;
    if (this.statusFilter) count++;
    if (this.sortBy !== 'name') count++;
    return count;
  }

  setViewMode(mode: ViewMode) {
    // Force immediate view mode change - Angular signals update synchronously
    this.viewMode.set(mode);

    // If switching away from map view, the view will change immediately
    // The map remains initialized but hidden via *ngIf

    // Initialize map if switching to map view
    if (mode === 'map' && !this.mapInitialized) {
      setTimeout(() => this.initializeMap(), 100);
    }
  }

  // ==================== Map Functions ====================

  initializeMap() {
    if (typeof (window as any).L === 'undefined') {
      console.warn('Leaflet not loaded yet');
      setTimeout(() => this.initializeMap(), 500);
      return;
    }

    const L = (window as any).L;
    const mapContainer = document.getElementById('farms-map');
    if (!mapContainer) {
      return;
    }

    // Remove existing map if any
    if (this.map) {
      this.map.remove();
      this.markers = [];
    }

    // Calculate center from farms or use default
    const farms = this.farms();
    let center: [number, number] = [0, 0];
    let zoom = 2;

    if (farms.length > 0 && farms[0].location) {
      const validFarms = farms.filter((f): f is AdminFarm & { location: { lat: number; lng: number } } =>
        f.location !== undefined && f.location.lat !== undefined && f.location.lng !== undefined
      );
      if (validFarms.length > 0) {
        const avgLat = validFarms.reduce((sum, f) => sum + f.location.lat, 0) / validFarms.length;
        const avgLng = validFarms.reduce((sum, f) => sum + f.location.lng, 0) / validFarms.length;
        center = [avgLat, avgLng];
        zoom = validFarms.length === 1 ? 15 : 10;
      }
    }

    // Initialize map
    this.map = L.map('farms-map', {
      center,
      zoom,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.mapInitialized = true;
    this.updateMapMarkers();
  }

  updateMapMarkers() {
    if (!this.map || !this.mapInitialized) return;

    const L = (window as any).L;
    const isDarkTheme = document.body.classList.contains('dark-theme');

    // Clear existing markers
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Add markers for each farm
    this.farms().forEach(farm => {
      if (!farm.location?.lat || !farm.location?.lng) return;

      const isActive = farm.status === 'active';
      const iconColor = isActive ? '#10b981' : '#6b7280';
      const borderColor = isActive ? '#059669' : '#4b5563';
      const shadowColor = isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(107, 114, 128, 0.3)';

      // Create custom icon with better styling
      const customIcon = L.divIcon({
        className: 'farm-marker',
        html: `
          <div class="marker-pin" style="
            background-color: ${iconColor};
            border: 2px solid ${borderColor};
            box-shadow: 0 4px 12px ${shadowColor};
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <mat-icon style="
              color: white;
              font-size: 18px;
              width: 18px;
              height: 18px;
              transform: rotate(45deg);
            ">agriculture</mat-icon>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });

      // Create styled popup content
      const popupContent = `
        <div class="farm-popup" style="
          min-width: 200px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid ${isDarkTheme ? 'rgba(51, 65, 85, 0.5)' : 'rgba(229, 231, 235, 0.8)'};
          ">
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 8px;
              background: linear-gradient(135deg, ${iconColor}, ${borderColor});
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
            ">
              <span style="font-size: 18px;">🌾</span>
            </div>
            <h4 style="
              margin: 0;
              font-size: 1rem;
              font-weight: 700;
              color: ${isDarkTheme ? '#f1f5f9' : '#1f2937'};
            ">${this.escapeHtml(farm.farm_name)}</h4>
          </div>
          <div style="
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 0.875rem;
            color: ${isDarkTheme ? '#cbd5e1' : '#4b5563'};
          ">
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong style="color: ${isDarkTheme ? '#94a3b8' : '#6b7280'}; min-width: 60px;">Owner:</strong>
              <span>${this.escapeHtml(farm.owner_name || 'Unknown')}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong style="color: ${isDarkTheme ? '#94a3b8' : '#6b7280'}; min-width: 60px;">Devices:</strong>
              <span>${farm.device_count || 0}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong style="color: ${isDarkTheme ? '#94a3b8' : '#6b7280'}; min-width: 60px;">Area:</strong>
              <span>${farm.area_hectares || 0} ha</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <strong style="color: ${isDarkTheme ? '#94a3b8' : '#6b7280'}; min-width: 60px;">Status:</strong>
              <span style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: capitalize;
                background: ${isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)'};
                color: ${isActive ? '#10b981' : '#6b7280'};
              ">
                <span style="
                  width: 6px;
                  height: 6px;
                  border-radius: 50%;
                  background: ${iconColor};
                "></span>
                ${farm.status}
              </span>
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([farm.location.lat, farm.location.lng], { icon: customIcon })
        .addTo(this.map)
        .bindPopup(popupContent, {
          className: 'farm-popup-container',
          maxWidth: 250
        });

      marker.on('click', () => {
        this.selectedMapFarm.set(farm);
        this.viewFarmDetails(farm);
      });

      this.markers.push(marker);
    });

    // Fit map to show all markers
    if (this.markers.length > 0) {
      const group = new L.FeatureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /**
   * Escape HTML to prevent XSS in popup content
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  focusFarmOnMap(farm: AdminFarm, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!farm.location?.lat || !farm.location?.lng) {
      this.snackBar.open('Farm location not available', 'Close', { duration: 3000 });
      return;
    }

    if (this.viewMode() !== 'map') {
      this.setViewMode('map');
      setTimeout(() => this.focusFarmOnMap(farm), 500);
      return;
    }

    if (!this.map || !this.mapInitialized) {
      this.initializeMap();
      setTimeout(() => this.focusFarmOnMap(farm), 500);
      return;
    }

    // At this point, we know farm.location exists and has lat/lng from the first check
    const location = farm.location;
    this.map.setView([location.lat, location.lng], 15);
    this.selectedMapFarm.set(farm);

    // Highlight the marker
    const marker = this.markers.find(m => {
      const latlng = m.getLatLng();
      return Math.abs(latlng.lat - location.lat) < 0.0001 &&
             Math.abs(latlng.lng - location.lng) < 0.0001;
    });

    if (marker) {
      marker.openPopup();
    }
  }

  fitMapToFarms() {
    if (!this.map || !this.mapInitialized || this.markers.length === 0) return;
    const L = (window as any).L;
    const group = new L.FeatureGroup(this.markers);
    this.map.fitBounds(group.getBounds().pad(0.1));
  }

  refreshMap() {
    this.updateMapMarkers();
    this.snackBar.open('Map refreshed', 'Close', { duration: 2000 });
  }

  // ==================== Selection Functions ====================

  stopEventPropagation(event: Event) {
    if (event && event.stopPropagation && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
  }

  toggleFarmSelection(farm: AdminFarm, event?: Event | any) {
    // Handle event propagation if it's a DOM event
    if (event && event.stopPropagation && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    const selected = this.selectedFarms();
    const index = selected.findIndex(f => f.farm_id === farm.farm_id);

    if (index >= 0) {
      this.selectedFarms.set(selected.filter(f => f.farm_id !== farm.farm_id));
    } else {
      this.selectedFarms.set([...selected, farm]);
    }
  }

  toggleAllFarms(event: any) {
    if (event.checked) {
      this.selectedFarms.set([...this.farms()]);
    } else {
      this.selectedFarms.set([]);
    }
  }

  isFarmSelected(farm: AdminFarm): boolean {
    return this.selectedFarms().some(f => f.farm_id === farm.farm_id);
  }

  // ==================== Farm Actions ====================

  viewFarmDetails(farm: AdminFarm, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const dialogRef = this.dialog.open(FarmDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        mode: 'view',
        farmId: farm.farm_id
      },
      panelClass: 'farm-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Farm updated successfully', 'Close', { duration: 3000 });
        this.loadFarms();
      }
    });
  }

  viewFarmDevices(farm: AdminFarm) {
    // TODO: Navigate to devices page filtered by farm
    this.snackBar.open(`Viewing devices for ${farm.farm_name}`, 'Close', { duration: 3000 });
  }

  editFarm(farm: AdminFarm, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const dialogRef = this.dialog.open(FarmDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        mode: 'edit',
        farmId: farm.farm_id
      },
      panelClass: 'farm-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Farm updated successfully', 'Close', { duration: 3000 });
        this.loadFarms();
      }
    });
  }

  deleteFarm(farm: AdminFarm) {
    if (farm.device_count > 0) {
      this.snackBar.open('Cannot delete farm with devices', 'Close', { duration: 3000 });
      return;
    }

    if (confirm(`Are you sure you want to delete "${farm.farm_name}"?`)) {
      this.adminApiService.deleteFarm(farm.farm_id)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError(err => {
            this.snackBar.open(err.error?.message || 'Failed to delete farm', 'Close', { duration: 3000 });
            return of(null);
          })
        )
        .subscribe(result => {
          if (result) {
            this.snackBar.open('Farm deleted successfully', 'Close', { duration: 3000 });
            this.loadFarms();
            this.selectedFarms.set(this.selectedFarms().filter(f => f.farm_id !== farm.farm_id));
          }
        });
    }
  }

  toggleFarmStatus(farm: AdminFarm) {
    const newStatus = farm.status === 'active' ? 'inactive' : 'active';
    this.adminApiService.updateFarm(farm.farm_id, { status: newStatus } as any)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.snackBar.open('Failed to update farm status', 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(result => {
        if (result) {
          this.snackBar.open(`Farm ${newStatus} successfully`, 'Close', { duration: 3000 });
          this.loadFarms();
        }
      });
  }

  // ==================== Bulk Actions ====================

  bulkActivate() {
    const selected = this.selectedFarms();
    if (selected.length === 0) return;

    // TODO: Implement bulk activate API call
    this.snackBar.open(`Activating ${selected.length} farms...`, 'Close', { duration: 3000 });
    this.selectedFarms.set([]);
    this.loadFarms();
  }

  bulkDeactivate() {
    const selected = this.selectedFarms();
    if (selected.length === 0) return;

    // TODO: Implement bulk deactivate API call
    this.snackBar.open(`Deactivating ${selected.length} farms...`, 'Close', { duration: 3000 });
    this.selectedFarms.set([]);
    this.loadFarms();
  }

  bulkDelete() {
    const selected = this.selectedFarms();
    if (selected.length === 0) return;

    const hasDevices = selected.some(f => f.device_count > 0);
    if (hasDevices) {
      this.snackBar.open('Cannot delete farms with devices', 'Close', { duration: 3000 });
      return;
    }

    if (confirm(`Are you sure you want to delete ${selected.length} farms?`)) {
      // TODO: Implement bulk delete API call
      this.snackBar.open(`Deleting ${selected.length} farms...`, 'Close', { duration: 3000 });
      this.selectedFarms.set([]);
      this.loadFarms();
    }
  }

  // ==================== Export ====================

  exportFarms() {
    const farms = this.farms();
    if (farms.length === 0) {
      this.snackBar.open('No farms to export', 'Close', { duration: 3000 });
      return;
    }

    // Convert to CSV
    const headers = ['Farm ID', 'Farm Name', 'Owner', 'Latitude', 'Longitude', 'Area (ha)', 'Devices', 'Status', 'Created'];
    const rows = farms.map(f => [
      f.farm_id,
      f.farm_name,
      f.owner_name || 'Unknown',
      f.location?.lat || '',
      f.location?.lng || '',
      f.area_hectares || 0,
      f.device_count || 0,
      f.status,
      this.formatDate(f.created_at)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farms-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Farms exported successfully', 'Close', { duration: 3000 });
  }

  // ==================== Create Farm ====================

  openCreateDialog() {
    const dialogRef = this.dialog.open(FarmDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        mode: 'create'
        // No farmId needed for create mode
      },
      panelClass: 'farm-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        this.snackBar.open('Farm created successfully', 'Close', { duration: 3000 });
        this.loadFarms();
      }
    });
  }

  // ==================== Utility Functions ====================

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  }

  initializeCounterAnimation() {
    // Animate counter values
    setTimeout(() => {
      const counters = document.querySelectorAll('.counter');
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target') || '0');
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
    }, 500);
  }

  // ==================== Trend & Performance Methods ====================

  // Simple Trend Helpers for KPI Cards
  private calculateTrend(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private getTrendArrowSimple(current: number, previous: number): string {
    if (current > previous) return '↑';
    if (current < previous) return '↓';
    return '→';
  }

  private getTrendColorSimple(current: number, previous: number): string {
    if (current > previous) return 'success';
    if (current < previous) return 'danger';
    return 'neutral';
  }
}
