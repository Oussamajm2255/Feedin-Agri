import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, switchMap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { AdminApiService } from '../../../../../../admin/core/services/admin-api.service';
import { LanguageService } from '../../../../../../core/services/language.service';

export interface AssignFarmDialogData {
  farmerId: string;
  farmerName: string;
}

@Component({
  selector: 'app-assign-farm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="assign-farm-container">
      <h2 mat-dialog-title>
        Assign Farm to {{ data.farmerName }}
      </h2>

      <div mat-dialog-content>
        <p class="dialog-subtitle">
          Search for a farm by name, ID, location, city, or region to assign it to this farmer.
        </p>

        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search Farms</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [formControl]="searchControl" placeholder="Type to search...">
          <mat-spinner *ngIf="isLoading()" [diameter]="20" matSuffix></mat-spinner>
        </mat-form-field>

        <div class="results-list" *ngIf="farms().length > 0; else noResults">
          <mat-action-list>
            <button mat-list-item *ngFor="let farm of farms()" (click)="selectFarm(farm)">
              <mat-icon matListItemIcon>agriculture</mat-icon>
              <div matListItemTitle>{{ farm.farm_name }}</div>
              <div matListItemLine>
                <span class="detail-item" *ngIf="farm.location">
                  <mat-icon inline>place</mat-icon> {{ farm.location }} ({{ farm.city || 'Unknown City' }})
                </span>
                <span class="detail-item status-badge" [class]="farm.status">
                  {{ farm.status }}
                </span>
              </div>
              <div matListItemLine>ID: {{ farm.farm_id }}</div>
            </button>
          </mat-action-list>
        </div>

        <ng-template #noResults>
          <div class="no-results" *ngIf="!isLoading() && hasSearched()">
            <mat-icon>search_off</mat-icon>
            <p>No farms found matching your search.</p>
          </div>
          <div class="initial-state" *ngIf="!isLoading() && !hasSearched()">
            <mat-icon>touch_app</mat-icon>
            <p>Start typing to search for a farm.</p>
          </div>
        </ng-template>
      </div>

      <div mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .assign-farm-container {
      min-width: 500px;
      padding-bottom: 1rem;
    }
    .dialog-subtitle {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }
    .search-field {
      width: 100%;
      margin-bottom: 1rem;
    }
    .results-list {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .detail-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-right: 12px;
      font-size: 0.85rem;
      color: #6b7280;
      
      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }
    .status-badge {
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      
      &.active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      &.inactive { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
    }
    .no-results, .initial-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #9ca3af;
      gap: 1rem;
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.5;
      }
      p { margin: 0; }
    }
  `]
})
export class AssignFarmDialogComponent implements OnInit {
  searchControl = new FormControl('');
  isLoading = signal(false);
  hasSearched = signal(false);
  farms = signal<any[]>([]);

  private adminApiService = inject(AdminApiService);
  private snackBar = inject(MatSnackBar);

  constructor(
    public dialogRef: MatDialogRef<AssignFarmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignFarmDialogData
  ) {}

  ngOnInit() {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (!term || term.length < 2) {
          this.farms.set([]);
          this.hasSearched.set(false);
          return of(null);
        }
        this.isLoading.set(true);
        this.hasSearched.set(true);
        return this.adminApiService.getFarms({ search: term, limit: 10 }).pipe(
          catchError(err => {
            console.error(err);
            this.isLoading.set(false);
            return of({ items: [] });
          }),
          finalize(() => this.isLoading.set(false))
        );
      })
    ).subscribe((result: any) => {
      this.isLoading.set(false);
      if (result && result.items) {
        this.farms.set(result.items);
      }
    });
  }

  selectFarm(farm: any) {
    if (!confirm(`Are you sure you want to assign farm "${farm.farm_name}" to ${this.data.farmerName}?`)) {
      return;
    }

    this.isLoading.set(true);
    this.adminApiService.assignFarmToFarmer(this.data.farmerId, farm.farm_id).subscribe({
      next: () => {
        this.snackBar.open('Farm assigned successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to assign farm', 'Close', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }
}
