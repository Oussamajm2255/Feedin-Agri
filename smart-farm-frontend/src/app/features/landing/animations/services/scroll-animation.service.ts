/**
 * ScrollAnimationService
 * 
 * Centralizes all GSAP ScrollTrigger logic for the landing page.
 * 
 * WHY this architecture:
 * - Single registration point prevents memory leaks
 * - Scroll velocity detection enables adaptive animation speed
 * - Reduced motion fallback respects accessibility
 */

import { Injectable, signal, OnDestroy, NgZone } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export interface ScrollRevealConfig {
  element: HTMLElement;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'stagger';
  duration?: number;
  delay?: number;
  staggerDelay?: number;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  markers?: boolean;
}

export interface TimelineConfig {
  trigger: HTMLElement;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  onUpdate?: (progress: number) => void;
}

@Injectable()
export class ScrollAnimationService implements OnDestroy {
  // Reactive state
  private _scrollProgress = signal(0);
  private _scrollVelocity = signal(0);
  private _isReducedMotion = signal(false);
  private _isMobile = signal(false);

  public scrollProgress = this._scrollProgress.asReadonly();
  public scrollVelocity = this._scrollVelocity.asReadonly();
  public isReducedMotion = this._isReducedMotion.asReadonly();
  public isMobile = this._isMobile.asReadonly();

  // Tracking
  private scrollTriggers: ScrollTrigger[] = [];
  private timelines: gsap.core.Timeline[] = [];
  private lastScrollY = 0;
  private velocityTimeout: ReturnType<typeof setTimeout> | null = null;

  // Custom easing
  public readonly EASING = {
    smooth: 'power2.out',
    bounce: 'back.out(1.2)',
    elastic: 'elastic.out(1, 0.5)',
    textReveal: 'power3.out',
    default: 'power2.inOut'
  } as const;

  constructor(private ngZone: NgZone) {
    // Check reduced motion preference
    this._isReducedMotion.set(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    // Initial mobile check
    this._isMobile.set(window.innerWidth < 768);

    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this._isReducedMotion.set(e.matches);
      if (e.matches) {
        this.disableAllAnimations();
      }
    });

    window.addEventListener('resize', () => {
      this._isMobile.set(window.innerWidth < 768);
    }, { passive: true });

    // Track scroll velocity
    this.ngZone.runOutsideAngular(() => {
      this.setupVelocityTracking();
    });
  }

  /**
   * Creates a scroll-triggered reveal animation
   */
  createReveal(config: ScrollRevealConfig): ScrollTrigger | null {
    if (this._isReducedMotion()) {
      // Show element immediately without animation
      gsap.set(config.element, { opacity: 1, y: 0, x: 0, scale: 1 });
      return null;
    }

    const {
      element,
      animation = 'fade-up',
      duration = this._isMobile() ? 0.4 : 0.8, // Faster animations on mobile
      delay = 0,
      staggerDelay = this._isMobile() ? 0.05 : 0.1, // Tighter stagger on mobile
      start = this._isMobile() ? 'top 95%' : 'top 85%', // Appear sooner on mobile
      end = 'bottom 20%',
      scrub = false,
      markers = false
    } = config;

    // Initial state based on animation type
    const fromVars = this.getFromVars(animation);
    const toVars = this.getToVars(animation, duration, delay);

    gsap.set(element, fromVars);

    let trigger: ScrollTrigger;

    if (animation === 'stagger' && element.children.length > 0) {
      // Stagger children
      trigger = ScrollTrigger.create({
        trigger: element,
        start,
        end,
        markers,
        onEnter: () => {
          gsap.to(element.children, {
            ...toVars,
            stagger: staggerDelay,
            ease: this.EASING.textReveal
          });
        },
        once: true
      });
    } else {
      trigger = ScrollTrigger.create({
        trigger: element,
        start,
        end,
        scrub,
        markers,
        onEnter: () => {
          gsap.to(element, { ...toVars, ease: this.EASING.smooth });
        },
        once: !scrub
      });
    }

    this.scrollTriggers.push(trigger);
    return trigger;
  }

  /**
   * Creates a GSAP timeline synced to scroll
   */
  createScrollTimeline(config: TimelineConfig): gsap.core.Timeline {
    const {
      trigger,
      start = 'top top',
      end = 'bottom bottom',
      scrub = 1,
      pin = false,
      onUpdate
    } = config;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger,
        start,
        end,
        scrub,
        pin,
        onUpdate: (self) => {
          if (onUpdate) {
            onUpdate(self.progress);
          }
        }
      }
    });

    this.timelines.push(timeline);
    return timeline;
  }

  /**
   * Creates a text reveal animation tuned to reading speed
   */
  createTextReveal(
    element: HTMLElement,
    options: { wordsPerLine?: number; readingSpeed?: number } = {}
  ): void {
    if (this._isReducedMotion()) {
      gsap.set(element, { opacity: 1 });
      return;
    }

    const { wordsPerLine = 8, readingSpeed = 200 } = options; // 200ms per word avg
    const text = element.textContent || '';
    const wordCount = text.split(/\s+/).length;

    // Calculate duration based on content length
    // WHY: Matches natural reading pace so animation finishes as user reads
    const baseDuration = Math.min(1.5, Math.max(0.6, wordCount / wordsPerLine * 0.3));

    gsap.set(element, { opacity: 0, y: 30 });

    ScrollTrigger.create({
      trigger: element,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(element, {
          opacity: 1,
          y: 0,
          duration: baseDuration,
          ease: this.EASING.textReveal
        });
      },
      once: true
    });
  }

  /**
   * Gets current scroll velocity (0-1 normalized)
   * Useful for adapting animation speed to scroll behavior
   */
  getScrollVelocity(): number {
    return this._scrollVelocity();
  }

  /**
   * Refreshes all ScrollTrigger instances
   * Call after dynamic content loads
   */
  refresh(): void {
    ScrollTrigger.refresh();
  }

  /**
   * Kills all animations and triggers
   */
  killAll(): void {
    this.scrollTriggers.forEach(trigger => trigger.kill());
    this.timelines.forEach(timeline => timeline.kill());
    this.scrollTriggers = [];
    this.timelines = [];
  }

  ngOnDestroy(): void {
    this.killAll();
    if (this.velocityTimeout) {
      clearTimeout(this.velocityTimeout);
    }
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private getFromVars(animation: string): gsap.TweenVars {
    switch (animation) {
      case 'fade-up':
        return { opacity: 0, y: 40 };
      case 'fade-left':
        return { opacity: 0, x: -40 };
      case 'fade-right':
        return { opacity: 0, x: 40 };
      case 'scale':
        return { opacity: 0, scale: 0.9 };
      case 'stagger':
        return { opacity: 0, y: 20 };
      default:
        return { opacity: 0 };
    }
  }

  private getToVars(animation: string, duration: number, delay: number): gsap.TweenVars {
    const base = { opacity: 1, duration, delay };

    switch (animation) {
      case 'fade-up':
        return { ...base, y: 0 };
      case 'fade-left':
      case 'fade-right':
        return { ...base, x: 0 };
      case 'scale':
        return { ...base, scale: 1 };
      case 'stagger':
        return { ...base, y: 0 };
      default:
        return base;
    }
  }

  private setupVelocityTracking(): void {
    let lastTime = Date.now();

    const trackVelocity = () => {
      const now = Date.now();
      const timeDelta = now - lastTime;
      const scrollDelta = Math.abs(window.scrollY - this.lastScrollY);

      if (timeDelta > 0) {
        // Normalize velocity to 0-1 range
        const velocity = Math.min(1, scrollDelta / (timeDelta * 0.5));
        this._scrollVelocity.set(velocity);
      }

      this.lastScrollY = window.scrollY;
      lastTime = now;

      // Decay velocity when scroll stops
      if (this.velocityTimeout) {
        clearTimeout(this.velocityTimeout);
      }
      this.velocityTimeout = setTimeout(() => {
        this._scrollVelocity.set(0);
      }, 150);
    };

    window.addEventListener('scroll', trackVelocity, { passive: true });
  }

  private disableAllAnimations(): void {
    // Show all hidden elements
    gsap.globalTimeline.clear();
    document.querySelectorAll('[data-scroll-reveal]').forEach((el) => {
      gsap.set(el, { opacity: 1, y: 0, x: 0, scale: 1 });
    });
  }
}
