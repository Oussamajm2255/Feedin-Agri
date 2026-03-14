import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
  signal,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

/**
 * ScrollToTopComponent
 *
 * A floating action button that appears when the user scrolls past a
 * configurable threshold and smoothly scrolls the page back to the top.
 *
 * Uses @HostListener for reliable Angular OnPush change-detection integration
 * instead of manual window.addEventListener (which can miss CD cycles).
 */
@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="scroll-to-top-btn"
      [class.visible]="isVisible()"
      (click)="scrollToTop()"
      aria-label="Retour en haut de la page"
      title="Retour en haut"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
      </svg>
    </button>
  `,
  styles: [`
    /* Host element must occupy no space but still allow fixed children to render */
    :host {
      display: block;
      position: relative;
      /* Occupy zero height so it doesn't affect parent layout */
      height: 0;
      overflow: visible;
    }

    .scroll-to-top-btn {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-green, #10b981), #059669);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3), inset 0 2px 4px rgba(255,255,255,0.2);
      z-index: 22000;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform: translateY(20px) scale(0.8);
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .scroll-to-top-btn.visible {
      transform: translateY(0) scale(1);
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .scroll-to-top-btn:hover {
      transform: translateY(-5px) scale(1.05);
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.5), inset 0 2px 4px rgba(255,255,255,0.3);
      background: linear-gradient(135deg, #059669, #047857);
    }

    .scroll-to-top-btn:active {
      transform: translateY(-2px) scale(0.95);
      transition: all 0.1s ease;
    }

    .scroll-to-top-btn svg {
      transition: transform 0.3s ease;
    }

    .scroll-to-top-btn:hover svg {
      transform: translateY(-3px);
    }

    @media (max-width: 768px) {
      .scroll-to-top-btn {
        bottom: 1.5rem;
        right: 1.5rem;
        width: 3rem;
        height: 3rem;
      }

      .scroll-to-top-btn svg {
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class ScrollToTopComponent implements OnInit {
  /** Whether the button is currently visible */
  isVisible = signal(false);

  private readonly document = inject(DOCUMENT);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Scroll distance (px) before the button appears */
  private static readonly SCROLL_THRESHOLD = 300;

  ngOnInit(): void {
    // Check the initial scroll position (handles mid-page reloads)
    this.evaluateScrollPosition();
  }

  /**
   * @HostListener on window:scroll runs inside Angular's zone by default,
   * which triggers change detection reliably even with OnPush strategy.
   */
  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.evaluateScrollPosition();
  }

  /** Smoothly scroll the viewport back to the top */
  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  /**
   * Evaluate the current scroll position and toggle visibility.
   * Uses multiple fallbacks for cross-browser compatibility.
   */
  private evaluateScrollPosition(): void {
    const yOffset =
      window.scrollY ??
      this.document.documentElement?.scrollTop ??
      this.document.body?.scrollTop ??
      0;

    const shouldBeVisible = yOffset > ScrollToTopComponent.SCROLL_THRESHOLD;

    if (this.isVisible() !== shouldBeVisible) {
      this.isVisible.set(shouldBeVisible);
      this.cdr.markForCheck();
    }
  }
}
