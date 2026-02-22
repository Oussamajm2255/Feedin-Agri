import { Injectable, signal, computed, effect, DestroyRef, inject } from '@angular/core';
import { fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * BreakpointService - Centralized responsive breakpoint management
 *
 * Features:
 * - Signal-based breakpoint detection (Angular 20 best practice)
 * - Single resize listener with throttling for performance
 * - Reusable across entire app
 * - Automatic cleanup on service destruction
 *
 * Breakpoints:
 * - xs: < 480px (extra small mobile)
 * - sm: 480px - 767px (small mobile)
 * - md: 768px - 1024px (tablet)
 * - lg: 1025px - 1400px (desktop)
 * - xl: > 1400px (large desktop)
 */
@Injectable({
  providedIn: 'root'
})
export class BreakpointService {
  private destroyRef = inject(DestroyRef);

  // Breakpoint definitions (in pixels)
  private readonly BREAKPOINTS = {
    xs: 480,
    sm: 768,
    md: 1024,
    lg: 1400
  } as const;

  // Current window width signal
  private _windowWidth = signal<number>(typeof window !== 'undefined' ? window.innerWidth : 1920);

  // Public readonly signals for breakpoint states
  readonly windowWidth = this._windowWidth.asReadonly();

  // Individual breakpoint signals
  readonly isXs = computed(() => this._windowWidth() < this.BREAKPOINTS.xs);
  readonly isSm = computed(() => this._windowWidth() >= this.BREAKPOINTS.xs && this._windowWidth() < this.BREAKPOINTS.sm);
  readonly isMd = computed(() => this._windowWidth() >= this.BREAKPOINTS.sm && this._windowWidth() < this.BREAKPOINTS.md);
  readonly isLg = computed(() => this._windowWidth() >= this.BREAKPOINTS.md && this._windowWidth() < this.BREAKPOINTS.lg);
  readonly isXl = computed(() => this._windowWidth() >= this.BREAKPOINTS.lg);

  // Combined breakpoint signals (for convenience)
  readonly isMobile = computed(() => this._windowWidth() < this.BREAKPOINTS.sm); // < 768px
  readonly isTablet = computed(() => this._windowWidth() >= this.BREAKPOINTS.sm && this._windowWidth() < this.BREAKPOINTS.md); // 768px - 1024px
  readonly isDesktop = computed(() => this._windowWidth() >= this.BREAKPOINTS.md); // >= 1024px
  readonly isSmallDesktop = computed(() => this._windowWidth() >= this.BREAKPOINTS.md && this._windowWidth() < this.BREAKPOINTS.lg); // 1024px - 1400px
  readonly isLargeDesktop = computed(() => this._windowWidth() >= this.BREAKPOINTS.lg); // >= 1400px

  // Screen size category (for conditional rendering)
  readonly screenSize = computed<'xs' | 'sm' | 'md' | 'lg' | 'xl'>(() => {
    const width = this._windowWidth();
    if (width < this.BREAKPOINTS.xs) return 'xs';
    if (width < this.BREAKPOINTS.sm) return 'sm';
    if (width < this.BREAKPOINTS.md) return 'md';
    if (width < this.BREAKPOINTS.lg) return 'lg';
    return 'xl';
  });

  // Orientation signals
  readonly isPortrait = computed(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });
  readonly isLandscape = computed(() => !this.isPortrait());

  constructor() {
    // Initialize on service creation
    this.initialize();

    // Set up resize listener with throttling (150ms for smooth performance)
    if (typeof window !== 'undefined') {
      fromEvent(window, 'resize', { passive: true })
        .pipe(
          throttleTime(150, undefined, { leading: true, trailing: true }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.updateWindowWidth();
        });

      // Also listen to orientation changes
      fromEvent(window, 'orientationchange', { passive: true })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          // Small delay to ensure dimensions are updated
          setTimeout(() => this.updateWindowWidth(), 100);
        });
    }
  }

  /**
   * Initialize the service with current window dimensions
   */
  private initialize(): void {
    if (typeof window !== 'undefined') {
      this._windowWidth.set(window.innerWidth);
    }
  }

  /**
   * Update window width signal
   */
  private updateWindowWidth(): void {
    if (typeof window !== 'undefined') {
      this._windowWidth.set(window.innerWidth);
    }
  }

  /**
   * Check if current width matches a specific breakpoint
   * @param breakpoint - Breakpoint name ('xs' | 'sm' | 'md' | 'lg' | 'xl')
   * @returns boolean signal
   */
  matches(breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): boolean {
    const width = this._windowWidth();
    switch (breakpoint) {
      case 'xs':
        return width < this.BREAKPOINTS.xs;
      case 'sm':
        return width >= this.BREAKPOINTS.xs && width < this.BREAKPOINTS.sm;
      case 'md':
        return width >= this.BREAKPOINTS.sm && width < this.BREAKPOINTS.md;
      case 'lg':
        return width >= this.BREAKPOINTS.md && width < this.BREAKPOINTS.lg;
      case 'xl':
        return width >= this.BREAKPOINTS.lg;
      default:
        return false;
    }
  }

  /**
   * Check if current width is less than a specific breakpoint
   * @param breakpoint - Breakpoint name
   * @returns boolean
   */
  isLessThan(breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): boolean {
    const width = this._windowWidth();
    const breakpointValue = this.getBreakpointValue(breakpoint);
    return width < breakpointValue;
  }

  /**
   * Check if current width is greater than or equal to a specific breakpoint
   * @param breakpoint - Breakpoint name
   * @returns boolean
   */
  isGreaterThanOrEqual(breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): boolean {
    const width = this._windowWidth();
    const breakpointValue = this.getBreakpointValue(breakpoint);
    return width >= breakpointValue;
  }

  /**
   * Get breakpoint value in pixels
   * @param breakpoint - Breakpoint name
   * @returns Breakpoint value in pixels
   */
  private getBreakpointValue(breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): number {
    switch (breakpoint) {
      case 'xs':
        return this.BREAKPOINTS.xs;
      case 'sm':
        return this.BREAKPOINTS.sm;
      case 'md':
        return this.BREAKPOINTS.md;
      case 'lg':
        return this.BREAKPOINTS.lg;
      case 'xl':
        return Infinity; // xl has no upper bound
      default:
        return 0;
    }
  }

  /**
   * Get current breakpoint name
   * @returns Current breakpoint name
   */
  getCurrentBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
    return this.screenSize();
  }
}

