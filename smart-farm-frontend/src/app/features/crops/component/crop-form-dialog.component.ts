import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CropFormComponent } from '../crop-form/crop-form.component';

@Component({
  selector: 'app-crop-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CropFormComponent,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-wrapper">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>{{ data.editId ? 'edit' : 'add_circle' }}</mat-icon>
          </div>
          <div class="header-text">
            <h2>{{ data.editId ? 'Edit Crop' : 'Create New Crop' }}</h2>
            <p>{{ data.editId ? 'Update crop details below' : 'Fill in the details to add a new crop' }}</p>
          </div>
        </div>
        <button mat-icon-button class="close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Body with Scroll -->
      <div class="dialog-body">
        <app-crop-form 
          [dialogMode]="true" 
          [editId]="data.editId || null"
          (cancel)="close()" 
          (save)="saved($event)">
        </app-crop-form>
      </div>
    </div>
  `,
  styles: [`
    .dialog-wrapper {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      min-width: 600px;
      max-width: 800px;
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
        letter-spacing: -0.02em;
      }

      p {
        margin: 0.25rem 0 0;
        font-size: 0.9rem;
        color: var(--text-secondary, #6b7280);
      }
    }

    .close-btn {
      color: var(--text-secondary, #6b7280);
      transition: all 0.2s ease;

      &:hover {
        color: var(--text-primary, #1f2937);
        background: rgba(0, 0, 0, 0.05);
      }
    }

    /* === BODY === */
    .dialog-body {
      flex: 1;
      overflow-y: auto;
      padding: 0;

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

    /* Override form container padding */
    :host ::ng-deep .crop-form-container {
      padding: 1.5rem 2rem 2rem;
      max-width: 100%;
    }

    :host ::ng-deep .form-card {
      box-shadow: none;
      border-radius: 0;
      background: transparent;
    }

    :host ::ng-deep .form-card mat-card-header {
      display: none;
    }

    :host ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }

    :host ::ng-deep .date-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    :host ::ng-deep .form-actions {
      padding-top: 1.5rem;
      margin-top: 1.5rem;
      border-top: 1px solid var(--border-color, #e5e7eb);

      button {
        border-radius: 12px;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
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

      .header-text {
        h2 {
          color: var(--text-primary, #f1f5f9);
        }

        p {
          color: var(--text-secondary, #94a3b8);
        }
      }

      .close-btn:hover {
        color: var(--text-primary, #f1f5f9);
        background: rgba(255, 255, 255, 0.1);
      }

      .dialog-body::-webkit-scrollbar-thumb {
        background: rgba(16, 185, 129, 0.3);
      }
    }

    /* === RESPONSIVE === */
    @media (max-width: 768px) {
      .dialog-wrapper {
        min-width: 100%;
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
      }

      .dialog-header {
        padding: 1rem 1.5rem;
      }

      .header-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .header-text h2 {
        font-size: 1.2rem;
      }

      :host ::ng-deep .crop-form-container {
        padding: 1rem 1.5rem 1.5rem;
      }

      :host ::ng-deep .date-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CropFormDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { editId?: string },
    private dialogRef: MatDialogRef<CropFormDialogComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  saved(result: any): void {
    this.dialogRef.close(result);
  }
}
