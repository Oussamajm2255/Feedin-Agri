import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Subject, interval, of } from 'rxjs';
import { filter, takeUntil, catchError } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { LanguageService } from '../../../../core/services/language.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { CustomDropdownComponent, DropdownItem } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';
import { AdminLayoutService } from '../../../../admin/core/services/admin-layout.service'; // Import Layout Service
import { AdminApiService } from '../../../../admin/core/services/admin-api.service';

interface Breadcrumb {
  label: string;
  route?: string;
}

/**
 * Admin Header Component
 * Professional top bar with search, breadcrumbs, and notifications
 */
@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule,
    TranslatePipe,
    CustomDropdownComponent
  ],
  templateUrl: './admin-header.html',
  styleUrls: ['./admin-header.scss']
})
export class AdminHeader implements OnInit, OnDestroy {
  @Input() isMobile = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleRightPanel = new EventEmitter<void>();

  searchQuery = '';
  breadcrumbs: Breadcrumb[] = [];
  notificationCount = 0;
  isDarkTheme = false;
  currentUser: any = null;
  private destroy$ = new Subject<void>();

  // Language service
  public languageService = inject(LanguageService);
  private adminLayoutService = inject(AdminLayoutService);
  private adminApi = inject(AdminApiService);

  // Track drawer state
  rightDrawerOpen = this.adminLayoutService.rightDrawerOpen;

  // Language dropdown items
  languageDropdownItems: DropdownItem[] = [
    {
      id: 'en-US',
      label: 'English',
      subtitle: 'English',
      flag: 'https://flagcdn.com/w40/us.png',
      badge: 'EN'
    },
    {
      id: 'fr-FR',
      label: 'Français',
      subtitle: 'French',
      flag: 'https://flagcdn.com/w40/fr.png',
      badge: 'FR'
    },
    {
      id: 'ar-TN',
      label: 'العربية',
      subtitle: 'Arabic',
      flag: 'https://flagcdn.com/w40/tn.png',
      badge: 'AR'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Load current user
    this.currentUser = this.authService.getCurrentUser();

    // Load theme state
    this.isDarkTheme = this.themeService.currentTheme === 'dark';

    // Update breadcrumbs on route change
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumbs();
      });

    // Initialize breadcrumbs
    this.updateBreadcrumbs();

    // Subscribe to language changes to update breadcrumbs
    this.languageService.getTranslations().subscribe(() => {
      this.updateBreadcrumbs();
    });

    // Load notifications count
    this.loadNotificationCount();
    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadNotificationCount();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotificationCount(): void {
    this.adminApi.get<any>('admin/notifications/counts')
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of({ unresolved: 0 }))
      )
      .subscribe(counts => {
        this.notificationCount = counts.unresolved || 0;
      });
  }

  /**
   * Update breadcrumbs based on current route
   */
  private updateBreadcrumbs(): void {
    const url = this.router.url;
    const segments = url.split('/').filter(s => s);

    this.breadcrumbs = [];

    if (segments.length > 1) {
      const page = segments[1];
      const translationKey = `admin.sidebar.${page}`;
      const translatedLabel = this.languageService.t()(translationKey);
      // Fallback to formatted label if translation not found
      const label = translatedLabel !== translationKey ? translatedLabel : this.formatBreadcrumbLabel(page);
      this.breadcrumbs.push({ label, route: url });
    }
  }

  /**
   * Format breadcrumb label from route segment
   */
  private formatBreadcrumbLabel(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Handle search
   */
  onSearch(): void {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // Implement search logic
    }
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchQuery = '';
  }

  /**
   * Toggle theme
   */
  onToggleTheme(): void {
    this.themeService.toggleTheme();
    this.isDarkTheme = this.themeService.currentTheme === 'dark';
  }

  /**
   * Open notifications
   */
  openNotifications(): void {
    this.router.navigate(['/admin/notifications']);
  }

  /**
   * Navigate to profile
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Navigate to settings
   */
  goToSettings(): void {
    this.router.navigate(['/admin/settings']);
  }

  /**
   * Logout
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Toggle sidebar drawer (mobile/tablet)
   */
  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  /**
   * Navigate to breadcrumb
   */
  navigateTo(route: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }

  /**
   * Handle language selection
   */
  onLanguageItemSelected(item: DropdownItem): void {
    this.languageService.setLanguage(item.id);
  }

  /**
   * Get selected language ID
   */
  getSelectedLanguageId(): string {
    return this.languageService.getCurrentLanguageCode();
  }

  /**
   * Check if current language is RTL
   */
  isRTL(): boolean {
    return this.languageService.isRTL();
  }

  /**
   * Get action button border style
   */
  getActionButtonBorder(): string {
    return this.isDarkTheme
      ? '0.5px solid rgba(255, 255, 255, 0.15)'
      : '0.5px solid rgba(0, 0, 0, 0.2)';
  }
}
