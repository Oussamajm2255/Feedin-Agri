import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Device, Farm } from '../../../../../../core/models/farm.model';

export interface SensorRegistrationData {
  device?: Device | null;
  farms: Farm[];
  crops: any[];
}

export interface SensorRegistrationResult {
  sensor_id: string;
  farm_id: string;
  type: string;
  unit: string;
  device_id: string;
  location?: string;
  crop_id?: string;
  min_critical?: number;
  min_warning?: number;
  max_warning?: number;
  max_critical?: number;
  action_low?: string;
  action_high?: string;
}

@Component({
  selector: 'app-sensor-registration-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './sensor-registration-dialog.component.html',
  styleUrl: './sensor-registration-dialog.component.scss',
})
export class SensorRegistrationDialogComponent implements OnInit {
  sensorForm: FormGroup;
  isLoading = signal(false);
  sensorTypeInfo = signal<string>('');

  sensorTypes = [
    { value: 'temperature', label: 'Temperature', unit: '°C' },
    { value: 'humidity', label: 'Humidity', unit: '%' },
    { value: 'soilMoisture', label: 'Soil Moisture', unit: '%' },
    { value: 'soilTemperature', label: 'Soil Temperature', unit: '°C' },
    { value: 'light', label: 'Light Intensity', unit: 'lux' },
    { value: 'ph', label: 'pH Level', unit: 'pH' },
    { value: 'ec', label: 'Electrical Conductivity', unit: 'µS/cm' },
    { value: 'co2', label: 'CO2 Concentration', unit: 'ppm' },
    { value: 'pressure', label: 'Atmospheric Pressure', unit: 'hPa' },
    { value: 'windSpeed', label: 'Wind Speed', unit: 'm/s' },
    { value: 'rainfall', label: 'Rainfall', unit: 'mm' },
    { value: 'uv', label: 'UV Index', unit: 'index' },
    { value: 'motion', label: 'Motion Detection', unit: 'boolean' },
    { value: 'door', label: 'Door/Window Status', unit: 'boolean' },
    { value: 'water', label: 'Water Level', unit: 'cm' },
    { value: 'DHT11', label: 'DHT11 (Combo Sensor)', unit: '°C' },
    { value: 'DHT22', label: 'DHT22 (Combo Sensor)', unit: '°C' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SensorRegistrationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SensorRegistrationData
  ) {
    this.sensorForm = this.fb.group({
      sensorId: ['', [Validators.required, Validators.maxLength(36)]],
      farmId: [data.device?.farm_id || '', Validators.required],
      cropId: [''],
      sensorType: ['', Validators.required],
      unit: ['', Validators.required],
      deviceId: [data.device?.device_id || '', Validators.required],
      location: ['', Validators.maxLength(100)],
      minCritical: [null],
      minWarning: [null],
      maxWarning: [null],
      maxCritical: [null],
      actionLow: [''],
      actionHigh: [''],
    });
  }

  ngOnInit(): void {
    // Auto-fill device if provided
    if (this.data.device) {
      this.sensorForm.patchValue({
        deviceId: this.data.device.device_id,
        farmId: this.data.device.farm_id,
      });
    }

    // Watch sensor type changes
    this.sensorForm.get('sensorType')?.valueChanges.subscribe((type) => {
      this.onSensorTypeChange(type);
    });
  }

  onSensorTypeChange(type: string): void {
    const sensorType = this.sensorTypes.find(st => st.value === type);
    if (sensorType) {
      this.sensorForm.patchValue({ unit: sensorType.unit });
    }

    // Special handling for combo sensors
    if (type === 'DHT11' || type === 'DHT22') {
      this.sensorTypeInfo.set('⚠️ Combo sensor detected! You\'ll need to register this twice: once for temperature (°C) and once for humidity (%).');
    } else {
      this.sensorTypeInfo.set('');
    }
  }

  onSubmit(): void {
    if (this.sensorForm.invalid) {
      this.markFormGroupTouched(this.sensorForm);
      return;
    }

    const formValue = this.sensorForm.value;

    // Validate thresholds
    if (formValue.minCritical !== null && formValue.minWarning !== null && formValue.minCritical >= formValue.minWarning) {
      alert('❌ Critical minimum must be less than warning minimum');
      return;
    }

    if (formValue.maxWarning !== null && formValue.maxCritical !== null && formValue.maxWarning >= formValue.maxCritical) {
      alert('❌ Warning maximum must be less than critical maximum');
      return;
    }

    const result: SensorRegistrationResult = {
      sensor_id: formValue.sensorId,
      farm_id: formValue.farmId,
      type: formValue.sensorType,
      unit: formValue.unit,
      device_id: formValue.deviceId,
      location: formValue.location || undefined,
      crop_id: formValue.cropId || undefined,
      min_critical: formValue.minCritical !== null ? parseFloat(formValue.minCritical) : undefined,
      min_warning: formValue.minWarning !== null ? parseFloat(formValue.minWarning) : undefined,
      max_warning: formValue.maxWarning !== null ? parseFloat(formValue.maxWarning) : undefined,
      max_critical: formValue.maxCritical !== null ? parseFloat(formValue.maxCritical) : undefined,
      action_low: formValue.actionLow || undefined,
      action_high: formValue.actionHigh || undefined,
    };

    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.sensorForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('maxlength')) {
      return `Maximum length is ${control.errors?.['maxlength'].requiredLength} characters`;
    }
    return '';
  }
}

