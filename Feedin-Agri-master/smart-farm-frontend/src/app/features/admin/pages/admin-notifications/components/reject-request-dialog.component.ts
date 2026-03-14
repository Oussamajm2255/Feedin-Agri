import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface RejectDialogData {
  userName: string;
}

@Component({
  selector: 'app-reject-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>Reject Access Request</h2>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div mat-dialog-content class="dialog-content">
        <div class="warning-banner">
          <mat-icon class="warning-icon">warning</mat-icon>
          <div class="warning-text">
            You are about to reject the access request for <strong>{{data.userName}}</strong>.
          </div>
        </div>
        
        <p class="instruction">Please provide a reason for this rejection. The user may be notified.</p>
        
        <mat-form-field appearance="outline" class="full-width mt-3">
          <mat-label>Rejection Reason</mat-label>
          <textarea matInput 
                    [(ngModel)]="reason" 
                    placeholder="e.g. Incomplete information, role mismatch..."
                    rows="4" 
                    cdkTextareaAutosize
                    cdkAutosizeMinRows="4"
                    cdkAutosizeMaxRows="8"
                    required></textarea>
          <mat-error *ngIf="!reason.trim()">Reason is required</mat-error>
          <mat-hint align="end">{{reason.length}} / 500</mat-hint>
        </mat-form-field>
      </div>

      <div mat-dialog-actions align="end" class="dialog-actions">
        <button mat-stroked-button mat-dialog-close color="primary">Cancel</button>
        <button mat-flat-button 
                color="warn" 
                [disabled]="!reason.trim()"
                [mat-dialog-close]="reason">
          <mat-icon>block</mat-icon> Reject Request
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      position: relative;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-right: 8px;

      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary, #ffffff);
      }

      .close-btn {
        color: var(--text-secondary, #9ca3af);
        &:hover {
          color: var(--text-primary, #ffffff);
          background: rgba(255, 255, 255, 0.05);
        }
      }
    }

    .dialog-content {
      padding-top: 16px !important;
      overflow-x: hidden;
    }

    .warning-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(245, 158, 11, 0.1);
      border-left: 4px solid var(--warning-color, #f59e0b);
      border-radius: 4px;
      margin-bottom: 20px;

      .warning-icon {
        color: var(--warning-color, #f59e0b);
      }

      .warning-text {
        font-size: 0.95rem;
        color: var(--text-primary, #ffffff);
        line-height: 1.5;
        
        strong {
          color: var(--warning-color, #f59e0b);
        }
      }
    }

    .instruction {
      color: var(--text-secondary, #9ca3af);
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    .full-width {
      width: 100%;
    }

    .mt-3 {
      margin-top: 16px;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
      
      button {
        border-radius: 8px;
        padding: 0 20px;
        height: 40px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          margin-right: -4px;
          transform: scale(0.9);
        }
      }
    }
  `]
})
export class RejectRequestDialogComponent {
  reason: string = '';

  constructor(
    public dialogRef: MatDialogRef<RejectRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RejectDialogData
  ) {}
}
