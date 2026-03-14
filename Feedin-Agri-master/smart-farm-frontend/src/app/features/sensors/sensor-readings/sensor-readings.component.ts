import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, combineLatest, EMPTY, of } from 'rxjs';
import { startWith, switchMap, catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

// Services
import { ApiService } from '../../../core/services/api.service';
import { FarmManagementService } from '../../../core/services/farm-management.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { ReadingsMapService } from './services/readings-map.service';

// Models
import { Farm, Device, Sensor, SensorReading } from '../../../core/models/farm.model';

// Utils
import {
  calculateSensorStatus,
  SensorWithThresholds,
  SensorStatusResult,
} from './utils/sensor-status.util';
import { normalizeThresholds } from './utils/sensor-thresholds.util';
import { generateUniqueSensorId, parseUniqueSensorId, extractActionPurpose } from './utils/sensor-display.util';

// Child Components
import { GlobalFilterHeaderComponent, FilterState } from './components/global-filter-header/global-filter-header.component';
import { DeviceListPanelComponent, DeviceListItem } from './components/device-list-panel/device-list-panel.component';
import { DeviceDetailPanelComponent, DeviceDetail } from './components/device-detail-panel/device-detail-panel.component';
import { FooterSummaryComponent, SummaryCounts } from './components/footer-summary/footer-summary.component';

@Component({
  selector: 'app-sensor-readings',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    GlobalFilterHeaderComponent,
    DeviceListPanelComponent,
    DeviceDetailPanelComponent,
    FooterSummaryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sensor-readings-layout">
      <!-- Header -->
      <app-global-filter-header
        [title]="languageService.t()('sensorReadings.title')"
        [subtitle]="languageService.t()('sensorReadings.liveData')"
        [farms]="farms()"
        [filters]="filterState()"
        [loading]="loading()"
        [autoRefresh]="autoRefreshEnabled()"
        [density]="density()"
        (filterChange)="onFilterChange($event)"
        (refresh)="refreshData()"
        (autoRefreshToggle)="toggleAutoRefresh($event)"
        (densityToggle)="toggleDensity($event)"
      />

      <!-- KPI Dashboard Header -->
      <div class="kpi-dashboard" [class.compact]="density() === 'compact'">
        <!-- Critical KPI -->
        <div class="kpi-card-mini critical-card" [class.has-issues]="summaryCounts().critical > 0">
          <div class="kpi-glow-indicator critical-glow"></div>
          <div class="kpi-icon-mini critical">
            <div class="icon-bg-pattern"></div>
            <mat-icon>error</mat-icon>
            <div class="status-pulse" *ngIf="summaryCounts().critical > 0"></div>
          </div>
          <div class="kpi-content-mini">
            <div class="kpi-header-mini">
              <span class="kpi-value-mini">{{ summaryCounts().critical }}</span>
              <div class="kpi-badge critical-badge" *ngIf="summaryCounts().critical > 0">ALERT</div>
            </div>
            <span class="kpi-label-mini">Critical</span>
            <div class="kpi-progress-mini">
              <div class="progress-fill critical-progress" [style.width.%]="getPercentage(summaryCounts().critical)"></div>
            </div>
          </div>
          <div class="kpi-corner-accent critical-accent"></div>
        </div>

        <!-- Warning KPI -->
        <div class="kpi-card-mini warning-card" [class.has-issues]="summaryCounts().warning > 0">
          <div class="kpi-glow-indicator warning-glow"></div>
          <div class="kpi-icon-mini warning">
            <div class="icon-bg-pattern"></div>
            <mat-icon>warning</mat-icon>
            <div class="status-pulse" *ngIf="summaryCounts().warning > 0"></div>
          </div>
          <div class="kpi-content-mini">
            <div class="kpi-header-mini">
              <span class="kpi-value-mini">{{ summaryCounts().warning }}</span>
              <div class="kpi-badge warning-badge" *ngIf="summaryCounts().warning > 0">CAUTION</div>
            </div>
            <span class="kpi-label-mini">Warning</span>
            <div class="kpi-progress-mini">
              <div class="progress-fill warning-progress" [style.width.%]="getPercentage(summaryCounts().warning)"></div>
            </div>
          </div>
          <div class="kpi-corner-accent warning-accent"></div>
        </div>

        <!-- Normal KPI -->
        <div class="kpi-card-mini normal-card" [class.has-issues]="summaryCounts().normal > 0">
          <div class="kpi-glow-indicator normal-glow"></div>
          <div class="kpi-icon-mini normal">
            <div class="icon-bg-pattern"></div>
            <mat-icon>check_circle</mat-icon>
            <div class="status-pulse active" *ngIf="summaryCounts().normal > 0"></div>
          </div>
          <div class="kpi-content-mini">
            <div class="kpi-header-mini">
              <span class="kpi-value-mini">{{ summaryCounts().normal }}</span>
              <div class="kpi-badge normal-badge" *ngIf="summaryCounts().normal > 0">HEALTHY</div>
            </div>
            <span class="kpi-label-mini">Normal</span>
            <div class="kpi-progress-mini">
              <div class="progress-fill normal-progress" [style.width.%]="getPercentage(summaryCounts().normal)"></div>
            </div>
          </div>
          <div class="kpi-corner-accent normal-accent"></div>
        </div>

        <!-- Offline KPI -->
        <div class="kpi-card-mini offline-card" [class.has-issues]="summaryCounts().offline > 0">
          <div class="kpi-glow-indicator offline-glow"></div>
          <div class="kpi-icon-mini offline">
            <div class="icon-bg-pattern"></div>
            <mat-icon>sensors_off</mat-icon>
            <div class="status-pulse" *ngIf="summaryCounts().offline > 0"></div>
          </div>
          <div class="kpi-content-mini">
            <div class="kpi-header-mini">
              <span class="kpi-value-mini">{{ summaryCounts().offline }}</span>
              <div class="kpi-badge offline-badge" *ngIf="summaryCounts().offline > 0">OFFLINE</div>
            </div>
            <span class="kpi-label-mini">Offline</span>
            <div class="kpi-progress-mini">
              <div class="progress-fill offline-progress" [style.width.%]="getPercentage(summaryCounts().offline)"></div>
            </div>
          </div>
          <div class="kpi-corner-accent offline-accent"></div>
        </div>

        <!-- Total Sensors KPI -->
        <div class="kpi-card-mini highlight total-sensors-card">
          <div class="kpi-glow-indicator info-glow"></div>
          <div class="kpi-icon-mini info">
            <div class="icon-bg-pattern"></div>
            <mat-icon>sensors</mat-icon>
            <div class="status-pulse active"></div>
          </div>
          <div class="kpi-content-mini">
            <div class="kpi-header-mini">
              <span class="kpi-value-mini">{{ deviceListItems().length }}</span>
              <div class="kpi-trend-indicator up">
                <mat-icon>trending_up</mat-icon>
              </div>
            </div>
            <span class="kpi-label-mini">Total Sensors</span>
            <div class="kpi-progress-mini">
              <div class="progress-fill info-progress" [style.width.%]="100"></div>
            </div>
          </div>
          <div class="kpi-corner-accent info-accent"></div>
        </div>

        <!-- Online Rate KPI -->
        <div class="kpi-card-mini success-card online-rate-card">
          <div class="kpi-glow-indicator success-glow"></div>
          <div class="kpi-icon-mini success">
            <div class="icon-bg-pattern"></div>
            <mat-icon>speed</mat-icon>
            <div class="status-pulse active" *ngIf="getOnlinePercentage() >= 90"></div>
          </div>
          <div class="kpi-content-mini">
            <div class="kpi-header-mini">
              <span class="kpi-value-mini">{{ getOnlinePercentage() }}%</span>
              <div class="kpi-trend-indicator" [class.up]="getOnlinePercentage() >= 90" [class.down]="getOnlinePercentage() < 70">
                <mat-icon>{{ getOnlinePercentage() >= 90 ? 'trending_up' : 'trending_down' }}</mat-icon>
              </div>
            </div>
            <span class="kpi-label-mini">Online Rate</span>
            <div class="kpi-progress-mini">
              <div class="progress-fill success-progress" [style.width.%]="getOnlinePercentage()"></div>
            </div>
          </div>
          <div class="kpi-corner-accent success-accent"></div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content" [class.compact]="density() === 'compact'">
        <!-- Left Panel: Device List -->
        <app-device-list-panel
          [items]="deviceListItems()"
          [selectedId]="selectedSensorId()"
          [loading]="loading()"
          [density]="density()"
          (itemClick)="selectSensor($event)"
          (pinToggle)="togglePin($event)"
        />

        <!-- Right Panel: Device Detail -->
        <app-device-detail-panel
          [device]="selectedDeviceDetail()"
          [loading]="loading()"
        />
      </div>

      <!-- Footer Summary -->
      <app-footer-summary
        [counts]="summaryCounts()"
        [overallStatus]="overallStatus()"
        [overallTitle]="overallTitle()"
        [subtitle]="summarySubtitle()"
      />
    </div>
  `,
  styles: [
    `
      /* Mobile-First Responsive Sensor Readings Layout */
      .sensor-readings-layout {
        min-height: 100vh;
        background: linear-gradient(135deg, #f8fafb 0%, #f0fdf4 100%);
        padding: 0;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow-x: hidden;
        width: 100%;
        box-sizing: border-box;
      }

      /* KPI Dashboard Header - Mobile First */
      .kpi-dashboard {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        padding: 1rem;
        max-width: 1600px;
        width: 100%;
        margin: 0 auto;
        animation: fadeInDown 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        box-sizing: border-box;
      }

      /* 480px+ - Small tablets */
      @media (min-width: 480px) {
        .kpi-dashboard {
          grid-template-columns: repeat(3, 1fr);
          gap: 0.875rem;
          padding: 1.25rem;
        }
      }

      /* 768px+ - Tablets */
      @media (min-width: 768px) {
        .kpi-dashboard {
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          padding: 1.5rem 1.5rem;
        }
      }

      /* 1024px+ - Desktops */
      @media (min-width: 1024px) {
        .kpi-dashboard {
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
          padding: 1.5rem 2rem;
        }
      }

      /* 1440px+ - Large screens */
      @media (min-width: 1440px) {
        .kpi-dashboard {
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          padding: 1.5rem 2rem;
        }
      }

      @keyframes fadeInDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .kpi-dashboard.compact {
        gap: 0.5rem;
        padding: 0.75rem;
      }

      @media (min-width: 768px) {
        .kpi-dashboard.compact {
          gap: 0.75rem;
          padding: 1rem 1.5rem;
        }
      }

      .kpi-card-mini {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 16px;
        border: 2px solid rgba(16, 185, 129, 0.15);
        box-shadow: 
          0 4px 16px rgba(0, 0, 0, 0.06),
          0 2px 8px rgba(16, 185, 129, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.8);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        isolation: isolate;
        min-height: 80px;
      }

      @media (min-width: 480px) {
        .kpi-card-mini {
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 14px;
          min-height: 85px;
        }
      }

      @media (min-width: 768px) {
        .kpi-card-mini {
          gap: 0.875rem;
          padding: 1.125rem 1.25rem;
          border-radius: 16px;
          min-height: 90px;
        }
      }

      @media (max-width: 479px) {
        .kpi-card-mini {
          min-height: 75px;
          padding: 0.875rem;
        }

        .kpi-icon-mini {
          width: 44px;
          height: 44px;
        }

        .kpi-value-mini {
          font-size: 1.375rem;
        }

        .kpi-badge {
          font-size: 0.5rem;
          padding: 0.2rem 0.5rem;
        }

        .kpi-trend-indicator {
          width: 20px;
          height: 20px;

          mat-icon {
            font-size: 12px;
            width: 12px;
            height: 12px;
          }
        }
      }

      // Glow indicator (top border accent)
      .kpi-glow-indicator {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        border-radius: 16px 16px 0 0;
        opacity: 0.8;
        transition: opacity 0.3s ease, height 0.3s ease;
      }

      .kpi-card-mini:hover .kpi-glow-indicator {
        opacity: 1;
        height: 4px;
      }

      .critical-glow {
        background: linear-gradient(90deg, #ef4444, #f87171, #ef4444);
        background-size: 200% 100%;
        animation: shimmerGlow 3s ease-in-out infinite;
      }

      .warning-glow {
        background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b);
        background-size: 200% 100%;
        animation: shimmerGlow 3s ease-in-out infinite;
      }

      .normal-glow {
        background: linear-gradient(90deg, #10b981, #34d399, #10b981);
        background-size: 200% 100%;
        animation: shimmerGlow 3s ease-in-out infinite;
      }

      .offline-glow {
        background: linear-gradient(90deg, #6b7280, #9ca3af, #6b7280);
        background-size: 200% 100%;
        animation: shimmerGlow 3s ease-in-out infinite;
      }

      .info-glow {
        background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
        background-size: 200% 100%;
        animation: shimmerGlow 3s ease-in-out infinite;
      }

      .success-glow {
        background: linear-gradient(90deg, #10b981, #34d399, #10b981);
        background-size: 200% 100%;
        animation: shimmerGlow 3s ease-in-out infinite;
      }

      @keyframes shimmerGlow {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      // Corner accent (bottom-right decorative element)
      .kpi-corner-accent {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 60px;
        height: 60px;
        opacity: 0.1;
        pointer-events: none;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }

      .kpi-card-mini:hover .kpi-corner-accent {
        opacity: 0.15;
        transform: scale(1.1);
      }

      .critical-accent {
        background: radial-gradient(circle, #ef4444 0%, transparent 70%);
        border-radius: 16px 0 16px 0;
      }

      .warning-accent {
        background: radial-gradient(circle, #f59e0b 0%, transparent 70%);
        border-radius: 16px 0 16px 0;
      }

      .normal-accent {
        background: radial-gradient(circle, #10b981 0%, transparent 70%);
        border-radius: 16px 0 16px 0;
      }

      .offline-accent {
        background: radial-gradient(circle, #6b7280 0%, transparent 70%);
        border-radius: 16px 0 16px 0;
      }

      .info-accent {
        background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
        border-radius: 16px 0 16px 0;
      }

      .success-accent {
        background: radial-gradient(circle, #10b981 0%, transparent 70%);
        border-radius: 16px 0 16px 0;
      }

      .kpi-card-mini:hover {
        transform: translateY(-6px) scale(1.02);
        box-shadow: 
          0 16px 40px rgba(16, 185, 129, 0.15),
          0 4px 16px rgba(0, 0, 0, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
        border-color: rgba(16, 185, 129, 0.3);
      }

      .kpi-card-mini.has-issues {
        border-color: rgba(239, 68, 68, 0.3);
      }

      .kpi-card-mini.critical-card.has-issues {
        animation: pulseGlowCritical 2s ease-in-out infinite;
      }

      @keyframes pulseGlowCritical {
        0%, 100% {
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.06),
            0 2px 8px rgba(239, 68, 68, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }
        50% {
          box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.08),
            0 4px 16px rgba(239, 68, 68, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
        }
      }

      .kpi-card-mini.highlight {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.08));
        border-color: rgba(16, 185, 129, 0.3);
      }

      .kpi-icon-mini {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);

        .icon-bg-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.1;
          background-image: 
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.1) 0%, transparent 50%);
        }

        mat-icon {
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .status-pulse {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid currentColor;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 3;
        }

        .status-pulse.active {
          opacity: 1;
          animation: pulseDot 2s ease-in-out infinite;
        }

        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
      }

      @media (min-width: 480px) {
        .kpi-icon-mini {
          width: 52px;
          height: 52px;
          border-radius: 13px;
        }
      }

      @media (min-width: 768px) {
        .kpi-icon-mini {
          width: 56px;
          height: 56px;
          border-radius: 14px;
        }
      }

      @media (min-width: 1024px) {
        .kpi-icon-mini {
          width: 60px;
          height: 60px;
          border-radius: 15px;
        }
      }

      .kpi-card-mini:hover .kpi-icon-mini {
        transform: scale(1.15) rotate(8deg);
        box-shadow: 
          0 8px 24px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.4);
      }

      .kpi-icon-mini.critical {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(239, 68, 68, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      .kpi-icon-mini.warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(245, 158, 11, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      .kpi-icon-mini.normal {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(16, 185, 129, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      .kpi-icon-mini.offline {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(107, 114, 128, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      .kpi-icon-mini.info {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(59, 130, 246, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      .kpi-icon-mini.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(16, 185, 129, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      .kpi-icon-mini mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      @media (min-width: 480px) {
        .kpi-icon-mini mat-icon {
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      @media (min-width: 768px) {
        .kpi-icon-mini mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      @media (min-width: 1024px) {
        .kpi-icon-mini mat-icon {
          font-size: 26px;
          width: 26px;
          height: 26px;
        }
      }

      .kpi-content-mini {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        min-width: 0;
      }

      .kpi-header-mini {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }

      .kpi-value-mini {
        font-size: 1.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.5px;
      }

      .critical-card .kpi-value-mini {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .warning-card .kpi-value-mini {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .normal-card .kpi-value-mini {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .offline-card .kpi-value-mini {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .total-sensors-card .kpi-value-mini {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .online-rate-card .kpi-value-mini {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      @media (min-width: 480px) {
        .kpi-value-mini {
          font-size: 1.625rem;
        }
      }

      @media (min-width: 768px) {
        .kpi-value-mini {
          font-size: 1.75rem;
        }
      }

      @media (min-width: 1024px) {
        .kpi-value-mini {
          font-size: 2rem;
        }
      }

      .kpi-badge {
        padding: 0.25rem 0.625rem;
        border-radius: 10px;
        font-size: 0.5625rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        white-space: nowrap;
        animation: pulseBadge 2s ease-in-out infinite;
      }

      .critical-badge {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
      }

      .warning-badge {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: white;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
      }

      .normal-badge {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
      }

      .offline-badge {
        background: linear-gradient(135deg, #6b7280, #4b5563);
        color: white;
        box-shadow: 0 2px 8px rgba(107, 114, 128, 0.4);
      }

      @keyframes pulseBadge {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.9; transform: scale(1.05); }
      }

      .kpi-trend-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        transition: all 0.3s ease;
        flex-shrink: 0;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }

        &.up {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }

        &.down {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
      }

      .kpi-label-mini {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        opacity: 0.9;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      @media (min-width: 480px) {
        .kpi-label-mini {
          font-size: 0.8125rem;
        }
      }

      @media (min-width: 768px) {
        .kpi-label-mini {
          font-size: 0.875rem;
        }
      }

      // Progress bar
      .kpi-progress-mini {
        width: 100%;
        height: 4px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 10px;
        overflow: hidden;
        margin-top: 0.25rem;
        position: relative;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .progress-fill {
        height: 100%;
        border-radius: 10px;
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: progressShimmer 2s ease-in-out infinite;
        }
      }

      @keyframes progressShimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .critical-progress {
        background: linear-gradient(90deg, #ef4444, #f87171);
        box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
      }

      .warning-progress {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
        box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
      }

      .normal-progress {
        background: linear-gradient(90deg, #10b981, #34d399);
        box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
      }

      .offline-progress {
        background: linear-gradient(90deg, #6b7280, #9ca3af);
        box-shadow: 0 0 6px rgba(107, 114, 128, 0.4);
      }

      .info-progress {
        background: linear-gradient(90deg, #3b82f6, #60a5fa);
        box-shadow: 0 0 6px rgba(59, 130, 246, 0.4);
      }

      .success-progress {
        background: linear-gradient(90deg, #10b981, #34d399);
        box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
      }

      /* Main Content Grid - Mobile First */
      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 0 1rem 5rem 1rem;
        max-width: 1600px;
        width: 100%;
        margin: 0 auto;
        box-sizing: border-box;
      }

      /* 480px+ - Small tablets - still stacked */
      @media (min-width: 480px) {
        .main-content {
          padding: 0 1.25rem 5.5rem 1.25rem;
          gap: 1.25rem;
        }
      }

      /* 768px+ - Tablets - two columns */
      @media (min-width: 768px) {
        .main-content {
          display: grid;
          grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
          gap: 1.5rem;
          padding: 0 1.5rem 6rem 1.5rem;
        }
      }

      /* 1024px+ - Desktops */
      @media (min-width: 1024px) {
        .main-content {
          grid-template-columns: minmax(360px, 420px) minmax(0, 1fr);
          gap: 1.5rem;
          padding: 0 2rem 2rem 2rem;
        }
      }

      /* 1440px+ - Large screens */
      @media (min-width: 1440px) {
        .main-content {
          grid-template-columns: minmax(460px, 520px) minmax(0, 1fr);
          gap: 1.5rem;
          padding: 0 2rem 2rem 2rem;
        }
      }

      .main-content.compact {
        gap: 0.75rem;
      }

      @media (min-width: 768px) {
        .main-content.compact {
          grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
          gap: 1rem;
        }
      }

      @media (min-width: 1024px) {
        .main-content.compact {
          grid-template-columns: minmax(340px, 400px) minmax(0, 1fr);
          gap: 1rem;
        }
      }

      @media (min-width: 1440px) {
        .main-content.compact {
          grid-template-columns: minmax(420px, 480px) minmax(0, 1fr);
          gap: 1rem;
        }
      }

      /* Dark theme support */
      :host-context(body.dark-theme) .sensor-readings-layout {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      }

      :host-context(body.dark-theme) .kpi-card-mini {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
        border-color: rgba(52, 211, 153, 0.2);
        box-shadow: 
          0 4px 16px rgba(0, 0, 0, 0.4),
          0 2px 8px rgba(16, 185, 129, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      :host-context(body.dark-theme) .kpi-card-mini:hover {
        border-color: rgba(52, 211, 153, 0.4);
        box-shadow: 
          0 16px 40px rgba(0, 0, 0, 0.5),
          0 4px 16px rgba(16, 185, 129, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
      }

      :host-context(body.dark-theme) .kpi-card-mini.highlight {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1));
        border-color: rgba(52, 211, 153, 0.3);
      }

      :host-context(body.dark-theme) .kpi-card-mini.has-issues {
        border-color: rgba(239, 68, 68, 0.4);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.critical {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(239, 68, 68, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(245, 158, 11, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.normal {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(16, 185, 129, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.offline {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(107, 114, 128, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.info {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(59, 130, 246, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      :host-context(body.dark-theme) .kpi-icon-mini.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        box-shadow: 
          0 4px 16px rgba(16, 185, 129, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      :host-context(body.dark-theme) .kpi-value-mini {
        background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      :host-context(body.dark-theme) .critical-card .kpi-value-mini {
        background: linear-gradient(135deg, #fca5a5 0%, #ef4444 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      :host-context(body.dark-theme) .warning-card .kpi-value-mini {
        background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      :host-context(body.dark-theme) .normal-card .kpi-value-mini {
        background: linear-gradient(135deg, #6ee7b7 0%, #10b981 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      :host-context(body.dark-theme) .offline-card .kpi-value-mini {
        background: linear-gradient(135deg, #cbd5e1 0%, #6b7280 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      :host-context(body.dark-theme) .total-sensors-card .kpi-value-mini {
        background: linear-gradient(135deg, #93c5fd 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      :host-context(body.dark-theme) .online-rate-card .kpi-value-mini {
        background: linear-gradient(135deg, #6ee7b7 0%, #10b981 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      :host-context(body.dark-theme) .kpi-label-mini {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .kpi-progress-mini {
        background: rgba(255, 255, 255, 0.05);
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
      }

      :host-context(body.dark-theme) .kpi-trend-indicator {
        background: rgba(52, 211, 153, 0.15);
        color: #34d399;
      }

      :host-context(body.dark-theme) .kpi-trend-indicator.up {
        background: rgba(52, 211, 153, 0.2);
        color: #6ee7b7;
      }

      :host-context(body.dark-theme) .kpi-trend-indicator.down {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
      }

      /* Smooth scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(16, 185, 129, 0.3);
        border-radius: 4px;
        transition: background 0.2s;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(16, 185, 129, 0.5);
      }

      :host-context(body.dark-theme) ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
      }

      :host-context(body.dark-theme) ::-webkit-scrollbar-thumb {
        background: rgba(16, 185, 129, 0.4);
      }
    `,
  ],
})
export class SensorReadingsComponent implements OnInit {
  // Injected services
  private apiService = inject(ApiService);
  private farmManagement = inject(FarmManagementService);
  private notifications = inject(NotificationService);
  public languageService = inject(LanguageService);
  private readingsMap = inject(ReadingsMapService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // State signals
  loading = signal(false);
  farms = signal<Farm[]>([]);
  devices = signal<Device[]>([]);
  sensors = signal<SensorWithThresholds[]>([]);
  sensorReadings = signal<SensorReading[]>([]);

  filterState = signal<FilterState>({
    farmId: '',
    sensorType: 'all',
    timeRange: '1h',
    searchQuery: '',
  });

  selectedSensorId = signal<string | null>(null);
  pinnedSensorIds = signal<Set<string>>(new Set());
  autoRefreshEnabled = signal(true);
  density = signal<'comfortable' | 'compact'>('comfortable');

  // Computed: Sensor statuses
  sensorStatuses = computed(() => {
    const sensorsData = this.sensors();
    const readings = this.sensorReadings();

    return sensorsData.map((sensor) =>
      calculateSensorStatus(sensor, readings, {
        offline: this.languageService.t()('sensorReadings.noRecentData'),
        optimal: this.languageService.t()('sensorReadings.optimalRange'),
        belowMin: this.languageService.t()('sensorReadings.belowMinimum'),
        aboveMax: this.languageService.t()('sensorReadings.aboveMaximum'),
        belowOptimal: this.languageService.t()('sensorReadings.belowOptimal'),
        aboveOptimal: this.languageService.t()('sensorReadings.aboveOptimal'),
      })
    );
  });

  // Computed: Filtered & sorted device list items
  deviceListItems = computed(() => {
    const statuses = this.sensorStatuses();
    const filters = this.filterState();
    const pinned = this.pinnedSensorIds();
    const devicesData = this.devices();
    const sensorsData = this.sensors();

    let filtered = statuses.map((statusResult, idx) => {
      const sensor = sensorsData[idx];
      const device = devicesData.find((d) => d.device_id === sensor.device_id);

      return {
        statusResult,
        sensor,
        device,
      };
    });

    // Apply farm filter
    if (filters.farmId) {
      filtered = filtered.filter((item) => item.device?.farm_id === filters.farmId);
    }

    // Apply type filter
    if (filters.sensorType !== 'all') {
      filtered = filtered.filter(
        (item) => item.sensor.type?.toLowerCase() === filters.sensorType
      );
    }

    // Apply search filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.sensor.sensor_id?.toLowerCase().includes(query) ||
          item.sensor.type?.toLowerCase().includes(query) ||
          item.device?.name?.toLowerCase().includes(query)
      );
    }

    // Map to DeviceListItem with unique IDs
    // Track seen IDs to ensure absolute uniqueness (prevents Angular tracking errors)
    const seenIds = new Set<string>();
    const items: DeviceListItem[] = filtered.map((item, index) => {
      // Generate unique ID that includes sensor type (for composite sensors like DHT11)
      let uniqueId = generateUniqueSensorId(
        item.sensor.sensor_id,
        item.sensor.type || 'unknown',
        item.sensor.unit
      );

      // Ensure absolute uniqueness by adding index if duplicate found
      // This prevents Angular NG0955 tracking errors
      if (seenIds.has(uniqueId)) {
        uniqueId = `${uniqueId}-${index}`;
      }
      seenIds.add(uniqueId);

      return {
        id: uniqueId,
        name: item.sensor.sensor_id || 'Unknown',
        type: item.sensor.type || 'Unknown',
        status: item.statusResult.status,
        value: item.statusResult.value,
        unit: item.sensor.unit || '',
        lastUpdate: item.statusResult.lastReading?.createdAt
          ? new Date(item.statusResult.lastReading.createdAt)
          : null,
        isPinned: pinned.has(uniqueId),
        actionPurpose: extractActionPurpose(item.sensor.action_low, item.sensor.action_high),
        sensorDbId: item.sensor.id, // Store database ID for direct matching
      };
    });

    // Additional deduplication by ID to prevent tracking errors (keep first occurrence)
    const uniqueItems = new Map<string, DeviceListItem>();
    items.forEach(item => {
      if (!uniqueItems.has(item.id)) {
        uniqueItems.set(item.id, item);
      }
    });

    // Sort: pinned first, then by status priority (critical > warning > offline > normal)
    const statusPriority = { critical: 0, warning: 1, offline: 2, normal: 3 };
    return Array.from(uniqueItems.values()).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return statusPriority[a.status] - statusPriority[b.status];
    });
  });

  // Signal to store historical data for selected sensor
  private historicalReadings = signal<Map<string, SensorReading[]>>(new Map());

  // Computed: Selected device detail
  selectedDeviceDetail = computed(() => {
    const uniqueSensorId = this.selectedSensorId();
    if (!uniqueSensorId) return null;

    // First, try to find the sensor by database ID from the device list items
    // This handles cases where duplicate sensors have index suffixes (e.g., "dht11-humidity-1")
    const items = this.deviceListItems();
    const selectedItem = items.find(item => item.id === uniqueSensorId);
    
    let sensor: SensorWithThresholds | undefined;
    
    if (selectedItem?.sensorDbId) {
      // Direct match by database ID (most reliable for duplicate sensors)
      sensor = this.sensors().find(s => s.id === selectedItem.sensorDbId);
    }
    
    if (!sensor) {
      // Fallback: Parse the unique ID to get base sensor ID and type
      const { baseSensorId, type } = parseUniqueSensorId(uniqueSensorId);
      
      // Find the sensor that matches both the base ID and type
      const sensors = this.sensors();
      sensor = sensors.find((s) => {
        const matches = s.sensor_id === baseSensorId;
        const typeMatches = s.type?.toLowerCase().replace(/\s+/g, '-') === type;
        return matches && typeMatches;
      });
    }

    if (!sensor) return null;

    const statuses = this.sensorStatuses();
    const sensors = this.sensors();
    const statusIndex = sensors.findIndex((s) => s === sensor);
    const statusResult = statusIndex >= 0 ? statuses[statusIndex] : null;

    if (!statusResult) return null;

    const timeRangeMs = this.getTimeRangeMs(this.filterState().timeRange);

    // Get historical data if available, otherwise use in-memory readings
    // Try both sensor.sensor_id and baseSensorId as fallback
    const { baseSensorId } = parseUniqueSensorId(uniqueSensorId);
    const historicalData = this.historicalReadings().get(sensor.sensor_id) || 
                          this.historicalReadings().get(baseSensorId) || 
                          [];
    const inMemoryData = this.readingsMap.getReadingsForSensor(sensor.sensor_id, timeRangeMs);

    // Combine and deduplicate by timestamp
    const allReadings = new Map<number, { timestamp: Date; value: number }>();

    // Add historical data
    historicalData.forEach(reading => {
      const timestamp = new Date(reading.createdAt).getTime();
      const cutoff = Date.now() - timeRangeMs;
      if (timestamp >= cutoff) {
        allReadings.set(timestamp, {
          timestamp: new Date(reading.createdAt),
          value: reading.value1 ?? 0
        });
      }
    });

    // Add in-memory data (may override historical if same timestamp)
    inMemoryData.forEach(reading => {
      const timestamp = reading.timestamp.getTime();
      allReadings.set(timestamp, reading);
    });

    // Convert to array and sort by timestamp
    const chartData = Array.from(allReadings.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const thresholds = normalizeThresholds(sensor.type || '', {
      min: sensor.min_threshold ?? sensor.min_critical,
      max: sensor.max_threshold ?? sensor.max_critical,
      optimal_min: sensor.optimal_min ?? sensor.min_warning,
      optimal_max: sensor.optimal_max ?? sensor.max_warning,
    });

    // Calculate delta (1h ago vs now)
    let delta1h: number | undefined;
    if (chartData.length > 1) {
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const oldReading = chartData.find((r) => r.timestamp.getTime() <= oneHourAgo);
      if (oldReading) {
        delta1h = statusResult.value - oldReading.value;
      }
    }

    const detail: DeviceDetail = {
      id: uniqueSensorId,
      name: sensor.sensor_id || 'Unknown',
      type: sensor.type || 'Unknown',
      status: statusResult.status,
      currentValue: statusResult.value,
      unit: sensor.unit || '',
      lastUpdate: statusResult.lastReading?.createdAt
        ? new Date(statusResult.lastReading.createdAt)
        : null,
      delta1h,
      thresholds: {
        min: thresholds.min,
        max: thresholds.max,
        optimalMin: thresholds.optimal_min,
        optimalMax: thresholds.optimal_max,
      },
      chartData: chartData.map((r) => ({ name: r.timestamp, value: r.value })),
    };

    return detail;
  });

  // Computed: Summary counts
  summaryCounts = computed(() => {
    const items = this.deviceListItems();
    return items.reduce(
      (acc, item) => {
        acc[item.status]++;
        return acc;
      },
      { normal: 0, warning: 0, critical: 0, offline: 0 } as SummaryCounts
    );
  });

  // Computed: Overall status
  overallStatus = computed(() => {
    const counts = this.summaryCounts();
    if (counts.critical > 0) return 'critical';
    if (counts.warning > 0) return 'warning';
    if (counts.offline === counts.normal + counts.warning + counts.critical + counts.offline && counts.offline > 0)
      return 'offline';
    return 'normal';
  });

  overallTitle = computed(() => {
    const status = this.overallStatus();
    const messages = {
      critical: this.languageService.t()('sensorReadings.criticalConditions'),
      warning: this.languageService.t()('sensorReadings.attentionNeeded'),
      offline: this.languageService.t()('sensorReadings.noData'),
      normal: this.languageService.t()('sensorReadings.allGood'),
    };
    return messages[status];
  });

  summarySubtitle = computed(() => {
    const total = this.deviceListItems().length;
    const selectedFarm = this.farmManagement.getSelectedFarm();
    if (selectedFarm) {
      return `${total} ${this.languageService.t()('sensors.title')} ${this.languageService.t()('common.in')} ${selectedFarm.name}`;
    }
    return `${total} ${this.languageService.t()('sensors.title')} ${this.languageService.t()('sensorReadings.acrossAllFarms')}`;
  });

  constructor() {
    // Sync URL to selection
    effect(() => {
      const sensorId = this.selectedSensorId();
      if (sensorId) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { sensor: sensorId },
          queryParamsHandling: 'merge',
        });
      }
    });

    // Load historical data when sensor is selected or time range changes
    effect(() => {
      const uniqueSensorId = this.selectedSensorId();
      const timeRange = this.filterState().timeRange;

      if (uniqueSensorId) {
        // Find the actual sensor to get its sensor_id
        const items = this.deviceListItems();
        const selectedItem = items.find(item => item.id === uniqueSensorId);
        
        let sensorId: string | null = null;
        
        if (selectedItem?.sensorDbId) {
          // Get sensor by database ID
          const sensor = this.sensors().find(s => s.id === selectedItem.sensorDbId);
          sensorId = sensor?.sensor_id || null;
        }
        
        if (!sensorId) {
          // Fallback: Parse the unique ID to get base sensor ID
          const { baseSensorId } = parseUniqueSensorId(uniqueSensorId);
          sensorId = baseSensorId;
        }

        if (sensorId) {
          // Load historical data using the actual sensor_id
          this.loadHistoricalData(sensorId, timeRange);
        }
      }
    });
  }

  ngOnInit() {
    // Initial data load
    this.loadAllData();

    // Listen to farm selection changes
    this.farmManagement.selectedFarm$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedFarm: Farm | null) => {
        if (selectedFarm) {
          this.filterState.update((state) => ({ ...state, farmId: selectedFarm.farm_id }));
          this.loadAllData();
        }
      });

    // Auto-refresh setup
    interval(10000)
      .pipe(
        startWith(0),
        switchMap(() => {
          if (this.autoRefreshEnabled()) {
            return this.softRefresh();
          }
          return EMPTY;
        }),
        catchError((err) => {
          console.error('Auto-refresh error:', err);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Restore selection from URL with backward compatibility
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['sensor']) {
        const queryParam = params['sensor'];
        const items = this.deviceListItems();

        // First, try to find exact match (new format: "dht11-temperature")
        let matchingItem = items.find(item => item.id === queryParam);

        // If no exact match, try to find a sensor that starts with the query param
        // This provides backward compatibility for URLs like "?sensor=dht11"
        if (!matchingItem) {
          matchingItem = items.find(item => item.id.startsWith(queryParam + '-'));
        }

        // Set the selected sensor ID (will be the unique ID)
        if (matchingItem) {
          this.selectedSensorId.set(matchingItem.id);
        } else {
          this.selectedSensorId.set(queryParam); // Fallback to original param
        }
      }
    });
  }

  async loadAllData() {
    this.loading.set(true);
    try {
      const [farms, devices, sensors, readings] = await Promise.all([
        firstValueFrom(this.apiService.getFarms()),
        firstValueFrom(this.apiService.getDevices(true)),
        firstValueFrom(this.apiService.getSensors()),
        firstValueFrom(this.apiService.getSensorReadings(200)),
      ]);

      this.farms.set(farms || []);
      this.devices.set(devices || []);
      this.sensors.set(this.enhanceSensorsWithThresholds(sensors || []));
      this.sensorReadings.set(readings || []);
      this.readingsMap.setReadings(readings || []);

      // Auto-select first item if none selected (using unique ID)
      if (!this.selectedSensorId() && this.deviceListItems().length > 0) {
        const firstItem = this.deviceListItems()[0];
        this.selectedSensorId.set(firstItem.id); // Already uses unique ID format
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.notifications.notify('critical', 'Error', 'Failed to load sensor data');
    } finally {
      this.loading.set(false);
    }
  }

  private async softRefresh() {
    try {
      const readings = await firstValueFrom(this.apiService.getSensorReadings(200));
      this.sensorReadings.set(readings || []);
      this.readingsMap.setReadings(readings || []);
    } catch (error) {
      console.error('Soft refresh error:', error);
    }
  }

  private enhanceSensorsWithThresholds(sensors: Sensor[]): SensorWithThresholds[] {
    return sensors.map((sensor) => ({
      ...sensor,
      name: `Sensor ${sensor.id}`,
      sensor_type: sensor.type,
    }));
  }

  private getTimeRangeMs(range: FilterState['timeRange']): number {
    const ranges = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };
    return ranges[range];
  }

  // Event handlers
  onFilterChange(changes: Partial<FilterState>) {
    this.filterState.update((state) => ({ ...state, ...changes }));
  }

  refreshData() {
    this.loadAllData();
  }

  toggleAutoRefresh(enabled: boolean) {
    this.autoRefreshEnabled.set(enabled);
  }

  toggleDensity(density: 'comfortable' | 'compact') {
    this.density.set(density);
  }

  selectSensor(sensorId: string) {
    this.selectedSensorId.set(sensorId);
  }

  togglePin(sensorId: string) {
    this.pinnedSensorIds.update((pinned) => {
      const newSet = new Set(pinned);
      if (newSet.has(sensorId)) {
        newSet.delete(sensorId);
      } else {
        newSet.add(sensorId);
      }
      return newSet;
    });
  }

  getOnlinePercentage(): number {
    const items = this.deviceListItems();
    if (items.length === 0) return 0;
    const online = items.filter(item => item.status !== 'offline').length;
    return Math.round((online / items.length) * 100);
  }

  getPercentage(count: number): number {
    const total = this.deviceListItems().length;
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  /**
   * Load historical data for a sensor based on the selected time range
   */
  private async loadHistoricalData(sensorId: string, timeRange: FilterState['timeRange']) {
    try {
      const timeRangeMs = this.getTimeRangeMs(timeRange);
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeRangeMs);

      console.log(`[SensorReadings] Loading historical data for sensor ${sensorId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Fetch historical data from API
      const historicalReadings = await firstValueFrom(
        this.apiService.getReadingsByDateRange(sensorId, startDate, endDate, 1000).pipe(
          catchError((error) => {
            console.error(`[SensorReadings] API error loading historical data for ${sensorId}:`, error);
            return of([]); // Return empty array on error
          })
        )
      );

      // Update historical readings map with both sensorId and any baseSensorId variants
      this.historicalReadings.update((map) => {
        const newMap = new Map(map);
        const readings = historicalReadings || [];
        newMap.set(sensorId, readings);
        
        // Also store with baseSensorId if different (for fallback lookup)
        const uniqueSensorId = this.selectedSensorId();
        if (uniqueSensorId) {
          const { baseSensorId } = parseUniqueSensorId(uniqueSensorId);
          if (baseSensorId !== sensorId && !newMap.has(baseSensorId)) {
            newMap.set(baseSensorId, readings);
          }
        }
        
        return newMap;
      });

      console.log(`[SensorReadings] Loaded ${historicalReadings?.length || 0} historical readings for ${sensorId}`);
      
      if (historicalReadings && historicalReadings.length === 0) {
        console.warn(`[SensorReadings] No historical readings found for sensor ${sensorId} in the selected time range`);
      }
    } catch (error) {
      console.error(`[SensorReadings] Error loading historical data for ${sensorId}:`, error);
      // Set empty array to prevent retry loops
      this.historicalReadings.update((map) => {
        const newMap = new Map(map);
        newMap.set(sensorId, []);
        return newMap;
      });
    }
  }
}

