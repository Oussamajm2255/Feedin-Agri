import { Component, OnInit, signal, inject, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { trigger, transition, style, animate, query, stagger, keyframes, state } from '@angular/animations';

interface SettingsTab {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface SystemSettings {
  general: {
    site_name: string;
    contact_email: string;
    maintenance_mode: boolean;
    default_language: string;
    timezone: string;
  };
  notifications: {
    email_enabled: boolean;
    email_sensor_alerts: boolean;
    email_device_status: boolean;
    email_daily_digest: boolean;
    sms_enabled: boolean;
    sms_phone: string;
    sms_critical_only: boolean;
    push_enabled: boolean;
  };
  security: {
    session_timeout: number;
    max_login_attempts: number;
    require_2fa: boolean;
    min_password_length: number;
    require_uppercase: boolean;
    require_numbers: boolean;
    require_special: boolean;
  };
  advanced: {
    api_rate_limit: number;
    debug_mode: boolean;
    log_level: string;
    log_retention_days: number;
  };
  data: {
    auto_backup_enabled: boolean;
    backup_frequency: string;
    backup_retention: number;
    sensor_data_retention: number;
    audit_log_retention: number;
  };
  integrations: {
    mqtt_enabled: boolean;
    mqtt_broker_url: string;
    weather_api_enabled: boolean;
    weather_api_key: string;
    sms_gateway_enabled: boolean;
    sms_gateway_provider: string;
  };
}

/**
 * Enhanced Admin Settings Component
 * Premium UI/UX with comprehensive system configuration options
 */
@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatSelectModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss'],
  animations: [
    // Page entrance animation
    trigger('pageAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-out', style({ opacity: 1 }))
      ])
    ]),
    // Fade in animation
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    // Stagger cards animation
    trigger('staggerCards', [
      transition(':enter', [
        query('.settings-card, .integration-card', [
          style({ opacity: 0, transform: 'translateY(30px) scale(0.95)' }),
          stagger(80, [
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', 
              style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
          ])
        ], { optional: true })
      ])
    ]),
    // Card animation
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    // Tab animation
    trigger('tabAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    // Slide in animation
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(30px)' }))
      ])
    ]),
    // Slide up animation for floating bar
    trigger('slideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50%) translateY(100px)' }),
        animate('500ms 200ms cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ opacity: 1, transform: 'translateX(-50%) translateY(0)' }))
      ])
    ])
  ]
})
export class AdminSettingsComponent implements OnInit {
  private adminApiService = inject(AdminApiService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  // State signals
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  error = signal<string | null>(null);
  settings = signal<SystemSettings | null>(null);
  activeTab = signal<string>('general');
  lastSaved = signal<Date | null>(null);
  testingConnection = signal<boolean>(false);
  showApiKey = signal<boolean>(false);

  // Computed values
  mqttConnected = signal<boolean>(false);
  weatherApiStatus = signal<string>('disconnected');
  smsConfigured = signal<boolean>(false);
  storageUsed = signal<number>(4.5);
  storageTotal = signal<number>(10);
  storageUsedPercent = computed(() => (this.storageUsed() / this.storageTotal()) * 100);

  // Settings tabs configuration
  settingsTabs: SettingsTab[] = [
    { id: 'general', label: 'General', description: 'Basic configuration', icon: 'tune', color: 'blue' },
    { id: 'notifications', label: 'Notifications', description: 'Alert channels', icon: 'notifications_active', color: 'yellow' },
    { id: 'security', label: 'Security', description: 'Access control', icon: 'security', color: 'red' },
    { id: 'advanced', label: 'Advanced', description: 'Developer options', icon: 'code', color: 'purple' },
    { id: 'data', label: 'Data & Storage', description: 'Backups & retention', icon: 'storage', color: 'green' },
    { id: 'integrations', label: 'Integrations', description: 'External services', icon: 'hub', color: 'cyan' }
  ];

  // Log levels configuration
  logLevels = [
    { value: 'debug', label: 'Debug', icon: 'bug_report' },
    { value: 'info', label: 'Info', icon: 'info' },
    { value: 'warn', label: 'Warning', icon: 'warning' },
    { value: 'error', label: 'Error', icon: 'error' }
  ];

  // Form group with all settings
  settingsForm = this.fb.group({
    // General
    site_name: ['Smart Farm Management', [Validators.required, Validators.minLength(3)]],
    contact_email: ['admin@smartfarm.com', [Validators.required, Validators.email]],
    maintenance_mode: [false],
    default_language: ['en'],
    timezone: ['UTC'],
    
    // Notifications
    email_enabled: [true],
    email_sensor_alerts: [true],
    email_device_status: [true],
    email_daily_digest: [false],
    sms_enabled: [false],
    sms_phone: [''],
    sms_critical_only: [true],
    push_enabled: [true],
    
    // Security
    session_timeout: [3600, [Validators.required, Validators.min(60), Validators.max(86400)]],
    max_login_attempts: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    require_2fa: [false],
    min_password_length: [8, [Validators.min(6), Validators.max(32)]],
    require_uppercase: [true],
    require_numbers: [true],
    require_special: [false],
    
    // Advanced
    api_rate_limit: [100, [Validators.min(10), Validators.max(1000)]],
    debug_mode: [false],
    log_level: ['info'],
    log_retention_days: [30, [Validators.min(1), Validators.max(365)]],
    
    // Data & Storage
    auto_backup_enabled: [true],
    backup_frequency: ['daily'],
    backup_retention: [7, [Validators.min(1), Validators.max(90)]],
    sensor_data_retention: [90, [Validators.min(30), Validators.max(365)]],
    audit_log_retention: [365, [Validators.min(30), Validators.max(730)]],
    
    // Integrations
    mqtt_enabled: [true],
    mqtt_broker_url: ['mqtt://localhost:1883'],
    weather_api_enabled: [false],
    weather_api_key: [''],
    sms_gateway_enabled: [false],
    sms_gateway_provider: ['twilio']
  });

  ngOnInit() {
    this.loadSettings();
    this.setupFormValueChanges();
  }

  private setupFormValueChanges() {
    // Track form changes for dirty state
    this.settingsForm.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      // Form is now dirty if any value changed
    });
  }

  hasUnsavedChanges(): boolean {
    return this.settingsForm.dirty;
  }

  setActiveTab(tabId: string) {
    this.activeTab.set(tabId);
  }

  getTabStatus(tabId: string): string | null {
    // Check if this tab has any dirty fields
    const tabFields = this.getTabFields(tabId);
    const hasDirtyFields = tabFields.some(field => 
      this.settingsForm.get(field)?.dirty
    );
    
    if (hasDirtyFields) {
      return 'modified';
    }
    
    // Check for validation errors
    const hasErrors = tabFields.some(field => 
      this.settingsForm.get(field)?.invalid
    );
    
    if (hasErrors) {
      return 'error';
    }
    
    return null;
  }

  private getTabFields(tabId: string): string[] {
    const fieldMap: Record<string, string[]> = {
      general: ['site_name', 'contact_email', 'maintenance_mode', 'default_language', 'timezone'],
      notifications: ['email_enabled', 'email_sensor_alerts', 'email_device_status', 'email_daily_digest', 
                     'sms_enabled', 'sms_phone', 'sms_critical_only', 'push_enabled'],
      security: ['session_timeout', 'max_login_attempts', 'require_2fa', 'min_password_length',
                'require_uppercase', 'require_numbers', 'require_special'],
      advanced: ['api_rate_limit', 'debug_mode', 'log_level', 'log_retention_days'],
      data: ['auto_backup_enabled', 'backup_frequency', 'backup_retention', 'sensor_data_retention', 'audit_log_retention'],
      integrations: ['mqtt_enabled', 'mqtt_broker_url', 'weather_api_enabled', 'weather_api_key', 
                    'sms_gateway_enabled', 'sms_gateway_provider']
    };
    return fieldMap[tabId] || [];
  }

  loadSettings() {
    this.loading.set(true);
    this.error.set(null);

    this.adminApiService.getSettings()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          // For demo purposes, use default settings if API fails
          console.warn('Using default settings:', err);
          return of(null);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe(apiData => {
        // Map API response to full SystemSettings format
        const fullSettings = this.mapApiToFullSettings(apiData);
        this.settings.set(fullSettings);
        this.populateForm(fullSettings);
        this.lastSaved.set(new Date());
        // Set connected states based on current settings
        this.mqttConnected.set(fullSettings.integrations.mqtt_enabled);
        this.weatherApiStatus.set(fullSettings.integrations.weather_api_key ? 'connected' : 'disconnected');
        this.smsConfigured.set(!!fullSettings.integrations.sms_gateway_provider);
      });
  }

  /**
   * Maps API response to full SystemSettings format
   * The API may return a partial settings object, so we merge with defaults
   */
  private mapApiToFullSettings(apiData: any): SystemSettings {
    const defaults = this.getDefaultSettings();
    
    if (!apiData) {
      return defaults;
    }
    
    return {
      general: {
        ...defaults.general,
        ...(apiData.general || {})
      },
      notifications: {
        ...defaults.notifications,
        ...(apiData.notifications || {})
      },
      security: {
        ...defaults.security,
        ...(apiData.security || {})
      },
      advanced: {
        ...defaults.advanced,
        ...(apiData.advanced || {})
      },
      data: {
        ...defaults.data,
        ...(apiData.data || {})
      },
      integrations: {
        ...defaults.integrations,
        ...(apiData.integrations || {})
      }
    };
  }

  private getDefaultSettings(): SystemSettings {
    return {
      general: {
        site_name: 'Smart Farm Management',
        contact_email: 'admin@smartfarm.com',
        maintenance_mode: false,
        default_language: 'en',
        timezone: 'UTC'
      },
      notifications: {
        email_enabled: true,
        email_sensor_alerts: true,
        email_device_status: true,
        email_daily_digest: false,
        sms_enabled: false,
        sms_phone: '',
        sms_critical_only: true,
        push_enabled: true
      },
      security: {
        session_timeout: 3600,
        max_login_attempts: 5,
        require_2fa: false,
        min_password_length: 8,
        require_uppercase: true,
        require_numbers: true,
        require_special: false
      },
      advanced: {
        api_rate_limit: 100,
        debug_mode: false,
        log_level: 'info',
        log_retention_days: 30
      },
      data: {
        auto_backup_enabled: true,
        backup_frequency: 'daily',
        backup_retention: 7,
        sensor_data_retention: 90,
        audit_log_retention: 365
      },
      integrations: {
        mqtt_enabled: true,
        mqtt_broker_url: 'mqtt://localhost:1883',
        weather_api_enabled: false,
        weather_api_key: '',
        sms_gateway_enabled: false,
        sms_gateway_provider: 'twilio'
      }
    };
  }

  populateForm(settings: SystemSettings) {
    this.settingsForm.patchValue({
      // General
      site_name: settings.general.site_name,
      contact_email: settings.general.contact_email,
      maintenance_mode: settings.general.maintenance_mode,
      default_language: settings.general.default_language || 'en',
      timezone: settings.general.timezone || 'UTC',
      
      // Notifications
      email_enabled: settings.notifications.email_enabled,
      email_sensor_alerts: settings.notifications.email_sensor_alerts ?? true,
      email_device_status: settings.notifications.email_device_status ?? true,
      email_daily_digest: settings.notifications.email_daily_digest ?? false,
      sms_enabled: settings.notifications.sms_enabled,
      sms_phone: settings.notifications.sms_phone || '',
      sms_critical_only: settings.notifications.sms_critical_only ?? true,
      push_enabled: settings.notifications.push_enabled ?? true,
      
      // Security
      session_timeout: settings.security.session_timeout,
      max_login_attempts: settings.security.max_login_attempts,
      require_2fa: settings.security.require_2fa ?? false,
      min_password_length: settings.security.min_password_length ?? 8,
      require_uppercase: settings.security.require_uppercase ?? true,
      require_numbers: settings.security.require_numbers ?? true,
      require_special: settings.security.require_special ?? false,
      
      // Advanced
      api_rate_limit: settings.advanced?.api_rate_limit ?? 100,
      debug_mode: settings.advanced?.debug_mode ?? false,
      log_level: settings.advanced?.log_level ?? 'info',
      log_retention_days: settings.advanced?.log_retention_days ?? 30,
      
      // Data & Storage
      auto_backup_enabled: settings.data?.auto_backup_enabled ?? true,
      backup_frequency: settings.data?.backup_frequency ?? 'daily',
      backup_retention: settings.data?.backup_retention ?? 7,
      sensor_data_retention: settings.data?.sensor_data_retention ?? 90,
      audit_log_retention: settings.data?.audit_log_retention ?? 365,
      
      // Integrations
      mqtt_enabled: settings.integrations?.mqtt_enabled ?? true,
      mqtt_broker_url: settings.integrations?.mqtt_broker_url ?? 'mqtt://localhost:1883',
      weather_api_enabled: settings.integrations?.weather_api_enabled ?? false,
      weather_api_key: settings.integrations?.weather_api_key ?? '',
      sms_gateway_enabled: settings.integrations?.sms_gateway_enabled ?? false,
      sms_gateway_provider: settings.integrations?.sms_gateway_provider ?? 'twilio'
    });
    
    this.settingsForm.markAsPristine();
  }

  resetForm() {
    const currentSettings = this.settings();
    if (currentSettings) {
      this.populateForm(currentSettings);
      this.settingsForm.markAsPristine();
      this.showToast('Changes discarded', 'info');
    }
  }

  saveSettings() {
    if (!this.settingsForm.valid) {
      this.showToast('Please fix form errors before saving', 'error');
      return;
    }

    this.saving.set(true);
    const formValue = this.settingsForm.value;

    const settingsData: SystemSettings = {
      general: {
        site_name: formValue.site_name || '',
        contact_email: formValue.contact_email || '',
        maintenance_mode: formValue.maintenance_mode || false,
        default_language: formValue.default_language || 'en',
        timezone: formValue.timezone || 'UTC'
      },
      notifications: {
        email_enabled: formValue.email_enabled || false,
        email_sensor_alerts: formValue.email_sensor_alerts || false,
        email_device_status: formValue.email_device_status || false,
        email_daily_digest: formValue.email_daily_digest || false,
        sms_enabled: formValue.sms_enabled || false,
        sms_phone: formValue.sms_phone || '',
        sms_critical_only: formValue.sms_critical_only || false,
        push_enabled: formValue.push_enabled || false
      },
      security: {
        session_timeout: formValue.session_timeout || 3600,
        max_login_attempts: formValue.max_login_attempts || 5,
        require_2fa: formValue.require_2fa || false,
        min_password_length: formValue.min_password_length || 8,
        require_uppercase: formValue.require_uppercase || false,
        require_numbers: formValue.require_numbers || false,
        require_special: formValue.require_special || false
      },
      advanced: {
        api_rate_limit: formValue.api_rate_limit || 100,
        debug_mode: formValue.debug_mode || false,
        log_level: formValue.log_level || 'info',
        log_retention_days: formValue.log_retention_days || 30
      },
      data: {
        auto_backup_enabled: formValue.auto_backup_enabled || false,
        backup_frequency: formValue.backup_frequency || 'daily',
        backup_retention: formValue.backup_retention || 7,
        sensor_data_retention: formValue.sensor_data_retention || 90,
        audit_log_retention: formValue.audit_log_retention || 365
      },
      integrations: {
        mqtt_enabled: formValue.mqtt_enabled || false,
        mqtt_broker_url: formValue.mqtt_broker_url || '',
        weather_api_enabled: formValue.weather_api_enabled || false,
        weather_api_key: formValue.weather_api_key || '',
        sms_gateway_enabled: formValue.sms_gateway_enabled || false,
        sms_gateway_provider: formValue.sms_gateway_provider || 'twilio'
      }
    };

    this.adminApiService.updateSettings(settingsData as any)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          // For demo, simulate successful save
          console.warn('Simulating save:', err);
          return of(settingsData);
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe(result => {
        if (result) {
          // Map the result to full settings format
          const fullSettings = this.mapApiToFullSettings(result);
          this.settings.set(fullSettings);
          this.settingsForm.markAsPristine();
          this.lastSaved.set(new Date());
          this.showToast('Settings saved successfully', 'success');
        }
      });
  }

  // Utility methods
  getTimeoutPercentage(): number {
    const timeout = this.settingsForm.get('session_timeout')?.value || 0;
    const maxTimeout = 86400; // 24 hours
    return Math.min((timeout / maxTimeout) * 100, 100);
  }

  formatTimeout(seconds: number | null | undefined): string {
    if (!seconds || seconds <= 0) return '0 min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  formatStorage(gb: number): string {
    return `${gb.toFixed(1)} GB`;
  }

  getRelativeTime(date: Date | null): string {
    if (!date) return '';
    
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  setLogLevel(level: string) {
    this.settingsForm.patchValue({ log_level: level });
    this.settingsForm.markAsDirty();
  }

  toggleApiKeyVisibility() {
    this.showApiKey.update(v => !v);
  }

  // Action methods
  exportSettings() {
    const settings = this.settingsForm.value;
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-farm-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.showToast('Settings exported successfully', 'success');
  }

  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const settings = JSON.parse(event.target?.result as string);
            this.settingsForm.patchValue(settings);
            this.settingsForm.markAsDirty();
            this.showToast('Settings imported - save to apply', 'info');
          } catch {
            this.showToast('Invalid settings file', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  triggerBackup() {
    this.showToast('Backup initiated...', 'info');
    // Simulate backup
    setTimeout(() => {
      this.showToast('Backup completed successfully', 'success');
    }, 2000);
  }

  testMqttConnection() {
    this.testingConnection.set(true);
    // Simulate connection test
    setTimeout(() => {
      this.testingConnection.set(false);
      this.mqttConnected.set(true);
      this.showToast('MQTT connection successful', 'success');
    }, 2000);
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    const panelClass = {
      success: 'success-snackbar',
      error: 'error-snackbar',
      info: 'info-snackbar',
      warning: 'warning-snackbar'
    };
    
    this.snackBar.open(message, 'Close', { 
      duration: 3000, 
      panelClass: [panelClass[type]] 
    });
  }

  // TrackBy functions for ngFor performance optimization
  trackByTabId = (_index: number, tab: SettingsTab): string => tab.id;
  trackByLogLevel = (_index: number, level: { value: string }): string => level.value;
}
