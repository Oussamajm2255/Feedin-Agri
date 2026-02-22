import { Component, OnInit, signal, inject, DestroyRef, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ApiService } from '../../../core/services/api.service';
import { Crop, CropStatus, Farm } from '../../../core/models/farm.model';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';

/**
 * CropFormComponent
 * 
 * Business Rules:
 * - Every crop MUST belong to a farm (farm_id required)
 * - Farm selection dropdown is shown for new crops
 * - Auto-select farm if user has only one farm
 * - Show "Add farms first" message if user has no farms
 */
@Component({
  selector: 'app-crop-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TranslatePipe
  ],
  template: `
    <div class="crop-form-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>{{ isEditMode() ? 'edit' : 'add_circle' }}</mat-icon>
            {{ isEditMode() 
              ? ('crops.form.editTitle' | translate) 
              : ('crops.form.createTitle' | translate) }}
          </mat-card-title>
          <mat-card-subtitle>
            {{ isEditMode() 
              ? ('crops.form.editSubtitle' | translate) 
              : ('crops.form.createSubtitle' | translate) }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Loading State -->
          <div *ngIf="loading()" class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p>{{ 'common.loading' | translate }}</p>
          </div>

          <!-- No Farms State - Business Rule 7 -->
          <div *ngIf="!loading() && !isEditMode() && farms().length === 0" class="no-farms-state">
            <div class="empty-icon-wrapper">
              <mat-icon class="empty-icon">agriculture</mat-icon>
            </div>
            <h3>{{ 'crops.form.noFarms.title' | translate }}</h3>
            <p>{{ 'crops.form.noFarms.subtitle' | translate }}</p>
            <button mat-raised-button color="primary" routerLink="/farms/create">
              <mat-icon>add</mat-icon>
              {{ 'crops.form.noFarms.cta' | translate }}
            </button>
          </div>

          <!-- Form -->
          <form *ngIf="!loading() && (isEditMode() || farms().length > 0)" 
                [formGroup]="cropForm" (ngSubmit)="onSubmit()" class="crop-form">
            
            <!-- Farm Selection Field (Required for new crops) -->
            <mat-form-field *ngIf="!isEditMode()" appearance="outline" class="full-width">
              <mat-label>
                <mat-icon class="field-icon">business</mat-icon>
                {{ 'crops.form.fields.farm' | translate }}
              </mat-label>
              <mat-select formControlName="farm_id" required>
                <mat-option *ngFor="let farm of farms()" [value]="farm.farm_id">
                  <mat-icon class="option-icon">location_on</mat-icon>
                  {{ farm.name }}
                  <span *ngIf="farm.location" class="farm-location"> - {{ farm.location }}</span>
                </mat-option>
              </mat-select>
              <mat-hint>{{ 'crops.form.hints.farm' | translate }}</mat-hint>
              <mat-error *ngIf="cropForm.get('farm_id')?.hasError('required')">
                {{ 'crops.form.errors.farmRequired' | translate }}
              </mat-error>
            </mat-form-field>

            <!-- Farm Display (Read-only for edit mode) -->
            <div *ngIf="isEditMode() && currentFarm()" class="farm-display">
              <mat-icon>business</mat-icon>
              <span class="farm-label">{{ 'crops.form.fields.farm' | translate }}:</span>
              <span class="farm-name">{{ currentFarm()?.name }}</span>
            </div>

            <!-- Name Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'crops.form.fields.name' | translate }}</mat-label>
              <input matInput formControlName="name" [placeholder]="'crops.form.placeholders.name' | translate">
              <mat-error *ngIf="cropForm.get('name')?.hasError('required')">
                {{ 'crops.form.errors.nameRequired' | translate }}
              </mat-error>
              <mat-error *ngIf="cropForm.get('name')?.hasError('maxlength')">
                {{ 'crops.form.errors.nameMaxLength' | translate }}
              </mat-error>
            </mat-form-field>

            <!-- Variety Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'crops.form.fields.variety' | translate }}</mat-label>
              <input matInput formControlName="variety" [placeholder]="'crops.form.placeholders.variety' | translate">
            </mat-form-field>

            <!-- Description Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'crops.form.fields.description' | translate }}</mat-label>
              <textarea matInput formControlName="description" rows="3" 
                [placeholder]="'crops.form.placeholders.description' | translate"></textarea>
            </mat-form-field>

            <!-- Date Fields Row -->
            <div class="date-row">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'crops.form.fields.plantingDate' | translate }}</mat-label>
                <input matInput [matDatepicker]="plantingPicker" formControlName="planting_date">
                <mat-datepicker-toggle matIconSuffix [for]="plantingPicker"></mat-datepicker-toggle>
                <mat-datepicker #plantingPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>{{ 'crops.form.fields.expectedHarvest' | translate }}</mat-label>
                <input matInput [matDatepicker]="harvestPicker" formControlName="expected_harvest_date">
                <mat-datepicker-toggle matIconSuffix [for]="harvestPicker"></mat-datepicker-toggle>
                <mat-datepicker #harvestPicker></mat-datepicker>
              </mat-form-field>
            </div>

            <!-- Status Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'crops.form.fields.status' | translate }}</mat-label>
              <mat-select formControlName="status">
                <mat-option *ngFor="let status of statusOptions" [value]="status.value">
                  {{ status.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Notes Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'crops.form.fields.notes' | translate }}</mat-label>
              <textarea matInput formControlName="notes" rows="4"
                [placeholder]="'crops.form.placeholders.notes' | translate"></textarea>
            </mat-form-field>

            <!-- Action Buttons -->
            <div class="form-actions">
              <button mat-stroked-button type="button" (click)="onCancel()" [disabled]="saving()">
                <mat-icon>close</mat-icon>
                {{ 'common.cancel' | translate }}
              </button>
              <button mat-raised-button color="primary" type="submit" 
                [disabled]="cropForm.invalid || saving()">
                <mat-spinner *ngIf="saving()" diameter="20" class="button-spinner"></mat-spinner>
                <mat-icon *ngIf="!saving()">{{ isEditMode() ? 'save' : 'add' }}</mat-icon>
                {{ isEditMode() 
                  ? ('crops.form.actions.save' | translate) 
                  : ('crops.form.actions.create' | translate) }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .crop-form-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .form-card {
      background: var(--card-bg, #ffffff);
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

      mat-card-header {
        margin-bottom: 1.5rem;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 600;

          mat-icon {
            color: var(--primary-green, #10b981);
          }
        }

        mat-card-subtitle {
          color: var(--text-secondary, #6b7280);
        }
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: var(--text-secondary, #6b7280);
    }

    .no-farms-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      text-align: center;

      .empty-icon-wrapper {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--primary-green, #10b981);
      }

      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary, #1f2937);
      }

      p {
        margin: 0;
        color: var(--text-secondary, #6b7280);
        max-width: 400px;
      }

      button {
        margin-top: 1rem;
      }
    }

    .crop-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .full-width {
      width: 100%;
    }

    .field-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 0.25rem;
      vertical-align: middle;
    }

    .option-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 0.5rem;
      color: var(--primary-green, #10b981);
    }

    .farm-location {
      color: var(--text-secondary, #6b7280);
      font-size: 0.875rem;
    }

    .farm-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--light-bg, #f9fafb);
      border-radius: 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      margin-bottom: 0.5rem;

      mat-icon {
        color: var(--primary-green, #10b981);
      }

      .farm-label {
        color: var(--text-secondary, #6b7280);
        font-size: 0.875rem;
      }

      .farm-name {
        font-weight: 500;
        color: var(--text-primary, #1f2937);
      }
    }

    .date-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color, #e5e7eb);

      button {
        min-width: 120px;

        mat-icon {
          margin-right: 0.5rem;
        }
      }

      .button-spinner {
        display: inline-block;
        margin-right: 0.5rem;
      }
    }

    /* Dark Mode */
    :host-context(body.dark-theme) {
      .form-card {
        background: var(--card-bg, #1e293b);
        
        mat-card-title {
          color: var(--text-primary, #f1f5f9);
        }
      }

      .no-farms-state {
        h3 {
          color: var(--text-primary, #f1f5f9);
        }
      }

      .farm-display {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
      }

      .form-actions {
        border-top-color: var(--border-color, #334155);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CropFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private languageService = inject(LanguageService);

  @Input() dialogMode = false;
  @Input() editId: string | null = null;
  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<Crop>();

  // State
  isEditMode = signal(false);
  loading = signal(false);
  saving = signal(false);
  cropId = signal<string | null>(null);
  farms = signal<Farm[]>([]);
  currentFarm = signal<Farm | null>(null);

  // Status options
  statusOptions = [
    { value: CropStatus.PLANTED, label: this.languageService.translate('crops.statuses.planted') },
    { value: CropStatus.GROWING, label: this.languageService.translate('crops.statuses.growing') },
    { value: CropStatus.HARVESTED, label: this.languageService.translate('crops.statuses.harvested') },
    { value: CropStatus.FAILED, label: this.languageService.translate('crops.statuses.failed') }
  ];

  // Form - now includes farm_id
  cropForm: FormGroup = this.fb.group({
    farm_id: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    variety: ['', Validators.maxLength(100)],
    description: [''],
    planting_date: [null],
    expected_harvest_date: [null],
    status: [CropStatus.PLANTED],
    notes: ['']
  });

  ngOnInit(): void {
    // Load user's farms first
    this.loadFarms();

    if (this.dialogMode) {
      if (this.editId) {
        this.cropId.set(this.editId);
        this.isEditMode.set(true);
        this.loadCrop(this.editId);
      }
    } else {
      // Check if we're in edit mode via route
      this.route.paramMap
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(params => {
          const id = params.get('id');
          if (id) {
            this.cropId.set(id);
            this.isEditMode.set(true);
            this.loadCrop(id);
          }
        });
    }
  }

  private loadFarms(): void {
    this.apiService.getFarms()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (farms) => {
          this.farms.set(farms);
          
          // Auto-select if only one farm (Business Rule 6)
          if (farms.length === 1 && !this.isEditMode()) {
            this.cropForm.patchValue({ farm_id: farms[0].farm_id });
          }
        },
        error: (err) => {
          console.error('Error loading farms:', err);
          this.farms.set([]);
        }
      });
  }

  private loadCrop(id: string): void {
    this.loading.set(true);

    this.apiService.getCrop(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (crop) => {
          this.cropForm.patchValue({
            farm_id: crop.farm_id,
            name: crop.name,
            variety: crop.variety || '',
            description: crop.description || '',
            planting_date: crop.planting_date ? new Date(crop.planting_date) : null,
            expected_harvest_date: crop.expected_harvest_date ? new Date(crop.expected_harvest_date) : null,
            status: crop.status || CropStatus.PLANTED,
            notes: crop.notes || ''
          });

          // Set current farm for display
          if (crop.farm) {
            this.currentFarm.set(crop.farm);
          } else {
            // Load farm if not included
            this.loadFarmForCrop(crop.farm_id);
          }

          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading crop:', err);
          this.snackBar.open(
            this.languageService.translate('crops.form.errors.loadFailed'),
            this.languageService.translate('common.close'),
            { duration: 3000 }
          );
          this.loading.set(false);
          if (!this.dialogMode) {
             this.router.navigate(['/crops']);
          } else {
             this.cancel.emit();
          }
        }
      });
  }

  private loadFarmForCrop(farmId: string): void {
    const farm = this.farms().find(f => f.farm_id === farmId);
    if (farm) {
      this.currentFarm.set(farm);
    } else {
      // Load farm from API
      this.apiService.getFarm(farmId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (farm) => this.currentFarm.set(farm),
          error: () => {}
        });
    }
  }

  onSubmit(): void {
    if (this.cropForm.invalid) return;

    this.saving.set(true);
    const formData = this.prepareFormData();

    const request$ = this.isEditMode()
      ? this.apiService.updateCrop(this.cropId()!, formData)
      : this.apiService.createCrop(formData);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (crop) => {
          this.snackBar.open(
            this.isEditMode()
              ? this.languageService.translate('crops.form.success.updated')
              : this.languageService.translate('crops.form.success.created'),
            this.languageService.translate('common.ok'),
            { duration: 3000 }
          );
          this.saving.set(false);
          
          if (this.dialogMode) {
            this.save.emit(crop);
          } else {
            this.router.navigate(['/crops', crop.crop_id, 'dashboard']);
          }
        },
        error: (err) => {
          console.error('Error saving crop:', err);
          
          // Check for specific error messages
          const errorMessage = err?.error?.message || err?.message || 
            this.languageService.translate('crops.form.errors.saveFailed');
          
          this.snackBar.open(
            errorMessage,
            this.languageService.translate('common.close'),
            { duration: 5000 }
          );
          this.saving.set(false);
        }
      });
  }

  private prepareFormData(): Partial<Crop> {
    const formValue = this.cropForm.value;

    const data: Partial<Crop> = {
      name: formValue.name,
      variety: formValue.variety || undefined,
      description: formValue.description || undefined,
      planting_date: formValue.planting_date 
        ? this.formatDate(formValue.planting_date) as any
        : undefined,
      expected_harvest_date: formValue.expected_harvest_date 
        ? this.formatDate(formValue.expected_harvest_date) as any
        : undefined,
      status: formValue.status,
      notes: formValue.notes || undefined
    };

    // Include farm_id for new crops (required)
    if (!this.isEditMode()) {
      data.farm_id = formValue.farm_id;
    }

    return data;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  onCancel(): void {
    if (this.dialogMode) {
      this.cancel.emit();
    } else {
      if (this.isEditMode() && this.cropId()) {
        this.router.navigate(['/crops', this.cropId(), 'dashboard']);
      } else {
        this.router.navigate(['/crops']);
      }
    }
  }
}
