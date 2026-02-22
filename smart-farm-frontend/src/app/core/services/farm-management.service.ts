import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { Farm } from '../models/farm.model';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FarmManagementService {
  private readonly STORAGE_KEY = 'selectedFarmId';
  private readonly authService = inject(AuthService);
  private initializedOnce = false;
  
  // Signals for reactive state management
  private _farms = signal<Farm[]>([]);
  private _selectedFarm = signal<Farm | null>(null);
  private _isLoading = signal<boolean>(false);
  
  // Public readonly signals
  readonly farms = this._farms.asReadonly();
  readonly selectedFarm = this._selectedFarm.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  
  // Computed signals
  readonly hasMultipleFarms = computed(() => this._farms().length > 1);
  readonly selectedFarmId = computed(() => this._selectedFarm()?.farm_id || null);
  
  // BehaviorSubject for components that need observables
  private selectedFarmSubject = new BehaviorSubject<Farm | null>(null);
  public selectedFarm$ = this.selectedFarmSubject.asObservable();

  constructor(private apiService: ApiService) {
    // Watch for auth state changes using effect()
    effect(() => {
      const user = this.authService.user();
      const isAuthenticated = this.authService.isAuthenticated();
      
      if (isAuthenticated && user) {
        // User is authenticated, load farms (but only once per login to avoid multiple calls)
        if (!this.initializedOnce || this._farms().length === 0) {
          console.log('🔄 [FARM-MGMT] User authenticated, initializing farms...');
          this.initializeFarmSelection();
          this.initializedOnce = true;
        }
      } else if (!isAuthenticated) {
        // User logged out, clear farms
        console.log('🚪 [FARM-MGMT] User logged out, clearing farms');
        this.clearSelection();
        this._farms.set([]);
        this.initializedOnce = false;
      }
    });
  }

  /**
   * Initialize farm selection - only called when user is authenticated
   */
  private async initializeFarmSelection(): Promise<void> {
    try {
      // Check if user is authenticated before loading farms
      if (!this.authService.isAuthenticated()) {
        console.log('⚠️ [FARM-MGMT] User not authenticated, skipping farm initialization');
        return;
      }

      this._isLoading.set(true);
      console.log('🏡 [FARM-MGMT] Loading farms for authenticated user...');
      
      // Load farms from API
      const farms = await this.apiService.getFarms().toPromise();
      console.log(`✅ [FARM-MGMT] Loaded ${farms?.length || 0} farms`);
      this._farms.set(farms || []);
      
      // Try to restore previously selected farm
      const savedFarmId = localStorage.getItem(this.STORAGE_KEY);
      let farmToSelect: Farm | null = null;
      
      if (savedFarmId && farms) {
        farmToSelect = farms.find(farm => farm.farm_id === savedFarmId) || null;
      }
      
      // If no saved farm or saved farm not found, select first farm
      if (!farmToSelect && farms && farms.length > 0) {
        farmToSelect = farms[0];
      }
      
      // Set selected farm
      if (farmToSelect) {
        this.selectFarm(farmToSelect);
      } else if (farms && farms.length === 0) {
        console.warn('⚠️ [FARM-MGMT] No farms found for this user. Check if farms have owner_id set in database.');
      }
      
    } catch (error) {
      console.error('❌ [FARM-MGMT] Error initializing farm selection:', error);
      // If error is 401, user might not be authenticated yet - this is expected
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        console.log('⚠️ [FARM-MGMT] Authentication required - farms will load after login');
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Select a farm and update global state
   */
  selectFarm(farm: Farm): void {
    this._selectedFarm.set(farm);
    this.selectedFarmSubject.next(farm);
    
    // Save to localStorage for persistence
    localStorage.setItem(this.STORAGE_KEY, farm.farm_id);
    
    console.log(`🏡 Farm selected: ${farm.name} (${farm.farm_id})`);
  }

  /**
   * Get the currently selected farm
   */
  getSelectedFarm(): Farm | null {
    return this._selectedFarm();
  }

  /**
   * Get farms list
   */
  getFarms(): Farm[] {
    return this._farms();
  }

  /**
   * Refresh farms list from API
   */
  async refreshFarms(): Promise<void> {
    try {
      // Check if user is authenticated
      if (!this.authService.isAuthenticated()) {
        console.log('⚠️ [FARM-MGMT] Cannot refresh farms - user not authenticated');
        return;
      }

      this._isLoading.set(true);
      console.log('🔄 [FARM-MGMT] Refreshing farms...');
      const farms = await this.apiService.getFarms().toPromise();
      console.log(`✅ [FARM-MGMT] Refreshed ${farms?.length || 0} farms`);
      this._farms.set(farms || []);
      
      // Check if current selected farm still exists
      const currentFarm = this._selectedFarm();
      if (currentFarm && farms) {
        const farmStillExists = farms.some(farm => farm.farm_id === currentFarm.farm_id);
        if (!farmStillExists && farms.length > 0) {
          // Current farm no longer exists, select first available farm
          this.selectFarm(farms[0]);
        } else if (!farmStillExists && farms.length === 0) {
          // No farms available, clear selection
          this.clearSelection();
        }
      } else if (!currentFarm && farms && farms.length > 0) {
        // No farm selected but farms available, select first one
        this.selectFarm(farms[0]);
      }
      
    } catch (error) {
      console.error('❌ [FARM-MGMT] Error refreshing farms:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Clear farm selection (useful for logout)
   */
  clearSelection(): void {
    this._selectedFarm.set(null);
    this.selectedFarmSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get farm display name for UI
   */
  getFarmDisplayName(): string {
    const farm = this._selectedFarm();
    if (farm) {
      return farm.name;
    }
    return this._farms().length === 1 ? this._farms()[0].name : 'Select Farm';
  }

  /**
   * Get farm location for UI
   */
  getFarmLocation(): string {
    const farm = this._selectedFarm();
    if (farm) {
      return farm.location || 'Location not specified';
    }
    return this._farms().length === 1 ? (this._farms()[0].location || 'Location not specified') : '';
  }

  /**
   * Check if a specific farm is selected
   */
  isFarmSelected(farmId: string): boolean {
    return this._selectedFarm()?.farm_id === farmId;
  }
}
