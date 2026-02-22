/**
 * ================================================================================
 * DEVICE DIALOG COMPONENT (UNIFIED VIEW + EDIT + CREATE MODE)
 * ================================================================================
 * 
 * This component provides a unified dialog for viewing, creating, and editing
 * device information. Key features:
 * 
 * - VIEW MODE: Read-only display with metadata (created_at, updated_at, last_seen, 
 *   health_score, alerts_count). Button to switch to EDIT mode.
 * - EDIT MODE: All fields editable (except device_id). Diff-based PATCH request.
 * - CREATE MODE: Full form for new device creation.
 * - Tab-based layout: Overview, Configuration, Advanced
 * - Skeleton loading state
 * - Premium glassmorphism styling
 * - Full dark mode support with white text
 * - Smooth transitions and animations
 * 
 * @author Refactored as per architectural requirements
 * @version 2.0.0
 * ================================================================================
 */

import { Component, Inject, OnInit, ViewChild, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, switchMap, catchError, of, map, finalize } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';

import { Device, Farm, DeviceStatus } from '../../../../../../core/models/farm.model';
import { User } from '../../../../../../core/models/user.model';
import { AdminApiService } from '../../../../../../admin/core/services/admin-api.service';

// ================================================================================
// TYPE DEFINITIONS
// ================================================================================

/**
 * Dialog mode - supports view, edit, and create
 */
export type DialogMode = 'view' | 'edit' | 'create';

/**
 * Dialog data interface - passed when opening the dialog
 */
export interface DeviceDialogData {
  mode: DialogMode;
  farms: Farm[];
  users: User[];
  device?: Device; // Required for view/edit mode
  deviceId?: string; // Alternative to device object - will fetch from API
}

/**
 * Device DTO for Create operations
 */
export interface CreateDeviceDto {
  device_id: string;
  name: string;
  device_type: 'gateway' | 'controller' | 'sensor-board' | 'weather-station' | 'actuator-hub' | 'custom';
  farm_id: string;
  location?: string;
  firmware_version?: string;
  ip_address?: string;
  mac_address?: string;
  protocol?: 'MQTT' | 'HTTP' | 'LoRaWAN' | 'Modbus' | 'Custom';
  mqtt_broker?: string;
  mqtt_port?: number;
  mqtt_username?: string;
  mqtt_password?: string;
  mqtt_topic?: string;
  status: DeviceStatus;
  tags?: string[];
  health_score?: number;
  install_date?: Date;
  warranty_date?: Date;
  notes?: string;
  description?: string;
}

/**
 * Update DTO (Partial of Create) - for PATCH operations
 */
export type UpdateDeviceDto = Partial<CreateDeviceDto>;

// ================================================================================
// COMPONENT DEFINITION
// ================================================================================

@Component({
  selector: 'app-device-dialog',
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
    MatChipsModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  templateUrl: './device-dialog.component.html',
  styleUrl: './device-dialog.component.scss',
  animations: [
    // Fade animation for mode switching
    trigger('fadeMode', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    // Skeleton fade out
    trigger('skeletonFade', [
      state('loading', style({ opacity: 1 })),
      state('loaded', style({ opacity: 0 })),
      transition('loading => loaded', animate('400ms ease-out'))
    ]),
    // Content fade in
    trigger('contentFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms 200ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class DeviceDialogComponent implements OnInit {
  @ViewChild('advancedPanel') advancedPanel?: MatExpansionPanel;

  // ================================================================================
  // SERVICE INJECTIONS
  // ================================================================================
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<DeviceDialogComponent>);
  private adminApiService = inject(AdminApiService);
  private destroyRef = inject(DestroyRef);
  public data = inject<DeviceDialogData>(MAT_DIALOG_DATA);

  // ================================================================================
  // STATE SIGNALS
  // ================================================================================
  
  deviceForm: FormGroup;
  
  // Loading states
  isLoading = signal(false);
  isLoadingDevice = signal(false); // For fetching device data
  isValidatingDeviceId = signal(false);
  deviceIdError = signal<string | null>(null);
  
  // Dialog mode management
  mode = signal<DialogMode>(this.data.mode);
  isViewMode = computed(() => this.mode() === 'view');
  isEditMode = computed(() => this.mode() === 'edit');
  isCreateMode = computed(() => this.mode() === 'create');
  
  // Device data
  device = signal<Device | null>(this.data.device || null);
  
  // Store initial values for diff detection (for edit mode)
  private initialFormValue: any = null;
  
  // Tab management
  selectedTabIndex = signal(0);
  
  // Chip list configuration for tags
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  tags = signal<string[]>([]);

  // ================================================================================
  // STATIC OPTIONS
  // ================================================================================
  
  deviceTypes = [
    { value: 'gateway', label: 'Gateway', icon: 'router', description: 'Main hub for device connectivity' },
    { value: 'controller', label: 'Controller', icon: 'settings_remote', description: 'Automated control unit' },
    { value: 'sensor-board', label: 'Sensor Board', icon: 'sensors', description: 'Multi-sensor data collection' },
    { value: 'weather-station', label: 'Weather Station', icon: 'wb_cloudy', description: 'Environmental monitoring' },
    { value: 'actuator-hub', label: 'Actuator Hub', icon: 'power', description: 'Device actuation control' },
    { value: 'custom', label: 'Custom', icon: 'build', description: 'Custom device type' },
  ];

  protocols = [
    { value: 'MQTT', label: 'MQTT', icon: 'cloud_queue' },
    { value: 'HTTP', label: 'HTTP/REST', icon: 'http' },
    { value: 'LoRaWAN', label: 'LoRaWAN', icon: 'cell_tower' },
    { value: 'Modbus', label: 'Modbus', icon: 'cable' },
    { value: 'Custom', label: 'Custom', icon: 'settings_ethernet' },
  ];

  statusOptions = [
    { value: 'online', label: 'Online', icon: 'check_circle', color: 'success' },
    { value: 'offline', label: 'Offline', icon: 'cancel', color: 'error' },
    { value: 'maintenance', label: 'Maintenance', icon: 'build_circle', color: 'warn' },
  ];

  // ================================================================================
  // COMPUTED VALUES
  // ================================================================================
  
  selectedDeviceType = computed(() => {
    const type = this.deviceForm?.get('device_type')?.value;
    return this.deviceTypes.find(t => t.value === type);
  });

  selectedProtocol = computed(() => {
    const protocol = this.deviceForm?.get('protocol')?.value;
    return protocol;
  });

  showMqttSettings = computed(() => this.selectedProtocol() === 'MQTT');

  selectedFarm = computed(() => {
    const farmId = this.deviceForm?.get('farm_id')?.value;
    return this.data.farms.find(f => f.farm_id === farmId);
  });

  farmOwnerName = computed(() => {
    const farm = this.selectedFarm();
    if (!farm) return 'N/A';
    const owner = this.data.users.find(u => u.user_id === farm.owner_id);
    return owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown Owner';
  });

  // Metadata computed signals (for view/edit mode)
  createdAt = computed(() => {
    const device = this.device();
    if (!device?.created_at) return null;
    return new Date(device.created_at);
  });

  updatedAt = computed(() => {
    const device = this.device();
    if (!device?.updated_at) return null;
    return new Date(device.updated_at);
  });

  lastSeen = computed(() => {
    const device = this.device();
    if (!device?.last_seen) return null;
    return new Date(device.last_seen);
  });

  healthScore = computed(() => {
    const device = this.device();
    return device?.health_score ?? null;
  });

  alertsCount = computed(() => {
    const device = this.device();
    return (device as any)?.alerts_count ?? null;
  });

  // Dialog UI computed values
  dialogTitle = computed(() => {
    if (this.isViewMode()) return 'Device Details';
    if (this.isEditMode()) return 'Edit Device';
    return 'Create New Device';
  });

  dialogSubtitle = computed(() => {
    const device = this.device();
    if (this.isViewMode()) return device?.name || 'View device information';
    if (this.isEditMode()) return `Update device information for ${device?.name || 'device'}`;
    return 'Register a new device in the smart farm system';
  });

  submitButtonText = computed(() => {
    if (this.isViewMode()) return 'Edit';
    if (this.isEditMode()) return 'Save Changes';
    return 'Create Device';
  });

  submitButtonIcon = computed(() => {
    if (this.isViewMode()) return 'edit';
    if (this.isEditMode()) return 'save';
    return 'add_circle';
  });

  // ================================================================================
  // CONSTRUCTOR
  // ================================================================================
  
  constructor() {
    const data = this.data;
    
    // Validate data for view/edit modes
    if ((data.mode === 'edit' || data.mode === 'view') && !data.device && !data.deviceId) {
      throw new Error('Device data or deviceId is required for view/edit mode');
    }

    // Initialize form with all fields
    this.deviceForm = this.fb.group({
      // Basic Information
      device_id: [
        { value: '', disabled: data.mode !== 'create' }, 
        [Validators.required, Validators.maxLength(50)]
      ],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      device_type: ['gateway', Validators.required],

      // Assignment
      farm_id: ['', Validators.required],
      location: ['', Validators.maxLength(200)],

      // Technical Details
      firmware_version: ['', Validators.maxLength(50)],
      ip_address: ['', [this.ipAddressValidator]],
      mac_address: ['', [this.macAddressValidator]],
      protocol: ['MQTT'],

      // MQTT Settings (conditional)
      mqtt_broker: [''],
      mqtt_port: [1883, [Validators.min(1), Validators.max(65535)]],
      mqtt_username: [''],
      mqtt_password: [''],
      mqtt_topic: [''],

      // Status
      status: ['online', Validators.required],

      // Advanced
      health_score: [100, [Validators.min(0), Validators.max(100)]],
      install_date: [new Date()],
      warranty_date: [null],
      notes: ['', Validators.maxLength(500)],
      description: ['', Validators.maxLength(300)],
    });
  }

  // ================================================================================
  // LIFECYCLE HOOKS
  // ================================================================================
  
  ngOnInit(): void {
    // Add async validator for device_id in create mode
    if (this.isCreateMode()) {
      const deviceIdControl = this.deviceForm.get('device_id');
      deviceIdControl?.setAsyncValidators([this.deviceIdAsyncValidator.bind(this)]);
      deviceIdControl?.updateValueAndValidity();
    }

    // Fetch device data if needed (when deviceId is provided but not device object)
    if ((this.isViewMode() || this.isEditMode()) && !this.data.device && this.data.deviceId) {
      this.fetchDeviceData(this.data.deviceId);
    } else if (this.data.device) {
      // Populate form with existing device data
      this.populateFormWithDevice(this.data.device);
    }

    // Watch protocol changes to toggle MQTT settings
    this.deviceForm.get('protocol')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(protocol => {
        this.updateMqttValidation(protocol);
      });

    // Initialize MQTT validation
    this.updateMqttValidation(this.deviceForm.get('protocol')?.value);

    // Store initial values for diff detection (after population)
    setTimeout(() => {
      this.initialFormValue = this.getFormValue();
      
      // Auto-expand advanced settings if any advanced field has value in edit mode
      if (this.isEditMode()) {
        this.checkAndExpandAdvancedSettings();
      }
    }, 0);

    // Disable form in view mode
    if (this.isViewMode()) {
      this.deviceForm.disable();
    }
  }

  // ================================================================================
  // DATA FETCHING
  // ================================================================================
  
  /**
   * Fetch device data from API when deviceId is provided
   */
  private fetchDeviceData(deviceId: string): void {
    this.isLoadingDevice.set(true);
    
    this.adminApiService.getDevice(deviceId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          console.error('Error fetching device:', error);
          return of(null);
        }),
        finalize(() => this.isLoadingDevice.set(false))
      )
      .subscribe((device: Device | null) => {
        if (device) {
          this.device.set(device);
          this.populateFormWithDevice(device);
          
          // Store initial values after population
          setTimeout(() => {
            this.initialFormValue = this.getFormValue();
          }, 0);
        }
      });
  }

  /**
   * Populate form fields with device data
   */
  private populateFormWithDevice(device: Device): void {
    this.device.set(device);
    
    this.deviceForm.patchValue({
      device_id: device.device_id,
      name: device.name,
      device_type: device.device_type || 'gateway',
      farm_id: device.farm_id,
      location: device.location || '',
      firmware_version: device.firmware_version || '',
      ip_address: device.ip_address || '',
      mac_address: device.mac_address || '',
      protocol: device.protocol || 'MQTT',
      mqtt_broker: device.mqtt_broker || '',
      mqtt_port: device.mqtt_port || 1883,
      mqtt_username: device.mqtt_username || '',
      mqtt_password: device.mqtt_password || '',
      mqtt_topic: device.mqtt_topic || '',
      status: device.status,
      health_score: device.health_score ?? 100,
      install_date: device.install_date ? new Date(device.install_date) : new Date(),
      warranty_date: device.warranty_date ? new Date(device.warranty_date) : null,
      notes: device.notes || '',
      description: device.description || '',
    });

    // Populate tags
    if (device.tags && device.tags.length > 0) {
      this.tags.set([...device.tags]);
    }

    // Disable form in view mode
    if (this.isViewMode()) {
      this.deviceForm.disable();
    }
  }

  private checkAndExpandAdvancedSettings(): void {
    const device = this.device();
    if (!device) return;

    // Check if any advanced field has a non-default value
    const hasAdvancedValues = 
      (device.health_score !== undefined && device.health_score !== 100) ||
      device.install_date !== undefined ||
      device.warranty_date !== undefined ||
      (device.description && device.description.trim().length > 0) ||
      (device.notes && device.notes.trim().length > 0);

    if (hasAdvancedValues && this.advancedPanel) {
      setTimeout(() => {
        this.advancedPanel?.open();
      }, 100);
    }
  }

  // ================================================================================
  // MODE SWITCHING
  // ================================================================================
  
  /**
   * Switch from VIEW mode to EDIT mode
   */
  switchToEditMode(): void {
    if (this.isViewMode()) {
      this.mode.set('edit');
      this.deviceForm.enable();
      
      // Keep device_id disabled in edit mode
      this.deviceForm.get('device_id')?.disable();
      
      // Store initial values for diff detection
      this.initialFormValue = this.getFormValue();
    }
  }

  /**
   * Cancel edit and return to VIEW mode
   */
  cancelEdit(): void {
    if (this.isEditMode() && this.data.mode !== 'edit') {
      // Only switch back to view if original mode wasn't edit
      this.mode.set('view');
      this.deviceForm.disable();
      
      // Reset form to original values
      const device = this.device();
      if (device) {
        this.populateFormWithDevice(device);
      }
    } else {
      // Close dialog if original mode was edit or create
      this.dialogRef.close();
    }
  }

  // ================================================================================
  // VALIDATORS
  // ================================================================================
  
  private ipAddressValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(control.value)) {
      return { invalidIp: true };
    }

    const parts = control.value.split('.');
    const valid = parts.every((part: string) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });

    return valid ? null : { invalidIp: true };
  }

  private macAddressValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macPattern.test(control.value) ? null : { invalidMac: true };
  }

  private deviceIdAsyncValidator(control: AbstractControl) {
    if (!control.value) {
      return of(null);
    }

    this.isValidatingDeviceId.set(true);
    this.deviceIdError.set(null);

    return of(control.value).pipe(
      debounceTime(500),
      switchMap(deviceId => {
        // TODO: Replace with actual backend validation
        // return this.adminApiService.checkDeviceIdExists(deviceId);
        return of({ exists: false });
      }),
      map(result => {
        this.isValidatingDeviceId.set(false);
        if (result.exists) {
          this.deviceIdError.set('Device ID already exists');
          return { deviceIdTaken: true };
        }
        return null;
      }),
      catchError(() => {
        this.isValidatingDeviceId.set(false);
        return of(null);
      })
    );
  }

  private updateMqttValidation(protocol: string): void {
    const mqttFields = ['mqtt_broker', 'mqtt_port', 'mqtt_topic'];
    
    if (protocol === 'MQTT') {
      mqttFields.forEach(field => {
        this.deviceForm.get(field)?.setValidators([Validators.required]);
        this.deviceForm.get(field)?.updateValueAndValidity();
      });
    } else {
      mqttFields.forEach(field => {
        this.deviceForm.get(field)?.clearValidators();
        this.deviceForm.get(field)?.updateValueAndValidity();
      });
    }
  }

  // ================================================================================
  // TAG MANAGEMENT
  // ================================================================================
  
  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.tags().includes(value)) {
      this.tags.update(tags => [...tags, value]);
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    this.tags.update(tags => tags.filter(t => t !== tag));
  }

  // ================================================================================
  // UTILITY METHODS
  // ================================================================================
  
  getDeviceIcon(): string {
    const type = this.selectedDeviceType();
    return type?.icon || 'device_hub';
  }

  /**
   * Get current form value (including disabled fields)
   */
  private getFormValue(): any {
    return {
      ...this.deviceForm.getRawValue(),
      tags: this.tags(),
    };
  }

  /**
   * Calculate diff between initial and current values (for PATCH)
   */
  private calculateChangedFields(): UpdateDeviceDto {
    if (this.isCreateMode()) {
      return this.buildCreateDto();
    }

    const currentValue = this.getFormValue();
    const changes: any = {};

    Object.keys(currentValue).forEach(key => {
      const currentVal = currentValue[key];
      const initialVal = this.initialFormValue?.[key];

      // Special handling for dates
      if (currentVal instanceof Date && initialVal instanceof Date) {
        if (currentVal.getTime() !== initialVal.getTime()) {
          changes[key] = currentVal;
        }
      } else if (JSON.stringify(currentVal) !== JSON.stringify(initialVal)) {
        // Only include if value changed
        if (currentVal !== null && currentVal !== '' && currentVal !== undefined) {
          changes[key] = currentVal;
        } else if (initialVal !== null && initialVal !== '' && initialVal !== undefined) {
          // Field was cleared
          changes[key] = null;
        }
      }
    });

    return changes;
  }

  /**
   * Build Create DTO from form values
   */
  private buildCreateDto(): CreateDeviceDto {
    const formValue = this.deviceForm.getRawValue();

    const deviceData: CreateDeviceDto = {
      device_id: formValue.device_id,
      name: formValue.name,
      device_type: formValue.device_type,
      farm_id: formValue.farm_id,
      location: formValue.location || undefined,
      firmware_version: formValue.firmware_version || undefined,
      ip_address: formValue.ip_address || undefined,
      mac_address: formValue.mac_address || undefined,
      protocol: formValue.protocol || undefined,
      status: formValue.status,
      tags: this.tags().length > 0 ? this.tags() : undefined,
      health_score: formValue.health_score || undefined,
      install_date: formValue.install_date || undefined,
      warranty_date: formValue.warranty_date || undefined,
      notes: formValue.notes || undefined,
      description: formValue.description || undefined,
    };

    // Add MQTT settings if protocol is MQTT
    if (formValue.protocol === 'MQTT') {
      deviceData.mqtt_broker = formValue.mqtt_broker;
      deviceData.mqtt_port = formValue.mqtt_port;
      deviceData.mqtt_username = formValue.mqtt_username || undefined;
      deviceData.mqtt_password = formValue.mqtt_password || undefined;
      deviceData.mqtt_topic = formValue.mqtt_topic;
    }

    return deviceData;
  }

  // ================================================================================
  // FORM SUBMISSION
  // ================================================================================
  
  onSubmit(): void {
    // In view mode, switch to edit mode
    if (this.isViewMode()) {
      this.switchToEditMode();
      return;
    }

    if (this.deviceForm.invalid) {
      this.markFormGroupTouched(this.deviceForm);
      return;
    }

    this.isLoading.set(true);

    if (this.isCreateMode()) {
      const deviceData = this.buildCreateDto();
      this.dialogRef.close({ mode: 'create', data: deviceData });
    } else {
      // Edit mode - only send changed fields (diff-based PATCH)
      const changes = this.calculateChangedFields();
      
      if (Object.keys(changes).length > 0) {
        this.dialogRef.close({ 
          mode: 'edit', 
          data: changes, 
          deviceId: this.device()!.device_id 
        });
      } else {
        // No changes, just close
        this.dialogRef.close();
      }
    }
  }

  onCancel(): void {
    if (this.isEditMode() && this.data.mode === 'view') {
      // Return to view mode if started in view
      this.cancelEdit();
    } else {
      this.dialogRef.close();
    }
  }

  onClose(): void {
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

  // ================================================================================
  // ERROR HANDLING
  // ================================================================================
  
  getErrorMessage(controlName: string): string {
    const control = this.deviceForm.get(controlName);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'This field is required';
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Maximum length is ${maxLength} characters`;
    }
    if (control.hasError('min')) {
      return `Minimum value is ${control.errors?.['min'].min}`;
    }
    if (control.hasError('max')) {
      return `Maximum value is ${control.errors?.['max'].max}`;
    }
    if (control.hasError('invalidIp')) {
      return 'Invalid IP address format (e.g., 192.168.1.1)';
    }
    if (control.hasError('invalidMac')) {
      return 'Invalid MAC address format (e.g., AA:BB:CC:DD:EE:FF)';
    }
    if (control.hasError('deviceIdTaken')) {
      return 'Device ID already exists';
    }
    return '';
  }

  // ================================================================================
  // FORMATTING
  // ================================================================================
  
  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  formatRelativeTime(date: Date | null): string {
    if (!date) return 'N/A';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return this.formatDate(date);
  }

  getHealthScoreColor(): string {
    const score = this.healthScore();
    if (score === null) return 'neutral';
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'error';
      case 'maintenance': return 'warn';
      default: return 'neutral';
    }
  }
}
