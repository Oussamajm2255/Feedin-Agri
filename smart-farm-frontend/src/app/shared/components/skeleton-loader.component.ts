import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 🦴 Skeleton Loader Component
 * 
 * Reusable skeleton loader for TerraFlow Design System.
 * Supports multiple variants for different use cases.
 */
@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Single Line Skeleton -->
    <ng-container *ngIf="variant === 'line'">
      <div class="skeleton skeleton-line" [style.width]="width" [style.height]="height"></div>
    </ng-container>

    <!-- Circle Skeleton (Avatar/Icon) -->
    <ng-container *ngIf="variant === 'circle'">
      <div class="skeleton skeleton-circle" [style.width]="size" [style.height]="size"></div>
    </ng-container>

    <!-- Card Skeleton -->
    <ng-container *ngIf="variant === 'card'">
      <div class="skeleton-card">
        <div class="skeleton-card-header">
          <div class="skeleton skeleton-circle" style="width: 48px; height: 48px;"></div>
          <div class="skeleton-card-info">
            <div class="skeleton skeleton-line" style="width: 60%; height: 16px;"></div>
            <div class="skeleton skeleton-line" style="width: 40%; height: 12px;"></div>
          </div>
        </div>
        <div class="skeleton skeleton-line" style="width: 100%; height: 80px; margin-top: 16px;"></div>
      </div>
    </ng-container>

    <!-- KPI Card Skeleton -->
    <ng-container *ngIf="variant === 'kpi'">
      <div class="skeleton-kpi">
        <div class="skeleton skeleton-circle" style="width: 48px; height: 48px;"></div>
        <div class="skeleton-kpi-info">
          <div class="skeleton skeleton-line" style="width: 80px; height: 12px;"></div>
          <div class="skeleton skeleton-line" style="width: 60px; height: 24px;"></div>
        </div>
      </div>
    </ng-container>

    <!-- Chart Skeleton -->
    <ng-container *ngIf="variant === 'chart'">
      <div class="skeleton-chart">
        <div class="skeleton skeleton-line" style="width: 100%; height: 250px;"></div>
        <div class="skeleton-chart-legend">
          <div class="skeleton skeleton-line" style="width: 80px; height: 16px;"></div>
          <div class="skeleton skeleton-line" style="width: 100px; height: 16px;"></div>
          <div class="skeleton skeleton-line" style="width: 70px; height: 16px;"></div>
        </div>
      </div>
    </ng-container>

    <!-- Timeline Skeleton -->
    <ng-container *ngIf="variant === 'timeline'">
      <div class="skeleton-timeline" *ngFor="let i of [1, 2, 3]">
        <div class="skeleton skeleton-circle" style="width: 40px; height: 40px;"></div>
        <div class="skeleton-timeline-content">
          <div class="skeleton skeleton-line" style="width: 70%; height: 14px;"></div>
          <div class="skeleton skeleton-line" style="width: 90%; height: 12px;"></div>
          <div class="skeleton skeleton-line" style="width: 50%; height: 12px;"></div>
        </div>
      </div>
    </ng-container>

    <!-- Table Row Skeleton -->
    <ng-container *ngIf="variant === 'table'">
      <div class="skeleton-table" *ngFor="let i of [1, 2, 3, 4, 5]">
        <div class="skeleton skeleton-line" style="width: 40px; height: 16px;"></div>
        <div class="skeleton skeleton-line" style="flex: 2; height: 16px;"></div>
        <div class="skeleton skeleton-line" style="flex: 1; height: 16px;"></div>
        <div class="skeleton skeleton-line" style="width: 80px; height: 16px;"></div>
      </div>
    </ng-container>

    <!-- Action Card Skeleton -->
    <ng-container *ngIf="variant === 'action'">
      <div class="skeleton-action">
        <div class="skeleton-action-header">
          <div class="skeleton skeleton-circle" style="width: 48px; height: 48px;"></div>
          <div class="skeleton-action-info">
            <div class="skeleton skeleton-line" style="width: 120px; height: 14px;"></div>
            <div class="skeleton skeleton-line" style="width: 80px; height: 12px;"></div>
          </div>
          <div class="skeleton skeleton-line" style="width: 60px; height: 24px; border-radius: 12px;"></div>
        </div>
        <div class="skeleton skeleton-line" style="width: 100%; height: 40px; margin-top: 12px;"></div>
      </div>
    </ng-container>
  `,
  styles: [`
    /* === SKELETON BASE ANIMATION === */
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        rgba(0, 0, 0, 0.06) 25%,
        rgba(0, 0, 0, 0.12) 50%,
        rgba(0, 0, 0, 0.06) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }

    .skeleton-line {
      display: block;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .skeleton-circle {
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* === CARD SKELETON === */
    .skeleton-card {
      padding: 1.5rem;
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 16px;
    }

    .skeleton-card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .skeleton-card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* === KPI SKELETON === */
    .skeleton-kpi {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 16px;
    }

    .skeleton-kpi-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* === CHART SKELETON === */
    .skeleton-chart {
      padding: 1rem;
    }

    .skeleton-chart-legend {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      margin-top: 1rem;
    }

    /* === TIMELINE SKELETON === */
    .skeleton-timeline {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color, #e5e7eb);

      &:last-child {
        border-bottom: none;
      }
    }

    .skeleton-timeline-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* === TABLE SKELETON === */
    .skeleton-table {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color, #e5e7eb);

      &:last-child {
        border-bottom: none;
      }
    }

    /* === ACTION SKELETON === */
    .skeleton-action {
      padding: 1.5rem;
      background: var(--card-bg, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
    }

    .skeleton-action-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .skeleton-action-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    /* === DARK MODE === */
    :host-context(body.dark-theme) {
      .skeleton {
        background: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0.06) 25%,
          rgba(255, 255, 255, 0.12) 50%,
          rgba(255, 255, 255, 0.06) 75%
        );
        background-size: 200% 100%;
      }

      .skeleton-card,
      .skeleton-kpi,
      .skeleton-action {
        background: var(--card-bg, #1e293b);
        border-color: var(--border-color, #334155);
      }

      .skeleton-timeline,
      .skeleton-table {
        border-bottom-color: var(--border-color, #334155);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonLoaderComponent {
  @Input() variant: 'line' | 'circle' | 'card' | 'kpi' | 'chart' | 'timeline' | 'table' | 'action' = 'line';
  @Input() width = '100%';
  @Input() height = '16px';
  @Input() size = '40px';
}

