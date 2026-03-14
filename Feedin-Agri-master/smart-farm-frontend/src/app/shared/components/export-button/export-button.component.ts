/**
 * Export Button Component
 * Reusable button component that opens the export modal
 * Can be placed in any admin page header
 */
import { Component, Input, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatRippleModule } from '@angular/material/core';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { ExportModalComponent, ExportDialogData, ExportDialogResult } from '../export-modal/export-modal.component';
import { ExportColumn } from '../../services/export.service';

@Component({
  selector: 'app-export-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatRippleModule,
    TranslatePipe
  ],
  template: `
    <button 
      mat-flat-button 
      class="export-button"
      [class.compact]="compact"
      [class.disabled]="disabled || loading()"
      [disabled]="disabled || loading() || dataCount === 0"
      [matTooltip]="dataCount === 0 ? ('export.button.noData' | translate) : ('export.button.tooltip' | translate)"
      (click)="openExportModal($event)"
      matRipple>
      @if (loading()) {
        <div class="loading-spinner"></div>
      } @else {
        <mat-icon>download</mat-icon>
      }
      @if (!compact) {
        <span class="button-text">{{ 'export.button.label' | translate }}</span>
      }
      <div class="btn-shine"></div>
    </button>
  `,
  styles: [`
    :host {
      display: inline-flex;
    }

    .export-button {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 20px;
      height: 42px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.875rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.08));
      color: var(--primary-green, #10b981);
      border: 1px solid rgba(16, 185, 129, 0.25);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, var(--primary-green, #10b981), var(--dark-green, #059669));
        color: white;
        border-color: transparent;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--glass-bg, rgba(0, 0, 0, 0.05));
        color: var(--text-secondary, #9ca3af);
        border-color: var(--border-color, #e5e7eb);
      }

      &.compact {
        padding: 0;
        width: 42px;
        min-width: 42px;
        justify-content: center;
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        transition: transform 0.2s ease;
      }

      &:hover:not(:disabled) mat-icon {
        transform: translateY(-1px);
      }
    }

    .button-text {
      white-space: nowrap;
    }

    .btn-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s ease;
      pointer-events: none;
    }

    .export-button:hover:not(:disabled) .btn-shine {
      left: 100%;
    }

    .loading-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(16, 185, 129, 0.2);
      border-top-color: var(--primary-green, #10b981);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Dark theme support */
    :host-context(body.dark-theme) {
      .export-button {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.12));
        border-color: rgba(16, 185, 129, 0.35);

        &:hover:not(:disabled) {
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4);
        }

        &:disabled {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary, #64748b);
          border-color: var(--border-color, #334155);
        }
      }
    }

    /* Responsive */
    @media screen and (max-width: 768px) {
      .export-button:not(.compact) {
        padding: 0 16px;
        height: 40px;
        font-size: 0.8125rem;
      }
    }

    @media screen and (max-width: 480px) {
      .export-button:not(.compact) {
        padding: 0;
        width: 40px;
        min-width: 40px;
        justify-content: center;

        .button-text {
          display: none;
        }
      }
    }
  `]
})
export class ExportButtonComponent {
  @Input() title = 'Data Export';
  @Input() sectionName = 'Data';
  @Input() subtitle?: string;
  @Input() filename?: string;
  @Input() adminName?: string;
  @Input() columns: ExportColumn[] = [];
  @Input() data: any[] = [];
  @Input() disabled = false;
  @Input() compact = false;
  
  @Output() exportComplete = new EventEmitter<ExportDialogResult>();
  @Output() exportError = new EventEmitter<any>();
  
  private readonly dialog = inject(MatDialog);
  
  loading = signal(false);
  
  get dataCount(): number {
    return this.data?.length || 0;
  }
  
  openExportModal(event: Event): void {
    event.stopPropagation();
    
    if (this.disabled || this.loading() || this.dataCount === 0) {
      return;
    }
    
    this.loading.set(true);
    
    const dialogData: ExportDialogData = {
      title: this.title,
      sectionName: this.sectionName,
      subtitle: this.subtitle,
      filename: this.filename,
      adminName: this.adminName,
      columns: this.columns,
      data: this.data
    };
    
    const dialogRef = this.dialog.open(ExportModalComponent, {
      data: dialogData,
      panelClass: 'export-modal-dialog',
      maxWidth: '500px',
      width: '95vw',
      disableClose: false,
      autoFocus: false
    });
    
    this.loading.set(false);
    
    dialogRef.afterClosed().subscribe((result: ExportDialogResult) => {
      if (result) {
        if (result.success) {
          this.exportComplete.emit(result);
        } else if (result.error) {
          this.exportError.emit(result.error);
        }
      }
    });
  }
}

