import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel } from '@angular/cdk/collections';
import { Crop } from '../../../core/models/farm.model';
import { CropService } from '../../../core/services/crop.service';
import { CropFormDialogComponent } from './crop-form-dialog.component';

@Component({
  selector: 'app-crop-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-wrapper">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>agriculture</mat-icon>
          </div>
          <div class="header-text">
            <h2>Manage Crops</h2>
            <p>{{ crops().length }} crops in your farm</p>
          </div>
        </div>
        <div class="header-actions">
          <button mat-flat-button color="primary" class="add-btn" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Add New
          </button>
          <button mat-icon-button class="close-btn" (click)="close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Bulk Actions Toolbar -->
      <div class="bulk-toolbar" *ngIf="selection.hasValue()">
        <div class="selection-info">
          <mat-icon>check_circle</mat-icon>
          <span>{{ selection.selected.length }} crop(s) selected</span>
        </div>
        <div class="bulk-actions">
          <button mat-flat-button color="warn" (click)="deleteSelected()" [disabled]="isDeleting()">
            <mat-icon>delete</mat-icon>
            Delete Selected
          </button>
          <button mat-stroked-button (click)="selection.clear()">
            Clear Selection
          </button>
        </div>
      </div>

      <!-- Body with Scroll -->
      <div class="dialog-body">
        <div class="table-container" *ngIf="crops().length > 0">
          <table mat-table [dataSource]="crops()" class="crop-table">
            
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef class="checkbox-cell">
                <mat-checkbox (change)="$event ? toggleAllRows() : null"
                              [checked]="selection.hasValue() && isAllSelected()"
                              [indeterminate]="selection.hasValue() && !isAllSelected()"
                              color="primary">
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let row" class="checkbox-cell">
                <mat-checkbox (click)="$event.stopPropagation()"
                              (change)="$event ? selection.toggle(row) : null"
                              [checked]="selection.isSelected(row)"
                              color="primary">
                </mat-checkbox>
              </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Crop Name</th>
              <td mat-cell *matCellDef="let crop">
                <div class="crop-info">
                  <div class="crop-avatar" [class]="'status-' + crop.status">
                    <mat-icon>eco</mat-icon>
                  </div>
                  <div class="crop-details">
                    <span class="crop-name">{{ crop.name }}</span>
                    <span class="crop-variety" *ngIf="crop.variety">{{ crop.variety }}</span>
                  </div>
                </div>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let crop">
                <div class="status-badge" [class]="'status-' + crop.status">
                  <span class="status-dot"></span>
                  {{ crop.status | titlecase }}
                </div>
              </td>
            </ng-container>

            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Planted</th>
              <td mat-cell *matCellDef="let crop">
                <span class="date-text" *ngIf="crop.planting_date">
                  {{ crop.planting_date | date:'MMM d, yyyy' }}
                </span>
                <span class="date-text empty" *ngIf="!crop.planting_date">—</span>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="actions-cell">Actions</th>
              <td mat-cell *matCellDef="let crop" class="actions-cell">
                <button mat-icon-button matTooltip="Edit" (click)="editCrop(crop); $event.stopPropagation()">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="Delete" 
                        (click)="deleteCrop(crop); $event.stopPropagation()">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                [class.selected]="selection.isSelected(row)"
                (click)="selection.toggle(row)">
            </tr>
          </table>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="crops().length === 0">
          <div class="empty-icon">
            <mat-icon>eco</mat-icon>
          </div>
          <h3>No crops yet</h3>
          <p>Start by adding your first crop</p>
          <button mat-flat-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Add First Crop
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <span class="footer-text">{{ crops().length }} total crops</span>
        <button mat-stroked-button (click)="close()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-wrapper {
      display: flex;
      flex-direction: column;
      width: 900px;
      max-width: 95vw;
      max-height: 85vh;
      background: var(--card-bg, #ffffff);
      border-radius: 24px;
      overflow: hidden;
    }

    /* === HEADER === */
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%);
      border-bottom: 1px solid rgba(16, 185, 129, 0.1);
      flex-shrink: 0;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 14px;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);

      mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
        color: white;
      }
    }

    .header-text {
      h2 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--text-primary, #1f2937);
      }

      p {
        margin: 0.25rem 0 0;
        font-size: 0.9rem;
        color: var(--text-secondary, #6b7280);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .add-btn {
      border-radius: 12px;
      padding: 0 1.25rem;
      height: 42px;
      font-weight: 600;
      
      mat-icon {
        margin-right: 6px;
      }
    }

    .close-btn {
      color: var(--text-secondary, #6b7280);
      
      &:hover {
        color: var(--text-primary, #1f2937);
        background: rgba(0, 0, 0, 0.05);
      }
    }

    /* === BULK TOOLBAR === */
    .bulk-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 2rem;
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%);
      border-bottom: 1px solid rgba(239, 68, 68, 0.1);
      flex-shrink: 0;
    }

    .selection-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #dc2626;
      font-weight: 600;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .bulk-actions {
      display: flex;
      gap: 0.75rem;

      button {
        border-radius: 10px;
        font-weight: 500;
      }
    }

    /* === BODY === */
    .dialog-body {
      flex: 1;
      overflow-y: auto;
      min-height: 300px;

      /* Custom Scrollbar */
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(16, 185, 129, 0.2);
        border-radius: 4px;

        &:hover {
          background: rgba(16, 185, 129, 0.4);
        }
      }
    }

    .table-container {
      width: 100%;
    }

    /* === TABLE === */
    .crop-table {
      width: 100%;

      th.mat-mdc-header-cell {
        background: var(--light-bg, #f9fafb);
        color: var(--text-secondary, #6b7280);
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
      }

      td.mat-mdc-cell {
        padding: 1rem 1.25rem;
        border-bottom: 1px solid var(--border-color, #f3f4f6);
        vertical-align: middle;
      }

      tr.mat-mdc-row {
        transition: all 0.2s ease;
        cursor: pointer;

        &:hover {
          background: rgba(16, 185, 129, 0.04);
        }

        &.selected {
          background: rgba(16, 185, 129, 0.08);
        }
      }
    }

    .checkbox-cell {
      width: 48px;
      padding-left: 1.5rem !important;
    }

    .actions-cell {
      width: 100px;
      text-align: right;
      padding-right: 1.5rem !important;
    }

    /* Crop Info */
    .crop-info {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }

    .crop-avatar {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: rgba(16, 185, 129, 0.1);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #10b981;
      }

      &.status-planted { background: rgba(59, 130, 246, 0.1); mat-icon { color: #3b82f6; } }
      &.status-growing { background: rgba(16, 185, 129, 0.1); mat-icon { color: #10b981; } }
      &.status-harvested { background: rgba(245, 158, 11, 0.1); mat-icon { color: #f59e0b; } }
      &.status-failed { background: rgba(239, 68, 68, 0.1); mat-icon { color: #ef4444; } }
    }

    .crop-details {
      display: flex;
      flex-direction: column;

      .crop-name {
        font-weight: 600;
        color: var(--text-primary, #1f2937);
      }

      .crop-variety {
        font-size: 0.85rem;
        color: var(--text-secondary, #6b7280);
      }
    }

    /* Status Badge */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      &.status-planted { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.status-growing { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      &.status-harvested { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
      &.status-failed { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    }

    .date-text {
      color: var(--text-primary, #1f2937);
      font-size: 0.9rem;

      &.empty {
        color: var(--text-secondary, #9ca3af);
      }
    }

    /* === EMPTY STATE === */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;

      .empty-icon {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
        border-radius: 50%;
        margin-bottom: 1.5rem;

        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          color: #10b981;
        }
      }

      h3 {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary, #1f2937);
      }

      p {
        margin: 0 0 1.5rem;
        color: var(--text-secondary, #6b7280);
      }

      button {
        border-radius: 12px;
        padding: 0.75rem 1.5rem;

        mat-icon {
          margin-right: 6px;
        }
      }
    }

    /* === FOOTER === */
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      background: var(--light-bg, #f9fafb);
      border-top: 1px solid var(--border-color, #e5e7eb);
      flex-shrink: 0;

      .footer-text {
        font-size: 0.875rem;
        color: var(--text-secondary, #6b7280);
      }

      button {
        border-radius: 10px;
      }
    }

    /* === DARK MODE === */
    :host-context(body.dark-theme) {
      .dialog-wrapper {
        background: var(--card-bg, #1e293b);
      }

      .dialog-header {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%);
        border-bottom-color: rgba(16, 185, 129, 0.15);
      }

      .header-text h2 {
        color: var(--text-primary, #f1f5f9);
      }

      .close-btn:hover {
        color: var(--text-primary, #f1f5f9);
        background: rgba(255, 255, 255, 0.1);
      }

      .crop-table {
        th.mat-mdc-header-cell {
          background: rgba(30, 41, 59, 0.8);
          color: var(--text-secondary, #94a3b8);
          border-bottom-color: var(--border-color, #334155);
        }

        td.mat-mdc-cell {
          border-bottom-color: var(--border-color, #334155);
        }

        tr.mat-mdc-row:hover {
          background: rgba(16, 185, 129, 0.08);
        }
      }

      .crop-details .crop-name {
        color: var(--text-primary, #f1f5f9);
      }

      .date-text {
        color: var(--text-primary, #f1f5f9);
      }

      .empty-state {
        h3 {
          color: var(--text-primary, #f1f5f9);
        }
      }

      .dialog-footer {
        background: rgba(15, 23, 42, 0.6);
        border-top-color: var(--border-color, #334155);
      }
    }

    /* === RESPONSIVE === */
    @media (max-width: 768px) {
      .dialog-wrapper {
        width: 100%;
        max-height: 100vh;
        border-radius: 0;
      }

      .dialog-header {
        padding: 1rem 1.25rem;
        flex-wrap: wrap;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .bulk-toolbar {
        padding: 0.75rem 1.25rem;
        flex-direction: column;
        gap: 0.75rem;
      }

      .bulk-actions {
        width: 100%;
      }

      .crop-table {
        th.mat-mdc-header-cell,
        td.mat-mdc-cell {
          padding: 0.75rem 1rem;
        }
      }

      .checkbox-cell {
        padding-left: 1rem !important;
      }

      .actions-cell {
        padding-right: 1rem !important;
      }

      .dialog-footer {
        padding: 1rem 1.25rem;
      }
    }
  `]
})
export class CropListDialogComponent implements OnInit {
  private cropService = inject(CropService);
  private dialog = inject(MatDialog);
  
  displayedColumns: string[] = ['select', 'name', 'status', 'date', 'actions'];
  selection = new SelectionModel<Crop>(true, []);
  crops = signal<Crop[]>([]);
  isDeleting = signal(false);

  constructor(
    private dialogRef: MatDialogRef<CropListDialogComponent>
  ) {}

  ngOnInit() {
    this.crops.set(this.cropService.crops());
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.crops().length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.crops());
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CropFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog',
      backdropClass: 'cdk-overlay-dark-backdrop',
      data: { editId: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cropService.loadCrops().subscribe(() => {
          this.crops.set(this.cropService.crops());
        });
      }
    });
  }

  editCrop(crop: Crop) {
    const dialogRef = this.dialog.open(CropFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog',
      backdropClass: 'cdk-overlay-dark-backdrop',
      data: { editId: crop.crop_id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cropService.loadCrops().subscribe(() => {
          this.crops.set(this.cropService.crops());
        });
      }
    });
  }

  deleteCrop(crop: Crop) {
    if (confirm(`Are you sure you want to delete "${crop.name}"?`)) {
      this.isDeleting.set(true);
      this.cropService.deleteCrop(crop.crop_id!).subscribe({
        next: () => {
          this.crops.set(this.cropService.crops());
          this.isDeleting.set(false);
        },
        error: () => {
          this.isDeleting.set(false);
        }
      });
    }
  }

  deleteSelected() {
    if (this.selection.isEmpty()) return;

    const count = this.selection.selected.length;
    if (confirm(`Are you sure you want to delete ${count} crop(s)?`)) {
      this.isDeleting.set(true);
      const ids = this.selection.selected.map(c => c.crop_id!);
      this.cropService.deleteCrops(ids).subscribe({
        next: () => {
          this.crops.set(this.cropService.crops());
          this.selection.clear();
          this.isDeleting.set(false);
        },
        error: () => {
          this.isDeleting.set(false);
        }
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
}
