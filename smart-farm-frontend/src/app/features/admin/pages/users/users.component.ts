import { Component, OnInit, AfterViewInit, signal, computed, effect, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, catchError, finalize, of, map } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

// Services
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';
import { AdminLayoutService } from '../../../../admin/core/services/admin-layout.service'; // Import Layout Service
import { ApiService } from '../../../../core/services/api.service';
import { LanguageService } from '../../../../core/services/language.service';
import { BreakpointService } from '../../../../core/services/breakpoint.service';

// Pipes
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

// Models
import { User, UserRole, UserStatus } from '../../../../core/models/user.model';
import { Farm } from '../../../../core/models/farm.model';
import { ActionLog } from '../../../../core/models/action-log.model';

// Dialogs
import { ConfirmImpersonateDialogComponent } from './components/dialogs/confirm-impersonate-dialog/confirm-impersonate-dialog.component';

// New Drawer Component
import { UserDrawerComponent, DrawerMode, DrawerCloseEvent } from './components/user-drawer/user-drawer.component';

// Export Components
import { ExportButtonComponent } from '../../../../shared/components/export-button/export-button.component';
import { ExportColumn } from '../../../../shared/services/export.service';

// Types
interface UserTableRow {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  role: string;
  status: string;
  city: string | null;
  country: string | null;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
  farm_count: number;
}

interface UserStats {
  total: number;
  farmers: number;
  moderators: number;
  admins: number;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule,
    TranslatePipe,
    UserDrawerComponent,
    ExportButtonComponent,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in', style({ opacity: 1 }))
      ])
    ]),
    trigger('floatIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px) scale(0.9)' }),
        animate('0.6s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class UsersComponent implements OnInit, AfterViewInit {
  // Services
  private adminApiService = inject(AdminApiService);
  private adminLayoutService = inject(AdminLayoutService); // Inject Layout Service
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  public languageService = inject(LanguageService);
  private breakpointService = inject(BreakpointService);

  // View mode: 'table' for large screens, 'grid' for smaller screens
  viewMode = signal<'table' | 'grid'>(
    typeof window !== 'undefined' && window.innerWidth < 1400 ? 'grid' : 'table'
  );

  /**
   * Effect to auto-switch view mode based on breakpoint
   */
  private viewModeBreakpointEffect = effect(() => {
    const isLargeDesktop = this.breakpointService.isLargeDesktop();
    // Only auto-switch to grid when moving from large to smaller screens
    if (!isLargeDesktop && this.viewMode() === 'table') {
      this.viewMode.set('grid');
    }
  }, { allowSignalWrites: true });

  // ... (rest of the class)




  // State Signals
  loading = signal<boolean>(true);
  loadingStats = signal<boolean>(true);
  users = signal<UserTableRow[]>([]);
  totalUsers = signal<number>(0);
  stats = signal<UserStats>({ total: 0, farmers: 0, moderators: 0, admins: 0 });

  // ==================== DRAWER STATE ====================
  drawerOpen = signal<boolean>(false);
  drawerMode = signal<DrawerMode>('view');
  selectedUserId = signal<string | null>(null);

  // Farms for filter dropdown
  farms = signal<Farm[]>([]);
  loadingFarms = signal<boolean>(false);

  // Pagination
  pageIndex = signal<number>(0);
  pageSize = signal<number>(20);

  // Sorting
  sortBy = signal<string>('created_at');
  sortOrder = signal<'ASC' | 'DESC'>('DESC');

  // Filters
  selectedRoles = signal<string[]>([]);
  selectedStatuses = signal<string[]>([]);
  selectedFarmId = signal<string | null>(null);
  searchControl = new FormControl('');

  // Filter Options
  roleOptions = [
    { value: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
    { value: 'farmer', label: 'Farmer', icon: 'agriculture' },
    { value: 'moderator', label: 'Moderator', icon: 'supervisor_account' },
  ];

  statusOptions = [
    { value: 'active', label: 'Active', color: 'success' },
    { value: 'inactive', label: 'Inactive', color: 'warn' },
    { value: 'suspended', label: 'Suspended', color: 'error' },
    { value: 'pending', label: 'Pending', color: 'default' },
  ];

  // Table columns
  displayedColumns: string[] = [
    'full_name',
    'email',
    'role',
    'status',
    'farm_count',
    'last_login',
    'actions',
  ];

  // Export columns configuration
  exportColumns: ExportColumn[] = [
    { key: 'full_name', header: 'Full Name', format: 'text' },
    { key: 'email', header: 'Email', format: 'text' },
    { key: 'role', header: 'Role', format: 'status' },
    { key: 'status', header: 'Status', format: 'status' },
    { key: 'city', header: 'City', format: 'text' },
    { key: 'country', header: 'Country', format: 'text' },
    { key: 'farm_count', header: 'Farms', format: 'number' },
    { key: 'last_login', header: 'Last Login', format: 'datetime' },
    { key: 'created_at', header: 'Created At', format: 'date' },
  ];

  // Computed
  hasActiveFilters = computed(() => {
    return (
      this.selectedRoles().length > 0 ||
      this.selectedStatuses().length > 0 ||
      this.selectedFarmId() !== null ||
      (this.searchControl.value?.trim() || '').length > 0
    );
  });

  filteredUsersCount = computed(() => this.users().length);

  activeFiltersCount = computed(() => {
    let count = 0;
    count += this.selectedRoles().length;
    count += this.selectedStatuses().length;
    if (this.selectedFarmId()) count += 1;
    if (this.searchControl.value?.trim()) count += 1;
    return count;
  });

  // Animation state for staggered table rows
  animationDelay = (index: number) => `${index * 50}ms`;

  // Counter animation for stats
  ngAfterViewInit(): void {
    // Animate counters when stats load
    if (!this.loadingStats()) {
      this.animateCounters();
    }
  }

  private animateCounters(): void {
    const counters = document.querySelectorAll('.counter');
    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute('data-target') || '0', 10);
      const duration = 2000; // 2 seconds
      const increment = target / (duration / 16); // 60fps
      let current = 0;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          counter.textContent = Math.floor(current).toString();
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target.toString();
        }
      };

      updateCounter();
    });
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadFarms();
    this.loadUsers();
    this.setupSearchListener();
    this.updateViewModeForBreakpoint();
  }

  /**
   * Update view mode based on current breakpoint
   */
  private updateViewModeForBreakpoint(): void {
    if (!this.breakpointService.isLargeDesktop()) {
      this.viewMode.set('grid');
    }
  }

  /**
   * Set view mode manually
   */
  setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode.set(mode);
  }

  // ==================== DATA LOADING ====================

  loadUsers(): void {
    this.loading.set(true);

    const query: any = {
      page: this.pageIndex() + 1,
      limit: this.pageSize(),
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
    };

    // Apply filters
    if (this.selectedRoles().length > 0) {
      query.role = this.selectedRoles().join(',');
    }
    if (this.selectedStatuses().length > 0) {
      query.status = this.selectedStatuses().join(',');
    }
    if (this.searchControl.value?.trim()) {
      query.search = this.searchControl.value.trim();
    }
    // Apply farm_id filter if selected
    if (this.selectedFarmId()) {
      query.farm_id = this.selectedFarmId()!;
    }

    this.adminApiService
      .getUsers(query)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error loading users:', error);

          // If error is due to unsupported farm_id filter, try again without it
          if (error.status === 400 && query.farm_id && error.error?.message?.includes('farm_id')) {
            console.warn('Backend does not support farm_id filter yet. Retrying without filter.');
            const queryWithoutFarm = { ...query };
            delete queryWithoutFarm.farm_id;

            return this.adminApiService.getUsers(queryWithoutFarm).pipe(
              catchError((retryError) => {
                this.showSnackbar('Failed to load users', 'error');
                return of({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 });
              })
            );
          }

          this.showSnackbar('Failed to load users', 'error');
          return of({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe((response: {
        items: Array<{
          user_id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          role: string;
          status: string;
          city: string | null;
          country: string | null;
          last_login: Date | null;
          created_at: Date;
          updated_at: Date;
          farm_count: number;
        }>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }) => {
        const mappedUsers: UserTableRow[] = response.items.map((user: {
          user_id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          role: string;
          status: string;
          city: string | null;
          country: string | null;
          last_login: Date | null;
          created_at: Date;
          updated_at: Date;
          farm_count: number;
        }) => ({
          ...user,
          full_name: `${user.first_name} ${user.last_name}`.trim(),
        }));
        this.users.set(mappedUsers);
        this.totalUsers.set(response.total);
      });
  }

  loadStats(): void {
    this.loadingStats.set(true);

    // Use the admin overview summary endpoint
    this.adminApiService
      .getOverviewSummary()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null)),
        finalize(() => {
          this.loadingStats.set(false);
          // Trigger counter animation after stats load
          setTimeout(() => this.animateCounters(), 100);
        })
      )
      .subscribe((summary: {
        totalFarms: number;
        totalDevices: number;
        onlineDevices: number;
        offlineDevices: number;
        maintenanceDevices: number;
        totalSensors: number;
        totalUsers: number;
        totalFarmers: number;
        totalAdmins: number;
        activeUsers: number;
        alertsToday: number;
        criticalAlertsUnread: number;
        actionsToday: number;
        autoActionsToday: number;
        manualActionsToday: number;
      } | null) => {
        if (summary) {
          this.stats.set({
            total: summary.totalUsers,
            farmers: summary.totalFarmers,
            moderators: 0, // Not available in summary yet
            admins: summary.totalAdmins,
          });
        }
      });
  }

  loadFarms(): void {
    this.loadingFarms.set(true);
    this.apiService
      .getFarms()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of([])),
        finalize(() => this.loadingFarms.set(false))
      )
      .subscribe((farms: Farm[]) => {
        this.farms.set(farms);
      });
  }

  setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        this.loadUsers();
      });
  }

  // ==================== DRAWER METHODS ====================

  openCreateUser(): void {
    this.selectedUserId.set(null);
    this.drawerMode.set('create');
    this.drawerOpen.set(true);
    this.adminLayoutService.openRightDrawer(); // Notify layout service
  }

  openViewUser(userId: string): void {
    this.selectedUserId.set(userId);
    this.drawerMode.set('view');
    this.drawerOpen.set(true);
    this.adminLayoutService.openRightDrawer(); // Notify layout service
  }

  openEditUser(userId: string): void {
    this.selectedUserId.set(userId);
    this.drawerMode.set('edit');
    this.drawerOpen.set(true);
    this.adminLayoutService.openRightDrawer(); // Notify layout service
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedUserId.set(null);
    this.drawerMode.set('view');
    this.adminLayoutService.closeRightDrawer(); // Notify layout service
  }

  onDrawerClosed(event: DrawerCloseEvent): void {
    if (event.action === 'saved' || event.action === 'created') {
      this.showSnackbar(
        event.action === 'created' ? 'User created successfully' : 'User updated successfully',
        'success'
      );
      this.loadUsers();
      this.loadStats();
    }
    this.closeDrawer();
  }

  onDrawerModeChanged(mode: DrawerMode): void {
    this.drawerMode.set(mode);
  }

  // ==================== USER ACTIONS ====================

  onRowClick(user: UserTableRow): void {
    this.openViewUser(user.user_id);
  }

  onViewDetails(user: UserTableRow, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (user?.user_id) {
      this.openViewUser(user.user_id);
    } else {
      console.error('Cannot view details: user or user_id is missing', user);
      this.showSnackbar('Unable to view user details', 'error');
    }
  }

  onEditUser(user: UserTableRow, event: Event): void {
    event.stopPropagation();
    this.openEditUser(user.user_id);
  }

  onImpersonateUser(user: UserTableRow | User, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const userId = 'user_id' in user ? user.user_id : (user as any).user_id;
    const userName = 'full_name' in user ? user.full_name : `${(user as User).first_name} ${(user as User).last_name}`;
    const userEmail = 'email' in user ? user.email : (user as User).email;
    const userStatus = 'status' in user ? user.status : (user as User).status;

    if (userStatus !== 'active') {
      this.showSnackbar('Cannot impersonate inactive users', 'warn');
      return;
    }

    // Show confirmation dialog
    const confirmDialogRef = this.dialog.open(ConfirmImpersonateDialogComponent, {
      width: '500px',
      data: {
        userName,
        userEmail,
      },
    });

    confirmDialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      // Call impersonation API
      this.adminApiService
        .impersonateUser(userId)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          catchError((error) => {
            console.error('Impersonation failed:', error);
            this.showSnackbar('Impersonation failed', 'error');
            return of(null);
          })
        )
        .subscribe((result: {
          user: User;
          impersonated: boolean;
          originalAdmin: {
            user_id: string;
            email: string;
            role: string;
          };
        } | null) => {
          if (result) {
            // Store original admin info in sessionStorage
            sessionStorage.setItem('impersonation_original_admin', JSON.stringify(result.originalAdmin));
            sessionStorage.setItem('impersonation_active', 'true');
            sessionStorage.setItem('impersonation_user', JSON.stringify(result.user));

            this.showSnackbar(`Now impersonating: ${userName}`, 'success');

            // Redirect to appropriate dashboard based on role
            setTimeout(() => {
              if (result.user.role === 'farmer') {
                window.location.href = '/dashboard';
              } else {
                // For other roles, redirect to their default page
                window.location.href = '/dashboard';
              }
            }, 1000);
          }
        });
    });
  }

  // ==================== TABLE ACTIONS ====================

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  onSortChange(sort: Sort): void {
    if (sort.direction) {
      this.sortBy.set(sort.active);
      this.sortOrder.set(sort.direction.toUpperCase() as 'ASC' | 'DESC');
    } else {
      this.sortBy.set('created_at');
      this.sortOrder.set('DESC');
    }
    this.loadUsers();
  }

  // ==================== FILTER ACTIONS ====================

  toggleRoleFilter(role: string): void {
    const current = this.selectedRoles();
    if (current.includes(role)) {
      this.selectedRoles.set(current.filter((r) => r !== role));
    } else {
      this.selectedRoles.set([...current, role]);
    }
    this.pageIndex.set(0);
    this.loadUsers();
  }

  toggleStatusFilter(status: string): void {
    const current = this.selectedStatuses();
    if (current.includes(status)) {
      this.selectedStatuses.set(current.filter((s) => s !== status));
    } else {
      this.selectedStatuses.set([...current, status]);
    }
    this.pageIndex.set(0);
    this.loadUsers();
  }

  onFarmFilterChange(farmId: string | null): void {
    this.selectedFarmId.set(farmId);
    this.pageIndex.set(0);
    // Reload users with the new farm filter
    this.loadUsers();
  }

  clearAllFilters(): void {
    this.selectedRoles.set([]);
    this.selectedStatuses.set([]);
    this.selectedFarmId.set(null);
    this.searchControl.setValue('');
    this.pageIndex.set(0);
    this.loadUsers();
  }

  // ==================== HELPERS ====================

  getRoleIcon(role: string): string {
    const roleOption = this.roleOptions.find((r) => r.value === role);
    return roleOption?.icon || 'person';
  }

  getRoleLabel(role: string): string {
    const roleOption = this.roleOptions.find((r) => r.value === role);
    return roleOption?.label || role;
  }

  getStatusColor(status: string): string {
    const statusOption = this.statusOptions.find((s) => s.value === status);
    return statusOption?.color || 'default';
  }

  formatDate(date: Date | null | undefined): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString(this.languageService.getCurrentLanguageCode() || 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '—';
    }
  }

  formatDateTime(date: Date | null | undefined): string {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleString(this.languageService.getCurrentLanguageCode() || 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  }

  showSnackbar(message: string, type: 'success' | 'error' | 'warn' | 'info' = 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`],
    });
  }

  getErrorMessage(error: any): string {
    // Handle HTTP error responses
    if (error?.error) {
      // NestJS error format: error.error.message or error.error.error.message
      const errorObj = error.error;
      
      // Check for nested error object (NestJS format)
      if (errorObj.error) {
        if (errorObj.error.message) {
          // Handle array of messages (validation errors)
          if (Array.isArray(errorObj.error.message)) {
            return errorObj.error.message.join(', ');
          }
          // Handle single message string
          return errorObj.error.message;
        }
        // If error.error is a string
        if (typeof errorObj.error === 'string') {
          return errorObj.error;
        }
      }
      
      // Check for direct message property
      if (errorObj.message) {
        // Handle array of messages (validation errors)
        if (Array.isArray(errorObj.message)) {
          return errorObj.message.join(', ');
        }
        // Handle single message string
        return errorObj.message;
      }
      
      // If error.error is a string directly
      if (typeof errorObj === 'string') {
        return errorObj;
      }
    }
    
    // Handle network errors
    if (error?.status === 0) {
      return 'Network error. Please check your connection.';
    }
    
    // Handle specific HTTP status codes with default messages
    if (error?.status === 400) {
      return 'Invalid user data. Please check all fields.';
    }
    if (error?.status === 409) {
      // Try to extract message, otherwise use default
      const conflictMessage = error?.error?.error?.message || error?.error?.message;
      return conflictMessage || 'Email already exists. Please use a different email.';
    }
    if (error?.status === 401) {
      return 'Unauthorized. Please log in again.';
    }
    if (error?.status === 403) {
      return 'You do not have permission to create users.';
    }
    if (error?.status === 500) {
      return 'Server error. Please try again later.';
    }
    
    // Default error message
    return error?.message || 'Failed to create user. Please try again.';
  }

  // ==================== SKELETON LOADERS ====================

  get skeletonRows(): number[] {
    return Array.from({ length: 5 }, (_, i) => i);
  }
}
