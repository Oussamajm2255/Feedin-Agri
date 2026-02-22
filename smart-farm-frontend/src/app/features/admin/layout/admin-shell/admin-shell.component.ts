import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { AdminSidebar } from '../admin-sidebar/admin-sidebar';
import { AdminHeader } from '../admin-header/admin-header';
import { AdminWorkspace } from '../admin-workspace/admin-workspace';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Admin Shell Component
 * Root container for the Admin Dashboard layout
 * Orchestrates sidebar, header, and workspace
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AdminSidebar,
    AdminHeader,
    AdminWorkspace
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss'
})
export class AdminShellComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  public languageService = inject(LanguageService);

  // Layout state
  isSidebarCollapsed = true; // Default to collapsed (icon-only)
  isSidebarDrawerOpen = false;
  isSidebarHovered = false;
  isMobile = false;
  isTablet = false;
  isDesktop = true;

  constructor(private breakpointObserver: BreakpointObserver) {}

  /**
   * Check if current language is RTL
   */
  isRTL(): boolean {
    return this.languageService.isRTL();
  }

  ngOnInit(): void {
    this.observeBreakpoints();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Observe responsive breakpoints and adjust layout
   */
  private observeBreakpoints(): void {
    this.breakpointObserver
      .observe(['(max-width: 767px)', '(min-width: 768px) and (max-width: 1023px)', '(min-width: 1024px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.breakpoints['(max-width: 767px)'];
        this.isTablet = result.breakpoints['(min-width: 768px) and (max-width: 1023px)'];
        this.isDesktop = result.breakpoints['(min-width: 1024px)'];

        // Auto-close drawer on desktop
        if (this.isDesktop) {
          this.isSidebarDrawerOpen = false;
        }
      });
  }

  /**
   * Toggle sidebar drawer (mobile/tablet)
   */
  toggleSidebarDrawer(): void {
    this.isSidebarDrawerOpen = !this.isSidebarDrawerOpen;
  }

  /**
   * Close sidebar drawer
   */
  closeSidebarDrawer(): void {
    this.isSidebarDrawerOpen = false;
  }

  /**
   * Handle sidebar hover state
   */
  onSidebarHover(isHovered: boolean): void {
    this.isSidebarHovered = isHovered;
  }

  /**
   * Handle backdrop click (mobile/tablet)
   */
  onBackdropClick(): void {
    // Only close if backdrop is actually visible and blocking
    if (this.isSidebarDrawerOpen) {
      this.closeSidebarDrawer();
    }
  }

  /**
   * Check if backdrop should be visible
   */
  get shouldShowBackdrop(): boolean {
    // Only show backdrop on mobile/tablet when drawer is open
    return this.isSidebarDrawerOpen && !this.isDesktop;
  }
}

