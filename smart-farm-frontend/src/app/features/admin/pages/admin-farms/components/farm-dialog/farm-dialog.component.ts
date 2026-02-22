import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  signal,
  computed,
  inject,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatStepperModule } from '@angular/material/stepper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';

import { AdminFarmDetails } from '../../../../../../core/models/farm.model';
import { User } from '../../../../../../core/models/user.model';
import { AdminApiService } from '../../../../../../admin/core/services/admin-api.service';

// Dialog Mode Type
export type DialogMode = 'create' | 'view' | 'edit';

// Dialog Data Interface
export interface FarmDialogData {
  mode: DialogMode;
  farmId?: string; // Optional for create mode
}

@Component({
  selector: 'app-farm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTableModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatStepperModule,
  ],
  templateUrl: './farm-dialog.component.html',
  styleUrls: ['./farm-dialog.component.scss']
})
export class FarmDialogComponent implements OnInit {
  @ViewChild('advancedPanel') advancedPanel?: MatExpansionPanel;

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<FarmDialogComponent>);
  private adminApiService = inject(AdminApiService);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);
  public data = inject<FarmDialogData>(MAT_DIALOG_DATA);

  // State signals
  farmForm: FormGroup;
  isLoading = signal(false);
  isLoadingDetails = signal(this.data.mode !== 'create'); // Only show loading for view/edit modes
  mode = signal<DialogMode>(this.data.mode);
  isCreateMode = computed(() => this.mode() === 'create');
  isEditMode = computed(() => this.mode() === 'edit');
  isViewMode = computed(() => this.mode() === 'view');

  // Data signals
  farm = signal<AdminFarmDetails | null>(null);
  farmers = signal<User[]>([]);
  moderators = signal<User[]>([]);
  devices = signal<any[]>([]);
  sensors = signal<any[]>([]);
  activityLogs = signal<any[]>([]);

  // Loading states for tabs
  loadingDevices = signal(false);
  loadingSensors = signal(false);
  loadingActivity = signal(false);

  // Store initial values for diff detection
  private initialFormValue: any = null;

  // Computed values
  dialogTitle = computed(() => {
    if (this.isCreateMode()) {
      return 'Create New Farm';
    }
    if (this.isViewMode()) {
      return this.farm()?.farm_name || 'Farm Details';
    }
    return `Edit ${this.farm()?.farm_name || 'Farm'}`;
  });

  // Form completion progress for create mode
  formProgress = computed(() => {
    if (!this.isCreateMode()) return 0;
    const totalFields = 9; // Total form fields
    const requiredFields = ['farm_name', 'owner_id'];
    let completed = 0;

    // Check required fields
    requiredFields.forEach(field => {
      const control = this.farmForm.get(field);
      if (control && control.value && !control.invalid) {
        completed++;
      }
    });

    // Check optional fields
    const optionalFields = ['latitude', 'longitude', 'city', 'region', 'country', 'area_hectares', 'description'];
    optionalFields.forEach(field => {
      const control = this.farmForm.get(field);
      if (control && control.value) {
        completed++;
      }
    });

    return Math.round((completed / totalFields) * 100);
  });

  // Check if field is valid
  isFieldValid(fieldName: string): boolean {
    const control = this.farmForm.get(fieldName);
    return control ? control.valid && control.touched : false;
  }

  // Check if field has error
  hasFieldError(fieldName: string): boolean {
    const control = this.farmForm.get(fieldName);
    return control ? control.invalid && control.touched : false;
  }

  // Check if a step is valid
  isStepValid(step: 'basic' | 'location' | 'details'): boolean {
    if (step === 'basic') {
      const nameValid = this.farmForm.get('farm_name')?.valid ?? false;
      const ownerValid = this.farmForm.get('owner_id')?.valid ?? false;
      // Description is optional
      return nameValid && ownerValid;
    }
    if (step === 'location') {
      // All location fields are optional in the form definition, but we might want to enforce at least something?
      // For now, just check if the controls themselves are valid (e.g. min/max constraints)
      const latValid = this.farmForm.get('latitude')?.valid ?? true;
      const lngValid = this.farmForm.get('longitude')?.valid ?? true;
      return latValid && lngValid;
    }
    if (step === 'details') {
      const areaValid = this.farmForm.get('area_hectares')?.valid ?? true;
      return areaValid;
    }
    return true;
  }

  // Get character count for text fields
  getCharacterCount(fieldName: string): number {
    const control = this.farmForm.get(fieldName);
    return control?.value?.length || 0;
  }

  // Get max length for field
  getMaxLength(fieldName: string): number {
    const control = this.farmForm.get(fieldName);
    if (control?.hasError('maxlength')) {
      return control.errors?.['maxlength'].requiredLength || 0;
    }
    switch (fieldName) {
      case 'farm_name': return 100;
      case 'description': return 500;
      case 'city':
      case 'region':
      case 'country': return 100;
      default: return 0;
    }
  }

  // Use current location
  useCurrentLocation(): void {
    if (navigator.geolocation) {
      this.isLoading.set(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.farmForm.patchValue({
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          });
          this.isLoading.set(false);
          this.snackBar.open('Location detected successfully', 'Close', { duration: 2000 });
        },
        (error) => {
          this.isLoading.set(false);
          this.snackBar.open('Unable to detect location. Please enter manually.', 'Close', { duration: 3000 });
        }
      );
    } else {
      this.snackBar.open('Geolocation is not supported by your browser', 'Close', { duration: 3000 });
    }
  }

  statusBadgeClass = computed(() => {
    const status = this.farm()?.status;
    return status === 'active' ? 'status-active' : 'status-inactive';
  });

  healthScoreBadgeClass = computed(() => {
    const score = this.farm()?.health_score || 0;
    if (score >= 80) return 'health-excellent';
    if (score >= 60) return 'health-good';
    if (score >= 40) return 'health-warning';
    return 'health-critical';
  });

  // Table columns
  deviceColumns: string[] = ['name', 'type', 'status', 'last_seen'];
  sensorColumns: string[] = ['sensor_id', 'type', 'device', 'status'];
  activityColumns: string[] = ['timestamp', 'action', 'source', 'status'];

  constructor() {
    // Initialize form
    this.farmForm = this.fb.group({
      farm_name: ['', [Validators.required, Validators.maxLength(100)]],
      owner_id: ['', Validators.required],
      latitude: ['', [Validators.min(-90), Validators.max(90)]],
      longitude: ['', [Validators.min(-180), Validators.max(180)]],
      city: ['', Validators.maxLength(100)],
      region: ['', Validators.maxLength(100)],
      country: ['', Validators.maxLength(100)],
      area_hectares: ['', [Validators.min(0)]],
      description: ['', Validators.maxLength(500)],
      moderator_ids: [[]],
    });
  }

  ngOnInit(): void {
    // In create mode, show form immediately (no loading needed)
    if (this.isCreateMode()) {
      this.isLoadingDetails.set(false);
      this.farmForm.enable();
      // Load farmers and moderators in background (non-blocking)
      this.loadFarmers();
      this.loadModerators();
    } else {
      // For view/edit mode, load farm details first
      // Load farmers and moderators in parallel (non-blocking)
      this.loadFarmers();
      this.loadModerators();
      this.loadFarmDetails();
    }
  }

  /**
   * Load farm details from backend
   */
  loadFarmDetails(): void {
    if (!this.data.farmId) {
      this.isLoadingDetails.set(false);
      return;
    }

    // Start loading immediately (already set in initialization)
    this.adminApiService.getFarm(this.data.farmId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          this.snackBar.open('Failed to load farm details', 'Close', { duration: 3000 });
          this.isLoadingDetails.set(false);
          return of(null);
        })
      )
      .subscribe((farm) => {
        if (farm) {
          this.farm.set(farm);
          this.populateForm(farm);

          // Store initial values for diff detection (synchronous, no setTimeout needed)
          this.initialFormValue = this.getFormValue();
        }
        // Set loading to false after data is loaded
        this.isLoadingDetails.set(false);
      });
  }

  /**
   * Populate form with farm data
   */
  private populateForm(farm: AdminFarmDetails): void {
    this.farmForm.patchValue({
      farm_name: farm.farm_name || '',
      owner_id: farm.owner_id || '',
      latitude: farm.latitude || farm.location?.lat || '',
      longitude: farm.longitude || farm.location?.lng || '',
      city: farm.city || '',
      region: farm.region || '',
      country: farm.country || '',
      area_hectares: farm.area_hectares || '',
      description: farm.description || '',
      moderator_ids: farm.moderator_ids || [],
    });

    // Disable form in view mode
    if (this.isViewMode()) {
      this.farmForm.disable();
    }
  }

  /**
   * Load farmers (owners)
   */
  loadFarmers(): void {
    this.adminApiService.getUsers({ role: 'farmer', limit: 100 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of({ items: [], total: 0, page: 1, limit: 100, totalPages: 0 }))
      )
      .subscribe((result) => {
        this.farmers.set(result.items as User[]);
      });
  }

  /**
   * Load moderators
   */
  loadModerators(): void {
    this.adminApiService.getUsers({ role: 'moderator', limit: 100 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of({ items: [], total: 0, page: 1, limit: 100, totalPages: 0 }))
      )
      .subscribe((result) => {
        this.moderators.set(result.items as User[]);
      });
  }

  /**
   * Load devices for this farm (lazy loaded on tab change)
   */
  loadDevices(): void {
    if (!this.data.farmId || this.devices().length > 0) return; // Already loaded or no farm ID

    this.loadingDevices.set(true);
    this.adminApiService.getDevices({ farm_id: this.data.farmId, limit: 100 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of({ devices: [], total: 0, page: 1, limit: 100, totalPages: 0 })),
        finalize(() => this.loadingDevices.set(false))
      )
      .subscribe((result) => {
        this.devices.set(result.devices);
      });
  }

  /**
   * Load sensors for this farm (lazy loaded on tab change)
   */
  loadSensors(): void {
    if (!this.data.farmId || this.sensors().length > 0) return; // Already loaded or no farm ID

    this.loadingSensors.set(true);
    this.adminApiService.getSensors({ farm_id: this.data.farmId, limit: 100 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of({ sensors: [], total: 0, page: 1, limit: 100, totalPages: 0 })),
        finalize(() => this.loadingSensors.set(false))
      )
      .subscribe((result) => {
        this.sensors.set(result.sensors);
      });
  }

  /**
   * Load activity logs for this farm (lazy loaded on tab change)
   */
  loadActivityLogs(): void {
    if (!this.data.farmId || this.activityLogs().length > 0) return; // Already loaded or no farm ID

    this.loadingActivity.set(true);
    this.adminApiService.getFarmActivity(this.data.farmId, 50)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of([])),
        finalize(() => this.loadingActivity.set(false))
      )
      .subscribe((logs) => {
        this.activityLogs.set(logs);
      });
  }

  /**
   * Handle tab change to lazy load data
   */
  onTabChange(event: any): void {
    const index = event.index;
    switch (index) {
      case 1: // Devices tab
        this.loadDevices();
        break;
      case 2: // Sensors tab
        this.loadSensors();
        break;
      case 3: // Moderators tab
        // Moderators already loaded
        break;
      case 4: // Activity Log tab
        this.loadActivityLogs();
        break;
    }
  }

  /**
   * Switch to edit mode
   */
  switchToEditMode(): void {
    this.mode.set('edit');
    this.farmForm.enable();
  }

  /**
   * Get current form value
   */
  private getFormValue(): any {
    return {
      ...this.farmForm.getRawValue(),
    };
  }

  /**
   * Calculate changed fields (diff)
   */
  private calculateChangedFields(): Partial<AdminFarmDetails> {
    const currentValue = this.getFormValue();
    const changes: any = {};

    Object.keys(currentValue).forEach((key) => {
      const currentVal = currentValue[key];
      const initialVal = this.initialFormValue?.[key];

      if (Array.isArray(currentVal) && Array.isArray(initialVal)) {
        // For arrays, check if they're different
        if (JSON.stringify(currentVal) !== JSON.stringify(initialVal)) {
          changes[key] = currentVal;
        }
      } else if (currentVal !== initialVal) {
        if (currentVal !== null && currentVal !== '' && currentVal !== undefined) {
          changes[key] = currentVal;
        } else if (initialVal !== null && initialVal !== '' && initialVal !== undefined) {
          changes[key] = null;
        }
      }
    });

    return changes;
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.farmForm.invalid) {
      this.markFormGroupTouched(this.farmForm);
      this.snackBar.open('Please fix form errors', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading.set(true);

    if (this.isCreateMode()) {
      // Create new farm
      const formValue = this.getFormValue();
      const createData: any = {
        name: formValue.farm_name,
        owner_id: formValue.owner_id,
        latitude: formValue.latitude ? parseFloat(formValue.latitude) : undefined,
        longitude: formValue.longitude ? parseFloat(formValue.longitude) : undefined,
        city: formValue.city || undefined,
        region: formValue.region || undefined,
        country: formValue.country || undefined,
        area_hectares: formValue.area_hectares ? parseFloat(formValue.area_hectares) : undefined,
        description: formValue.description || undefined,
        status: 'active', // Default to active
      };

      this.adminApiService.createFarm(createData)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError((err) => {
            this.snackBar.open(err.error?.message || 'Failed to create farm', 'Close', {
              duration: 3000
            });
            return of(null);
          }),
          finalize(() => this.isLoading.set(false))
        )
        .subscribe((result) => {
          if (result) {
            // If moderators were selected, assign them
            if (formValue.moderator_ids && formValue.moderator_ids.length > 0 && result.farm_id) {
              this.adminApiService.updateFarmModerators(result.farm_id, formValue.moderator_ids)
                .pipe(
                  takeUntilDestroyed(this.destroyRef),
                  catchError(() => of(null))
                )
                .subscribe(() => {
                  this.snackBar.open('Farm created successfully', 'Close', { duration: 3000 });
                  this.dialogRef.close({ success: true, farm: result });
                });
            } else {
              this.snackBar.open('Farm created successfully', 'Close', { duration: 3000 });
              this.dialogRef.close({ success: true, farm: result });
            }
          }
        });
    } else {
      // Update existing farm
      const changes = this.calculateChangedFields();

      // No changes detected
      if (Object.keys(changes).length === 0) {
        this.snackBar.open('No changes detected', 'Close', { duration: 2000 });
        this.dialogRef.close();
        return;
      }

      if (!this.data.farmId) {
        this.snackBar.open('Farm ID is missing', 'Close', { duration: 3000 });
        this.isLoading.set(false);
        return;
      }

      this.adminApiService.patchFarm(this.data.farmId, changes)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError((err) => {
            this.snackBar.open(err.error?.message || 'Failed to update farm', 'Close', {
              duration: 3000
            });
            return of(null);
          }),
          finalize(() => this.isLoading.set(false))
        )
        .subscribe((result) => {
          if (result) {
            this.snackBar.open('Farm updated successfully', 'Close', { duration: 3000 });
            this.dialogRef.close({ success: true, farm: result });
          }
        });
    }
  }

  /**
   * Cancel and close dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Mark form as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Get error message for form control
   */
  getErrorMessage(controlName: string): string {
    const control = this.farmForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Maximum length is ${maxLength} characters`;
    }
    if (control.hasError('min')) {
      return `Minimum value is ${control.errors?.['min'].min}`;
    }
    if (control.hasError('max')) {
      return `Maximum value is ${control.errors?.['max'].max}`;
    }
    return '';
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string | undefined | null): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  /**
   * Get relative time
   */
  getRelativeTime(date: Date | string | undefined | null): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string | undefined): string {
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

  /**
   * Get owner name by owner ID
   */
  getOwnerName(ownerId: string | null | undefined): string {
    if (!ownerId) return 'N/A';
    const owner = this.farmers().find(f => f.user_id === ownerId);
    return owner ? `${owner.first_name} ${owner.last_name}` : ownerId;
  }
}
