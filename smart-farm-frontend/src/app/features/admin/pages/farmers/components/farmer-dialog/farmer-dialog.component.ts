import {
  Component,
  Inject,
  OnInit,
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
  MatDialogModule,
  MatDialog
} from '@angular/material/dialog';
import { AssignFarmDialogComponent } from '../assign-farm-dialog/assign-farm-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { Router } from '@angular/router';

import { User } from '../../../../../../core/models/user.model';
import { AdminApiService } from '../../../../../../admin/core/services/admin-api.service';
import { LanguageService } from '../../../../../../core/services/language.service';

// Dialog Mode Type
export type DialogMode = 'view' | 'edit';

// Dialog Data Interface
export interface FarmerDialogData {
  mode: DialogMode;
  farmerId: string;
}

@Component({
  selector: 'app-farmer-dialog',
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
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatSnackBarModule,
    MatChipsModule,
    MatCardModule,
  ],
  templateUrl: './farmer-dialog.component.html',
  styleUrls: ['./farmer-dialog.component.scss']
})
export class FarmerDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<FarmerDialogComponent>);
  private dialog = inject(MatDialog);
  private adminApiService = inject(AdminApiService);
  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  public data = inject<FarmerDialogData>(MAT_DIALOG_DATA);

  // Translation helper method
  t(key: string, params?: { [key: string]: any }): string {
    return this.languageService.translate(key, params);
  }

  // State signals
  farmerForm: FormGroup;
  isLoading = signal(false);
  isLoadingDetails = signal(true);
  mode = signal<DialogMode>(this.data.mode);
  isEditMode = computed(() => this.mode() === 'edit');
  isViewMode = computed(() => this.mode() === 'view');

  // Data signals
  farmer = signal<User | null>(null);

  // Store initial values for diff detection
  private initialFormValue: any = null;

  // Computed values
  dialogTitle = computed(() => {
    if (this.isViewMode()) {
      const f = this.farmer();
      return f ? `${f.first_name} ${f.last_name}` : this.t('admin.farmers.dialog.title.view');
    }
    return this.t('admin.farmers.dialog.title.edit', { name: this.farmer()?.first_name || '' });
  });

  // Status badge helper
  getStatusBadgeClass = computed(() => {
    const status = this.farmer()?.status || 'active';
    return {
      'status-active': status === 'active',
      'status-inactive': status === 'inactive',
      'status-suspended': status === 'suspended'
    };
  });

  // Get status label
  getStatusLabel = computed(() => {
    const status = this.farmer()?.status || 'active';
    return this.t(`admin.farmers.dialog.status.${status}`);
  });

  // Check if device_id exists
  hasDeviceId = computed(() => {
    const f = this.farmer();
    return f && (f as any).device_id ? true : false;
  });

  constructor() {
    // Initialize form
    this.farmerForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.maxLength(50)]],
      last_name: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.maxLength(20)],
      city: ['', Validators.maxLength(100)],
      country: ['', Validators.maxLength(100)],
      status: ['active'],
      device_id: [''], // Readonly in edit mode
    });
  }

  ngOnInit(): void {
    this.loadFarmerDetails();
  }

  /**
   * Load farmer details from backend
   */
  loadFarmerDetails(): void {
    if (!this.data.farmerId) {
      this.isLoadingDetails.set(false);
      return;
    }

    this.adminApiService.getUser(this.data.farmerId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          this.snackBar.open(
            this.t('admin.farmers.dialog.errors.loadFailed'),
            this.t('common.close'),
            { duration: 3000 }
          );
          this.isLoadingDetails.set(false);
          return of(null);
        })
      )
      .subscribe((farmer) => {
        if (farmer) {
          this.farmer.set(farmer);
          this.populateForm(farmer);
          this.initialFormValue = this.getFormValue();
        }
        this.isLoadingDetails.set(false);
      });
  }

  /**
   * Populate form with farmer data
   */
  private populateForm(farmer: User): void {
    this.farmerForm.patchValue({
      first_name: farmer.first_name || '',
      last_name: farmer.last_name || '',
      email: farmer.email || '',
      phone: farmer.phone || '',
      city: farmer.city || '',
      country: farmer.country || '',
      status: farmer.status || 'active',
      device_id: (farmer as any).device_id || '',
    });

    // Disable form in view mode
    if (this.isViewMode()) {
      this.farmerForm.disable();
    }

    // Email always disabled (can't change email)
    this.farmerForm.get('email')?.disable();
    
    // Device ID always readonly
    this.farmerForm.get('device_id')?.disable();
  }

  /**
   * Switch to edit mode
   */
  switchToEditMode(): void {
    this.mode.set('edit');
    this.farmerForm.enable();
    // Keep email and device_id disabled
    this.farmerForm.get('email')?.disable();
    this.farmerForm.get('device_id')?.disable();
  }

  /**
   * Get current form value
   */
  private getFormValue(): any {
    return {
      ...this.farmerForm.getRawValue(),
    };
  }

  /**
   * Calculate changed fields (diff)
   */
  private calculateChangedFields(): Partial<User> {
    const currentValue = this.getFormValue();
    const changes: any = {};

    Object.keys(currentValue).forEach((key) => {
      // Skip email - it can't be changed
      if (key === 'email') return;

      const currentVal = currentValue[key];
      const initialVal = this.initialFormValue?.[key];

      if (currentVal !== initialVal) {
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
    if (this.farmerForm.invalid) {
      this.markFormGroupTouched(this.farmerForm);
      this.snackBar.open(
        this.t('admin.farmers.dialog.errors.formErrors'),
        this.t('common.close'),
        { duration: 3000 }
      );
      return;
    }

    const changes = this.calculateChangedFields();

    // No changes detected
    if (Object.keys(changes).length === 0) {
      this.snackBar.open(
        this.t('admin.farmers.dialog.errors.noChanges'),
        this.t('common.close'),
        { duration: 2000 }
      );
      this.dialogRef.close();
      return;
    }

    if (!this.data.farmerId) {
      this.snackBar.open(
        this.t('admin.farmers.dialog.errors.missingId'),
        this.t('common.close'),
        { duration: 3000 }
      );
      return;
    }

    this.isLoading.set(true);

    this.adminApiService.patchUser(this.data.farmerId, changes)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          this.snackBar.open(
            err.error?.message || this.t('admin.farmers.dialog.errors.updateFailed'),
            this.t('common.close'),
            { duration: 3000 }
          );
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((result) => {
        if (result) {
          this.snackBar.open(
            this.t('admin.farmers.dialog.success.updated'),
            this.t('common.close'),
            { duration: 3000 }
          );
          this.dialogRef.close({ success: true, farmer: result });
        }
      });
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
    const control = this.farmerForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return this.t('admin.farmers.dialog.errors.required');
    }
    if (control.hasError('email')) {
      return this.t('admin.farmers.dialog.errors.invalidEmail');
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return this.t('admin.farmers.dialog.errors.maxLength', { max: maxLength });
    }
    return '';
  }

  /**
   * Quick Actions
   */
  onAssignFarm(): void {
    if (!this.data.farmerId || !this.farmer()) return;

    this.dialog.open(AssignFarmDialogComponent, {
      width: '600px',
      data: {
        farmerId: this.data.farmerId,
        farmerName: `${this.farmer()?.first_name} ${this.farmer()?.last_name}`
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadFarmerDetails(); // Refresh details
      }
    });
  }

  onViewAllFarms(): void {
    // Navigate to farms page filtered by farmer
    this.dialogRef.close();
    this.router.navigate(['/admin/farms'], {
      queryParams: { farmer_id: this.data.farmerId }
    });
  }

  onImpersonateFarmer(): void {
    if (!this.data.farmerId) return;

    this.isLoading.set(true);
    this.adminApiService.impersonateUser(this.data.farmerId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          this.snackBar.open(
            err.error?.message || this.t('admin.farmers.dialog.errors.impersonateFailed'),
            this.t('common.close'),
            { duration: 3000 }
          );
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((result) => {
        if (result) {
          this.snackBar.open(
            this.t('admin.farmers.dialog.success.impersonated'),
            this.t('common.close'),
            { duration: 2000 }
          );
          // Reload page to apply impersonation
          window.location.href = '/';
        }
      });
  }

  onSendResetLink(): void {
    // TODO: Implement send reset link action
    this.snackBar.open(
      this.t('admin.farmers.dialog.actions.resetLinkSent'),
      this.t('common.close'),
      { duration: 2000 }
    );
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
}
