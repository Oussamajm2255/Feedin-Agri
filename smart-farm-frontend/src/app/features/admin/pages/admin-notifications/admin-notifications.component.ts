// Admin Notifications Component - System-Level Intelligence Center
import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { BreakpointService } from '../../../../core/services/breakpoint.service';

// Types
export type AdminNotificationSeverity = 'critical' | 'warning' | 'info' | 'success';
export type AdminNotificationDomain = 'system' | 'farms' | 'devices' | 'crops' | 'users' | 'automation';
export type AdminNotificationStatus = 'new' | 'acknowledged' | 'resolved';

export interface AdminNotification {
  id: string;
  type: string;
  severity: AdminNotificationSeverity;
  domain: AdminNotificationDomain;
  title: string;
  message?: string;
  context?: {
    farmId?: string;
    farmName?: string;
    deviceId?: string;
    deviceName?: string;
    userId?: string;
    userName?: string;
    suggestedActions?: string[];
    [key: string]: any;
  };
  status: AdminNotificationStatus;
  pinned_until_resolved: boolean;
  created_at: Date | string;
  acknowledged_at?: Date | string;
  resolved_at?: Date | string;
}

export interface AdminNotificationCounts {
  critical: number;
  warning: number;
  info: number;
  success: number;
  total: number;
  unresolved: number;
  newCount: number;
}

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatBadgeModule,
    MatSnackBarModule,
    TranslatePipe
  ],
  templateUrl: './admin-notifications.component.html',
  styleUrl: './admin-notifications.component.scss'
})
export class AdminNotificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private adminApi = inject(AdminApiService);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);
  public themeService = inject(ThemeService);
  public breakpointService = inject(BreakpointService);

  // State signals
  notifications = signal<AdminNotification[]>([]);
  counts = signal<AdminNotificationCounts>({
    critical: 0, warning: 0, info: 0, success: 0, total: 0, unresolved: 0, newCount: 0
  });
  isLoading = signal(true);
  selectedNotification = signal<AdminNotification | null>(null);
  drawerOpen = signal(false);

  // Filter state
  filterSeverity = signal<AdminNotificationSeverity | null>(null);
  filterDomain = signal<AdminNotificationDomain | null>(null);
  filterStatus = signal<AdminNotificationStatus | null>(null);
  filterSearch = signal('');
  filterDateFrom = signal<Date | null>(null);
  filterDateTo = signal<Date | null>(null);
  filtersExpanded = signal(false);

  // Pagination
  currentPage = signal(1);
  pageSize = 50;
  hasMore = signal(false);
  total = signal(0);

  // System status
  systemHealthy = signal(true);

  // Computed filtered notifications (client-side filtering for real-time)
  filteredNotifications = computed(() => {
    let items = this.notifications();
    
    const severity = this.filterSeverity();
    const domain = this.filterDomain();
    const status = this.filterStatus();
    const search = this.filterSearch().toLowerCase();
    
    if (severity) items = items.filter(n => n.severity === severity);
    if (domain) items = items.filter(n => n.domain === domain);
    if (status) items = items.filter(n => n.status === status);
    if (search) {
      items = items.filter(n => 
        n.title.toLowerCase().includes(search) || 
        n.message?.toLowerCase().includes(search) ||
        n.type.toLowerCase().includes(search)
      );
    }
    
    return items;
  });

  // Pinned critical (always at top)
  pinnedCritical = computed(() => 
    this.notifications().filter(n => n.pinned_until_resolved && n.status !== 'resolved')
  );

  // Available domains for filter
  domains: { value: AdminNotificationDomain; label: string; icon: string }[] = [
    { value: 'system', label: 'System', icon: 'dns' },
    { value: 'farms', label: 'Farms', icon: 'agriculture' },
    { value: 'devices', label: 'Devices', icon: 'memory' },
    { value: 'crops', label: 'Crops', icon: 'grass' },
    { value: 'users', label: 'Users', icon: 'people' },
    { value: 'automation', label: 'Automation', icon: 'auto_fix_high' }
  ];

  ngOnInit(): void {
    this.loadNotifications();
    this.loadCounts();
    this.loadSystemHealth();
    
    // Auto-refresh every 30 seconds
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCounts();
        this.loadSystemHealth();
        this.loadNotifications(false); // Silent refresh
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSystemHealth(): void {
    this.adminApi.getSystemHealth()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ status: 'degraded' }))
      )
      .subscribe((res: any) => {
        this.systemHealthy.set(res.status === 'healthy');
      });
  }

  loadNotifications(showLoading = true): void {
    if (showLoading) this.isLoading.set(true);

    const params: any = {
      page: this.currentPage(),
      limit: this.pageSize
    };

    if (this.filterSeverity()) params.severity = this.filterSeverity();
    if (this.filterDomain()) params.domain = this.filterDomain();
    if (this.filterStatus()) params.status = this.filterStatus();
    if (this.filterSearch()) params.search = this.filterSearch();
    if (this.filterDateFrom()) params.from = this.filterDateFrom()?.toISOString();
    if (this.filterDateTo()) params.to = this.filterDateTo()?.toISOString();

    this.adminApi.get<any>('admin/notifications', { params })
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ items: [], total: 0, hasMore: false }))
      )
      .subscribe(res => {
        this.notifications.set(res.items || []);
        this.total.set(res.total || 0);
        this.hasMore.set(res.hasMore || false);
        this.isLoading.set(false);
      });
  }

  loadCounts(): void {
    this.adminApi.get<AdminNotificationCounts>('admin/notifications/counts')
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({
          critical: 0, warning: 0, info: 0, success: 0, total: 0, unresolved: 0, newCount: 0
        }))
      )
      .subscribe(counts => this.counts.set(counts));
  }

  // Filter methods
  setSeverityFilter(severity: AdminNotificationSeverity | null): void {
    this.filterSeverity.set(severity);
    this.currentPage.set(1);
    this.loadNotifications();
  }

  setDomainFilter(domain: AdminNotificationDomain | null): void {
    this.filterDomain.set(domain);
    this.currentPage.set(1);
    this.loadNotifications();
  }

  setStatusFilter(status: AdminNotificationStatus | null): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
    this.loadNotifications();
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.loadNotifications();
  }

  clearFilters(): void {
    this.filterSeverity.set(null);
    this.filterDomain.set(null);
    this.filterStatus.set(null);
    this.filterSearch.set('');
    this.filterDateFrom.set(null);
    this.filterDateTo.set(null);
    this.currentPage.set(1);
    this.loadNotifications();
  }

  toggleFilters(): void {
    this.filtersExpanded.update(v => !v);
  }

  loadMoreNotifications(): void {
    this.currentPage.update(p => p + 1);
    this.loadNotifications();
  }

  // Actions
  acknowledge(notification: AdminNotification, event?: Event): void {
    event?.stopPropagation();
    
    this.adminApi.patch<AdminNotification>(`admin/notifications/${notification.id}/acknowledge`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.updateNotificationInList(updated);
          this.loadCounts();
          this.snackBar.open('Notification acknowledged', 'OK', { duration: 2000 });
        },
        error: () => this.snackBar.open('Failed to acknowledge', 'OK', { duration: 3000 })
      });
  }

  resolve(notification: AdminNotification, event?: Event): void {
    event?.stopPropagation();
    
    this.adminApi.patch<AdminNotification>(`admin/notifications/${notification.id}/resolve`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.updateNotificationInList(updated);
          this.loadCounts();
          this.snackBar.open('Notification resolved', 'OK', { duration: 2000 });
        },
        error: () => this.snackBar.open('Failed to resolve', 'OK', { duration: 3000 })
      });
  }

  bulkAcknowledge(): void {
    const ids = this.filteredNotifications()
      .filter(n => n.status === 'new')
      .map(n => n.id);
    
    if (ids.length === 0) return;

    this.adminApi.post<any>('admin/notifications/bulk-acknowledge', { ids })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.loadCounts();
          this.snackBar.open(`${ids.length} notifications acknowledged`, 'OK', { duration: 2000 });
        },
        error: () => this.snackBar.open('Bulk acknowledge failed', 'OK', { duration: 3000 })
      });
  }

  bulkResolve(): void {
    const ids = this.filteredNotifications()
      .filter(n => n.status !== 'resolved')
      .map(n => n.id);
    
    if (ids.length === 0) return;

    this.adminApi.post<any>('admin/notifications/bulk-resolve', { ids })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.loadCounts();
          this.snackBar.open(`${ids.length} notifications resolved`, 'OK', { duration: 2000 });
        },
        error: () => this.snackBar.open('Bulk resolve failed', 'OK', { duration: 3000 })
      });
  }

  // Details drawer
  openDetails(notification: AdminNotification): void {
    this.selectedNotification.set(notification);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    setTimeout(() => this.selectedNotification.set(null), 300);
  }

  // Helper methods
  private updateNotificationInList(updated: AdminNotification): void {
    this.notifications.update(list => 
      list.map(n => n.id === updated.id ? updated : n)
    );
  }

  getSeverityIcon(severity: AdminNotificationSeverity): string {
    switch (severity) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'check_circle';
    }
  }

  getDomainIcon(domain: AdminNotificationDomain): string {
    const d = this.domains.find(x => x.value === domain);
    return d?.icon || 'category';
  }

  getStatusLabel(status: AdminNotificationStatus): string {
    switch (status) {
      case 'new': return 'New';
      case 'acknowledged': return 'Reviewed';
      case 'resolved': return 'Resolved';
    }
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatFullDate(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  navigateToEntity(type: string, id: string): void {
    // Navigate to related entity
    // This would use Router to navigate to the appropriate admin page
    console.log(`Navigate to ${type}: ${id}`);
  }

  exportAudit(): void {
    this.adminApi.get<any>('admin/notifications/export/audit', { 
      params: { limit: 1000 } 
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `admin-notifications-audit-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => this.snackBar.open('Export failed', 'OK', { duration: 3000 })
      });
  }
}
