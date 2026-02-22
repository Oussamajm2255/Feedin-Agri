import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ZoneAlert, ZoneDashboardData } from '../../../core/models/zone.model';

/**
 * Zone Alerts Component
 *
 * Displays alerts grouped by zone with critical alerts pinned.
 * Uses calm, farm-friendly language — no raw logs or technical codes.
 */
@Component({
  selector: 'app-zone-alerts',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule],
  template: `
    <div class="zone-alerts">
      @if (pinnedAlerts().length > 0) {
        <div class="pinned-section">
          <h4 class="section-title critical-title">
            <mat-icon>error</mat-icon>
            Needs attention
          </h4>
          @for (alert of pinnedAlerts(); track alert.id) {
            <div class="alert-item critical">
              <mat-icon>error</mat-icon>
              <div class="alert-content">
                <span class="alert-title">{{ alert.title }}</span>
                @if (alert.message) {
                  <span class="alert-msg">{{ alert.message }}</span>
                }
                <span class="alert-time">{{ formatTime(alert.created_at) }}</span>
              </div>
            </div>
          }
        </div>
      }

      @if (warningAlerts().length > 0) {
        <div class="warning-section">
          <h4 class="section-title warning-title">
            <mat-icon>warning</mat-icon>
            Worth monitoring
          </h4>
          @for (alert of warningAlerts(); track alert.id) {
            <div class="alert-item warning">
              <mat-icon>warning</mat-icon>
              <div class="alert-content">
                <span class="alert-title">{{ alert.title }}</span>
                <span class="alert-time">{{ formatTime(alert.created_at) }}</span>
              </div>
            </div>
          }
        </div>
      }

      @if (pinnedAlerts().length === 0 && warningAlerts().length === 0) {
        <div class="no-alerts">
          <mat-icon>check_circle</mat-icon>
          <p>Everything looks good — no alerts right now.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .zone-alerts {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .critical-title { color: #ef5350; }
    .warning-title { color: #ffa726; }

    .alert-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 6px;
      transition: background 0.2s ease;
    }

    .alert-item.critical {
      background: rgba(229, 57, 53, 0.08);
      border-left: 3px solid #ef5350;
    }

    .alert-item.critical mat-icon {
      color: #ef5350;
    }

    .alert-item.warning {
      background: rgba(255, 167, 38, 0.08);
      border-left: 3px solid #ffa726;
    }

    .alert-item.warning mat-icon {
      color: #ffa726;
    }

    .alert-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .alert-title {
      font-size: 0.9rem;
      font-weight: 500;
    }

    .alert-msg {
      font-size: 0.8rem;
      color: var(--on-surface-variant, #aaa);
    }

    .alert-time {
      font-size: 0.7rem;
      color: var(--on-surface-variant, #888);
    }

    .no-alerts {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      color: var(--on-surface-variant, #999);
      text-align: center;
    }

    .no-alerts mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #66bb6a;
      margin-bottom: 8px;
    }

    @media (prefers-reduced-motion: reduce) {
      .alert-item { transition: none; }
    }
  `],
})
export class ZoneAlertsComponent {
  /** All zone dashboard data to extract and group alerts */
  zones = input.required<ZoneDashboardData[]>();

  pinnedAlerts(): (ZoneAlert & { zoneName: string })[] {
    return this.zones()
      .flatMap((z) =>
        z.alerts
          .filter((a) => a.severity === 'critical')
          .map((a) => ({ ...a, zoneName: z.zone.name })),
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  warningAlerts(): (ZoneAlert & { zoneName: string })[] {
    return this.zones()
      .flatMap((z) =>
        z.alerts
          .filter((a) => a.severity === 'warning')
          .map((a) => ({ ...a, zoneName: z.zone.name })),
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }

  formatTime(date: Date): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  }
}
