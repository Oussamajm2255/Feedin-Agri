import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

import { ZonesService } from '../../../core/services/zones.service';
import { ApiService } from '../../../core/services/api.service';
import { CropService } from '../../../core/services/crop.service';
import { LanguageService } from '../../../core/services/language.service';
import { FarmManagementService } from '../../../core/services/farm-management.service';
import { Zone, ZoneType } from '../../../core/models/zone.model';
import { Sensor, Device, Crop } from '../../../core/models/farm.model';

@Component({
  selector: 'app-zone-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatDividerModule,
    TranslatePipe,
  ],
  templateUrl: './zone-detail.component.html',
  styleUrl: './zone-detail.component.scss',
})
export class ZoneDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private zonesService = inject(ZonesService);
  private apiService = inject(ApiService);
  private cropService = inject(CropService);
  private farmManagement = inject(FarmManagementService);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);

  // State
  zone = signal<Zone | null>(null);
  isLoading = signal(true);

  // All available items (from farm — used for dropdowns)
  allSensors = signal<Sensor[]>([]);
  allDevices = signal<Device[]>([]);
  allCrops = signal<Crop[]>([]);

  // Assignment form values
  selectedSensorId = '';
  selectedDeviceId = '';

  ngOnInit(): void {
    const zoneId = this.route.snapshot.paramMap.get('id');
    if (!zoneId) {
      this.router.navigate(['/zones']);
      return;
    }
    this.loadZone(zoneId);
  }

  private loadZone(zoneId: string): void {
    this.isLoading.set(true);
    this.zonesService.getZone(zoneId).subscribe({
      next: (zone) => {
        this.zone.set(zone);
        this.loadFarmItems(zone.farm_id);
      },
      error: () => {
        this.snackBar.open('Zone not found', 'OK', { duration: 3000 });
        this.router.navigate(['/zones']);
      },
    });
  }

  private loadFarmItems(farmId: string): void {
    forkJoin({
      sensors: this.apiService.getSensors(),
      devices: this.apiService.getDevicesByFarm(farmId),
      crops: this.cropService.loadCrops(),
    }).subscribe({
      next: (result: { sensors: Sensor[]; devices: Device[]; crops: Crop[] }) => {
        this.allSensors.set(result.sensors);
        this.allDevices.set(result.devices);
        this.allCrops.set(result.crops);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  // ── Computed Lists ──────────────────────────────────────

  get zoneSensors(): Sensor[] {
    const z = this.zone();
    if (!z) return [];
    return this.allSensors().filter((s) => s.zone_id === z.id);
  }

  get zoneDevices(): Device[] {
    const z = this.zone();
    if (!z) return [];
    return this.allDevices().filter((d) => (d as any).zone_id === z.id);
  }

  get zoneCrops(): Crop[] {
    const z = this.zone();
    if (!z) return [];
    return this.allCrops().filter((c) => c.zone_id === z.id);
  }

  get unassignedSensors(): Sensor[] {
    return this.allSensors().filter((s) => !s.zone_id);
  }

  get unassignedDevices(): Device[] {
    return this.allDevices().filter((d) => !(d as any).zone_id);
  }

  // ── Assignment Actions ──────────────────────────────────

  assignSensor(): void {
    const z = this.zone();
    if (!z || !this.selectedSensorId) return;

    this.zonesService.assignSensor(z.id, this.selectedSensorId).subscribe({
      next: () => {
        this.snackBar.open('Sensor linked to zone', 'OK', { duration: 3000 });
        this.selectedSensorId = '';
        this.loadZone(z.id);
      },
      error: () => {
        this.snackBar.open('Failed to assign sensor', 'OK', { duration: 3000 });
      },
    });
  }

  assignDevice(): void {
    const z = this.zone();
    if (!z || !this.selectedDeviceId) return;

    this.zonesService.assignDevice(z.id, this.selectedDeviceId).subscribe({
      next: () => {
        this.snackBar.open('Device linked to zone', 'OK', { duration: 3000 });
        this.selectedDeviceId = '';
        this.loadZone(z.id);
      },
      error: () => {
        this.snackBar.open('Failed to assign device', 'OK', { duration: 3000 });
      },
    });
  }

  unlinkSensor(sensor: Sensor): void {
    // Unlink = assign to null zone (set zone_id = null)
    this.zonesService.assignSensor('unlink', sensor.sensor_id).subscribe({
      next: () => {
        this.snackBar.open('Sensor unlinked', 'OK', { duration: 3000 });
        const z = this.zone();
        if (z) this.loadZone(z.id);
      },
      error: () => {
        this.snackBar.open('Failed to unlink sensor', 'OK', { duration: 3000 });
      },
    });
  }

  unlinkDevice(device: Device): void {
    this.zonesService.assignDevice('unlink', device.device_id).subscribe({
      next: () => {
        this.snackBar.open('Device unlinked', 'OK', { duration: 3000 });
        const z = this.zone();
        if (z) this.loadZone(z.id);
      },
      error: () => {
        this.snackBar.open('Failed to unlink device', 'OK', { duration: 3000 });
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────

  getZoneIcon(type: ZoneType): string {
    switch (type) {
      case 'greenhouse': return 'house';
      case 'indoor':     return 'meeting_room';
      case 'hydroponic': return 'water_drop';
      default:           return 'landscape';
    }
  }

  goBack(): void {
    this.router.navigate(['/zones']);
  }
}
