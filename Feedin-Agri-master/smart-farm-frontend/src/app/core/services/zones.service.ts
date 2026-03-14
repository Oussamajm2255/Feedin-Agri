import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Zone, FarmDashboardAggregation, ZoneDashboardData } from '../models/zone.model';

/**
 * ZonesService
 *
 * Central service for Zone CRUD and selection state.
 * Uses Angular Signals for reactive state management.
 */
@Injectable({
  providedIn: 'root',
})
export class ZonesService {
  private readonly API = environment.apiUrl;

  // ── Reactive State (Signals) ───────────────────────────────
  /** All zones for the currently selected farm */
  public zones = signal<Zone[]>([]);
  /** The zone currently selected in the dashboard selector */
  public selectedZone = signal<Zone | null>(null);
  /** Loading flag */
  public loading = signal<boolean>(false);
  /** Error message */
  public error = signal<string | null>(null);

  /** Derived: whether zones are available */
  public hasZones = computed(() => this.zones().length > 0);

  private readonly STORAGE_KEY = 'sf_selected_zone_id';

  constructor(private http: HttpClient) {}

  // ── CRUD ────────────────────────────────────────────────────

  /**
   * Load all zones for a farm and update local state.
   * Restores last selected zone from localStorage.
   */
  loadZones(farmId: string): Observable<Zone[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.http
      .get<Zone[]>(`${this.API}/zones`, {
        params: new HttpParams().set('farmId', farmId),
      })
      .pipe(
        tap((zones) => {
          this.zones.set(zones);
          this.loading.set(false);

          // Restore persisted selection
          const savedId = localStorage.getItem(this.STORAGE_KEY);
          if (savedId) {
            const found = zones.find((z) => z.id === savedId);
            if (found) {
              this.selectedZone.set(found);
              return;
            }
          }
          // Default: no zone selected (show all)
          this.selectedZone.set(null);
        }),
        catchError((err) => {
          this.error.set('Failed to load zones');
          this.loading.set(false);
          console.error('ZonesService.loadZones error:', err);
          return of([]);
        }),
      );
  }

  getZone(id: string): Observable<Zone> {
    return this.http.get<Zone>(`${this.API}/zones/${id}`);
  }

  createZone(data: Partial<Zone> & { farm_id: string; name: string }): Observable<Zone> {
    return this.http.post<Zone>(`${this.API}/zones`, data);
  }

  updateZone(id: string, data: Partial<Zone>): Observable<Zone> {
    return this.http.patch<Zone>(`${this.API}/zones/${id}`, data);
  }

  deleteZone(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API}/zones/${id}`);
  }

  assignSensor(zoneId: string, sensorId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/zones/${zoneId}/assign-sensor`, {
      sensorId,
    });
  }

  assignDevice(zoneId: string, deviceId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/zones/${zoneId}/assign-device`, {
      deviceId,
    });
  }

  // ── Selection ───────────────────────────────────────────────

  /**
   * Select a zone (or null for "All Zones").
   * Persists selection to localStorage.
   */
  selectZone(zone: Zone | null): void {
    this.selectedZone.set(zone);
    if (zone) {
      localStorage.setItem(this.STORAGE_KEY, zone.id);
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // ── Dashboard Aggregation ──────────────────────────────────

  getFarmDashboard(farmId: string): Observable<FarmDashboardAggregation> {
    return this.http.get<FarmDashboardAggregation>(`${this.API}/dashboard/farm/${farmId}`);
  }

  getZoneDashboard(zoneId: string): Observable<ZoneDashboardData> {
    return this.http.get<ZoneDashboardData>(`${this.API}/dashboard/zone/${zoneId}`);
  }
}
