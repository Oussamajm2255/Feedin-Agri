import { Component, OnInit, input, output, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

import { AiRecommendationService, SmartRecommendation, RecommendationPriority } from '../../../core/services/ai-recommendation.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';

/**
 * 🤖 Smart Recommendations Component
 * 
 * Displays AI-generated actionable recommendations for farmers.
 * Key Features:
 * - Priority-based card layout (critical first)
 * - One-tap action buttons
 * - Swipeable on mobile
 * - Visual urgency indicators
 * - Expandable details
 */
@Component({
  selector: 'app-crop-smart-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule,
    TranslatePipe
  ],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-20px)' }),
          stagger(100, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ]),
    trigger('pulseAnimation', [
      transition('* => critical', [
        animate('600ms ease-in-out', style({ transform: 'scale(1.02)' })),
        animate('600ms ease-in-out', style({ transform: 'scale(1)' }))
      ])
    ])
  ],
  template: `
    <div class="smart-recommendations" [class.has-critical]="hasCritical()">
      <!-- Header -->
      <div class="recommendations-header">
        <div class="header-left">
          <mat-icon class="header-icon" [class.critical]="hasCritical()">
            {{ hasCritical() ? 'priority_high' : 'lightbulb' }}
          </mat-icon>
          <div class="header-text">
            <h3>{{ 'ai.recommendations.title' | translate }}</h3>
            <span class="subtitle" *ngIf="recommendationCount() > 0">
              {{ 'ai.recommendations.subtitle' | translate:{ count: recommendationCount() } }}
            </span>
          </div>
        </div>
        
        <div class="header-actions">
          <button 
            mat-icon-button 
            (click)="refresh()"
            [disabled]="loading()"
            [matTooltip]="'common.refresh' | translate">
            <mat-icon [class.spinning]="loading()">refresh</mat-icon>
          </button>
          <mat-chip *ngIf="criticalCount() > 0" class="critical-badge">
            <mat-icon>warning</mat-icon>
            {{ criticalCount() }}
          </mat-chip>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <mat-spinner diameter="32"></mat-spinner>
        <span>{{ 'ai.recommendations.analyzing' | translate }}</span>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && recommendationCount() === 0" class="empty-state">
        <mat-icon class="empty-icon">check_circle</mat-icon>
        <h4>{{ 'ai.recommendations.empty.title' | translate }}</h4>
        <p>{{ 'ai.recommendations.empty.description' | translate }}</p>
      </div>

      <!-- Recommendations List -->
      <div 
        *ngIf="!loading() && recommendationCount() > 0" 
        class="recommendations-list"
        [@listAnimation]="recommendationCount()">
        
        <!-- Critical Recommendations First -->
        <div 
          *ngFor="let rec of sortedRecommendations(); trackBy: trackById"
          class="recommendation-card"
          [class]="'priority-' + rec.priority"
          [@cardAnimation]
          [@pulseAnimation]="rec.priority">
          
          <!-- Priority Indicator -->
          <div class="priority-bar" [style.background]="rec.color"></div>
          
          <!-- Card Content -->
          <div class="card-content">
            <!-- Icon & Type -->
            <div class="card-header">
              <div class="icon-wrapper" [style.background]="rec.color + '20'">
                <mat-icon [style.color]="rec.color">{{ rec.icon }}</mat-icon>
              </div>
              <div class="header-info">
                <span class="rec-title">{{ rec.title }}</span>
                <div class="rec-meta">
                  <mat-chip [class]="'priority-chip priority-' + rec.priority" size="small">
                    {{ getPriorityLabel(rec.priority) }}
                  </mat-chip>
                  <span class="rec-time">{{ getRelativeTime(rec.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <p class="rec-description">{{ rec.description }}</p>

            <!-- Reason (Why this recommendation) -->
            <div class="rec-reason" *ngIf="rec.reason">
              <mat-icon>info_outline</mat-icon>
              <span>{{ rec.reason }}</span>
            </div>

            <!-- Sensor Value Indicator -->
            <div class="value-indicator" *ngIf="rec.metadata.currentValue !== undefined">
              <div class="value-bar">
                <div class="current-value" 
                     [style.left.%]="getValuePosition(rec)"
                     [style.background]="rec.color">
                  {{ rec.metadata.currentValue }}{{ rec.metadata.unit }}
                </div>
                <div class="optimal-range" 
                     *ngIf="rec.metadata.optimalRange"
                     [style.left.%]="rec.metadata.optimalRange.min"
                     [style.width.%]="rec.metadata.optimalRange.max - rec.metadata.optimalRange.min">
                </div>
              </div>
              <div class="value-labels">
                <span>0</span>
                <span class="optimal-label">{{ 'ai.recommendations.optimalRange' | translate }}</span>
                <span>100</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="card-actions">
              <button 
                mat-button 
                class="dismiss-btn"
                (click)="onDismiss(rec)">
                <mat-icon>close</mat-icon>
                {{ 'ai.recommendations.actions.dismiss' | translate }}
              </button>
              
              <button 
                mat-raised-button 
                class="action-btn primary-action"
                [style.background]="rec.color"
                (click)="onAction(rec)"
                matRipple>
                <mat-icon>{{ getActionIcon(rec.actionType) }}</mat-icon>
                {{ rec.actionLabel }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions FAB (Mobile) -->
      <div class="fab-container" *ngIf="hasCritical() && !loading()">
        <button 
          mat-fab 
          extended
          color="warn"
          class="critical-fab"
          (click)="executeAllCritical()"
          [matTooltip]="'ai.recommendations.actions.executeAllCritical' | translate">
          <mat-icon>flash_on</mat-icon>
          {{ 'ai.recommendations.actions.fixAll' | translate }} ({{ criticalCount() }})
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* ===== SMART RECOMMENDATIONS - TERRAFLOW DESIGN ===== */
    
    .smart-recommendations {
      background: var(--card-bg, #ffffff);
      border-radius: 16px;
      border: 1px solid var(--border-color, #e5e7eb);
      padding: 1.5rem;
      transition: all 0.3s ease;

      &.has-critical {
        border-color: rgba(239, 68, 68, 0.3);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }

    /* Header */
    .recommendations-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color, #e5e7eb);

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .header-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
          color: var(--primary-green, #10b981);
          transition: all 0.3s ease;

          &.critical {
            color: #ef4444;
            animation: pulse-icon 2s infinite;
          }
        }

        h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);
        }

        .subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary, #6b7280);
        }
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .critical-badge {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          font-weight: 600;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            margin-right: 4px;
          }
        }
      }
    }

    /* Loading & Empty States */
    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--text-secondary, #6b7280);
      gap: 1rem;

      .empty-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--primary-green, #10b981);
        opacity: 0.7;
      }

      h4 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-primary, #1f2937);
      }

      p {
        margin: 0;
        text-align: center;
        max-width: 300px;
      }
    }

    /* Recommendations List */
    .recommendations-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Recommendation Card */
    .recommendation-card {
      position: relative;
      display: flex;
      background: var(--card-bg, #ffffff);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e5e7eb);
      overflow: hidden;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        transform: translateY(-2px);
      }

      &.priority-critical {
        border-color: rgba(239, 68, 68, 0.4);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), transparent);

        .priority-bar {
          animation: pulse-bar 2s infinite;
        }
      }

      &.priority-high {
        border-color: rgba(245, 158, 11, 0.4);
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), transparent);
      }

      .priority-bar {
        width: 4px;
        min-height: 100%;
        flex-shrink: 0;
      }

      .card-content {
        flex: 1;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
    }

    /* Card Header */
    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;

      .icon-wrapper {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .header-info {
        flex: 1;
        min-width: 0;

        .rec-title {
          display: block;
          font-weight: 600;
          font-size: 1rem;
          color: var(--text-primary, #1f2937);
          margin-bottom: 0.375rem;
          line-height: 1.3;
        }

        .rec-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;

          .priority-chip {
            font-size: 0.7rem;
            height: 22px;
            padding: 0 8px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;

            &.priority-critical {
              background: rgba(239, 68, 68, 0.15);
              color: #dc2626;
            }

            &.priority-high {
              background: rgba(245, 158, 11, 0.15);
              color: #d97706;
            }

            &.priority-medium {
              background: rgba(59, 130, 246, 0.15);
              color: #2563eb;
            }

            &.priority-low {
              background: rgba(16, 185, 129, 0.15);
              color: #059669;
            }
          }

          .rec-time {
            font-size: 0.75rem;
            color: var(--text-secondary, #6b7280);
          }
        }
      }
    }

    /* Description */
    .rec-description {
      margin: 0;
      font-size: 0.9rem;
      color: var(--text-secondary, #6b7280);
      line-height: 1.5;
    }

    /* Reason Box */
    .rec-reason {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(16, 185, 129, 0.08);
      border-radius: 8px;
      font-size: 0.85rem;
      color: var(--text-primary, #1f2937);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--primary-green, #10b981);
        flex-shrink: 0;
        margin-top: 2px;
      }

      span {
        line-height: 1.4;
      }
    }

    /* Value Indicator */
    .value-indicator {
      margin-top: 0.5rem;

      .value-bar {
        position: relative;
        height: 24px;
        background: var(--light-bg, #f3f4f6);
        border-radius: 12px;
        overflow: hidden;

        .optimal-range {
          position: absolute;
          top: 4px;
          bottom: 4px;
          background: rgba(16, 185, 129, 0.25);
          border-radius: 8px;
          border: 1px dashed var(--primary-green, #10b981);
        }

        .current-value {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          z-index: 1;
        }
      }

      .value-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        color: var(--text-secondary, #6b7280);
        margin-top: 4px;
        padding: 0 4px;

        .optimal-label {
          color: var(--primary-green, #10b981);
          font-weight: 500;
        }
      }
    }

    /* Card Actions */
    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color, #e5e7eb);

      .dismiss-btn {
        color: var(--text-secondary, #6b7280);

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-right: 4px;
        }
      }

      .primary-action {
        color: white;
        font-weight: 600;
        min-width: 140px;
        border-radius: 8px;
        transition: all 0.2s ease;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-right: 6px;
        }

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        &:active {
          transform: translateY(0);
        }
      }
    }

    /* FAB Container */
    .fab-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 100;

      .critical-fab {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
        animation: pulse-fab 2s infinite;

        mat-icon {
          margin-right: 8px;
        }
      }
    }

    /* Animations */
    @keyframes pulse-icon {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.1); }
    }

    @keyframes pulse-bar {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes pulse-fab {
      0%, 100% { transform: scale(1); box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4); }
      50% { transform: scale(1.05); box-shadow: 0 8px 24px rgba(239, 68, 68, 0.6); }
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Dark Mode */
    :host-context(body.dark-theme) {
      .smart-recommendations {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);

        &.has-critical {
          border-color: rgba(239, 68, 68, 0.4);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }
      }

      .recommendations-header {
        border-bottom-color: var(--border-color, #334155);
      }

      .recommendation-card {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);

        &.priority-critical {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent);
        }

        &.priority-high {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), transparent);
        }
      }

      .card-actions {
        border-top-color: var(--border-color, #334155);
      }

      .rec-reason {
        background: rgba(16, 185, 129, 0.12);
      }

      .value-indicator .value-bar {
        background: var(--light-bg, #0f172a);
      }
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .smart-recommendations {
        padding: 1rem;
        border-radius: 12px;
      }

      .recommendations-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .recommendation-card {
        flex-direction: column;

        .priority-bar {
          width: 100%;
          height: 3px;
          min-height: auto;
        }
      }

      .card-header {
        .icon-wrapper {
          width: 40px;
          height: 40px;
        }
      }

      .card-actions {
        flex-direction: column;

        button {
          width: 100%;
          justify-content: center;
        }

        .primary-action {
          min-height: 48px; /* Touch-friendly */
        }
      }

      .fab-container {
        bottom: 16px;
        right: 16px;
        left: 16px;

        .critical-fab {
          width: 100%;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CropSmartRecommendationsComponent implements OnInit {
  private aiService = inject(AiRecommendationService);
  private languageService = inject(LanguageService);

  // Inputs
  cropId = input.required<string>();
  sensors = input.required<any[]>();
  cropContext = input<any>();

  // Outputs
  actionExecuted = output<{ recommendation: SmartRecommendation; success: boolean }>();
  refreshRequested = output<void>();

  // Local state
  loading = signal(false);
  recommendations = signal<SmartRecommendation[]>([]);

  // Computed
  sortedRecommendations = computed(() => {
    const recs = this.recommendations();
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...recs].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  });

  recommendationCount = computed(() => this.recommendations().filter(r => !r.dismissed && !r.executed).length);
  criticalCount = computed(() => this.recommendations().filter(r => r.priority === 'critical' && !r.dismissed && !r.executed).length);
  hasCritical = computed(() => this.criticalCount() > 0);

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    const context = this.cropContext() || {
      cropId: this.cropId(),
      cropName: 'Crop',
      status: 'growing'
    };

    this.loading.set(true);

    // Convert sensor data to expected format
    const sensorReadings = (this.sensors() || []).map(s => ({
      sensor_id: s.sensor_id || s.id,
      type: s.type,
      value: s.currentValue || s.value || 0,
      unit: s.unit || '%',
      timestamp: new Date()
    }));

    this.aiService.generateRecommendations(sensorReadings, context).subscribe({
      next: (recs) => {
        this.recommendations.set(recs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error generating recommendations:', err);
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadRecommendations();
    this.refreshRequested.emit();
  }

  onDismiss(rec: SmartRecommendation): void {
    this.aiService.dismissRecommendation(rec.id);
    this.recommendations.set(this.recommendations().filter(r => r.id !== rec.id));
  }

  onAction(rec: SmartRecommendation): void {
    // Mark as executed
    this.aiService.markAsExecuted(rec.id);
    
    // Emit for parent to handle
    this.actionExecuted.emit({ recommendation: rec, success: true });

    // Remove from list with animation
    setTimeout(() => {
      this.recommendations.set(this.recommendations().filter(r => r.id !== rec.id));
    }, 300);
  }

  executeAllCritical(): void {
    const criticalRecs = this.recommendations().filter(r => r.priority === 'critical');
    criticalRecs.forEach(rec => this.onAction(rec));
  }

  getPriorityLabel(priority: RecommendationPriority): string {
    return this.languageService.translate(`ai.recommendations.priority.${priority}`);
  }

  getActionIcon(actionType: string): string {
    const icons: Record<string, string> = {
      'irrigate': 'water_drop',
      'schedule_irrigation': 'schedule',
      'check_drainage': 'plumbing',
      'activate_heating': 'local_fire_department',
      'activate_ventilation': 'air',
      'mist': 'water',
      'fertilize': 'eco',
      'harvest': 'agriculture',
      'prepare_harvest': 'assignment',
      'protect_frost': 'ac_unit',
      'shade_crop': 'wb_shade',
      'skip_irrigation': 'block',
      'monitor': 'visibility',
      'view_details': 'info',
      'view_tips': 'lightbulb'
    };
    return icons[actionType] || 'touch_app';
  }

  getValuePosition(rec: SmartRecommendation): number {
    const value = rec.metadata.currentValue || 0;
    return Math.min(100, Math.max(0, value));
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return this.languageService.translate('common.justNow');
    if (minutes < 60) return this.languageService.translate('common.minutesAgo', { count: minutes });
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return this.languageService.translate('common.hoursAgo', { count: hours });
    
    return this.languageService.translate('common.daysAgo', { count: Math.floor(hours / 24) });
  }

  trackById(index: number, rec: SmartRecommendation): string {
    return rec.id;
  }
}
