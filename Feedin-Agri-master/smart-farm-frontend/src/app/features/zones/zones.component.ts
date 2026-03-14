import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

import { ZonesService } from '../../core/services/zones.service';
import { FarmManagementService } from '../../core/services/farm-management.service';
import { LanguageService } from '../../core/services/language.service';
import { Zone, ZoneType } from '../../core/models/zone.model';

@Component({
  selector: 'app-zones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './zones.component.html',
  styleUrl: './zones.component.scss',
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class ZonesComponent implements OnInit, OnDestroy {
  private zonesService = inject(ZonesService);
  private farmManagement = inject(FarmManagementService);
  public languageService = inject(LanguageService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  private subs = new Subscription();

  // State
  isLoading = signal(true);
  showCreateForm = signal(false);
  editingZone = signal<Zone | null>(null);

  // Form model
  form = {
    name: '',
    type: 'outdoor' as ZoneType,
    area_m2: null as number | null,
    description: '',
  };

  readonly zoneTypes: ZoneType[] = ['indoor', 'outdoor', 'greenhouse', 'hydroponic'];

  get zones() {
    return this.zonesService.zones();
  }

  get selectedFarm() {
    return this.farmManagement.selectedFarm();
  }

  ngOnInit(): void {
    // Subscribe to farm changes and load zones
    this.subs.add(
      this.farmManagement.selectedFarm$?.subscribe((farm) => {
        if (farm) {
          this.loadZones(farm.farm_id);
        }
      }) ?? (() => {
        // If no observable, load once
        const farm = this.farmManagement.selectedFarm();
        if (farm) {
          this.loadZones(farm.farm_id);
        } else {
          this.isLoading.set(false);
        }
      })()
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadZones(farmId: string): void {
    this.isLoading.set(true);
    this.zonesService.loadZones(farmId).subscribe({
      next: () => this.isLoading.set(false),
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Failed to load zones', 'OK', { duration: 3000 });
      },
    });
  }

  // ── Form Actions ─────────────────────────────────────────

  openCreateForm(): void {
    this.resetForm();
    this.editingZone.set(null);
    this.showCreateForm.set(true);
  }

  openEditForm(zone: Zone): void {
    this.editingZone.set(zone);
    this.form.name = zone.name;
    this.form.type = zone.type;
    this.form.area_m2 = zone.area_m2 ?? null;
    this.form.description = zone.description ?? '';
    this.showCreateForm.set(true);
  }

  cancelForm(): void {
    this.showCreateForm.set(false);
    this.editingZone.set(null);
    this.resetForm();
  }

  private resetForm(): void {
    this.form = { name: '', type: 'outdoor', area_m2: null, description: '' };
  }

  submitForm(): void {
    const farm = this.selectedFarm;
    if (!farm) return;

    if (!this.form.name.trim()) {
      this.snackBar.open('Zone name is required', 'OK', { duration: 3000 });
      return;
    }

    const editing = this.editingZone();

    if (editing) {
      // Update
      this.zonesService.updateZone(editing.id, {
        name: this.form.name.trim(),
        type: this.form.type,
        area_m2: this.form.area_m2,
        description: this.form.description.trim() || undefined,
      }).subscribe({
        next: () => {
          this.snackBar.open('Zone updated', 'OK', { duration: 3000 });
          this.cancelForm();
          this.loadZones(farm.farm_id);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to update zone';
          this.snackBar.open(msg, 'OK', { duration: 4000 });
        },
      });
    } else {
      // Create
      this.zonesService.createZone({
        farm_id: farm.farm_id,
        name: this.form.name.trim(),
        type: this.form.type,
        area_m2: this.form.area_m2,
        description: this.form.description.trim() || undefined,
      }).subscribe({
        next: () => {
          this.snackBar.open('Zone created!', 'OK', { duration: 3000 });
          this.cancelForm();
          this.loadZones(farm.farm_id);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to create zone';
          this.snackBar.open(msg, 'OK', { duration: 4000 });
        },
      });
    }
  }

  deleteZone(zone: Zone): void {
    if (!confirm(`Delete zone "${zone.name}"? Sensors and crops inside will be unlinked.`)) return;

    this.zonesService.deleteZone(zone.id).subscribe({
      next: () => {
        this.snackBar.open('Zone deleted', 'OK', { duration: 3000 });
        const farm = this.selectedFarm;
        if (farm) this.loadZones(farm.farm_id);
      },
      error: () => {
        this.snackBar.open('Failed to delete zone', 'OK', { duration: 3000 });
      },
    });
  }

  openZoneDetail(zone: Zone): void {
    this.router.navigate(['/zones', zone.id]);
  }

  // ── Helpers ──────────────────────────────────────────────

  getZoneIcon(type: ZoneType): string {
    switch (type) {
      case 'greenhouse': return 'house';
      case 'indoor':     return 'meeting_room';
      case 'hydroponic': return 'water_drop';
      case 'outdoor':
      default:           return 'landscape';
    }
  }

  getZoneTypeLabel(type: ZoneType): string {
    const key = `zones.types.${type}`;
    return this.languageService.t()(key) || type;
  }

  getZoneStatusClass(zone: Zone): string {
    return zone.status === 'active' ? 'status-active' : 'status-inactive';
  }

  getSensorCount(zone: Zone): number {
    return zone.sensors?.length ?? 0;
  }

  getCropCount(zone: Zone): number {
    return zone.crops?.length ?? 0;
  }

  getDeviceCount(zone: Zone): number {
    return zone.devices?.length ?? 0;
  }
}
