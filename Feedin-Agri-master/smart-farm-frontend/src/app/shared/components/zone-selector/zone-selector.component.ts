import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ZonesService } from '../../../core/services/zones.service';
import { Zone } from '../../../core/models/zone.model';

@Component({
  selector: 'app-zone-selector',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatFormFieldModule, MatIconModule, MatChipsModule],
  template: `
    <div class="zone-selector" [class.compact]="compact()">
      @if (zonesService.hasZones()) {
        <mat-form-field appearance="outline" class="zone-field">
          <mat-label>
            <mat-icon>map</mat-icon>
            Zone
          </mat-label>
          <mat-select
            [value]="zonesService.selectedZone()?.id || 'all'"
            (selectionChange)="onZoneChange($event.value)"
            id="zone-selector-dropdown">
            <mat-option value="all">
              <mat-icon>dashboard</mat-icon>
              All Zones
            </mat-option>
            @for (zone of zonesService.zones(); track zone.id) {
              <mat-option [value]="zone.id">
                <mat-icon>{{ getZoneIcon(zone.type) }}</mat-icon>
                {{ zone.name }}
                @if (zone.type) {
                  <span class="zone-type-badge">{{ zone.type }}</span>
                }
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      } @else if (zonesService.loading()) {
        <div class="zone-loading">
          <mat-icon class="spin">sync</mat-icon>
          <span>Loading zones...</span>
        </div>
      } @else {
        <div class="zone-empty">
          <mat-icon>info_outline</mat-icon>
          <span>No zones configured</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .zone-selector {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .zone-field {
      min-width: 200px;
      max-width: 300px;
    }

    .zone-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .zone-type-badge {
      display: inline-block;
      font-size: 0.7rem;
      padding: 1px 6px;
      border-radius: 8px;
      background: var(--surface-variant, rgba(255, 255, 255, 0.08));
      color: var(--on-surface-variant, #aaa);
      margin-left: 8px;
      text-transform: capitalize;
    }

    .zone-loading,
    .zone-empty {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      color: var(--on-surface-variant, #999);
      padding: 8px 12px;
    }

    .spin {
      animation: spin 1.2s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .compact .zone-field {
      min-width: 160px;
    }

    @media (max-width: 600px) {
      .zone-field {
        min-width: 140px;
        max-width: 100%;
      }
    }
  `],
})
export class ZoneSelectorComponent {
  zonesService = inject(ZonesService);

  /** Compact mode for mobile / sidebar */
  compact = input(false);

  /** Emits when zone selection changes */
  zoneChanged = output<Zone | null>();

  onZoneChange(value: string): void {
    if (value === 'all') {
      this.zonesService.selectZone(null);
      this.zoneChanged.emit(null);
    } else {
      const zone = this.zonesService.zones().find((z) => z.id === value) ?? null;
      this.zonesService.selectZone(zone);
      this.zoneChanged.emit(zone);
    }
  }

  getZoneIcon(type: string): string {
    switch (type) {
      case 'indoor': return 'house';
      case 'greenhouse': return 'wb_sunny';
      case 'hydroponic': return 'water_drop';
      case 'outdoor': return 'park';
      default: return 'map';
    }
  }
}
