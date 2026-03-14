import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  services: {
    api: { status: string; responseTime: number };
    database: { status: string; connections: number };
    mqtt: { status: string; connectedDevices: number };
  };
  timestamp: Date;
}

interface SystemMetrics {
  cpu: { usage: number; cores: number };
  memory: { total: number; used: number; free: number; rss: number; external: number };
  disk: { total: number; used: number; free: number };
  uptime: number;
  timestamp: Date;
}

interface SystemUptime {
  uptime: number;
  uptimeFormatted: string;
  startTime: Date;
  devices: {
    total: number;
    online: number;
    offline: number;
    uptimePercentage: number;
  };
  timestamp: Date;
}

/**
 * System Health Component
 * Monitor system performance, uptime, and resource usage
 */
@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1 class="page-title">
          <mat-icon>monitor_heart</mat-icon>
          System Health
        </h1>
        <p class="page-subtitle">Monitor system performance and uptime</p>
      </div>

      <div *ngIf="loading()" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading system health data...</p>
      </div>

      <div *ngIf="!loading() && error()" class="error-container">
        <mat-icon class="error-icon">error_outline</mat-icon>
        <h2>Error Loading System Health</h2>
        <p>{{ error() }}</p>
        <button class="retry-button" (click)="loadData()">Retry</button>
      </div>

      <div *ngIf="!loading() && !error()" class="health-content">
        <!-- Overall Health Status -->
        <div class="health-card status-card" [class.healthy]="health()?.status === 'healthy'"
             [class.degraded]="health()?.status === 'degraded'"
             [class.critical]="health()?.status === 'critical'">
          <div class="card-header">
            <mat-icon class="status-icon">{{ getStatusIcon() }}</mat-icon>
            <div>
              <h2>System Status</h2>
              <p class="status-text">{{ health()?.status?.toUpperCase() || 'UNKNOWN' }}</p>
            </div>
          </div>
          <div class="card-content">
            <div class="metric">
              <span class="label">Uptime:</span>
              <span class="value">{{ formatUptime(health()?.uptime || 0) }}</span>
            </div>
            <div class="metric">
              <span class="label">Last Updated:</span>
              <span class="value">{{ formatDate(health()?.timestamp) }}</span>
            </div>
          </div>
        </div>

        <!-- Services Status -->
        <div class="health-card">
          <h3>Services Status</h3>
          <div class="services-grid">
            <div class="service-item" [class.healthy]="health()?.services?.api?.status === 'healthy'">
              <mat-icon>api</mat-icon>
              <div>
                <strong>API</strong>
                <p>{{ health()?.services?.api?.status || 'unknown' }}</p>
                <small>Response: {{ health()?.services?.api?.responseTime || 0 }}ms</small>
              </div>
            </div>
            <div class="service-item" [class.healthy]="health()?.services?.database?.status === 'healthy'">
              <mat-icon>storage</mat-icon>
              <div>
                <strong>Database</strong>
                <p>{{ health()?.services?.database?.status || 'unknown' }}</p>
                <small>Connections: {{ health()?.services?.database?.connections || 0 }}</small>
              </div>
            </div>
            <div class="service-item" [class.healthy]="health()?.services?.mqtt?.status === 'healthy'">
              <mat-icon>hub</mat-icon>
              <div>
                <strong>MQTT</strong>
                <p>{{ health()?.services?.mqtt?.status || 'unknown' }}</p>
                <small>Devices: {{ health()?.services?.mqtt?.connectedDevices || 0 }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- System Metrics -->
        <div class="health-card" *ngIf="metrics()">
          <h3>System Metrics</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <mat-icon>memory</mat-icon>
              <div>
                <strong>CPU</strong>
                <p>{{ metrics()?.cpu?.cores || 0 }} cores</p>
                <small>Usage: {{ metrics()?.cpu?.usage || 0 }}%</small>
              </div>
            </div>
            <div class="metric-card">
              <mat-icon>dns</mat-icon>
              <div>
                <strong>Memory</strong>
                <p>{{ formatBytes(metrics()?.memory?.used || 0) }} / {{ formatBytes(metrics()?.memory?.total || 0) }}</p>
                <small>Free: {{ formatBytes(metrics()?.memory?.free || 0) }}</small>
              </div>
            </div>
            <div class="metric-card">
              <mat-icon>hard_drive</mat-icon>
              <div>
                <strong>Disk</strong>
                <p>{{ formatBytes(metrics()?.disk?.used || 0) }} / {{ formatBytes(metrics()?.disk?.total || 0) }}</p>
                <small>Free: {{ formatBytes(metrics()?.disk?.free || 0) }}</small>
              </div>
            </div>
          </div>
        </div>

        <!-- Uptime Statistics -->
        <div class="health-card" *ngIf="uptime()">
          <h3>Uptime Statistics</h3>
          <div class="uptime-info">
            <div class="uptime-display">
              <mat-icon>schedule</mat-icon>
              <div>
                <strong>System Uptime</strong>
                <p class="uptime-value">{{ uptime()?.uptimeFormatted || 'N/A' }}</p>
                <small>Started: {{ formatDate(uptime()?.startTime) }}</small>
              </div>
            </div>
            <div class="device-stats">
              <h4>Device Status</h4>
              <div class="device-metrics">
                <div class="device-metric">
                  <span>Total:</span>
                  <strong>{{ uptime()?.devices?.total || 0 }}</strong>
                </div>
                <div class="device-metric online">
                  <span>Online:</span>
                  <strong>{{ uptime()?.devices?.online || 0 }}</strong>
                </div>
                <div class="device-metric offline">
                  <span>Offline:</span>
                  <strong>{{ uptime()?.devices?.offline || 0 }}</strong>
                </div>
                <div class="device-metric">
                  <span>Uptime %:</span>
                  <strong>{{ uptime()?.devices?.uptimePercentage || 0 }}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { padding: var(--space-6); }
    .page-header { margin-bottom: var(--space-6); border-bottom: 2px solid var(--border-primary); padding-bottom: var(--space-4); }
    .page-title { display: flex; align-items: center; gap: var(--space-3); font-size: var(--text-3xl); font-weight: var(--font-bold); color: var(--text-primary); margin: 0 0 var(--space-2); }
    .page-subtitle { font-size: var(--text-base); color: var(--text-secondary); margin: 0; }
    
    .loading-container, .error-container { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      padding: var(--space-8); 
      gap: var(--space-4);
    }
    
    .error-container { color: var(--danger-500); }
    .error-icon { font-size: 64px; width: 64px; height: 64px; }
    .retry-button { 
      padding: var(--space-2) var(--space-4); 
      background: var(--primary-green); 
      color: white; 
      border: none; 
      border-radius: var(--radius-lg); 
      cursor: pointer;
      margin-top: var(--space-4);
    }
    
    .health-content { display: grid; gap: var(--space-6); }
    
    .health-card { 
      background: var(--card-bg); 
      border-radius: var(--radius-xl); 
      padding: var(--space-6); 
      border: 1px solid var(--border-primary);
    }
    
    .status-card { 
      border-left: 4px solid var(--success-500);
    }
    .status-card.healthy { border-left-color: var(--success-500); }
    .status-card.degraded { border-left-color: var(--warning-500); }
    .status-card.critical { border-left-color: var(--danger-500); }
    
    .card-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-4); }
    .status-icon { font-size: 48px; width: 48px; height: 48px; }
    .status-text { font-size: var(--text-2xl); font-weight: var(--font-bold); margin: 0; }
    
    .card-content { display: flex; gap: var(--space-6); flex-wrap: wrap; }
    .metric { display: flex; flex-direction: column; gap: var(--space-1); }
    .metric .label { font-size: var(--text-sm); color: var(--text-secondary); }
    .metric .value { font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary); }
    
    .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-top: var(--space-4); }
    .service-item { 
      display: flex; 
      align-items: center; 
      gap: var(--space-3); 
      padding: var(--space-4); 
      background: var(--bg-secondary); 
      border-radius: var(--radius-lg);
      border: 2px solid var(--border-primary);
    }
    .service-item.healthy { border-color: var(--success-500); }
    .service-item mat-icon { font-size: 32px; width: 32px; height: 32px; }
    
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-4); margin-top: var(--space-4); }
    .metric-card { 
      display: flex; 
      align-items: center; 
      gap: var(--space-3); 
      padding: var(--space-4); 
      background: var(--bg-secondary); 
      border-radius: var(--radius-lg);
    }
    .metric-card mat-icon { font-size: 32px; width: 32px; height: 32px; }
    
    .uptime-info { display: flex; flex-direction: column; gap: var(--space-6); }
    .uptime-display { display: flex; align-items: center; gap: var(--space-4); }
    .uptime-display mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .uptime-value { font-size: var(--text-2xl); font-weight: var(--font-bold); margin: var(--space-2) 0; }
    
    .device-stats { margin-top: var(--space-4); }
    .device-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-3); margin-top: var(--space-3); }
    .device-metric { 
      padding: var(--space-3); 
      background: var(--bg-secondary); 
      border-radius: var(--radius-lg);
      text-align: center;
    }
    .device-metric.online { border-left: 3px solid var(--success-500); }
    .device-metric.offline { border-left: 3px solid var(--danger-500); }
  `]
})
export class SystemHealthComponent implements OnInit {
  private adminApiService = inject(AdminApiService);
  private destroyRef = inject(DestroyRef);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  health = signal<SystemHealth | null>(null);
  metrics = signal<SystemMetrics | null>(null);
  uptime = signal<SystemUptime | null>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.error.set(null);

    // Load all health data in parallel
    this.adminApiService.getSystemHealth()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(err => {
          this.error.set(err.message || 'Failed to load system health');
          return of(null);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe(data => {
        if (data) this.health.set(data);
      });

    this.adminApiService.getSystemMetrics()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null))
      )
      .subscribe(data => {
        if (data) this.metrics.set(data);
      });

    this.adminApiService.getSystemUptime()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null))
      )
      .subscribe(data => {
        if (data) this.uptime.set(data);
      });
  }

  getStatusIcon(): string {
    const status = this.health()?.status;
    if (status === 'healthy') return 'check_circle';
    if (status === 'degraded') return 'warning';
    if (status === 'critical') return 'error';
    return 'help_outline';
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  }
}
