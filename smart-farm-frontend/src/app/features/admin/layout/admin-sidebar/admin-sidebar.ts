import { Component, Input, Output, EventEmitter, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LanguageService } from '../../../../core/services/language.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  children?: NavItem[];
}

/**
 * Admin Sidebar Component
 * Curved active navigation with icon-only design
 * Expands on hover (desktop), drawer mode (mobile/tablet)
 */
@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss'
})
export class AdminSidebar {
  @Input() isCollapsed = false;
  @Input() isDrawerOpen = false;
  @Input() isMobile = false;
  @Input() isTablet = false;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() sidebarHover = new EventEmitter<boolean>();

  public languageService = inject(LanguageService);

  navItems: NavItem[] = [
    // TOP PRIORITY - Core Admin Functions
    { icon: 'dashboard', label: 'admin.sidebar.overview', route: '/admin/overview' },
    { icon: 'agriculture', label: 'admin.sidebar.farms', route: '/admin/farms' },
    { icon: 'memory', label: 'admin.sidebar.devices', route: '/admin/devices' },
    { icon: 'insights', label: 'admin.sidebar.sensorAnalytics', route: '/admin/sensor-analytics' },
    { icon: 'group',
      label: 'admin.sidebar.users',
      route: '/admin/users',
      children: [
        { icon: 'person', label: 'admin.sidebar.farmers', route: '/admin/farmers' }
      ]
    },
    { icon: 'receipt_long', label: 'admin.sidebar.logs', route: '/admin/logs' },
    { icon: 'notifications_active', label: 'admin.sidebar.notifications', route: '/admin/notifications' },
    // OPTIONAL - Low Priority
    { icon: 'settings', label: 'admin.sidebar.settings', route: '/admin/settings' }
  ];

  constructor(private router: Router) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.isMobile && !this.isTablet) {
      this.sidebarHover.emit(true);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (!this.isMobile && !this.isTablet) {
      this.sidebarHover.emit(false);
    }
  }

  /**
   * Get translated label for nav item
   */
  getNavLabel(translationKey: string): string {
    return this.languageService.t()(translationKey);
  }

  /**
   * Check if current language is RTL
   */
  isRTL(): boolean {
    return this.languageService.isRTL();
  }

  /**
   * Check if route is active (including sub-routes)
   */
  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  /**
   * Check if parent item has active child
   */
  hasActiveChild(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some(child => this.isActive(child.route));
  }

  /**
   * Check if sub-navigation should be expanded
   */
  isExpanded(item: NavItem): boolean {
    return this.isActive(item.route) || this.hasActiveChild(item);
  }

  /**
   * Navigate to route
   */
  navigate(route: string): void {
    this.router.navigate([route]);

    // Close drawer on mobile/tablet after navigation
    if (this.isMobile || this.isTablet) {
      this.closeSidebar.emit();
    }
  }

  /**
   * Handle sidebar overlay click
   */
  onCloseSidebar(): void {
    this.closeSidebar.emit();
  }
}
