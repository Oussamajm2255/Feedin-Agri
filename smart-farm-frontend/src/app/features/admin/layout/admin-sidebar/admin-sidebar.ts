import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  inject,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { LanguageService } from '../../../../core/services/language.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  children?: NavItem[];
}

/**
 * Admin Sidebar Component
 * Fluid-Rail design: 64px icon-only mini-state, 260px expanded glass state.
 * Active state: pill background with soft green glow + 4px left-accent border.
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
export class AdminSidebar implements OnDestroy {
  @Input() isCollapsed = true;
  @Input() isDrawerOpen = false;
  @Input() isMobile = false;
  @Input() isTablet = false;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() sidebarHover = new EventEmitter<boolean>();

  /** Mobile Bento overlay state emitted to shell */
  @Output() bentoOpen = new EventEmitter<boolean>();

  public isBentoOpen = false;
  private readonly destroy$ = new Subject<void>();
  public languageService = inject(LanguageService);

  navItems: NavItem[] = [
    { icon: 'dashboard',            label: 'admin.sidebar.overview',        route: '/admin/overview' },
    { icon: 'agriculture',          label: 'admin.sidebar.farms',           route: '/admin/farms' },
    { icon: 'memory',               label: 'admin.sidebar.devices',         route: '/admin/devices' },
    { icon: 'insights',             label: 'admin.sidebar.sensorAnalytics', route: '/admin/sensor-analytics' },
    {
      icon: 'group',
      label: 'admin.sidebar.users',
      route: '/admin/users',
      children: [
        { icon: 'person', label: 'admin.sidebar.farmers', route: '/admin/farmers' }
      ]
    },
    { icon: 'receipt_long',         label: 'admin.sidebar.logs',            route: '/admin/logs' },
    { icon: 'notifications_active', label: 'admin.sidebar.notifications',   route: '/admin/notifications' },
    { icon: 'settings',             label: 'admin.sidebar.settings',        route: '/admin/settings' }
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Get translated nav label */
  getNavLabel(key: string): string {
    return this.languageService.t()(key);
  }

  /** RTL check */
  isRTL(): boolean {
    return this.languageService.isRTL();
  }

  /** Route active check */
  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  /** Parent has active child */
  hasActiveChild(item: NavItem): boolean {
    return item.children?.some(c => this.isActive(c.route)) ?? false;
  }

  /** Sub-nav expanded */
  isExpanded(item: NavItem): boolean {
    return this.isActive(item.route) || this.hasActiveChild(item);
  }

  /** Navigate and close on mobile */
  navigate(route: string): void {
    this.router.navigate([route]);
    if (this.isMobile || this.isTablet) {
      this.closeSidebar.emit();
    }
  }

  onCloseSidebar(): void {
    this.closeSidebar.emit();
  }
}
