import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ZoneDashboardData } from '../../../core/models/zone.model';

@Component({
  selector: 'app-zone-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  template: `
    <mat-card class="zone-card" [class.critical]="hasCriticalAlerts()">
      <!-- Header -->
      <div class="zone-header">
        <div class="zone-title-row">
          <mat-icon class="zone-icon">{{ getZoneIcon() }}</mat-icon>
          <div class="zone-title">
            <h3>{{ data().zone.name }}</h3>
            <span class="zone-type">{{ data().zone.type }}</span>
          </div>
        </div>
        <div class="health-badge" [class]="'health-' + getHealthLevel()">
          <mat-icon>{{ getHealthIcon() }}</mat-icon>
          {{ data().healthScore }}%
        </div>
      </div>

      <!-- Health Bar -->
      <mat-progress-bar
        [value]="data().healthScore"
        [color]="getHealthColor()"
        mode="determinate"
        class="health-bar">
      </mat-progress-bar>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat" matTooltip="Active crops">
          <mat-icon>eco</mat-icon>
          <span>{{ data().crops.length }}</span>
        </div>
        <div class="stat" matTooltip="Sensors">
          <mat-icon>sensors</mat-icon>
          <span>{{ data().sensors.length }}</span>
        </div>
        <div class="stat" matTooltip="Devices">
          <mat-icon>developer_board</mat-icon>
          <span>{{ data().deviceCount }}</span>
        </div>
        <div class="stat" matTooltip="Alerts">
          <mat-icon [class.alert-icon]="hasCriticalAlerts()">
            {{ hasCriticalAlerts() ? 'error' : 'check_circle' }}
          </mat-icon>
          <span>{{ data().alerts.length }}</span>
        </div>
      </div>

      <!-- Active Crops -->
      @if (data().crops.length > 0) {
        <div class="section">
          <span class="section-label">Crops</span>
          <div class="chips">
            @for (crop of data().crops.slice(0, 3); track crop.crop_id) {
              <mat-chip-option [selectable]="false" class="crop-chip">
                {{ crop.name }}
              </mat-chip-option>
            }
            @if (data().crops.length > 3) {
              <span class="more">+{{ data().crops.length - 3 }} more</span>
            }
          </div>
        </div>
      }

      <!-- Latest Sensor Readings -->
      @if (data().sensors.length > 0) {
        <div class="section">
          <span class="section-label">Latest Readings</span>
          <div class="readings-grid">
            @for (sensor of data().sensors.slice(0, 4); track sensor.sensor_id) {
              <div class="reading-item">
                <span class="reading-type">{{ sensor.type }}</span>
                <span class="reading-value" [class.stale]="isStale(sensor.latest_timestamp)">
                  @if (sensor.latest_value !== null) {
                    {{ sensor.latest_value | number:'1.1-1' }} {{ sensor.unit }}
                  } @else {
                    <span class="no-data">—</span>
                  }
                </span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Alerts -->
      @if (data().alerts.length > 0) {
        <div class="section alerts-section">
          <span class="section-label">Alerts</span>
          @for (alert of data().alerts.slice(0, 2); track alert.id) {
            <div class="alert-item" [class]="'alert-' + alert.severity">
              <mat-icon>{{ alert.severity === 'critical' ? 'error' : 'warning' }}</mat-icon>
              <span>{{ alert.title }}</span>
            </div>
          }
        </div>
      }

      <!-- Recommendations -->
      @if (data().recommendations.length > 0) {
        <div class="section">
          <span class="section-label">Recommendations</span>
          @for (rec of data().recommendations.slice(0, 2); track rec.id) {
            <div class="rec-item">
              <mat-icon>lightbulb</mat-icon>
              <span>{{ rec.message }}</span>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (data().sensors.length === 0 && data().crops.length === 0) {
        <div class="empty-state">
          <mat-icon>info_outline</mat-icon>
          <p>This zone has no sensors or crops yet.</p>
        </div>
      }
    </mat-card>
  `,
  styles: [`
    .zone-card {
      border-radius: 16px;
      padding: 20px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 1px solid var(--border-color, rgba(255,255,255,0.06));
      background: var(--card-bg, #1a1a2e);
    }

    .zone-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .zone-card.critical {
      border-color: var(--error, #e53935);
    }

    .zone-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .zone-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .zone-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: var(--primary, #4caf50);
    }

    .zone-title h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .zone-type {
      font-size: 0.75rem;
      text-transform: capitalize;
      color: var(--on-surface-variant, #999);
    }

    .health-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .health-good { background: rgba(76, 175, 80, 0.15); color: #66bb6a; }
    .health-warning { background: rgba(255, 167, 38, 0.15); color: #ffa726; }
    .health-critical { background: rgba(229, 57, 53, 0.15); color: #ef5350; }

    .health-bar {
      margin-bottom: 16px;
      border-radius: 4px;
    }

    .stats-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.85rem;
      color: var(--on-surface-variant, #bbb);
    }

    .stat mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .alert-icon {
      color: var(--error, #e53935) !important;
    }

    .section {
      margin-bottom: 12px;
    }

    .section-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--on-surface-variant, #999);
      display: block;
      margin-bottom: 6px;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .crop-chip {
      font-size: 0.8rem;
    }

    .more {
      font-size: 0.8rem;
      color: var(--on-surface-variant, #888);
    }

    .readings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 8px;
    }

    .reading-item {
      display: flex;
      flex-direction: column;
      padding: 6px 8px;
      border-radius: 8px;
      background: var(--surface-variant, rgba(255,255,255,0.04));
    }

    .reading-type {
      font-size: 0.7rem;
      text-transform: capitalize;
      color: var(--on-surface-variant, #999);
    }

    .reading-value {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .reading-value.stale {
      opacity: 0.5;
    }

    .no-data {
      color: var(--on-surface-variant, #666);
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 4px;
    }

    .alert-critical {
      background: rgba(229, 57, 53, 0.1);
      color: #ef5350;
    }

    .alert-warning {
      background: rgba(255, 167, 38, 0.1);
      color: #ffa726;
    }

    .alert-info {
      background: rgba(66, 165, 245, 0.1);
      color: #42a5f5;
    }

    .rec-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--on-surface-variant, #ccc);
      margin-bottom: 4px;
    }

    .rec-item mat-icon {
      color: #ffca28;
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-top: 2px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      color: var(--on-surface-variant, #888);
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
    }

    @media (max-width: 600px) {
      .zone-card {
        padding: 14px;
      }

      .stats-row {
        gap: 12px;
      }

      .readings-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .zone-card {
        transition: none;
      }
    }
  `],
})
export class ZoneCardComponent {
  data = input.required<ZoneDashboardData>();

  hasCriticalAlerts(): boolean {
    return this.data().alerts.some((a) => a.severity === 'critical');
  }

  getHealthLevel(): string {
    const score = this.data().healthScore;
    if (score >= 80) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  }

  getHealthIcon(): string {
    const score = this.data().healthScore;
    if (score >= 80) return 'favorite';
    if (score >= 50) return 'heart_broken';
    return 'warning';
  }

  getHealthColor(): 'primary' | 'accent' | 'warn' {
    const score = this.data().healthScore;
    if (score >= 80) return 'primary';
    if (score >= 50) return 'accent';
    return 'warn';
  }

  getZoneIcon(): string {
    switch (this.data().zone.type) {
      case 'indoor': return 'house';
      case 'greenhouse': return 'wb_sunny';
      case 'hydroponic': return 'water_drop';
      case 'outdoor': return 'park';
      default: return 'map';
    }
  }

  isStale(timestamp: Date | null): boolean {
    if (!timestamp) return true;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(timestamp) < oneHourAgo;
  }
}
