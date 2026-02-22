import { Component, OnInit, input, signal, computed, inject, DestroyRef, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CropService, CropDashboardData, SensorWithReading } from '../../../core/services/crop.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../core/services/language.service';
import { Crop } from '../../../core/models/farm.model';

interface SustainabilityMetric {
  id: string;
  label: string;
  icon: string;
  value: number;
  unit: string;
  target: number;
  progress: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  description: string;
  color: string;
}

interface GrowthStage {
  stage: string;
  icon: string;
  progress: number;
  daysRemaining: number;
  totalDays: number;
  expectedDate: Date | null;
}

interface EnvironmentWarning {
  id: string;
  type: 'temperature' | 'moisture' | 'humidity' | 'light' | 'general';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired: boolean;
}

@Component({
  selector: 'app-crop-sustainability-metrics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  template: `
    <div class="sustainability-container">
      <!-- Growth Stage Progress - Premium Edition -->
      <div class="growth-stage-card premium-card">
        <!-- Header with Glow Effect -->
        <div class="growth-header">
          <div class="header-icon-wrapper">
            <div class="icon-glow"></div>
            <mat-icon class="header-icon">trending_up</mat-icon>
          </div>
          <div class="header-text">
            <h2>{{ 'crops.sustainability.growthStage.title' | translate }}</h2>
            <span class="header-subtitle">{{ getStageLabel(currentGrowthStage().stage) }}</span>
          </div>
          <div class="progress-badge" [class]="'stage-' + currentGrowthStage().stage">
            <span class="badge-value">{{ currentGrowthStage().progress | number:'1.0-0' }}</span>
            <span class="badge-unit">%</span>
          </div>
        </div>

        <!-- Immersive Timeline -->
        <div class="growth-timeline">
          <!-- Stage Nodes -->
          <div class="timeline-track">
            <div class="track-fill" [style.width.%]="currentGrowthStage().progress"></div>
            <div class="track-glow" [style.width.%]="currentGrowthStage().progress"></div>
          </div>
          
          <div class="timeline-nodes">
            <div class="timeline-node" 
                 *ngFor="let stage of growthStages; let i = index"
                 [class.completed]="currentGrowthStage().progress >= stage.threshold"
                 [class.current]="isCurrentStage(stage.id)"
                 [class.upcoming]="currentGrowthStage().progress < stage.threshold">
              <div class="node-ring">
                <div class="node-inner">
                  <mat-icon>{{ stage.icon }}</mat-icon>
                </div>
                <div class="node-pulse" *ngIf="isCurrentStage(stage.id)"></div>
              </div>
              <div class="node-label">
                <span class="stage-name">{{ stage.label }}</span>
                <span class="stage-threshold">{{ stage.threshold }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="growth-stats">
          <div class="stat-card">
            <div class="stat-icon-box days">
              <mat-icon>schedule</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ currentGrowthStage().daysRemaining }}</span>
              <span class="stat-label">{{ 'crops.sustainability.growthStage.daysRemaining' | translate }}</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon-box progress">
              <mat-icon>donut_large</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ currentGrowthStage().totalDays - currentGrowthStage().daysRemaining }}</span>
              <span class="stat-label">Days Elapsed</span>
            </div>
          </div>
          
          <div class="stat-card" *ngIf="currentGrowthStage().expectedDate">
            <div class="stat-icon-box harvest">
              <mat-icon>event_available</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value date">{{ currentGrowthStage().expectedDate | date:'MMM d' }}</span>
              <span class="stat-label">Expected Harvest</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon-box cycle">
              <mat-icon>autorenew</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ currentGrowthStage().totalDays }}</span>
              <span class="stat-label">Total Cycle Days</span>
            </div>
          </div>
        </div>
      </div>



      <!-- Environmental Warnings -->
      <mat-card *ngIf="environmentWarnings().length > 0" class="warnings-card glass-card warning-glow">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="warning-icon">warning</mat-icon>
            {{ 'crops.sustainability.warnings.title' | translate }}
          </mat-card-title>
          <span class="warning-badge">{{ environmentWarnings().length }}</span>
        </mat-card-header>
        <mat-card-content>
          <div class="warnings-list">
            <div *ngFor="let warning of environmentWarnings()"
                 class="warning-item"
                 [class]="'severity-' + warning.severity">
              <div class="warning-icon-wrapper">
                <mat-icon>{{ getWarningIcon(warning.type) }}</mat-icon>
              </div>
              <div class="warning-content">
                <h4>{{ warning.title }}</h4>
                <p>{{ warning.message }}</p>
                <span class="warning-time">{{ getRelativeTime(warning.timestamp) }}</span>
              </div>
              <button *ngIf="warning.actionRequired"
                      mat-stroked-button
                      color="warn"
                      class="action-btn">
                <mat-icon>build</mat-icon>
                {{ 'crops.sustainability.warnings.takeAction' | translate }}
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>


    </div>
  `,
  styles: [`
    .sustainability-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* === GLASSMORPHISM === */
    .glass-card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.08),
        inset 0 0 0 1px rgba(255, 255, 255, 0.5);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 
          0 12px 40px rgba(16, 185, 129, 0.12),
          inset 0 0 0 1px rgba(16, 185, 129, 0.2);
      }

      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);

          mat-icon {
            color: var(--primary-green, #10b981);
          }
        }
      }
    }

    /* === PREMIUM GROWTH STAGE CARD === */
    .premium-card {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 244, 0.9) 100%);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 
        0 20px 60px rgba(16, 185, 129, 0.08),
        0 8px 24px rgba(0, 0, 0, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
        pointer-events: none;
      }
    }

    /* === GROWTH HEADER === */
    .growth-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
      position: relative;
      z-index: 1;
    }

    .header-icon-wrapper {
      position: relative;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon-glow {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 16px;
        animation: iconPulse 3s ease-in-out infinite;
      }

      .header-icon {
        position: relative;
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
        z-index: 1;
      }
    }

    @keyframes iconPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.85; transform: scale(1.05); }
    }

    .header-text {
      flex: 1;

      h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.025em;
      }

      .header-subtitle {
        display: block;
        font-size: 0.9rem;
        color: var(--primary-green, #10b981);
        font-weight: 600;
        margin-top: 0.25rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .progress-badge {
      display: flex;
      align-items: baseline;
      gap: 2px;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 16px;
      box-shadow: 
        0 8px 24px rgba(16, 185, 129, 0.35),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);

      .badge-value {
        font-size: 2rem;
        font-weight: 800;
        color: white;
        line-height: 1;
      }

      .badge-unit {
        font-size: 1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.85);
      }

      &.stage-germination { background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); }
      &.stage-seedling { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
      &.stage-vegetative { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
      &.stage-flowering { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
      &.stage-mature { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    }

    /* === TIMELINE === */
    .growth-timeline {
      position: relative;
      padding: 2rem 0;
      margin-bottom: 2rem;
    }

    .timeline-track {
      position: absolute;
      top: 50%;
      left: 5%;
      right: 5%;
      height: 6px;
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%);
      border-radius: 3px;
      transform: translateY(-50%);
      overflow: hidden;

      .track-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
        border-radius: 3px;
        transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
      }

      .track-glow {
        position: absolute;
        top: -4px;
        left: 0;
        height: 14px;
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.1) 100%);
        border-radius: 7px;
        filter: blur(6px);
        transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    .timeline-nodes {
      display: flex;
      justify-content: space-between;
      position: relative;
      z-index: 1;
    }

    .timeline-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

      .node-ring {
        position: relative;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;

        .node-inner {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
          border: 3px solid #e5e7eb;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

          mat-icon {
            font-size: 22px;
            width: 22px;
            height: 22px;
            color: #9ca3af;
            transition: all 0.3s ease;
          }
        }

        .node-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #10b981;
          animation: nodePulse 2s ease-out infinite;
        }
      }

      .node-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;

        .stage-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6b7280;
          transition: color 0.3s ease;
        }

        .stage-threshold {
          font-size: 0.7rem;
          color: #9ca3af;
          font-weight: 500;
        }
      }

      /* States */
      &.completed {
        .node-ring .node-inner {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #10b981;
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);

          mat-icon {
            color: white;
          }
        }

        .node-label .stage-name {
          color: #10b981;
        }
      }

      &.current {
        transform: scale(1.1);

        .node-ring .node-inner {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
          border-color: #10b981;
          box-shadow: 
            0 8px 24px rgba(16, 185, 129, 0.4),
            0 0 0 4px rgba(16, 185, 129, 0.15);

          mat-icon {
            color: white;
          }
        }

        .node-label .stage-name {
          color: #059669;
          font-weight: 700;
        }
      }

      &.upcoming {
        opacity: 0.6;

        &:hover {
          opacity: 0.85;
          transform: translateY(-2px);
        }
      }
    }

    @keyframes nodePulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    /* === STATS GRID === */
    .growth-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      position: relative;
      z-index: 1;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(16, 185, 129, 0.1);
      border-radius: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: rgba(255, 255, 255, 0.95);
        transform: translateY(-3px);
        box-shadow: 0 12px 32px rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.2);
      }

      .stat-icon-box {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        flex-shrink: 0;

        mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }

        &.days {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
          mat-icon { color: #3b82f6; }
        }

        &.progress {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
          mat-icon { color: #10b981; }
        }

        &.harvest {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
          mat-icon { color: #f59e0b; }
        }

        &.cycle {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05));
          mat-icon { color: #8b5cf6; }
        }
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        min-width: 0;

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary, #1f2937);
          line-height: 1.2;

          &.date {
            font-size: 1.25rem;
          }
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary, #6b7280);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    /* === DARK MODE === */
    :host-context(body.dark-theme) {
      .premium-card {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%);
        border-color: rgba(16, 185, 129, 0.2);
        box-shadow: 
          0 20px 60px rgba(0, 0, 0, 0.3),
          0 8px 24px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);

        &::before {
          background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
        }
      }

      .header-text h2 {
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        -webkit-background-clip: text;
        background-clip: text;
      }

      .timeline-track {
        background: rgba(16, 185, 129, 0.1);
      }

      .timeline-node {
        .node-ring .node-inner {
          background: #1e293b;
          border-color: #334155;
        }

        &.upcoming .node-label .stage-name {
          color: #94a3b8;
        }
      }

      .stat-card {
        background: rgba(30, 41, 59, 0.6);
        border-color: rgba(51, 65, 85, 0.5);

        &:hover {
          background: rgba(30, 41, 59, 0.9);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .stat-content .stat-value {
          color: #f1f5f9;
        }
      }
    }

    /* === RESPONSIVE === */
    @media (max-width: 768px) {
      .premium-card {
        padding: 1.5rem;
      }

      .growth-header {
        flex-wrap: wrap;
        gap: 1rem;
      }

      .progress-badge {
        margin-left: auto;
      }

      .timeline-nodes {
        overflow-x: auto;
        padding-bottom: 1rem;
        gap: 1.5rem;
      }

      .timeline-node {
        min-width: 70px;
      }

      .growth-stats {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 480px) {
      .header-icon-wrapper {
        width: 48px;
        height: 48px;

        .header-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .header-text h2 {
        font-size: 1.25rem;
      }

      .progress-badge .badge-value {
        font-size: 1.5rem;
      }

      .timeline-node .node-ring {
        width: 48px;
        height: 48px;

        .node-inner {
          width: 40px;
          height: 40px;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }

      .growth-stats {
        grid-template-columns: 1fr;
      }
    }

    /* === METRICS GRID === */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      &.status-excellent {
        border-left: 4px solid var(--primary-green, #10b981);
      }

      &.status-good {
        border-left: 4px solid #4caf50;
      }

      &.status-warning {
        border-left: 4px solid #ff9800;
      }

      &.status-critical {
        border-left: 4px solid #f44336;
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .metric-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;

          mat-icon {
            font-size: 24px;
            width: 24px;
            height: 24px;
          }
        }

        .metric-trend {
          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          &.up mat-icon { color: var(--primary-green, #10b981); }
          &.down mat-icon { color: #f44336; }
          &.stable mat-icon { color: #9e9e9e; }
        }
      }

      .metric-body {
        .metric-label {
          font-size: 0.75rem;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value-row {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin: 0.25rem 0;

          .metric-value {
            font-size: 1.75rem;
            font-weight: 600;
            color: var(--text-primary, #1f2937);
          }

          .metric-unit {
            font-size: 0.875rem;
            color: var(--text-secondary, #6b7280);
          }
        }

        mat-progress-bar {
          height: 6px;
          border-radius: 3px;
          margin: 0.5rem 0;
        }

        .metric-target {
          font-size: 0.75rem;
          color: var(--text-secondary, #6b7280);
        }
      }

      .metric-footer {
        mat-chip {
          height: 24px;
          font-size: 0.7rem;

          &.excellent { background: rgba(16, 185, 129, 0.15); color: var(--primary-green, #10b981); }
          &.good { background: rgba(76, 175, 80, 0.15); color: #4caf50; }
          &.warning { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
          &.critical { background: rgba(244, 67, 54, 0.15); color: #f44336; }
        }
      }
    }

    /* === WARNINGS === */
    .warnings-card {
      &.warning-glow {
        box-shadow: 
          0 8px 32px rgba(255, 152, 0, 0.15),
          inset 0 0 0 1px rgba(255, 152, 0, 0.2);
      }

      mat-card-header {
        display: flex;
        align-items: center;

        mat-card-title {
          flex: 1;

          .warning-icon {
            color: #ff9800;
          }
        }

        .warning-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #ff9800;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 50%;
        }
      }
    }

    .warnings-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .warning-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 152, 0, 0.05);
      border-radius: 12px;
      border-left: 4px solid #ff9800;

      &.severity-high {
        border-left-color: #f44336;
        background: rgba(244, 67, 54, 0.05);
      }

      &.severity-medium {
        border-left-color: #ff9800;
      }

      &.severity-low {
        border-left-color: #4caf50;
        background: rgba(76, 175, 80, 0.05);
      }

      .warning-icon-wrapper {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 152, 0, 0.15);
        border-radius: 50%;
        flex-shrink: 0;

        mat-icon {
          color: #ff9800;
        }
      }

      .warning-content {
        flex: 1;

        h4 {
          margin: 0 0 0.25rem 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);
        }

        p {
          margin: 0 0 0.5rem 0;
          font-size: 0.85rem;
          color: var(--text-secondary, #6b7280);
          line-height: 1.5;
        }

        .warning-time {
          font-size: 0.75rem;
          color: var(--text-secondary, #6b7280);
        }
      }

      .action-btn {
        flex-shrink: 0;
      }
    }

    /* === EFFICIENCY === */
    .efficiency-card {
      mat-card-content {
        padding-top: 1rem;
      }
    }

    .efficiency-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(16, 185, 129, 0.05);
      border-radius: 12px;
      transition: all 0.3s;

      &:hover {
        background: rgba(16, 185, 129, 0.1);
        transform: translateY(-2px);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        &.water { background: rgba(33, 150, 243, 0.15); mat-icon { color: #2196f3; } }
        &.energy { background: rgba(255, 193, 7, 0.15); mat-icon { color: #ffc107; } }
        &.carbon { background: rgba(76, 175, 80, 0.15); mat-icon { color: #4caf50; } }
        &.score { background: rgba(255, 152, 0, 0.15); mat-icon { color: #ff9800; } }
      }

      .stat-info {
        display: flex;
        flex-direction: column;

        .stat-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary, #1f2937);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary, #6b7280);
        }
      }
    }

    /* === DARK MODE === */
    :host-context(body.dark-theme) {
      .glass-card {
        background: rgba(30, 41, 59, 0.85);
        border-color: rgba(51, 65, 85, 0.5);
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 0 0 1px rgba(255, 255, 255, 0.1);

        mat-card-title {
          color: var(--text-primary, #f1f5f9);
        }
      }

      .stage-indicator .stage-info {
        .stage-label {
          color: var(--text-primary, #f1f5f9);
        }
      }

      .metric-card {
        .metric-body {
          .metric-value {
            color: var(--text-primary, #f1f5f9);
          }
        }
      }

      .warning-item {
        .warning-content h4 {
          color: var(--text-primary, #f1f5f9);
        }
      }

      .stat-item {
        background: rgba(16, 185, 129, 0.1);

        &:hover {
          background: rgba(16, 185, 129, 0.15);
        }

        .stat-info .stat-value {
          color: var(--text-primary, #f1f5f9);
        }
      }
    }

    /* === RESPONSIVE === */
    @media (max-width: 768px) {
      .metrics-grid {
        grid-template-columns: 1fr 1fr;
      }

      .efficiency-stats {
        grid-template-columns: 1fr 1fr;
      }

      .warning-item {
        flex-direction: column;

        .action-btn {
          width: 100%;
        }
      }
    }

    @media (max-width: 480px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .efficiency-stats {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CropSustainabilityMetricsComponent implements OnInit {
  private languageService = inject(LanguageService);
  private cropService = inject(CropService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  cropId = input.required<string>();
  sensors = input.required<SensorWithReading[]>();
  dashboardData = input<CropDashboardData | null>(null);

  // Local state
  loading = signal(false);
  sustainabilityLoading = signal(false);

  // Growth stages configuration for the timeline
  growthStages = [
    { id: 'germination', label: 'Germination', icon: 'spa', threshold: 0 },
    { id: 'seedling', label: 'Seedling', icon: 'grass', threshold: 15 },
    { id: 'vegetative', label: 'Vegetative', icon: 'eco', threshold: 35 },
    { id: 'flowering', label: 'Flowering', icon: 'local_florist', threshold: 60 },
    { id: 'mature', label: 'Harvest', icon: 'agriculture', threshold: 90 }
  ];

  /**
   * Check if a stage is the current active stage
   */
  isCurrentStage(stageId: string): boolean {
    const progress = this.currentGrowthStage().progress;
    const stageIndex = this.growthStages.findIndex(s => s.id === stageId);
    if (stageIndex === -1) return false;
    
    const currentThreshold = this.growthStages[stageIndex].threshold;
    const nextThreshold = stageIndex < this.growthStages.length - 1 
      ? this.growthStages[stageIndex + 1].threshold 
      : 100;
    
    return progress >= currentThreshold && progress < nextThreshold;
  }

  // Sustainability data from backend (no more fake data)
  sustainabilityData = signal<{
    waterSaved: number;
    energySaved: number;
    carbonOffset: number;
    sustainabilityScore: number;
    efficiency: {
      waterEfficiency: number;
      energyEfficiency: number;
      resourceScore: number;
    };
  } | null>(null);

  // Computed values
  currentGrowthStage = computed<GrowthStage>(() => {
    const data = this.dashboardData();
    if (!data?.crop?.planting_date) {
      return {
        stage: 'unknown',
        icon: 'help_outline',
        progress: 0,
        daysRemaining: 0,
        totalDays: 90,
        expectedDate: null
      };
    }

    const plantingDate = new Date(data.crop.planting_date);
    const now = new Date();
    const daysSincePlanting = Math.floor((now.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Estimate total days based on crop type (default 90 days)
    const totalDays = data.crop.expected_harvest_date 
      ? Math.floor((new Date(data.crop.expected_harvest_date).getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24))
      : 90;

    const progress = Math.min(100, (daysSincePlanting / totalDays) * 100);
    const daysRemaining = Math.max(0, totalDays - daysSincePlanting);

    let stage = 'germination';
    let icon = 'spa';

    if (progress < 15) { stage = 'germination'; icon = 'spa'; }
    else if (progress < 35) { stage = 'seedling'; icon = 'grass'; }
    else if (progress < 60) { stage = 'vegetative'; icon = 'forest'; }
    else if (progress < 85) { stage = 'flowering'; icon = 'local_florist'; }
    else { stage = 'mature'; icon = 'agriculture'; }

    return {
      stage,
      icon,
      progress,
      daysRemaining,
      totalDays,
      expectedDate: data.crop.expected_harvest_date ? new Date(data.crop.expected_harvest_date) : null
    };
  });

  sustainabilityMetrics = computed<SustainabilityMetric[]>(() => {
    const data = this.dashboardData();
    if (!data) return [];

    const kpis = data.kpis;

    return [
      {
        id: 'water_usage',
        label: this.languageService.translate('crops.sustainability.metrics.waterUsage'),
        icon: 'water_drop',
        value: this.calculateWaterUsage(kpis),
        unit: 'L/day',
        target: 50,
        progress: Math.min(100, (this.calculateWaterUsage(kpis) / 50) * 100),
        status: this.getMetricStatus(this.calculateWaterUsage(kpis), 50, 'lower'),
        trend: 'stable',
        description: this.languageService.translate('crops.sustainability.metrics.waterUsageDesc'),
        color: '#2196f3'
      },
      {
        id: 'energy',
        label: this.languageService.translate('crops.sustainability.metrics.energyConsumption'),
        icon: 'bolt',
        value: this.calculateEnergyUsage(),
        unit: 'kWh',
        target: 10,
        progress: Math.min(100, (this.calculateEnergyUsage() / 10) * 100),
        status: this.getMetricStatus(this.calculateEnergyUsage(), 10, 'lower'),
        trend: 'down',
        description: this.languageService.translate('crops.sustainability.metrics.energyDesc'),
        color: '#ffc107'
      },
      {
        id: 'soil_health',
        label: this.languageService.translate('crops.sustainability.metrics.soilHealth'),
        icon: 'landscape',
        value: kpis.avgSoilMoisture || 0,
        unit: '%',
        target: 60,
        progress: kpis.avgSoilMoisture || 0,
        status: this.getMetricStatus(kpis.avgSoilMoisture || 0, 60, 'optimal'),
        trend: kpis.avgSoilMoisture && kpis.avgSoilMoisture > 50 ? 'up' : 'down',
        description: this.languageService.translate('crops.sustainability.metrics.soilHealthDesc'),
        color: '#8bc34a'
      },
      {
        id: 'efficiency',
        label: this.languageService.translate('crops.sustainability.metrics.resourceEfficiency'),
        icon: 'speed',
        value: this.calculateEfficiencyScore(kpis),
        unit: '%',
        target: 90,
        progress: this.calculateEfficiencyScore(kpis),
        status: this.getMetricStatus(this.calculateEfficiencyScore(kpis), 90, 'higher'),
        trend: 'up',
        description: this.languageService.translate('crops.sustainability.metrics.efficiencyDesc'),
        color: '#10b981'
      }
    ];
  });

  environmentWarnings = computed<EnvironmentWarning[]>(() => {
    const data = this.dashboardData();
    if (!data) return [];

    const warnings: EnvironmentWarning[] = [];
    const kpis = data.kpis;

    // Check moisture
    if (kpis.avgSoilMoisture !== null && kpis.avgSoilMoisture < 30) {
      warnings.push({
        id: 'low_moisture',
        type: 'moisture',
        severity: 'high',
        title: this.languageService.translate('crops.sustainability.warnings.lowMoisture.title'),
        message: this.languageService.translate('crops.sustainability.warnings.lowMoisture.message'),
        timestamp: new Date(),
        actionRequired: true
      });
    }

    // Check temperature
    if (kpis.avgTemperature !== null && kpis.avgTemperature > 35) {
      warnings.push({
        id: 'high_temp',
        type: 'temperature',
        severity: 'medium',
        title: this.languageService.translate('crops.sustainability.warnings.highTemp.title'),
        message: this.languageService.translate('crops.sustainability.warnings.highTemp.message'),
        timestamp: new Date(),
        actionRequired: true
      });
    }

    // Check humidity
    if (kpis.avgHumidity !== null && kpis.avgHumidity > 85) {
      warnings.push({
        id: 'high_humidity',
        type: 'humidity',
        severity: 'low',
        title: this.languageService.translate('crops.sustainability.warnings.highHumidity.title'),
        message: this.languageService.translate('crops.sustainability.warnings.highHumidity.message'),
        timestamp: new Date(),
        actionRequired: false
      });
    }

    return warnings;
  });

  // Real computed values from backend data
  waterSaved = computed(() => {
    const data = this.sustainabilityData();
    return data?.waterSaved ?? 0;
  });

  energySaved = computed(() => {
    const data = this.sustainabilityData();
    return data?.energySaved ?? 0;
  });

  carbonOffset = computed(() => {
    const data = this.sustainabilityData();
    return data?.carbonOffset ?? 0;
  });

  sustainabilityScore = computed(() => {
    const data = this.sustainabilityData();
    return data?.sustainabilityScore ?? 0;
  });

  // Effect to load sustainability data when cropId changes
  constructor() {
    effect(() => {
      const id = this.cropId();
      if (id) {
        this.loadSustainabilityData(id);
      }
    });
  }

  ngOnInit(): void {
    // Initial load handled by effect
  }

  private loadSustainabilityData(cropId: string): void {
    this.sustainabilityLoading.set(true);

    this.cropService.getSustainabilityMetrics(cropId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data) {
            this.sustainabilityData.set(data);
          }
          this.sustainabilityLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading sustainability data:', err);
          this.sustainabilityLoading.set(false);
        }
      });
  }

  private calculateWaterUsage(kpis: any): number {
    // Calculate based on actual moisture levels - lower moisture = higher water usage
    const baseMoisture = kpis.avgSoilMoisture || 50;
    // Formula: inverse relationship with moisture (optimal is 50-60%)
    return Math.round((100 - baseMoisture) * 0.8 + 20);
  }

  private calculateEnergyUsage(): number {
    // Get from sustainability data if available, otherwise estimate from efficiency
    const data = this.sustainabilityData();
    if (data?.efficiency?.energyEfficiency) {
      // Inverse of efficiency gives usage estimate
      return Math.round((100 - data.efficiency.energyEfficiency) * 0.15 * 10) / 10;
    }
    // Baseline estimate based on active sensors
    const sensorCount = this.sensors()?.length || 0;
    return Math.round(sensorCount * 0.5 * 10) / 10;
  }

  private calculateEfficiencyScore(kpis: any): number {
    let score = 50;
    if (kpis.avgSoilMoisture && kpis.avgSoilMoisture >= 40 && kpis.avgSoilMoisture <= 70) score += 15;
    if (kpis.avgTemperature && kpis.avgTemperature >= 18 && kpis.avgTemperature <= 28) score += 15;
    if (kpis.avgHumidity && kpis.avgHumidity >= 50 && kpis.avgHumidity <= 75) score += 15;
    if (kpis.activeSensors > 0) score += 5;
    return Math.min(100, score);
  }

  private getMetricStatus(value: number, target: number, type: 'lower' | 'higher' | 'optimal'): 'excellent' | 'good' | 'warning' | 'critical' {
    const ratio = value / target;

    if (type === 'lower') {
      if (ratio <= 0.7) return 'excellent';
      if (ratio <= 0.9) return 'good';
      if (ratio <= 1.1) return 'warning';
      return 'critical';
    }

    if (type === 'higher') {
      if (ratio >= 1.0) return 'excellent';
      if (ratio >= 0.8) return 'good';
      if (ratio >= 0.6) return 'warning';
      return 'critical';
    }

    // Optimal (within range)
    if (ratio >= 0.9 && ratio <= 1.1) return 'excellent';
    if (ratio >= 0.7 && ratio <= 1.3) return 'good';
    if (ratio >= 0.5 && ratio <= 1.5) return 'warning';
    return 'critical';
  }

  getStageLabel(stage: string): string {
    return this.languageService.translate(`crops.sustainability.stages.${stage}`);
  }

  getStatusLabel(status: string): string {
    return this.languageService.translate(`crops.sustainability.status.${status}`);
  }

  getProgressColor(status: string): 'primary' | 'accent' | 'warn' {
    if (status === 'excellent' || status === 'good') return 'primary';
    if (status === 'warning') return 'accent';
    return 'warn';
  }

  getWarningIcon(type: string): string {
    switch (type) {
      case 'temperature': return 'thermostat';
      case 'moisture': return 'water_drop';
      case 'humidity': return 'cloud';
      case 'light': return 'wb_sunny';
      default: return 'warning';
    }
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return this.languageService.translate('crops.common.relative.justNow');
    if (minutes < 60) return this.languageService.translate('crops.common.relative.minutesAgo', { count: minutes });
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return this.languageService.translate('crops.common.relative.hoursAgo', { count: hours });
    
    const days = Math.floor(hours / 24);
    return this.languageService.translate('crops.common.relative.daysAgo', { count: days });
  }
}

