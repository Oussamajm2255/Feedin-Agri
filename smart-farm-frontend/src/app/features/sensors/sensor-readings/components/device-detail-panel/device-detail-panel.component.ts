import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SensorStatus } from '../../utils/sensor-status.util';

export interface DeviceDetail {
  id: string;
  name: string;
  type: string;
  status: SensorStatus;
  currentValue: number;
  unit: string;
  lastUpdate: Date | null;
  delta1h?: number;
  thresholds: {
    min: number;
    max: number;
    optimalMin: number;
    optimalMax: number;
  };
  chartData: Array<{ name: Date; value: number }>;
}

@Component({
  selector: 'app-device-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatMenuModule,
    NgxChartsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="detail-panel">
      @if (loading()) {
        <!-- Loading Skeleton -->
        <div class="loading-detail">
          <div class="skeleton-header">
            <div class="skeleton-circle large"></div>
            <div class="skeleton-content">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
          <div class="skeleton-chart"></div>
        </div>
      } @else if (device()) {
        <!-- Panel Title Section -->
        <div class="panel-title-section">
          <div class="title-content">
            <div class="title-icon-wrapper">
              <mat-icon class="title-icon">sensors</mat-icon>
            </div>
            <div class="title-text">
              <h1 class="panel-title">Sensor Details</h1>
              <p class="panel-subtitle">Real-time monitoring and insights</p>
            </div>
          </div>
          <div class="title-divider"></div>
        </div>

        <!-- Device Header -->
        <div class="detail-header" [class]="'status-' + device()!.status">
          <div class="header-left">
            <div class="status-icon" [class]="'icon-' + device()!.status">
              <div class="icon-glow"></div>
              <div class="icon-inner-wrapper">
                <div class="icon-background"></div>
                <mat-icon class="icon-element">{{ getStatusIcon(device()!.status) }}</mat-icon>
                <div class="icon-shine"></div>
              </div>
              @if (device()!.status === 'normal') {
                <div class="status-pulse active"></div>
              }
              @if (device()!.status === 'critical' || device()!.status === 'warning') {
                <div class="status-alert-ring"></div>
              }
            </div>
            <div class="header-info">
              <div class="device-name-row">
                <h2>{{ device()!.name }}</h2>
                <div class="device-type-badge">
                  <mat-icon class="type-icon">sensors</mat-icon>
                  <span>{{ device()!.type }}</span>
                </div>
              </div>
              <div class="status-description">
                <mat-icon class="description-icon">{{ getStatusDescriptionIcon(device()!.status) }}</mat-icon>
                <span>{{ getStatusDescription(device()!.status) }}</span>
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="status-chip" [class]="'chip-' + device()!.status">
              <div class="chip-glow"></div>
              <mat-icon class="chip-icon">{{ getStatusIcon(device()!.status) }}</mat-icon>
              <span class="chip-text">{{ getStatusLabel(device()!.status) }}</span>
            </div>
            <div class="health-indicator" [class]="'health-' + device()!.status">
              <div class="health-bar">
                <div class="health-fill" [style.width.%]="getHealthPercentage(device()!.status)"></div>
              </div>
              <span class="health-label">Health: {{ getHealthPercentage(device()!.status) }}%</span>
            </div>
          </div>
        </div>

        <!-- KPIs -->
        <div class="kpi-section">
          <div class="kpi-card primary" [class]="getValueStatusClass(device()!.currentValue)">
            <div class="kpi-icon-wrapper">
              <div class="kpi-icon-bg"></div>
              <mat-icon class="kpi-icon">thermostat</mat-icon>
              <div class="kpi-status-indicator" [class]="'indicator-' + getValueStatus(device()!.currentValue)"></div>
            </div>
            <div class="kpi-content">
              <div class="kpi-label-row">
                <span class="kpi-label">Current Reading</span>
                <div class="kpi-status-badge" [class]="'badge-' + getValueStatus(device()!.currentValue)">
                  <mat-icon>{{ getValueStatusIcon(device()!.currentValue) }}</mat-icon>
                  <span>{{ getZoneStatus(device()!.currentValue) }}</span>
                </div>
              </div>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ device()!.currentValue | number: '1.0-2' }}</span>
                <span class="kpi-unit">{{ device()!.unit }}</span>
              </div>
              @if (device()!.delta1h !== undefined && device()!.delta1h !== null) {
                <div class="kpi-delta-row">
                  <div class="kpi-delta" [class.positive]="device()!.delta1h! > 0" [class.negative]="device()!.delta1h! < 0" [class.neutral]="device()!.delta1h === 0">
                    <mat-icon class="delta-icon">{{ device()!.delta1h! > 0 ? 'arrow_upward' : device()!.delta1h! < 0 ? 'arrow_downward' : 'remove' }}</mat-icon>
                    <span class="delta-value">{{ device()!.delta1h! > 0 ? '+' : '' }}{{ device()!.delta1h | number: '1.0-1' }} {{ device()!.unit }}</span>
                    <span class="delta-label">in last hour</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="kpi-card secondary">
            <div class="kpi-icon-wrapper">
              <div class="kpi-icon-bg"></div>
              <mat-icon class="kpi-icon">schedule</mat-icon>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Last Update</span>
              <div class="kpi-text-row">
                <span class="kpi-text-primary">{{ formatDateTime(device()!.lastUpdate) }}</span>
                <span class="kpi-text-secondary">{{ getTimeAgo(device()!.lastUpdate) }}</span>
              </div>
            </div>
          </div>

          <div class="kpi-card tertiary">
            <div class="kpi-icon-wrapper">
              <div class="kpi-icon-bg"></div>
              <mat-icon class="kpi-icon">insights</mat-icon>
            </div>
            <div class="kpi-content">
              <span class="kpi-label">Optimal Range</span>
              <div class="kpi-text-row">
                <span class="kpi-text-primary">{{ device()!.thresholds.optimalMin }} – {{ device()!.thresholds.optimalMax }} {{ device()!.unit }}</span>
                <span class="kpi-text-secondary">Safe operating zone</span>
              </div>
              <div class="kpi-range-indicator">
                <div class="range-bar">
                  <div class="range-min">{{ device()!.thresholds.min }}</div>
                  <div class="range-optimal" [style.left.%]="getRangePosition(device()!.thresholds.optimalMin, device()!.thresholds.min, device()!.thresholds.max)" [style.width.%]="getRangeWidth(device()!.thresholds.optimalMin, device()!.thresholds.optimalMax, device()!.thresholds.min, device()!.thresholds.max)"></div>
                  <div class="range-max">{{ device()!.thresholds.max }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Threshold Visual -->
        <div class="threshold-section">
          <div class="threshold-header">
            <div class="header-left">
              <div class="header-icon-wrapper">
                <mat-icon>tune</mat-icon>
              </div>
              <div class="header-text">
                <h3>Threshold Zones</h3>
                <p class="header-subtitle">Monitor your sensor's safe operating range</p>
              </div>
            </div>
            <div class="current-value-display" [class]="getValueStatusClass(device()!.currentValue)">
              <div class="value-label">Current</div>
              <div class="value-number">{{ device()!.currentValue | number:'1.0-2' }}</div>
              <div class="value-unit">{{ device()!.unit }}</div>
            </div>
          </div>

          <div class="threshold-zones-container">
            <!-- Zone Legend -->
            <div class="zone-legend">
              <div class="zone-item optimal">
                <div class="zone-indicator"></div>
                <span class="zone-label">Optimal</span>
                <span class="zone-range">{{ device()!.thresholds.optimalMin }} - {{ device()!.thresholds.optimalMax }} {{ device()!.unit }}</span>
              </div>
              <div class="zone-item warning">
                <div class="zone-indicator"></div>
                <span class="zone-label">Warning</span>
                <span class="zone-range">Outside optimal range</span>
              </div>
              <div class="zone-item critical">
                <div class="zone-indicator"></div>
                <span class="zone-label">Critical</span>
                <span class="zone-range">Immediate action needed</span>
              </div>
            </div>

            <!-- Visual Threshold Bar -->
            <div class="threshold-bar">
              <div class="bar-track">
                <!-- Critical Zone (Left) -->
                <div
                  class="zone critical-zone-left"
                  [style.width.%]="getPosition(device()!.thresholds.optimalMin)"
                  [matTooltip]="'Critical Zone: Below ' + device()!.thresholds.optimalMin + ' ' + device()!.unit"
                >
                  <div class="zone-pattern"></div>
                </div>
                
                <!-- Optimal Zone -->
                <div
                  class="zone optimal-zone"
                  [style.left.%]="getPosition(device()!.thresholds.optimalMin)"
                  [style.width.%]="getWidth(device()!.thresholds.optimalMin, device()!.thresholds.optimalMax)"
                  [matTooltip]="'Optimal Zone: ' + device()!.thresholds.optimalMin + ' - ' + device()!.thresholds.optimalMax + ' ' + device()!.unit"
                >
                  <div class="zone-glow"></div>
                  <div class="zone-label-overlay">OPTIMAL</div>
                </div>
                
                <!-- Critical Zone (Right) -->
                <div
                  class="zone critical-zone-right"
                  [style.left.%]="getPosition(device()!.thresholds.optimalMax)"
                  [style.width.%]="100 - getPosition(device()!.thresholds.optimalMax)"
                  [matTooltip]="'Critical Zone: Above ' + device()!.thresholds.optimalMax + ' ' + device()!.unit"
                >
                  <div class="zone-pattern"></div>
                </div>

                <!-- Current Value Marker -->
                <div
                  class="current-marker"
                  [style.left.%]="getPosition(device()!.currentValue)"
                  [class.in-optimal]="isInOptimalZone(device()!.currentValue)"
                  [class.in-warning]="isInWarningZone(device()!.currentValue)"
                  [class.in-critical]="isInCriticalZone(device()!.currentValue)"
                  [matTooltip]="'Current Value: ' + device()!.currentValue + ' ' + device()!.unit + ' (' + getZoneStatus(device()!.currentValue) + ')'"
                >
                  <div class="marker-pulse"></div>
                  <div class="marker-value">{{ device()!.currentValue | number:'1.0-2' }}</div>
                </div>
              </div>

              <!-- Threshold Labels -->
              <div class="threshold-labels">
                <div class="label-container">
                  <span class="label-value">{{ device()!.thresholds.min }}</span>
                  <span class="label-text">Min</span>
                </div>
                <div class="label-container optimal-start">
                  <span class="label-value">{{ device()!.thresholds.optimalMin }}</span>
                  <span class="label-text">Optimal Start</span>
                </div>
                <div class="label-container optimal-end">
                  <span class="label-value">{{ device()!.thresholds.optimalMax }}</span>
                  <span class="label-text">Optimal End</span>
                </div>
                <div class="label-container">
                  <span class="label-value">{{ device()!.thresholds.max }}</span>
                  <span class="label-text">Max</span>
                </div>
              </div>
            </div>

            <!-- Status Message -->
            <div class="status-message" [class]="getValueStatusClass(device()!.currentValue)">
              <div class="status-icon-wrapper">
                <mat-icon class="status-icon">{{ getValueStatusIcon(device()!.currentValue) }}</mat-icon>
                <div class="icon-pulse"></div>
              </div>
              <div class="status-text">
                <strong>{{ getZoneStatus(device()!.currentValue) }}</strong>
                <span>{{ getStatusMessage(device()!.currentValue) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div class="chart-section">
          <div class="chart-header">
            <div class="chart-header-left">
              <mat-icon>show_chart</mat-icon>
              <span>Historical Data</span>
            </div>
            <div class="chart-controls">
              <!-- View Toggle -->
              <mat-button-toggle-group [(value)]="viewMode" class="view-toggle-group" [appearance]="'standard'">
                <mat-button-toggle value="chart" matTooltip="Chart View">
                  <mat-icon>show_chart</mat-icon>
                </mat-button-toggle>
                <mat-button-toggle value="table" matTooltip="Table View">
                  <mat-icon>table_rows</mat-icon>
                </mat-button-toggle>
                <mat-button-toggle value="timeline" matTooltip="Timeline View">
                  <mat-icon>timeline</mat-icon>
                </mat-button-toggle>
              </mat-button-toggle-group>

              <!-- Export Menu -->
              <button mat-stroked-button [matMenuTriggerFor]="exportMenu" class="export-btn">
                <mat-icon>download</mat-icon>
                Export
              </button>
              <mat-menu #exportMenu="matMenu" class="export-menu">
                <button mat-menu-item (click)="exportToCSV()">
                  <mat-icon>description</mat-icon>
                  <span>Export CSV</span>
                </button>
                <button mat-menu-item (click)="exportToPDF()">
                  <mat-icon>picture_as_pdf</mat-icon>
                  <span>Export PDF</span>
                </button>
              </mat-menu>
            </div>
          </div>
          @if (chartSeriesData().length > 0) {
            <!-- Chart View -->
            @if (viewMode() === 'chart') {
              <div class="chart-container">
                <ngx-charts-line-chart
                  [results]="chartSeriesData()"
                  [xAxis]="true"
                  [yAxis]="true"
                  [showXAxisLabel]="false"
                  [showYAxisLabel]="false"
                  [timeline]="true"
                  [autoScale]="true"
                  [curve]="curveFunction"
                  [animations]="true"
                  [scheme]="colorScheme"
                  [showGridLines]="true"
                  [gradient]="true"
                >
                </ngx-charts-line-chart>
              </div>
            }

            <!-- Table View -->
            @if (viewMode() === 'table') {
              <div class="data-table-container">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (point of device()!.chartData; track point.name) {
                      <tr>
                        <td>{{ point.name | date:'short' }}</td>
                        <td>{{ point.value | number: '1.0-2' }} {{ device()!.unit }}</td>
                        <td>
                          <span class="table-status-badge" [class]="getValueStatus(point.value)">
                            {{ getValueStatus(point.value) | uppercase }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- Timeline View -->
            @if (viewMode() === 'timeline') {
              <div class="timeline-container">
                <div class="timeline-track"></div>
                @for (point of device()!.chartData; track point.name; let i = $index) {
                  <div class="timeline-entry" [style.animation-delay]="i * 30 + 'ms'">
                    <div class="timeline-marker" [class]="getValueStatus(point.value)">
                      <div class="timeline-dot"></div>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-time">{{ point.name | date:'short' }}</div>
                      <div class="timeline-value">
                        <span class="value-text">{{ point.value | number: '1.0-2' }}</span>
                        <span class="value-unit">{{ device()!.unit }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          } @else {
            <div class="no-chart-data">
              <mat-icon>timeline</mat-icon>
              <p>No historical data available</p>
            </div>
          }
        </div>
      } @else {
        <!-- Empty State -->
        <div class="empty-detail">
          <div class="empty-icon">
            <mat-icon>touch_app</mat-icon>
          </div>
          <h3>Select a Sensor</h3>
          <p>Choose a sensor from the list to view detailed information and charts</p>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .detail-panel {
        height: 100%;
        background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);
        border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        overflow: auto;
        animation: fadeInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0;
        border: 2px solid rgba(16, 185, 129, 0.1);
        position: relative;
        isolation: isolate;
      }

      @keyframes fadeInRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      // Panel Title Section
      .panel-title-section {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%);
        padding: 24px 28px;
        border-bottom: 2px solid rgba(16, 185, 129, 0.1);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #10b981, #059669, #10b981);
          background-size: 200% 100%;
          animation: shimmerTitle 3s ease-in-out infinite;
        }

        &::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
          border-radius: 50%;
          transform: translate(50%, -50%);
          pointer-events: none;
        }
      }

      @keyframes shimmerTitle {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .title-content {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        position: relative;
        z-index: 1;
      }

      .title-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 14px;
        box-shadow: 
          0 4px 16px rgba(16, 185, 129, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        flex-shrink: 0;
        transition: transform 0.3s ease;
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
          border-radius: 14px;
        }
      }

      .panel-title-section:hover .title-icon-wrapper {
        transform: scale(1.05) rotate(5deg);
      }

      .title-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
        position: relative;
        z-index: 1;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
      }

      .title-text {
        flex: 1;
        min-width: 0;
      }

      .panel-title {
        margin: 0 0 6px 0;
        font-size: 1.75rem;
        font-weight: 800;
        color: #10b981;
        letter-spacing: -0.5px;
        line-height: 1.2;
      }

      .panel-subtitle {
        margin: 0;
        font-size: 0.9375rem;
        color: #64748b;
        font-weight: 500;
        line-height: 1.5;
      }

      .title-divider {
        position: absolute;
        bottom: 0;
        left: 28px;
        right: 28px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent);
      }

      .loading-detail {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .skeleton-header {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .skeleton-circle {
        border-radius: 50%;
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }

      .skeleton-circle.large {
        width: 64px;
        height: 64px;
      }

      .skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .skeleton-line {
        height: 16px;
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        border-radius: 8px;
        animation: shimmer 1.5s infinite;
      }

      .skeleton-line.short {
        width: 60%;
      }

      .skeleton-chart {
        height: 300px;
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        border-radius: 16px;
        animation: shimmer 1.5s infinite;
      }

      /* Dark theme skeleton loading */
      :host-context(body.dark-theme) .skeleton-circle,
      :host-context(body.dark-theme) .skeleton-line,
      :host-context(body.dark-theme) .skeleton-chart {
        background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
        background-size: 200% 100%;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 28px;
        margin: 24px 28px 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
        border-radius: 18px;
        box-shadow: 
          0 4px 16px rgba(0, 0, 0, 0.06),
          0 2px 8px rgba(16, 185, 129, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.8);
        border: 2px solid rgba(16, 185, 129, 0.15);
        border-left: 4px solid transparent;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.08),
            0 4px 12px rgba(16, 185, 129, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border-color: rgba(16, 185, 129, 0.25);

          &::before {
            opacity: 1;
          }
        }
      }

      .detail-header.status-critical {
        border-left-color: #ef4444;
        border-color: rgba(239, 68, 68, 0.2);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
      }

      .detail-header.status-warning {
        border-left-color: #f59e0b;
        border-color: rgba(245, 158, 11, 0.2);
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
      }

      .detail-header.status-normal {
        border-left-color: #10b981;
        border-color: rgba(16, 185, 129, 0.2);
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
      }

      .detail-header.status-offline {
        border-left-color: #6b7280;
        border-color: rgba(107, 114, 128, 0.2);
        background: linear-gradient(135deg, rgba(107, 114, 128, 0.08) 0%, rgba(255, 255, 255, 0.95) 100%);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        flex: 1;
        min-width: 0;
      }

      .status-icon {
        width: 80px;
        height: 80px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border: 3px solid transparent;
        position: relative;
        overflow: visible;
        box-shadow: 
          0 4px 16px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);

        .icon-glow {
          position: absolute;
          inset: -4px;
          border-radius: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 0;
        }

        .icon-inner-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          overflow: hidden;
          z-index: 1;
        }

        .icon-background {
          position: absolute;
          inset: 0;
          border-radius: 20px;
          opacity: 0.1;
          transition: opacity 0.3s ease;
        }

        .icon-shine {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 45%,
            rgba(255, 255, 255, 0.5) 50%,
            rgba(255, 255, 255, 0.3) 55%,
            transparent 100%
          );
          transform: rotate(45deg);
          animation: shine 3s infinite;
          pointer-events: none;
        }

        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .icon-element {
          position: relative;
          z-index: 2;
          font-size: 40px;
          width: 40px;
          height: 40px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
          transition: transform 0.3s ease;
        }

        .status-pulse {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          border: 3px solid currentColor;
          opacity: 0;
          z-index: 3;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.5);
        }

        .status-pulse.active {
          opacity: 1;
          animation: pulseDot 2s ease-in-out infinite;
        }

        @keyframes pulseDot {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1; 
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.5);
          }
          50% { 
            transform: scale(1.2); 
            opacity: 0.8; 
            box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.3);
          }
        }

        .status-alert-ring {
          position: absolute;
          inset: -6px;
          border-radius: 20px;
          border: 2px solid currentColor;
          opacity: 0.6;
          z-index: 0;
          animation: alertRing 2s ease-in-out infinite;
        }

        @keyframes alertRing {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.9;
          }
        }
      }

      .detail-header:hover .status-icon {
        transform: scale(1.05);
        border-color: currentColor;
      }

      .detail-header:hover .status-icon .icon-element {
        transform: scale(1.1);
      }

      .detail-header:hover .status-icon .icon-glow {
        opacity: 0.8;
      }

      .detail-header:hover .status-icon .icon-background {
        opacity: 0.2;
      }

      .icon-normal {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 
          0 4px 16px rgba(16, 185, 129, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);

        .icon-glow {
          background: radial-gradient(circle, rgba(16, 185, 129, 0.5), transparent);
        }

        .icon-background {
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2), transparent);
        }

        .status-pulse {
          border-color: #10b981;
        }
      }

      .icon-warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #ffffff;
        border-color: rgba(245, 158, 11, 0.4);
        box-shadow: 
          0 4px 16px rgba(245, 158, 11, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);

        .icon-glow {
          background: radial-gradient(circle, rgba(245, 158, 11, 0.5), transparent);
        }

        .icon-background {
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.2), transparent);
        }

        .status-alert-ring {
          border-color: #f59e0b;
        }
      }

      .icon-critical {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: #ffffff;
        border-color: rgba(239, 68, 68, 0.5);
        animation: pulseCritical 2s infinite;
        box-shadow: 
          0 4px 16px rgba(239, 68, 68, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);

        .icon-glow {
          background: radial-gradient(circle, rgba(239, 68, 68, 0.6), transparent);
          opacity: 0.7;
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .icon-background {
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.25), transparent);
          animation: pulseBackground 2s ease-in-out infinite;
        }

        .status-alert-ring {
          border-color: #ef4444;
        }

        @keyframes pulseGlow {
          0%, 100% { 
            opacity: 0.7; 
            transform: scale(1); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.15); 
          }
        }

        @keyframes pulseBackground {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.25; }
        }
      }

      @keyframes pulseCritical {
        0%, 100% {
          box-shadow: 
            0 4px 16px rgba(239, 68, 68, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border-color: rgba(239, 68, 68, 0.5);
        }
        50% {
          box-shadow: 
            0 6px 24px rgba(239, 68, 68, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border-color: rgba(239, 68, 68, 0.7);
        }
      }

      .icon-offline {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        color: #ffffff;
        border-color: rgba(107, 114, 128, 0.4);
        box-shadow: 
          0 4px 16px rgba(107, 114, 128, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);

        .icon-glow {
          background: radial-gradient(circle, rgba(107, 114, 128, 0.5), transparent);
        }

        .icon-background {
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.15), transparent);
        }
      }

      .header-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .device-name-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .header-info h2 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 800;
        color: #1f2937;
        letter-spacing: -0.3px;
        line-height: 1.2;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .device-type-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 8px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #059669;
        text-transform: capitalize;
      }

      .device-type-badge .type-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #10b981;
      }

      .status-description {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(241, 245, 249, 0.8);
        border-radius: 8px;
        font-size: 0.875rem;
        color: #475569;
        font-weight: 500;
        line-height: 1.4;
      }

      .status-description .description-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #64748b;
        flex-shrink: 0;
      }

      .header-right {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
      }

      .status-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        border-radius: 12px;
        font-size: 0.8125rem;
        font-weight: 800;
        letter-spacing: 0.8px;
        border: 2px solid transparent;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        text-transform: uppercase;
        white-space: nowrap;

        .chip-glow {
          position: absolute;
          inset: 0;
          border-radius: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 0;
        }

        .chip-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          position: relative;
          z-index: 1;
        }

        .chip-text {
          position: relative;
          z-index: 1;
        }
      }

      .detail-header:hover .status-chip {
        transform: scale(1.05);
      }

      .health-indicator {
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: flex-end;
        min-width: 120px;
      }

      .health-bar {
        width: 100%;
        height: 8px;
        background: rgba(229, 231, 235, 0.8);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }

      .health-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.6s ease;
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
          animation: shimmer 2s infinite;
        }
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .health-indicator.health-normal .health-fill {
        background: linear-gradient(90deg, #10b981, #34d399);
      }

      .health-indicator.health-warning .health-fill {
        background: linear-gradient(90deg, #f59e0b, #fbbf24);
      }

      .health-indicator.health-critical .health-fill {
        background: linear-gradient(90deg, #ef4444, #f87171);
      }

      .health-indicator.health-offline .health-fill {
        background: linear-gradient(90deg, #6b7280, #9ca3af);
      }

      .health-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-align: right;
      }

      .chip-normal {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        border-color: rgba(16, 185, 129, 0.3);
        box-shadow: 
          0 4px 12px rgba(16, 185, 129, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);

        .chip-glow {
          background: radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent);
        }
      }

      .chip-warning {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #ffffff;
        border-color: rgba(245, 158, 11, 0.3);
        box-shadow: 
          0 4px 12px rgba(245, 158, 11, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);

        .chip-glow {
          background: radial-gradient(circle, rgba(245, 158, 11, 0.3), transparent);
        }
      }

      .chip-critical {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: #ffffff;
        border-color: rgba(239, 68, 68, 0.3);
        box-shadow: 
          0 4px 12px rgba(239, 68, 68, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        animation: pulseChip 2s ease-in-out infinite;

        .chip-glow {
          background: radial-gradient(circle, rgba(239, 68, 68, 0.3), transparent);
        }
      }

      @keyframes pulseChip {
        0%, 100% {
          box-shadow: 
            0 4px 12px rgba(239, 68, 68, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        50% {
          box-shadow: 
            0 6px 16px rgba(239, 68, 68, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
      }

      .chip-offline {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        color: #ffffff;
        border-color: rgba(107, 114, 128, 0.3);
        box-shadow: 
          0 4px 12px rgba(107, 114, 128, 0.25),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);

        .chip-glow {
          background: radial-gradient(circle, rgba(107, 114, 128, 0.3), transparent);
        }
      }

      .detail-header:hover .status-chip .chip-glow {
        opacity: 0.6;
      }

      .kpi-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        padding: 24px 28px;
        margin-top: 20px;
      }

      .kpi-card {
        background: white;
        border-radius: 18px;
        padding: 24px;
        box-shadow: 
          0 4px 16px rgba(0, 0, 0, 0.06),
          0 2px 8px rgba(16, 185, 129, 0.08);
        display: flex;
        align-items: flex-start;
        gap: 20px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border: 2px solid rgba(16, 185, 129, 0.1);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #10b981, #34d399, #10b981);
          background-size: 200% 100%;
          animation: shimmerTop 3s ease-in-out infinite;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover {
          transform: translateY(-4px);
          box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.1),
            0 4px 12px rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.25);

          &::before {
            opacity: 1;
          }
        }
      }

      @keyframes shimmerTop {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .kpi-card.primary {
        grid-column: 1 / -1;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%);
        border: 2px solid rgba(16, 185, 129, 0.2);
        box-shadow: 
          0 8px 24px rgba(0, 0, 0, 0.08),
          0 4px 12px rgba(16, 185, 129, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
      }

      .kpi-card.primary.status-normal {
        border-color: rgba(16, 185, 129, 0.3);
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(255, 255, 255, 0.98) 100%);
      }

      .kpi-card.primary.status-warning {
        border-color: rgba(245, 158, 11, 0.3);
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(255, 255, 255, 0.98) 100%);
      }

      .kpi-card.primary.status-critical {
        border-color: rgba(239, 68, 68, 0.3);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(255, 255, 255, 0.98) 100%);
      }

      .kpi-card.primary:hover {
        box-shadow: 
          0 12px 32px rgba(0, 0, 0, 0.12),
          0 6px 16px rgba(16, 185, 129, 0.18),
          inset 0 1px 0 rgba(255, 255, 255, 0.95);
        transform: translateY(-4px) scale(1.01);
      }

      .kpi-icon-wrapper {
        position: relative;
        width: 64px;
        height: 64px;
        flex-shrink: 0;
      }

      .kpi-icon-bg {
        position: absolute;
        inset: 0;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%);
        border: 2px solid rgba(16, 185, 129, 0.2);
      }

      .kpi-card.secondary .kpi-icon-bg {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.08) 100%);
        border-color: rgba(102, 126, 234, 0.2);
      }

      .kpi-card.tertiary .kpi-icon-bg {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%);
        border-color: rgba(245, 158, 11, 0.2);
      }

      .kpi-icon {
        position: relative;
        z-index: 1;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: #10b981;
        transition: transform 0.3s ease;
      }

      .kpi-card.secondary .kpi-icon {
        color: #667eea;
      }

      .kpi-card.tertiary .kpi-icon {
        color: #f59e0b;
      }

      .kpi-card:hover .kpi-icon {
        transform: scale(1.1) rotate(5deg);
      }

      .kpi-status-indicator {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid white;
        z-index: 2;
      }

      .kpi-status-indicator.indicator-normal {
        background: #10b981;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
      }

      .kpi-status-indicator.indicator-warning {
        background: #f59e0b;
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
        animation: pulseIndicator 2s ease-in-out infinite;
      }

      .kpi-status-indicator.indicator-critical {
        background: #ef4444;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
        animation: pulseIndicator 1.5s ease-in-out infinite;
      }

      @keyframes pulseIndicator {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
      }

      .kpi-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
        min-width: 0;
      }

      .kpi-label-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .kpi-label {
        font-size: 0.875rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .kpi-status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.5px;
      }

      .kpi-status-badge mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .kpi-status-badge.badge-normal {
        background: rgba(16, 185, 129, 0.15);
        color: #059669;
      }

      .kpi-status-badge.badge-warning {
        background: rgba(245, 158, 11, 0.15);
        color: #d97706;
      }

      .kpi-status-badge.badge-critical {
        background: rgba(239, 68, 68, 0.15);
        color: #dc2626;
      }

      .kpi-value-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        flex-wrap: wrap;
      }

      .kpi-value {
        font-size: 2.5rem;
        font-weight: 800;
        line-height: 1;
        color: #1f2937;
        letter-spacing: -1px;
        font-variant-numeric: tabular-nums;
      }

      .kpi-card.primary.status-normal .kpi-value {
        color: #10b981;
      }

      .kpi-card.primary.status-warning .kpi-value {
        color: #f59e0b;
      }

      .kpi-card.primary.status-critical .kpi-value {
        color: #ef4444;
      }

      .kpi-unit {
        font-size: 1.125rem;
        font-weight: 600;
        color: #64748b;
      }

      .kpi-delta-row {
        margin-top: 4px;
      }

      .kpi-delta {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.8125rem;
        font-weight: 600;
        background: rgba(241, 245, 249, 0.8);
      }

      .kpi-delta.positive {
        background: rgba(16, 185, 129, 0.1);
        color: #059669;
      }

      .kpi-delta.negative {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }

      .kpi-delta.neutral {
        background: rgba(107, 114, 128, 0.1);
        color: #4b5563;
      }

      .kpi-delta .delta-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .delta-value {
        font-weight: 700;
      }

      .delta-label {
        font-size: 0.75rem;
        opacity: 0.7;
        margin-left: 4px;
      }

      .kpi-text-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .kpi-text-primary {
        font-size: 1rem;
        font-weight: 700;
        color: #1f2937;
        line-height: 1.4;
      }

      .kpi-text-secondary {
        font-size: 0.8125rem;
        color: #64748b;
        font-weight: 500;
      }

      .kpi-range-indicator {
        margin-top: 12px;
      }

      .range-bar {
        position: relative;
        height: 6px;
        background: rgba(229, 231, 235, 0.8);
        border-radius: 3px;
        overflow: hidden;
        margin-top: 8px;
      }

      .range-optimal {
        position: absolute;
        top: 0;
        height: 100%;
        background: linear-gradient(90deg, #10b981, #34d399);
        border-radius: 3px;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
      }

      .range-min,
      .range-max {
        position: absolute;
        top: -20px;
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 600;
      }

      .range-min {
        left: 0;
      }

      .range-max {
        right: 0;
      }

      .kpi-text {
        font-size: 0.9375rem;
        font-weight: 600;
        color: #1f2937;
      }

      .kpi-delta {
        display: flex;
        align-items: center;
        gap: 2px;
        font-size: 0.875rem;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.2);
      }

      .kpi-delta mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .kpi-delta.positive {
        color: #10b981;
      }

      .kpi-delta.negative {
        color: #ef4444;
      }

      .threshold-section {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%);
        border-radius: 20px;
        padding: 24px;
        margin: 0 28px;
        box-shadow: 
          0 8px 24px rgba(0, 0, 0, 0.06),
          0 2px 8px rgba(16, 185, 129, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.8);
        border: 2px solid rgba(16, 185, 129, 0.1);
        transition: all 0.3s ease;
      }

      .threshold-section:hover {
        border-color: rgba(16, 185, 129, 0.2);
        box-shadow: 
          0 12px 32px rgba(0, 0, 0, 0.08),
          0 4px 12px rgba(16, 185, 129, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
      }

      .threshold-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 2px solid rgba(16, 185, 129, 0.1);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
      }

      .header-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);

        mat-icon {
          color: white;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      .header-text h3 {
        margin: 0 0 4px 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #1f2937;
        letter-spacing: -0.3px;
      }

      .header-subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }

      .current-value-display {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        padding: 12px 20px;
        border-radius: 12px;
        background: rgba(16, 185, 129, 0.05);
        border: 2px solid rgba(16, 185, 129, 0.15);
        transition: all 0.3s ease;
      }

      .current-value-display.status-normal {
        background: rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.25);
      }

      .current-value-display.status-warning {
        background: rgba(245, 158, 11, 0.08);
        border-color: rgba(245, 158, 11, 0.25);
      }

      .current-value-display.status-critical {
        background: rgba(239, 68, 68, 0.08);
        border-color: rgba(239, 68, 68, 0.25);
      }

      .value-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .value-number {
        font-size: 1.75rem;
        font-weight: 800;
        color: #1f2937;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }

      .value-unit {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }

      .threshold-zones-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .zone-legend {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .zone-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 10px 16px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.02);
        border: 1px solid rgba(0, 0, 0, 0.05);
        flex: 1;
        min-width: 180px;
      }

      .zone-indicator {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .zone-item.optimal .zone-indicator {
        background: linear-gradient(135deg, #10b981, #34d399);
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
      }

      .zone-item.warning .zone-indicator {
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
        box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
      }

      .zone-item.critical .zone-indicator {
        background: linear-gradient(135deg, #ef4444, #f87171);
        box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
      }

      .zone-label {
        font-size: 0.875rem;
        font-weight: 700;
        color: #1f2937;
        min-width: 70px;
      }

      .zone-range {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 500;
      }

      .chart-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        font-weight: 700;
        font-size: 1rem;
        color: #1f2937;
        margin-bottom: 16px;
      }

      .chart-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .chart-header mat-icon {
        color: #667eea;
      }

      .chart-controls {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      /* View Toggle Group - Enhanced */
      .view-toggle-group {
        display: inline-flex;
        border-radius: 14px;
        overflow: hidden;
        border: 2px solid rgba(16, 185, 129, 0.15);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.08),
          0 0 0 1px rgba(255, 255, 255, 0.5) inset,
          0 1px 2px rgba(0, 0, 0, 0.05) inset;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9));
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        position: relative;
        gap: 2px;
        padding: 2px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .view-toggle-group:hover {
        border-color: rgba(16, 185, 129, 0.3);
        box-shadow: 
          0 6px 16px rgba(16, 185, 129, 0.15),
          0 0 0 1px rgba(255, 255, 255, 0.6) inset,
          0 1px 2px rgba(0, 0, 0, 0.05) inset;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle {
        border: none;
        background: transparent;
        color: #64748b;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        margin: 0;
        min-width: 48px;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.1);
        transform: translate(-50%, -50%);
        transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
                    height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle:hover::before {
        width: 100%;
        height: 100%;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-button {
        padding: 10px 18px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 1;
        border-radius: 10px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
        color: #64748b;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 2;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle:hover {
        background: rgba(16, 185, 129, 0.08);
        transform: translateY(-1px);
      }

      .view-toggle-group ::ng-deep .mat-button-toggle:hover mat-icon {
        color: #10b981;
        transform: scale(1.15) rotate(5deg);
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-checked {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 
          0 4px 12px rgba(16, 185, 129, 0.3),
          0 2px 4px rgba(0, 0, 0, 0.1) inset,
          0 0 0 1px rgba(255, 255, 255, 0.2) inset;
        transform: translateY(-1px);
        position: relative;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-checked::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
        border-radius: 10px;
        pointer-events: none;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-checked mat-icon {
        color: white;
        transform: scale(1.15);
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
      }

      /* Hide Material's pseudo-checkbox checkmark - but keep the actual icons */
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-pseudo-checkbox,
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-pseudo-checkbox-checked,
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-pseudo-checkbox-minimal,
      .view-toggle-group ::ng-deep .mat-pseudo-checkbox,
      .view-toggle-group ::ng-deep .mat-pseudo-checkbox-checked,
      .view-toggle-group ::ng-deep .mat-pseudo-checkbox-minimal,
      .view-toggle-group ::ng-deep *[class*="pseudo-checkbox"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        position: absolute !important;
        left: -9999px !important;
        pointer-events: none !important;
      }

      /* Hide any checkmark SVG or icon elements - specifically target check icons only */
      .view-toggle-group ::ng-deep .mat-button-toggle svg[data-mat-icon-name="check"],
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-icon svg:has(path[d*="M9 16.17"]),
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-icon svg:has(path[d*="M21 7"]),
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[data-mat-icon-name="check"],
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[data-mat-icon-type="check"],
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon:has-text("check") {
        display: none !important;
        visibility: hidden !important;
      }

      /* Hide checkmark icons but preserve our actual icons */
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[class*="check"]:not([class*="show_chart"]):not([class*="table_rows"]):not([class*="timeline"]),
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[aria-label*="check" i],
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[aria-label*="Check" i] {
        display: none !important;
        visibility: hidden !important;
      }

      /* Target any element that contains a checkmark path in SVG */
      .view-toggle-group ::ng-deep .mat-button-toggle svg path[d*="M9 16.17"],
      .view-toggle-group ::ng-deep .mat-button-toggle svg path[d*="M21 7"],
      .view-toggle-group ::ng-deep .mat-button-toggle svg path[d*="L4.83 12"] {
        display: none !important;
        visibility: hidden !important;
      }

      /* Ensure our actual icons stay visible */
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[class*="show_chart"],
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[class*="table_rows"],
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon[class*="timeline"] {
        display: inline-flex !important;
        visibility: visible !important;
      }

      /* Nuclear option: Hide any mat-icon that contains "check" in its text content or innerHTML */
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-button-toggle-button {
        position: relative;
      }

      /* Hide checkmark by targeting the specific Material check icon */
      .view-toggle-group ::ng-deep .mat-button-toggle mat-icon:not([class*="show_chart"]):not([class*="table_rows"]):not([class*="timeline"]) {
        /* Only hide if it's not one of our icons */
      }

      /* More aggressive: Hide any second icon element or checkmark */
      .view-toggle-group ::ng-deep .mat-button-toggle-checked .mat-button-toggle-button > mat-icon:nth-child(2),
      .view-toggle-group ::ng-deep .mat-button-toggle-checked .mat-button-toggle-button > mat-icon:last-child:not(:first-child),
      .view-toggle-group ::ng-deep .mat-button-toggle-checked .mat-button-toggle-button mat-icon + mat-icon {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }

      /* Universal checkmark hiding - target any element that might be a checkmark */
      .view-toggle-group ::ng-deep .mat-button-toggle *::before,
      .view-toggle-group ::ng-deep .mat-button-toggle *::after {
        content: none !important;
      }

      /* Hide any element with checkmark-related content */
      .view-toggle-group ::ng-deep .mat-button-toggle [class*="check"]:not([class*="show_chart"]):not([class*="table_rows"]):not([class*="timeline"]),
      .view-toggle-group ::ng-deep .mat-button-toggle [aria-label*="check" i]:not([class*="show_chart"]):not([class*="table_rows"]):not([class*="timeline"]) {
        display: none !important;
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-checked:hover {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        box-shadow: 
          0 6px 16px rgba(16, 185, 129, 0.4),
          0 2px 4px rgba(0, 0, 0, 0.15) inset,
          0 0 0 1px rgba(255, 255, 255, 0.25) inset;
        transform: translateY(-2px);
      }

      .view-toggle-group ::ng-deep .mat-button-toggle-checked:hover mat-icon {
        transform: scale(1.2) rotate(-5deg);
      }

      /* Ripple effect enhancement */
      .view-toggle-group ::ng-deep .mat-button-toggle .mat-ripple-element {
        background-color: rgba(16, 185, 129, 0.2);
        animation-duration: 0.6s;
      }

      /* Focus states for accessibility */
      .view-toggle-group ::ng-deep .mat-button-toggle:focus-visible {
        outline: 2px solid rgba(16, 185, 129, 0.5);
        outline-offset: 2px;
        border-radius: 10px;
      }

      /* Smooth transition between states */
      .view-toggle-group ::ng-deep .mat-button-toggle:not(.mat-button-toggle-checked) {
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0.7;
        }
        to {
          opacity: 1;
        }
      }

      /* Responsive - View Toggle Group */
      @media (max-width: 768px) {
        .view-toggle-group {
          border-radius: 12px;
          padding: 1px;
          gap: 1px;
        }

        .view-toggle-group ::ng-deep .mat-button-toggle-button {
          padding: 8px 12px;
          height: 40px;
          min-width: 44px;
        }

        .view-toggle-group ::ng-deep .mat-button-toggle mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      @media (max-width: 480px) {
        .chart-controls {
          flex-wrap: wrap;
          gap: 8px;
        }

        .view-toggle-group {
          width: 100%;
          justify-content: stretch;
        }

        .view-toggle-group ::ng-deep .mat-button-toggle {
          flex: 1;
        }

        .view-toggle-group ::ng-deep .mat-button-toggle-button {
          padding: 10px 8px;
          height: 38px;
        }

        .view-toggle-group ::ng-deep .mat-button-toggle mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      /* Export Button */
      .export-btn {
        border-radius: 12px;
        border: 2px solid rgba(16, 185, 129, 0.3);
        background: rgba(255, 255, 255, 0.9);
        color: #10b981;
        font-weight: 600;
        padding: 0 16px;
        height: 40px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .export-btn mat-icon {
        margin-right: 6px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .export-btn:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1));
        border-color: #10b981;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      }

      .export-btn:active {
        transform: translateY(0);
      }

      .threshold-bar {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .bar-track {
        position: relative;
        height: 32px;
        background: linear-gradient(to right, 
          rgba(239, 68, 68, 0.15) 0%,
          rgba(245, 158, 11, 0.15) 25%,
          rgba(16, 185, 129, 0.15) 50%,
          rgba(245, 158, 11, 0.15) 75%,
          rgba(239, 68, 68, 0.15) 100%);
        border-radius: 16px;
        overflow: visible;
        border: 2px solid rgba(0, 0, 0, 0.05);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .zone {
        position: absolute;
        height: 100%;
        top: 0;
        border-radius: 14px;
      }

      .critical-zone-left,
      .critical-zone-right {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2));
        border-right: 1px solid rgba(239, 68, 68, 0.4);
      }

      .critical-zone-right {
        border-right: none;
        border-left: 1px solid rgba(239, 68, 68, 0.4);
      }

      .zone-pattern {
        width: 100%;
        height: 100%;
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 4px,
          rgba(0, 0, 0, 0.05) 4px,
          rgba(0, 0, 0, 0.05) 8px
        );
        border-radius: 14px;
      }

      .optimal-zone {
        background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%);
        background-size: 200% 100%;
        animation: shimmerZone 3s ease-in-out infinite;
        box-shadow: 
          0 0 20px rgba(16, 185, 129, 0.5),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.3);
        z-index: 2;
      }

      @keyframes shimmerZone {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .zone-glow {
        position: absolute;
        inset: -2px;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent);
        border-radius: 16px;
        z-index: -1;
        animation: pulseGlow 2s ease-in-out infinite;
      }

      @keyframes pulseGlow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.8; }
      }

      .zone-label-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.625rem;
        font-weight: 800;
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        letter-spacing: 1px;
        z-index: 3;
        white-space: nowrap;
      }

      .current-marker {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 
          0 4px 16px rgba(102, 126, 234, 0.5),
          0 0 0 2px rgba(102, 126, 234, 0.2),
          inset 0 2px 4px rgba(255, 255, 255, 0.3);
        cursor: pointer;
        z-index: 10;
        transition: all 0.3s ease;
      }

      .current-marker.in-optimal {
        background: linear-gradient(135deg, #10b981, #34d399);
        box-shadow: 
          0 4px 16px rgba(16, 185, 129, 0.5),
          0 0 0 2px rgba(16, 185, 129, 0.2),
          inset 0 2px 4px rgba(255, 255, 255, 0.3);
      }

      .current-marker.in-warning {
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
        box-shadow: 
          0 4px 16px rgba(245, 158, 11, 0.5),
          0 0 0 2px rgba(245, 158, 11, 0.2),
          inset 0 2px 4px rgba(255, 255, 255, 0.3);
      }

      .current-marker.in-critical {
        background: linear-gradient(135deg, #ef4444, #f87171);
        box-shadow: 
          0 4px 16px rgba(239, 68, 68, 0.5),
          0 0 0 2px rgba(239, 68, 68, 0.2),
          inset 0 2px 4px rgba(255, 255, 255, 0.3);
      }

      .current-marker:hover {
        transform: translate(-50%, -50%) scale(1.2);
        z-index: 11;
      }

      .marker-value {
        position: absolute;
        top: -28px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 700;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 12;
      }

      .current-marker:hover .marker-value {
        opacity: 1;
      }

      .marker-pulse {
        position: absolute;
        inset: -6px;
        border: 2px solid currentColor;
        border-radius: 50%;
        animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        opacity: 0.6;
      }

      .current-marker.in-optimal .marker-pulse {
        border-color: #10b981;
      }

      .current-marker.in-warning .marker-pulse {
        border-color: #f59e0b;
      }

      .current-marker.in-critical .marker-pulse {
        border-color: #ef4444;
        animation: pulse-ring-critical 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes pulse-ring {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        100% {
          transform: scale(1.8);
          opacity: 0;
        }
      }

      @keyframes pulse-ring-critical {
        0% {
          transform: scale(1);
          opacity: 0.8;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }

      .threshold-labels {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        position: relative;
        padding-top: 8px;
      }

      .label-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex: 1;
        position: relative;
      }

      .label-container.optimal-start::before,
      .label-container.optimal-end::before {
        content: '';
        position: absolute;
        top: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 8px;
        background: #10b981;
        border-radius: 2px;
      }

      .label-value {
        font-size: 0.875rem;
        font-weight: 700;
        color: #1f2937;
        font-variant-numeric: tabular-nums;
      }

      .label-text {
        font-size: 0.6875rem;
        color: #6b7280;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .label-container.optimal-start .label-value,
      .label-container.optimal-end .label-value {
        color: #10b981;
      }

      .status-message {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 18px 24px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%);
        border: 2px solid rgba(16, 185, 129, 0.2);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

          &::before {
            opacity: 1;
          }
        }
      }

      .status-message.status-normal {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%);
        border-color: rgba(16, 185, 129, 0.3);

        &::before {
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent);
        }
      }

      .status-message.status-warning {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%);
        border-color: rgba(245, 158, 11, 0.3);

        &::before {
          background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), transparent);
        }
      }

      .status-message.status-critical {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.06) 100%);
        border-color: rgba(239, 68, 68, 0.3);
        animation: criticalPulse 2s ease-in-out infinite;

        &::before {
          background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.5), transparent);
        }
      }

      @keyframes criticalPulse {
        0%, 100% { 
          box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
        }
        50% { 
          box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
        }
      }

      .status-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.8);
        border: 2px solid transparent;
        position: relative;
        flex-shrink: 0;
        transition: all 0.3s ease;
        box-shadow: 
          0 2px 8px rgba(0, 0, 0, 0.08),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);

        .icon-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 0;
        }
      }

      .status-message:hover .status-icon-wrapper {
        transform: scale(1.05);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.95);
      }

      .status-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        position: relative;
        z-index: 1;
        transition: all 0.3s ease;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      }

      .status-message.status-normal .status-icon-wrapper {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%);
        border-color: rgba(16, 185, 129, 0.3);
        box-shadow: 
          0 2px 8px rgba(16, 185, 129, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);

        .icon-pulse {
          background: radial-gradient(circle, rgba(16, 185, 129, 0.3), transparent);
        }
      }

      .status-message.status-normal .status-icon {
        color: #10b981;
      }

      .status-message.status-warning .status-icon-wrapper {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%);
        border-color: rgba(245, 158, 11, 0.3);
        box-shadow: 
          0 2px 8px rgba(245, 158, 11, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);

        .icon-pulse {
          background: radial-gradient(circle, rgba(245, 158, 11, 0.3), transparent);
        }
      }

      .status-message.status-warning .status-icon {
        color: #f59e0b;
      }

      .status-message.status-critical .status-icon-wrapper {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%);
        border-color: rgba(239, 68, 68, 0.3);
        box-shadow: 
          0 2px 8px rgba(239, 68, 68, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        animation: iconPulse 2s ease-in-out infinite;

        .icon-pulse {
          background: radial-gradient(circle, rgba(239, 68, 68, 0.4), transparent);
          opacity: 0.6;
          animation: pulseGlow 2s ease-in-out infinite;
        }
      }

      @keyframes iconPulse {
        0%, 100% {
          box-shadow: 
            0 2px 8px rgba(239, 68, 68, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        50% {
          box-shadow: 
            0 4px 12px rgba(239, 68, 68, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
      }

      @keyframes pulseGlow {
        0%, 100% {
          opacity: 0.6;
          transform: scale(1);
        }
        50% {
          opacity: 0.9;
          transform: scale(1.1);
        }
      }

      .status-message.status-critical .status-icon {
        color: #ef4444;
      }

      .status-message:hover .status-icon-wrapper .icon-pulse {
        opacity: 0.8;
      }

      .status-text {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
        min-width: 0;
      }

      .status-text strong {
        font-size: 1rem;
        font-weight: 800;
        color: #1f2937;
        letter-spacing: -0.2px;
        line-height: 1.3;
      }

      .status-text span {
        font-size: 0.875rem;
        color: #64748b;
        line-height: 1.5;
        font-weight: 500;
      }

      .chart-section {
        background: white;
        border-radius: 16px;
        padding: 20px;
        margin: 0 28px 24px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        flex: 1;
        min-height: 300px;
      }

      .chart-container {
        height: 300px;
      }

      /* Data Table View */
      .data-table-container {
        max-height: 300px;
        overflow-y: auto;
        border-radius: 12px;
        border: 1px solid rgba(229, 231, 235, 0.8);
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
      }

      .data-table thead {
        position: sticky;
        top: 0;
        z-index: 10;
        background: linear-gradient(135deg, #f8fafb, #f0fdf4);
      }

      .data-table th {
        padding: 12px 16px;
        text-align: left;
        font-weight: 700;
        font-size: 0.875rem;
        color: #1f2937;
        border-bottom: 2px solid rgba(16, 185, 129, 0.3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .data-table tbody tr {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border-bottom: 1px solid rgba(229, 231, 235, 0.6);
      }

      .data-table tbody tr:hover {
        background: rgba(16, 185, 129, 0.05);
        transform: scale(1.005);
        box-shadow: inset 4px 0 0 #10b981;
      }

      .data-table td {
        padding: 12px 16px;
        font-size: 0.875rem;
        color: #374151;
      }

      .table-status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .table-status-badge.normal {
        background: #d1fae5;
        color: #065f46;
      }

      .table-status-badge.warning {
        background: #fef3c7;
        color: #92400e;
      }

      .table-status-badge.critical {
        background: #fee2e2;
        color: #991b1b;
      }

      .table-status-badge.offline {
        background: #f3f4f6;
        color: #4b5563;
      }

      /* Timeline View */
      .timeline-container {
        max-height: 300px;
        overflow-y: auto;
        position: relative;
        padding: 16px 0 16px 40px;
      }

      .timeline-track {
        position: absolute;
        left: 16px;
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(180deg, #10b981, #34d399, #10b981);
        border-radius: 2px;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
      }

      .timeline-entry {
        position: relative;
        margin-bottom: 24px;
        animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
      }

      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .timeline-marker {
        position: absolute;
        left: -32px;
        top: 4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 2;
      }

      .timeline-marker.normal {
        background: linear-gradient(135deg, #10b981, #059669);
      }

      .timeline-marker.warning {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }

      .timeline-marker.critical {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        animation: pulse 2s ease-in-out infinite;
      }

      .timeline-marker.offline {
        background: linear-gradient(135deg, #6b7280, #4b5563);
      }

      .timeline-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
      }

      .timeline-content {
        background: white;
        border-radius: 12px;
        padding: 12px 16px;
        border: 1px solid rgba(229, 231, 235, 0.8);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .timeline-content:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.4);
      }

      .timeline-time {
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .timeline-value {
        display: flex;
        align-items: baseline;
        gap: 4px;
      }

      .value-text {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1f2937;
      }

      .value-unit {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }

      .no-chart-data {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #9ca3af;
      }

      .no-chart-data mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      .empty-detail {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 80px 28px;
        margin: 24px 28px;
      }

      .empty-icon {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      .empty-icon mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #667eea;
      }

      .empty-detail h3 {
        margin: 0 0 8px 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
      }

      .empty-detail p {
        margin: 0;
        font-size: 1rem;
        color: #6b7280;
        max-width: 400px;
      }

      @media (max-width: 768px) {
        .panel-title-section {
          padding: 20px;
        }

        .panel-title {
          font-size: 1.5rem;
        }

        .panel-subtitle {
          font-size: 0.875rem;
        }

        .title-icon-wrapper {
          width: 48px;
          height: 48px;
        }

        .title-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .detail-header {
          padding: 20px;
          margin: 20px 20px 0;
          flex-direction: column;
          gap: 16px;
        }

        .header-left {
          width: 100%;
        }

        .header-right {
          width: 100%;
          align-items: flex-start;
        }

        .device-name-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .header-info h2 {
          font-size: 1.5rem;
        }

        .status-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
        }

        .status-icon .icon-element {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }

        .status-icon .status-pulse {
          width: 14px;
          height: 14px;
          top: -4px;
          right: -4px;
        }

        .status-icon {
          width: 60px;
          height: 60px;
        }

        .status-icon mat-icon {
          font-size: 30px;
          width: 30px;
          height: 30px;
        }

        .kpi-section {
          grid-template-columns: 1fr;
          padding: 20px;
          margin-top: 16px;
          gap: 16px;
        }

        .kpi-card {
          padding: 20px;
        }

        .kpi-card.primary {
          grid-column: 1;
        }

        .kpi-icon-wrapper {
          width: 56px;
          height: 56px;
        }

        .kpi-icon {
          width: 56px;
          height: 56px;
          font-size: 28px;
        }

        .kpi-value {
          font-size: 2rem;
        }

        .kpi-label-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .health-indicator {
          width: 100%;
          align-items: flex-start;
        }

        .threshold-section {
          margin: 0 20px;
          padding: 20px;
        }

        .chart-section {
          margin: 0 20px 20px;
          padding: 16px;
        }

        .chart-container {
          height: 250px;
        }

        .empty-detail {
          padding: 60px 20px;
          margin: 20px;
        }
      }

      /* ========================================
         🌙 DARK THEME STYLES
      ======================================== */
      :host-context(body.dark-theme) .detail-panel {
        background: linear-gradient(
          to bottom,
          rgba(15, 23, 42, 0.75),
          rgba(30, 41, 59, 0.7)
        );
        backdrop-filter: blur(16px);
        border-color: rgba(16, 185, 129, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
                    inset 0 1px 1px rgba(100, 116, 139, 0.25);
      }

      :host-context(body.dark-theme) .panel-title-section {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%);
        border-bottom-color: rgba(16, 185, 129, 0.2);

        &::before {
          background: linear-gradient(90deg, #10b981, #34d399, #10b981);
        }

        &::after {
          background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
        }
      }

      :host-context(body.dark-theme) .panel-title {
        color: #34d399;
        text-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
      }

      :host-context(body.dark-theme) .panel-subtitle {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .title-icon-wrapper {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        box-shadow: 
          0 4px 16px rgba(16, 185, 129, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }

      :host-context(body.dark-theme) .title-divider {
        background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.4), transparent);
      }

      :host-context(body.dark-theme) .detail-panel::before {
        background: linear-gradient(
          90deg,
          rgba(16, 185, 129, 0.5),
          rgba(52, 211, 153, 0.4),
          rgba(16, 185, 129, 0.5)
        );
      }

      :host-context(body.dark-theme) .detail-header {
        background: rgba(30, 41, 59, 0.6) !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      }

      :host-context(body.dark-theme) .detail-header.status-critical {
        border-left-color: #f87171;
        background: linear-gradient(to right, rgba(239, 68, 68, 0.15), rgba(30, 41, 59, 0.6)) !important;
      }

      :host-context(body.dark-theme) .detail-header.status-warning {
        border-left-color: #fbbf24;
        background: linear-gradient(to right, rgba(245, 158, 11, 0.15), rgba(30, 41, 59, 0.6)) !important;
      }

      :host-context(body.dark-theme) .detail-header.status-normal {
        border-left-color: #34d399;
        background: linear-gradient(to right, rgba(16, 185, 129, 0.15), rgba(30, 41, 59, 0.6)) !important;
      }

      :host-context(body.dark-theme) .detail-header.status-offline {
        border-left-color: #9ca3af;
        background: linear-gradient(to right, rgba(107, 114, 128, 0.15), rgba(30, 41, 59, 0.6)) !important;
      }

      :host-context(body.dark-theme) .header-info h2 {
        color: #ffffff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }

      :host-context(body.dark-theme) .device-type {
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .device-type-badge {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
        border-color: rgba(16, 185, 129, 0.3);
        color: #34d399;
      }

      :host-context(body.dark-theme) .device-type-badge .type-icon {
        color: #34d399;
      }

      :host-context(body.dark-theme) .status-description {
        background: rgba(30, 41, 59, 0.6);
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .status-description .description-icon {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .health-label {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .health-bar {
        background: rgba(30, 41, 59, 0.8);
      }

      :host-context(body.dark-theme) .icon-normal {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(167, 243, 208, 0.2));
        color: #6ee7b7;
        border: 1px solid rgba(16, 185, 129, 0.4);
      }

      :host-context(body.dark-theme) .icon-warning {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(253, 230, 138, 0.2));
        color: #fcd34d;
        border: 1px solid rgba(245, 158, 11, 0.4);
      }

      :host-context(body.dark-theme) .icon-critical {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(254, 202, 202, 0.2));
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.4);
      }

      :host-context(body.dark-theme) .icon-offline {
        background: linear-gradient(135deg, rgba(107, 114, 128, 0.3), rgba(229, 231, 235, 0.15));
        color: #cbd5e1;
        border: 1px solid rgba(107, 114, 128, 0.4);
      }

      :host-context(body.dark-theme) .chip-normal {
        background: rgba(16, 185, 129, 0.25);
        color: #6ee7b7;
        border-color: rgba(16, 185, 129, 0.4);
      }

      :host-context(body.dark-theme) .chip-warning {
        background: rgba(245, 158, 11, 0.25);
        color: #fcd34d;
        border-color: rgba(245, 158, 11, 0.4);
      }

      :host-context(body.dark-theme) .chip-critical {
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
        border-color: rgba(239, 68, 68, 0.4);
      }

      :host-context(body.dark-theme) .chip-offline {
        background: rgba(107, 114, 128, 0.25);
        color: #cbd5e1;
        border-color: rgba(107, 114, 128, 0.4);
      }

      :host-context(body.dark-theme) .kpi-card {
        background: rgba(30, 41, 59, 0.7);
        border-color: rgba(100, 116, 139, 0.3);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
                    inset 0 1px 1px rgba(100, 116, 139, 0.15);
      }

      :host-context(body.dark-theme) .kpi-card:hover {
        background: rgba(30, 41, 59, 0.85);
        border-color: rgba(52, 211, 153, 0.5);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4),
                    0 0 32px rgba(16, 185, 129, 0.15),
                    inset 0 1px 1px rgba(52, 211, 153, 0.25);
      }

      :host-context(body.dark-theme) .kpi-card.primary {
        background: linear-gradient(
          135deg,
          rgba(128, 203, 196, 0.25),
          rgba(0, 95, 91, 0.2)
        );
        border-color: rgba(128, 203, 196, 0.4);
        box-shadow: 0 8px 24px rgba(128, 203, 196, 0.2),
                    inset 0 1px 1px rgba(128, 203, 196, 0.15);
      }

      :host-context(body.dark-theme) .kpi-card.primary:hover {
        background: linear-gradient(
          135deg,
          rgba(128, 203, 196, 0.35),
          rgba(0, 95, 91, 0.3)
        );
        box-shadow: 0 12px 32px rgba(128, 203, 196, 0.3),
                    0 0 32px rgba(128, 203, 196, 0.15),
                    inset 0 1px 1px rgba(128, 203, 196, 0.25);
      }

      :host-context(body.dark-theme) .kpi-label {
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .kpi-value {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .kpi-card.primary.status-normal .kpi-value {
        color: #34d399;
      }

      :host-context(body.dark-theme) .kpi-card.primary.status-warning .kpi-value {
        color: #fcd34d;
      }

      :host-context(body.dark-theme) .kpi-card.primary.status-critical .kpi-value {
        color: #fca5a5;
      }

      :host-context(body.dark-theme) .kpi-unit {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .kpi-text-primary {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .kpi-text-secondary {
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .kpi-icon-bg {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%);
        border-color: rgba(16, 185, 129, 0.3);
      }

      :host-context(body.dark-theme) .kpi-card.secondary .kpi-icon-bg {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.15) 100%);
        border-color: rgba(102, 126, 234, 0.3);
      }

      :host-context(body.dark-theme) .kpi-card.tertiary .kpi-icon-bg {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(239, 68, 68, 0.15) 100%);
        border-color: rgba(245, 158, 11, 0.3);
      }

      :host-context(body.dark-theme) .kpi-icon {
        color: #34d399;
      }

      :host-context(body.dark-theme) .kpi-card.secondary .kpi-icon {
        color: #818cf8;
      }

      :host-context(body.dark-theme) .kpi-card.tertiary .kpi-icon {
        color: #fcd34d;
      }

      :host-context(body.dark-theme) .kpi-delta {
        background: rgba(30, 41, 59, 0.6);
      }

      :host-context(body.dark-theme) .kpi-delta.positive {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
      }

      :host-context(body.dark-theme) .kpi-delta.negative {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
      }

      :host-context(body.dark-theme) .range-bar {
        background: rgba(30, 41, 59, 0.8);
      }

      :host-context(body.dark-theme) .range-min,
      :host-context(body.dark-theme) .range-max {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .kpi-value {
        color: #80cbc4;
        text-shadow: 0 2px 8px rgba(128, 203, 196, 0.4), 0 0 16px rgba(128, 203, 196, 0.2);
      }

      :host-context(body.dark-theme) .kpi-unit {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .kpi-text {
        color: #e2e8f0;
      }

      :host-context(body.dark-theme) .threshold-section {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
        border-color: rgba(52, 211, 153, 0.2);
        box-shadow: 
          0 8px 24px rgba(0, 0, 0, 0.4),
          0 2px 8px rgba(16, 185, 129, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.05);
      }

      :host-context(body.dark-theme) .threshold-section:hover {
        border-color: rgba(52, 211, 153, 0.3);
        box-shadow: 
          0 12px 32px rgba(0, 0, 0, 0.5),
          0 4px 12px rgba(16, 185, 129, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      :host-context(body.dark-theme) .header-text h3 {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .header-subtitle {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .value-number {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .value-unit {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .zone-item {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(100, 116, 139, 0.2);
      }

      :host-context(body.dark-theme) .zone-label {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .zone-range {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .bar-track {
        background: linear-gradient(to right, 
          rgba(239, 68, 68, 0.2) 0%,
          rgba(245, 158, 11, 0.2) 25%,
          rgba(16, 185, 129, 0.2) 50%,
          rgba(245, 158, 11, 0.2) 75%,
          rgba(239, 68, 68, 0.2) 100%);
        border-color: rgba(100, 116, 139, 0.3);
      }

      :host-context(body.dark-theme) .label-value {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .label-text {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .status-message {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%);
        border-color: rgba(16, 185, 129, 0.25);
      }

      :host-context(body.dark-theme) .status-message.status-normal {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.1) 100%);
        border-color: rgba(16, 185, 129, 0.35);
      }

      :host-context(body.dark-theme) .status-message.status-warning {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0.1) 100%);
        border-color: rgba(245, 158, 11, 0.35);
      }

      :host-context(body.dark-theme) .status-message.status-critical {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(239, 68, 68, 0.1) 100%);
        border-color: rgba(239, 68, 68, 0.35);
      }

      :host-context(body.dark-theme) .status-icon-wrapper {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.8) 100%);
        border-color: rgba(100, 116, 139, 0.3);
        box-shadow: 
          0 2px 8px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
      }

      :host-context(body.dark-theme) .status-message.status-normal .status-icon-wrapper {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%);
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 
          0 2px 8px rgba(16, 185, 129, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }

      :host-context(body.dark-theme) .status-message.status-warning .status-icon-wrapper {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%);
        border-color: rgba(245, 158, 11, 0.4);
        box-shadow: 
          0 2px 8px rgba(245, 158, 11, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }

      :host-context(body.dark-theme) .status-message.status-critical .status-icon-wrapper {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.15) 100%);
        border-color: rgba(239, 68, 68, 0.4);
        box-shadow: 
          0 2px 8px rgba(239, 68, 68, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }

      :host-context(body.dark-theme) .status-message.status-normal .status-icon {
        color: #34d399;
      }

      :host-context(body.dark-theme) .status-message.status-warning .status-icon {
        color: #fcd34d;
      }

      :host-context(body.dark-theme) .status-message.status-critical .status-icon {
        color: #fca5a5;
      }

      :host-context(body.dark-theme) .status-text strong {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .status-text span {
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .chart-header {
        color: #f1f5f9;
      }

      /* Dark Theme - View Toggle - Enhanced */
      :host-context(body.dark-theme) .view-toggle-group {
        border-color: rgba(100, 116, 139, 0.25);
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.9));
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.3),
          0 0 0 1px rgba(100, 116, 139, 0.2) inset,
          0 1px 2px rgba(0, 0, 0, 0.2) inset;
      }

      :host-context(body.dark-theme) .view-toggle-group:hover {
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 
          0 6px 16px rgba(16, 185, 129, 0.2),
          0 0 0 1px rgba(100, 116, 139, 0.3) inset,
          0 1px 2px rgba(0, 0, 0, 0.2) inset;
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle {
        background: transparent;
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle::before {
        background: rgba(16, 185, 129, 0.15);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle mat-icon {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle:hover {
        background: rgba(16, 185, 129, 0.12);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle:hover mat-icon {
        color: #34d399;
        transform: scale(1.15) rotate(5deg);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle-checked {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        box-shadow: 
          0 4px 12px rgba(16, 185, 129, 0.4),
          0 2px 4px rgba(0, 0, 0, 0.3) inset,
          0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle-checked::after {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), transparent);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle-checked mat-icon {
        color: white;
        filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle-checked:hover {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        box-shadow: 
          0 6px 16px rgba(16, 185, 129, 0.5),
          0 2px 4px rgba(0, 0, 0, 0.4) inset,
          0 0 0 1px rgba(255, 255, 255, 0.15) inset;
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle-checked:hover mat-icon {
        transform: scale(1.2) rotate(-5deg);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle .mat-ripple-element {
        background-color: rgba(16, 185, 129, 0.3);
      }

      :host-context(body.dark-theme) .view-toggle-group ::ng-deep .mat-button-toggle:focus-visible {
        outline-color: rgba(16, 185, 129, 0.6);
      }

      /* Dark Theme - Export Button */
      :host-context(body.dark-theme) .export-btn {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(16, 185, 129, 0.5);
        color: #34d399;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      :host-context(body.dark-theme) .export-btn:hover {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2));
        border-color: #34d399;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }

      /* Dark Theme - Data Table */
      :host-context(body.dark-theme) .data-table-container {
        border-color: rgba(100, 116, 139, 0.4);
      }

      :host-context(body.dark-theme) .data-table {
        background: rgba(30, 41, 59, 0.7);
      }

      :host-context(body.dark-theme) .data-table thead {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8));
      }

      :host-context(body.dark-theme) .data-table th {
        color: #f1f5f9;
        border-bottom-color: rgba(16, 185, 129, 0.4);
      }

      :host-context(body.dark-theme) .data-table tbody tr {
        border-bottom-color: rgba(100, 116, 139, 0.3);
      }

      :host-context(body.dark-theme) .data-table tbody tr:hover {
        background: rgba(16, 185, 129, 0.1);
        box-shadow: inset 4px 0 0 #34d399;
      }

      :host-context(body.dark-theme) .data-table td {
        color: #e2e8f0;
      }

      :host-context(body.dark-theme) .table-status-badge.normal {
        background: rgba(16, 185, 129, 0.25);
        color: #6ee7b7;
      }

      :host-context(body.dark-theme) .table-status-badge.warning {
        background: rgba(245, 158, 11, 0.25);
        color: #fcd34d;
      }

      :host-context(body.dark-theme) .table-status-badge.critical {
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
      }

      :host-context(body.dark-theme) .table-status-badge.offline {
        background: rgba(107, 114, 128, 0.25);
        color: #cbd5e1;
      }

      /* Dark Theme - Timeline */
      :host-context(body.dark-theme) .timeline-track {
        background: linear-gradient(180deg, rgba(16, 185, 129, 0.6), rgba(52, 211, 153, 0.5), rgba(16, 185, 129, 0.6));
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
      }

      :host-context(body.dark-theme) .timeline-marker {
        border-color: rgba(30, 41, 59, 0.9);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      }

      :host-context(body.dark-theme) .timeline-content {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(100, 116, 139, 0.4);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      :host-context(body.dark-theme) .timeline-content:hover {
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        border-color: rgba(16, 185, 129, 0.5);
      }

      :host-context(body.dark-theme) .timeline-time {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .value-text {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .value-unit {
        color: #94a3b8;
      }

      :host-context(body.dark-theme) .chart-section {
        background: rgba(30, 41, 59, 0.7);
        border-color: rgba(100, 116, 139, 0.3);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
                    inset 0 1px 1px rgba(100, 116, 139, 0.15);
      }

      :host-context(body.dark-theme) .chart-section:hover {
        background: rgba(30, 41, 59, 0.85);
        border-color: rgba(52, 211, 153, 0.4);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4),
                    0 0 24px rgba(16, 185, 129, 0.1),
                    inset 0 1px 1px rgba(52, 211, 153, 0.2);
      }

      :host-context(body.dark-theme) .chart-header {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .empty-detail {
        color: #cbd5e1;
      }

      :host-context(body.dark-theme) .empty-detail h3 {
        color: #f1f5f9;
      }

      :host-context(body.dark-theme) .empty-detail p {
        color: #94a3b8;
      }
    `,
  ],
})
export class DeviceDetailPanelComponent {
  // Inputs
  device = input<DeviceDetail | null>(null);
  loading = input<boolean>(false);

  // View mode state
  viewMode = signal<'chart' | 'table' | 'timeline'>('chart');

  // Chart config
  colorScheme: any = {
    domain: ['#667eea', '#764ba2', '#f59e0b'],
  };
  curveFunction: any = null; // Will use default curve

  // Computed chart data in ngx-charts format
  chartSeriesData = computed(() => {
    const dev = this.device();
    if (!dev || !dev.chartData || dev.chartData.length === 0) return [];
    return [
      {
        name: dev.name,
        series: dev.chartData,
      },
    ];
  });

  getStatusIcon(status: SensorStatus): string {
    const icons: Record<SensorStatus, string> = {
      normal: 'check_circle',
      warning: 'warning',
      critical: 'error',
      offline: 'sensors_off',
    };
    return icons[status];
  }

  getStatusLabel(status: SensorStatus): string {
    const labels: Record<SensorStatus, string> = {
      normal: 'Healthy',
      warning: 'Caution',
      critical: 'Alert',
      offline: 'Offline',
    };
    return labels[status];
  }

  getStatusDescription(status: SensorStatus): string {
    const descriptions: Record<SensorStatus, string> = {
      normal: 'Sensor is operating normally and within safe parameters',
      warning: 'Sensor reading is outside optimal range - monitor closely',
      critical: 'Immediate attention required - sensor reading is critical',
      offline: 'Sensor is not responding - check connection',
    };
    return descriptions[status];
  }

  getStatusDescriptionIcon(status: SensorStatus): string {
    const icons: Record<SensorStatus, string> = {
      normal: 'info',
      warning: 'info',
      critical: 'error',
      offline: 'wifi_off',
    };
    return icons[status];
  }

  getHealthPercentage(status: SensorStatus): number {
    const percentages: Record<SensorStatus, number> = {
      normal: 100,
      warning: 60,
      critical: 20,
      offline: 0,
    };
    return percentages[status];
  }

  getTimeAgo(date: Date | null): string {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  getRangePosition(optimalMin: number, min: number, max: number): number {
    if (max === min) return 0;
    return Math.max(0, Math.min(100, ((optimalMin - min) / (max - min)) * 100));
  }

  getRangeWidth(optimalMin: number, optimalMax: number, min: number, max: number): number {
    if (max === min) return 0;
    return Math.max(0, Math.min(100, ((optimalMax - optimalMin) / (max - min)) * 100));
  }

  formatDateTime(date: Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  getPosition(value: number): number {
    const dev = this.device();
    if (!dev) return 0;
    const { min, max } = dev.thresholds;
    if (max === min) return 0;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  }

  getWidth(start: number, end: number): number {
    const dev = this.device();
    if (!dev) return 0;
    const { min, max } = dev.thresholds;
    if (max === min) return 0;
    return Math.max(0, Math.min(100, ((end - start) / (max - min)) * 100));
  }

  getValueStatus(value: number): SensorStatus {
    const dev = this.device();
    if (!dev) return 'offline';

    const { min, max, optimalMin, optimalMax } = dev.thresholds;

    if (value < min || value > max) return 'critical';
    if (value < optimalMin || value > optimalMax) return 'warning';
    return 'normal';
  }

  getValueStatusClass(value: number): string {
    const status = this.getValueStatus(value);
    return `status-${status}`;
  }

  isInOptimalZone(value: number): boolean {
    const dev = this.device();
    if (!dev) return false;
    const { optimalMin, optimalMax } = dev.thresholds;
    return value >= optimalMin && value <= optimalMax;
  }

  isInWarningZone(value: number): boolean {
    const dev = this.device();
    if (!dev) return false;
    const { min, max, optimalMin, optimalMax } = dev.thresholds;
    return (value >= min && value < optimalMin) || (value > optimalMax && value <= max);
  }

  isInCriticalZone(value: number): boolean {
    const dev = this.device();
    if (!dev) return false;
    const { min, max } = dev.thresholds;
    return value < min || value > max;
  }

  getZoneStatus(value: number): string {
    const status = this.getValueStatus(value);
    switch (status) {
      case 'normal': return 'Optimal';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  }

  getValueStatusIcon(value: number): string {
    const status = this.getValueStatus(value);
    switch (status) {
      case 'normal': return 'check_circle';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'help';
    }
  }

  getStatusMessage(value: number): string {
    const dev = this.device();
    if (!dev) return '';
    const status = this.getValueStatus(value);
    const { optimalMin, optimalMax, min, max } = dev.thresholds;

    switch (status) {
      case 'normal':
        return `Your sensor is operating within the optimal range (${optimalMin} - ${optimalMax} ${dev.unit}).`;
      case 'warning':
        if (value < optimalMin) {
          return `Value is below optimal range. Consider adjusting to reach ${optimalMin} - ${optimalMax} ${dev.unit}.`;
        } else {
          return `Value is above optimal range. Consider adjusting to reach ${optimalMin} - ${optimalMax} ${dev.unit}.`;
        }
      case 'critical':
        if (value < min) {
          return `Value is critically low (below ${min} ${dev.unit}). Immediate action required!`;
        } else {
          return `Value is critically high (above ${max} ${dev.unit}). Immediate action required!`;
        }
      default:
        return 'Unable to determine status.';
    }
  }

  exportToCSV(): void {
    const dev = this.device();
    if (!dev || !dev.chartData || dev.chartData.length === 0) {
      console.warn('No data available for export');
      return;
    }

    // Generate CSV content
    const headers = ['Timestamp', 'Value', 'Unit', 'Status'];
    const rows = dev.chartData.map(point => {
      const status = this.getValueStatus(point.value);
      return [
        new Date(point.name).toLocaleString(),
        point.value.toFixed(2),
        dev.unit,
        status.toUpperCase()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${dev.name}_data_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToPDF(): void {
    const dev = this.device();
    if (!dev) {
      console.warn('No device data available for export');
      return;
    }

    // Simple PDF export using browser print
    // For a production app, consider using libraries like jsPDF or pdfmake
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sensor Data - ${dev.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #10b981; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #10b981; color: white; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .header-info { margin-bottom: 20px; }
          .status-badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .normal { background: #d1fae5; color: #065f46; }
          .warning { background: #fef3c7; color: #92400e; }
          .critical { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <h1>Sensor Data Report</h1>
        <div class="header-info">
          <p><strong>Sensor:</strong> ${dev.name}</p>
          <p><strong>Type:</strong> ${dev.type}</p>
          <p><strong>Current Value:</strong> ${dev.currentValue.toFixed(2)} ${dev.unit}</p>
          <p><strong>Status:</strong> ${dev.status.toUpperCase()}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${dev.chartData.map(point => {
              const status = this.getValueStatus(point.value);
              return `
                <tr>
                  <td>${new Date(point.name).toLocaleString()}</td>
                  <td>${point.value.toFixed(2)} ${dev.unit}</td>
                  <td><span class="status-badge ${status}">${status.toUpperCase()}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }
}

