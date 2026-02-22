/**
 * Export Modal Component
 * Premium export dialog with format selection, progress indicators, and notifications
 */
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { ExportService, ExportColumn, PDFExportOptions, CSVExportOptions } from '../../services/export.service';

export type ExportFormat = 'pdf' | 'csv';

export interface ExportDialogData {
  title: string;
  sectionName: string;
  columns: ExportColumn[];
  data: any[];
  filename?: string;
  adminName?: string;
  subtitle?: string;
}

export interface ExportDialogResult {
  success: boolean;
  format?: ExportFormat;
  error?: string;
}

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRippleModule,
    TranslatePipe
  ],
  template: `
    <div class="export-modal" [class.exporting]="isExporting()">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-icon-wrapper">
          <mat-icon class="header-icon">download</mat-icon>
          <div class="icon-glow"></div>
        </div>
        <div class="header-content">
          <h2 class="modal-title">{{ 'export.modal.title' | translate }}</h2>
          <p class="modal-subtitle">{{ data.sectionName }}</p>
        </div>
        <button mat-icon-button class="close-btn" (click)="onCancel()" [disabled]="isExporting()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Content -->
      <div class="modal-content">
        <!-- Data summary -->
        <div class="data-summary glass-card">
          <div class="summary-icon">
            <mat-icon>table_chart</mat-icon>
          </div>
          <div class="summary-info">
            <span class="summary-label">{{ 'export.modal.recordsToExport' | translate }}</span>
            <span class="summary-value">{{ data.data.length }} {{ 'export.modal.records' | translate }}</span>
          </div>
        </div>

        <!-- Format selection -->
        <div class="format-selection">
          <label class="section-label">
            <mat-icon>description</mat-icon>
            {{ 'export.modal.selectFormat' | translate }}
          </label>
          
          <div class="format-options">
            <!-- PDF Option -->
            <button 
              class="format-option"
              [class.selected]="selectedFormat() === 'pdf'"
              (click)="selectFormat('pdf')"
              [disabled]="isExporting()"
              matRipple>
              <div class="format-icon-wrapper pdf-icon">
                <mat-icon>picture_as_pdf</mat-icon>
              </div>
              <div class="format-details">
                <span class="format-name">PDF</span>
                <span class="format-desc">{{ 'export.modal.pdfDescription' | translate }}</span>
              </div>
              <div class="format-check" *ngIf="selectedFormat() === 'pdf'">
                <mat-icon>check_circle</mat-icon>
              </div>
            </button>

            <!-- CSV Option -->
            <button 
              class="format-option"
              [class.selected]="selectedFormat() === 'csv'"
              (click)="selectFormat('csv')"
              [disabled]="isExporting()"
              matRipple>
              <div class="format-icon-wrapper csv-icon">
                <mat-icon>grid_on</mat-icon>
              </div>
              <div class="format-details">
                <span class="format-name">CSV</span>
                <span class="format-desc">{{ 'export.modal.csvDescription' | translate }}</span>
              </div>
              <div class="format-check" *ngIf="selectedFormat() === 'csv'">
                <mat-icon>check_circle</mat-icon>
              </div>
            </button>
          </div>
        </div>

        <!-- Export info -->
        <div class="export-info">
          <div class="info-item">
            <mat-icon>access_time</mat-icon>
            <span>{{ 'export.modal.timestamp' | translate }}: {{ currentDate }}</span>
          </div>
          <div class="info-item" *ngIf="data.adminName">
            <mat-icon>person</mat-icon>
            <span>{{ 'export.modal.generatedBy' | translate }}: {{ data.adminName }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button 
          mat-stroked-button 
          class="cancel-btn"
          (click)="onCancel()"
          [disabled]="isExporting()">
          {{ 'common.cancel' | translate }}
        </button>
        
        <button 
          mat-flat-button 
          class="export-btn"
          [class.loading]="isExporting()"
          (click)="onExport()"
          [disabled]="isExporting()">
          @if (isExporting()) {
            <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
            <span>{{ 'export.modal.exporting' | translate }}</span>
          } @else {
            <mat-icon>download</mat-icon>
            <span>{{ 'export.modal.export' | translate }}</span>
          }
          <div class="btn-shine"></div>
        </button>
      </div>

      <!-- Progress overlay -->
      <div class="export-progress-overlay" *ngIf="isExporting()">
        <div class="progress-content">
          <mat-spinner diameter="48"></mat-spinner>
          <span class="progress-text">{{ 'export.modal.generatingFile' | translate }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .export-modal {
      position: relative;
      background: var(--card-bg, #ffffff);
      border-radius: 20px;
      overflow: hidden;
      max-width: 480px;
      width: 100%;
    }

    /* Header */
    .modal-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: linear-gradient(135deg, var(--primary-green, #10b981) 0%, var(--dark-green, #059669) 100%);
      color: white;
    }

    .header-icon-wrapper {
      position: relative;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      backdrop-filter: blur(8px);
    }

    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .icon-glow {
      position: absolute;
      inset: -4px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent);
      border-radius: 16px;
      animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }

    .header-content {
      flex: 1;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.875rem;
      opacity: 0.9;
      margin: 4px 0 0;
    }

    .close-btn {
      color: white;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }
    }

    /* Content */
    .modal-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .data-summary {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--glass-bg, rgba(16, 185, 129, 0.05));
      border: 1px solid var(--border-color, rgba(16, 185, 129, 0.15));
      border-radius: 12px;
    }

    .summary-icon {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-green, #10b981), var(--primary-blue, #3b82f6));
      border-radius: 10px;
      color: white;
    }

    .summary-info {
      display: flex;
      flex-direction: column;
    }

    .summary-label {
      font-size: 0.75rem;
      color: var(--text-secondary, #6b7280);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #1f2937);
    }

    /* Format Selection */
    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #1f2937);
      margin-bottom: 12px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--primary-green, #10b981);
      }
    }

    .format-options {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .format-option {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--card-bg, #ffffff);
      border: 2px solid var(--border-color, #e5e7eb);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;
      width: 100%;

      &:hover:not(:disabled) {
        border-color: var(--primary-green, #10b981);
        background: var(--glass-bg, rgba(16, 185, 129, 0.03));
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.1);
      }

      &.selected {
        border-color: var(--primary-green, #10b981);
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.04));
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.15);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .format-icon-wrapper {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      color: white;

      &.pdf-icon {
        background: linear-gradient(135deg, #ef4444, #dc2626);
      }

      &.csv-icon {
        background: linear-gradient(135deg, #22c55e, #16a34a);
      }

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .format-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .format-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary, #1f2937);
    }

    .format-desc {
      font-size: 0.8125rem;
      color: var(--text-secondary, #6b7280);
    }

    .format-check {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-green, #10b981);
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        animation: check-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    }

    @keyframes check-pop {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }

    /* Export Info */
    .export-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: var(--glass-bg, rgba(0, 0, 0, 0.02));
      border-radius: 10px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8125rem;
      color: var(--text-secondary, #6b7280);

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--primary-green, #10b981);
        opacity: 0.8;
      }
    }

    /* Footer */
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      background: var(--glass-bg, rgba(0, 0, 0, 0.02));
      border-top: 1px solid var(--border-color, #e5e7eb);
    }

    .cancel-btn {
      border-radius: 10px;
      padding: 0 24px;
      height: 44px;
      font-weight: 500;
      border-color: var(--border-color, #e5e7eb);
      color: var(--text-secondary, #6b7280);
      transition: all 0.2s ease;

      &:hover {
        background: var(--glass-bg, rgba(0, 0, 0, 0.05));
        border-color: var(--border-color, #d1d5db);
      }
    }

    .export-btn {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 10px;
      padding: 0 28px;
      height: 44px;
      font-weight: 600;
      background: linear-gradient(135deg, var(--primary-green, #10b981), var(--dark-green, #059669));
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35);
      }

      &:disabled {
        opacity: 0.8;
      }

      &.loading {
        pointer-events: none;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .btn-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s ease;
    }

    .export-btn:hover .btn-shine {
      left: 100%;
    }

    .btn-spinner {
      margin-right: 4px;
      
      ::ng-deep circle {
        stroke: white !important;
      }
    }

    /* Progress Overlay */
    .export-progress-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      animation: fade-in 0.3s ease;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .progress-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;

      mat-spinner ::ng-deep circle {
        stroke: var(--primary-green, #10b981) !important;
      }
    }

    .progress-text {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #6b7280);
    }

    /* Dark theme support */
    :host-context(body.dark-theme) {
      .export-modal {
        background: var(--card-bg, #1e293b);
      }

      .modal-title,
      .summary-value,
      .format-name {
        color: var(--text-primary, #f1f5f9);
      }

      .format-option {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);

        &:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.1);
          border-color: var(--primary-green, #10b981);
        }

        &.selected {
          background: rgba(16, 185, 129, 0.15);
        }
      }

      .export-progress-overlay {
        background: rgba(30, 41, 59, 0.95);
      }
    }

    /* Responsive */
    @media screen and (max-width: 480px) {
      .modal-header {
        padding: 20px;
      }

      .modal-content {
        padding: 20px;
      }

      .modal-footer {
        padding: 16px 20px;
        flex-direction: column;
      }

      .cancel-btn,
      .export-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ExportModalComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<ExportModalComponent>);
  readonly data: ExportDialogData = inject(MAT_DIALOG_DATA);
  private readonly exportService = inject(ExportService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly languageService = inject(LanguageService);
  
  // State signals
  selectedFormat = signal<ExportFormat>('pdf');
  isExporting = signal(false);
  
  // Computed values
  get currentDate(): string {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  ngOnInit(): void {
    // Default format selection
    this.selectedFormat.set('pdf');
  }
  
  selectFormat(format: ExportFormat): void {
    this.selectedFormat.set(format);
  }
  
  async onExport(): Promise<void> {
    this.isExporting.set(true);
    
    try {
      const format = this.selectedFormat();
      const filename = this.data.filename || this.data.sectionName.toLowerCase().replace(/\s+/g, '_');
      
      if (format === 'pdf') {
        const pdfOptions: PDFExportOptions = {
          title: this.data.title,
          subtitle: this.data.subtitle,
          filename,
          columns: this.data.columns,
          data: this.data.data,
          adminName: this.data.adminName,
          sectionName: this.data.sectionName,
          orientation: 'portrait',
          showPageNumbers: true,
          showFooter: true,
          includeTimestamp: true
        };
        
        await this.exportService.exportToPDF(pdfOptions);
      } else {
        const csvOptions: CSVExportOptions = {
          title: this.data.title,
          filename,
          columns: this.data.columns,
          data: this.data.data,
          adminName: this.data.adminName,
          sectionName: this.data.sectionName,
          delimiter: ',',
          includeMetadata: true,
          includeTimestamp: true
        };
        
        this.exportService.exportToCSV(csvOptions);
      }
      
      // Show success notification
      this.showSuccessNotification(format);
      
      // Close dialog with success
      this.dialogRef.close({
        success: true,
        format
      } as ExportDialogResult);
      
    } catch (error) {
      console.error('Export failed:', error);
      this.showErrorNotification(error);
      this.isExporting.set(false);
    }
  }
  
  onCancel(): void {
    this.dialogRef.close({ success: false } as ExportDialogResult);
  }
  
  private showSuccessNotification(format: ExportFormat): void {
    const formatLabel = format.toUpperCase();
    const message = `${formatLabel} file downloaded successfully!`;
    
    this.snackBar.open(message, '✓', {
      duration: 4000,
      panelClass: ['glass-snackbar', 'success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }
  
  private showErrorNotification(error: unknown): void {
    const message = 'Export failed. Please try again.';
    
    this.snackBar.open(message, '✕', {
      duration: 5000,
      panelClass: ['glass-snackbar', 'error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }
}
