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
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';
import { AdminWebSocketService } from '../../../../admin/core/services/admin-websocket.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { BreakpointService } from '../../../../core/services/breakpoint.service';
import { AlertService } from '../../../../core/services/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { RejectRequestDialogComponent } from './components/reject-request-dialog.component';
import { ExportButtonComponent } from '../../../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../../../shared/services/export.service';

// Types
export type AdminNotificationSeverity = 'critical' | 'warning' | 'info' | 'success';
export type AdminNotificationDomain =
  | 'system'
  | 'farms'
  | 'devices'
  | 'crops'
  | 'users'
  | 'automation';
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
    TranslatePipe,
    ExportButtonComponent,
  ],
  templateUrl: './admin-notifications.component.html',
  styleUrl: './admin-notifications.component.scss',
})
export class AdminNotificationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private adminApi = inject(AdminApiService);
  private adminWs = inject(AdminWebSocketService);
  private alertService = inject(AlertService);
  public languageService = inject(LanguageService);
  public themeService = inject(ThemeService);
  public breakpointService = inject(BreakpointService);
  private dialog = inject(MatDialog);

  // State signals
  notifications = signal<AdminNotification[]>([]);
  counts = signal<AdminNotificationCounts>({
    critical: 0,
    warning: 0,
    info: 0,
    success: 0,
    total: 0,
    unresolved: 0,
    newCount: 0,
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

  // Access requests
  pendingRequests = signal<any[]>([]);
  pendingTotal = signal(0);
  isLoadingRequests = signal(false);
  activeTab = signal<'notifications' | 'access-requests' | 'contact-messages' | 'training-requests'>('notifications');

  // Contact messages
  contactMessages = signal<any[]>([]);
  contactTotal = signal(0);
  contactNewCount = signal(0);
  isLoadingContacts = signal(false);

  // Training requests
  trainingRequests = signal<any[]>([]);
  trainingTotal = signal(0);
  trainingNewCount = signal(0);
  isLoadingTraining = signal(false);

  // Computed filtered notifications (client-side filtering for real-time)
  filteredNotifications = computed(() => {
    let items = this.notifications();

    const severity = this.filterSeverity();
    const domain = this.filterDomain();
    const status = this.filterStatus();
    const search = this.filterSearch().toLowerCase();

    if (severity) items = items.filter((n) => n.severity === severity);
    if (domain) items = items.filter((n) => n.domain === domain);
    if (status) items = items.filter((n) => n.status === status);
    if (search) {
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(search) ||
          n.message?.toLowerCase().includes(search) ||
          n.type.toLowerCase().includes(search),
      );
    }

    return items;
  });

  // Pinned critical (always at top)
  pinnedCritical = computed(() =>
    this.notifications().filter((n) => n.pinned_until_resolved && n.status !== 'resolved'),
  );

  // Available domains for filter
  domains: { value: AdminNotificationDomain; label: string; icon: string }[] = [
    { value: 'system', label: 'System', icon: 'dns' },
    { value: 'farms', label: 'Farms', icon: 'agriculture' },
    { value: 'devices', label: 'Devices', icon: 'memory' },
    { value: 'crops', label: 'Crops', icon: 'grass' },
    { value: 'users', label: 'Users', icon: 'people' },
    { value: 'automation', label: 'Automation', icon: 'auto_fix_high' },
  ];

  // Export columns definition
  exportColumns: ExportColumn[] = [
    { key: 'title', header: 'Title', format: 'text', width: 40 },
    { key: 'severity', header: 'Severity', format: 'status', width: 15 },
    { key: 'domain', header: 'Domain', format: 'text', width: 15 },
    { key: 'status', header: 'Status', format: 'status', width: 15 },
    { key: 'message', header: 'Message', format: 'text', width: 50 },
    { key: 'created_at', header: 'Created At', format: 'datetime', width: 25 },
  ];

  ngOnInit(): void {
    this.loadNotifications();
    this.loadCounts();
    this.loadSystemHealth();
    this.loadPendingRequests();

    // Subscribe to real-time WebSocket events
    this.adminWs.newNotification$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      // Refresh notifications when a new one arrives
      this.loadNotifications(false);
      this.loadCounts();
    });

    this.adminWs.newAccessRequest$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadPendingRequests();
    });

    this.adminWs.countsUpdated$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadPendingRequests();
      this.loadCounts();
    });

    // Lead-specific real-time events
    this.adminWs.newLead$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data.type === 'contact') {
        this.contactNewCount.update((c) => c + 1);
        if (this.activeTab() === 'contact-messages') {
          this.loadContactMessages();
        }
      } else if (data.type === 'training') {
        this.trainingNewCount.update((c) => c + 1);
        if (this.activeTab() === 'training-requests') {
          this.loadTrainingRequests();
        }
      }
    });

    this.adminWs.leadStatusChanged$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data.type === 'contact' && this.activeTab() === 'contact-messages') {
        this.loadContactMessages();
      } else if (data.type === 'training' && this.activeTab() === 'training-requests') {
        this.loadTrainingRequests();
      }
    });

    // Auto-refresh every 60 seconds (reduced from 30s since WS handles real-time)
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadCounts();
        this.loadSystemHealth();
        this.loadNotifications(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSystemHealth(): void {
    this.adminApi
      .getSystemHealth()
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ status: 'degraded' })),
      )
      .subscribe((res: any) => {
        this.systemHealthy.set(res.status === 'healthy');
      });
  }

  loadNotifications(showLoading = true): void {
    if (showLoading) this.isLoading.set(true);

    const params: any = {
      page: this.currentPage(),
      limit: this.pageSize,
    };

    if (this.filterSeverity()) params.severity = this.filterSeverity();
    if (this.filterDomain()) params.domain = this.filterDomain();
    if (this.filterStatus()) params.status = this.filterStatus();
    if (this.filterSearch()) params.search = this.filterSearch();
    if (this.filterDateFrom()) params.from = this.filterDateFrom()?.toISOString();
    if (this.filterDateTo()) params.to = this.filterDateTo()?.toISOString();

    this.adminApi
      .get<any>('admin/notifications', { params })
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ items: [], total: 0, hasMore: false })),
      )
      .subscribe((res) => {
        this.notifications.set(res.items || []);
        this.total.set(res.total || 0);
        this.hasMore.set(res.hasMore || false);
        this.isLoading.set(false);
      });
  }

  loadCounts(): void {
    this.adminApi
      .get<AdminNotificationCounts>('admin/notifications/counts')
      .pipe(
        takeUntil(this.destroy$),
        catchError(() =>
          of({
            critical: 0,
            warning: 0,
            info: 0,
            success: 0,
            total: 0,
            unresolved: 0,
            newCount: 0,
          }),
        ),
      )
      .subscribe((counts) => this.counts.set(counts));
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
    this.filtersExpanded.update((v) => !v);
  }

  loadMoreNotifications(): void {
    this.currentPage.update((p) => p + 1);
    this.loadNotifications();
  }

  // Actions
  acknowledge(notification: AdminNotification, event?: Event): void {
    event?.stopPropagation();

    this.adminApi
      .patch<AdminNotification>(`admin/notifications/${notification.id}/acknowledge`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.updateNotificationInList(updated);
          this.loadCounts();
          this.alertService.success('Success', 'Notification acknowledged', 2000);
        },
        error: () => this.alertService.error('Error', 'Failed to acknowledge', 3000),
      });
  }

  resolve(notification: AdminNotification, event?: Event): void {
    event?.stopPropagation();

    this.adminApi
      .patch<AdminNotification>(`admin/notifications/${notification.id}/resolve`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.updateNotificationInList(updated);
          this.loadCounts();
          this.alertService.success('Success', 'Notification resolved', 2000);
        },
        error: () => this.alertService.error('Error', 'Failed to resolve', 3000),
      });
  }

  bulkAcknowledge(): void {
    const ids = this.filteredNotifications()
      .filter((n) => n.status === 'new')
      .map((n) => n.id);

    if (ids.length === 0) return;

    this.adminApi
      .post<any>('admin/notifications/bulk-acknowledge', { ids })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.loadCounts();
          this.alertService.success('Success', `${ids.length} notifications acknowledged`, 2000);
        },
        error: () => this.alertService.error('Error', 'Bulk acknowledge failed', 3000),
      });
  }

  bulkResolve(): void {
    const ids = this.filteredNotifications()
      .filter((n) => n.status !== 'resolved')
      .map((n) => n.id);

    if (ids.length === 0) return;

    this.adminApi
      .post<any>('admin/notifications/bulk-resolve', { ids })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.loadCounts();
          this.alertService.success('Success', `${ids.length} notifications resolved`, 2000);
        },
        error: () => this.alertService.error('Error', 'Bulk resolve failed', 3000),
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
    this.notifications.update((list) => list.map((n) => (n.id === updated.id ? updated : n)));
  }

  getSeverityIcon(severity: AdminNotificationSeverity): string {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'check_circle';
    }
  }

  getDomainIcon(domain: AdminNotificationDomain): string {
    const d = this.domains.find((x) => x.value === domain);
    return d?.icon || 'category';
  }

  getStatusLabel(status: AdminNotificationStatus): string {
    switch (status) {
      case 'new':
        return 'New';
      case 'acknowledged':
        return 'Reviewed';
      case 'resolved':
        return 'Resolved';
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
      minute: '2-digit',
    });
  }

  navigateToEntity(type: string, id: string): void {
    // Navigate to related entity
    // This would use Router to navigate to the appropriate admin page
    console.log(`Navigate to ${type}: ${id}`);
  }

  exportAudit(): void {
    this.adminApi
      .get<any>('admin/notifications/export/audit', {
        params: { limit: 1000 },
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
        error: () => this.alertService.error('Error', 'Export failed', 3000),
      });
  }

  // ========================
  // ACCESS REQUEST MANAGEMENT
  // ========================

  setActiveTab(tab: 'notifications' | 'access-requests' | 'contact-messages' | 'training-requests'): void {
    this.activeTab.set(tab);
    if (tab === 'access-requests') {
      this.loadPendingRequests();
    } else if (tab === 'contact-messages') {
      this.loadContactMessages();
    } else if (tab === 'training-requests') {
      this.loadTrainingRequests();
    }
  }

  loadPendingRequests(): void {
    this.isLoadingRequests.set(true);
    this.adminApi
      .getPendingAccessRequests(1, 50)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ items: [], total: 0 })),
      )
      .subscribe((res: any) => {
        this.pendingRequests.set(res.items || []);
        this.pendingTotal.set(res.total || 0);
        this.isLoadingRequests.set(false);
      });
  }

  approveRequest(userId: string, event?: Event): void {
    event?.stopPropagation();
    this.adminApi
      .approveAccessRequest(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.alertService.success(
            'Success',
            `${res.user.first_name} ${res.user.last_name} has been approved`,
            4000,
          );
          this.loadPendingRequests();
          this.loadNotifications(false);
          this.loadCounts();
        },
        error: (err) => {
          this.alertService.error(
            'Error',
            err?.error?.message || 'Failed to approve request',
            4000,
          );
        },
      });
  }

  rejectRequest(userId: string, event?: Event, userName?: string): void {
    event?.stopPropagation();

    if (!userName) {
      const pendingUser = this.pendingRequests().find(
        (req: any) => (req.id || req.user_id) === userId,
      );
      if (pendingUser) {
        userName = `${pendingUser.first_name || ''} ${pendingUser.last_name || ''}`.trim();
      }
    }

    const dialogRef = this.dialog.open(RejectRequestDialogComponent, {
      width: '500px',
      data: { userName: userName || 'User' },
      disableClose: true,
      panelClass: ['glass-dialog', 'mobile-fullscreen-dialog'],
    });

    dialogRef.afterClosed().subscribe((reason) => {
      if (!reason) return; // User cancelled

      this.adminApi
        .rejectAccessRequest(userId, reason)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.alertService.success('Success', `Access request has been rejected`, 4000);
            this.loadPendingRequests();
            this.loadNotifications(false);
            this.loadCounts();
          },
          error: (err) => {
            this.alertService.error(
              'Error',
              err?.error?.message || 'Failed to reject request',
              4000,
            );
          },
        });
    });
  }

  /**
   * Approve access directly from a user_registration notification
   */
  approveFromNotification(notification: AdminNotification, event?: Event): void {
    event?.stopPropagation();
    const userId = notification.context?.userId;
    if (!userId) {
      this.alertService.error('Error', 'Cannot approve - user ID not found in notification', 3000);
      return;
    }
    this.approveRequest(userId, event);
  }

  rejectFromNotification(notification: AdminNotification, event?: Event): void {
    event?.stopPropagation();
    const userId = notification.context?.userId;
    const userName = notification.context?.userName || 'User';
    if (!userId) {
      this.alertService.error('Error', 'Cannot reject - user ID not found in notification', 3000);
      return;
    }
    this.rejectRequest(userId, event, userName);
  }

  /**
   * Check if a notification is an access request that can be acted upon
   */
  isAccessRequestNotification(notification: AdminNotification): boolean {
    return notification.type === 'user_registration' && notification.status !== 'resolved';
  }

  // ========================
  // CONTACT MESSAGES MANAGEMENT
  // ========================

  loadContactMessages(): void {
    this.isLoadingContacts.set(true);
    this.adminApi
      .getContactMessages(1, 50)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ items: [], total: 0, newCount: 0 })),
      )
      .subscribe((res: any) => {
        this.contactMessages.set(res.items || []);
        this.contactTotal.set(res.total || 0);
        this.contactNewCount.set(res.newCount || 0);
        this.isLoadingContacts.set(false);
      });
  }

  updateContactStatus(id: string, status: string, event?: Event): void {
    event?.stopPropagation();
    this.adminApi
      .updateContactMessageStatus(id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertService.success('Success', `Message marked as ${status}`, 2000);
          this.loadContactMessages();
        },
        error: () => this.alertService.error('Error', 'Failed to update status', 3000),
      });
  }

  /** Human-readable project type label */
  getProjectTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'serre-connectee': 'Serre Connectée',
      'serre-verticale': 'Serre Verticale',
      'automatisation': 'Automatisation',
      'amenagement': 'Aménagement',
      'formation': 'Formation',
      'etude': 'Étude',
      'autre': 'Autre',
    };
    return labels[type] || type;
  }

  /** Icon for project type */
  getProjectTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'serre-connectee': 'sensors',
      'serre-verticale': 'vertical_align_top',
      'automatisation': 'auto_fix_high',
      'amenagement': 'engineering',
      'formation': 'school',
      'etude': 'science',
      'autre': 'help_outline',
    };
    return icons[type] || 'category';
  }

  // ========================
  // TRAINING REQUESTS MANAGEMENT
  // ========================

  loadTrainingRequests(): void {
    this.isLoadingTraining.set(true);
    this.adminApi
      .getTrainingRequests(1, 50)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ items: [], total: 0, newCount: 0 })),
      )
      .subscribe((res: any) => {
        this.trainingRequests.set(res.items || []);
        this.trainingTotal.set(res.total || 0);
        this.trainingNewCount.set(res.newCount || 0);
        this.isLoadingTraining.set(false);
      });
  }

  updateTrainingStatus(id: string, status: string, event?: Event): void {
    event?.stopPropagation();
    this.adminApi
      .updateTrainingRequestStatus(id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.alertService.success('Success', `Request marked as ${status}`, 2000);
          this.loadTrainingRequests();
        },
        error: () => this.alertService.error('Error', 'Failed to update status', 3000),
      });
  }

  /** Human-readable training level label */
  getTrainingTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'level_1': 'Niveau 1 — Fondamentaux',
      'level_2': 'Niveau 2 — Avancé',
      'level_3': 'Niveau 3 — Expert',
    };
    return labels[type] || type;
  }

  /** Status chip color class for lead statuses */
  getLeadStatusClass(status: string): string {
    switch (status) {
      case 'new': return 'lead-status-new';
      case 'read': case 'contacted': return 'lead-status-contacted';
      case 'replied': case 'scheduled': return 'lead-status-replied';
      case 'completed': case 'converted': return 'lead-status-completed';
      case 'archived': return 'lead-status-archived';
      default: return 'lead-status-new';
    }
  }
}
