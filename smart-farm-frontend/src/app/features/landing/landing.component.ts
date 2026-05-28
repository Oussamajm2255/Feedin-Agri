/**
 * LandingComponent
 *
 * Main container for the public landing page.
 * Orchestrates all sections and manages global page state.
 * Uses the shared PublicNavComponent for consistent navigation UI/UX.
 *
 * PAGE ORDER (PRODUCTION):
 * 1. Hero
 * 2. Bento Grid
 * 3. À propos (Teaser)
 * 4. Services / Valeur (Teaser)
 * 5. Appel à l'action final (CTA)
 * 6. Footer
 *
 * Sub-pages now handle the detailed information:
 * /about, /services, /solutions, /formation, /contact
 */

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  inject,
  AfterViewInit,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { SeoService } from '../../core/services/seo.service';

// Sections — ordered by page flow
import { HeroSectionComponent } from './sections/hero/hero-section.component';
import { AProposComponent } from './sections/a-propos/a-propos';
import { ValeurAgricoleComponent } from './sections/valeur-agricole/valeur-agricole.component';
import { CtaFinalComponent } from './sections/cta-final/cta-final.component';
import { LandingBentoSectionComponent } from './sections/landing-bento-section/landing-bento-section.component';
import { PartnerCarouselComponent } from './sections/partner-carousel/partner-carousel.component';
import { LandingNewsComponent } from './sections/landing-news/landing-news.component';

// Shared components
import { PublicNavComponent } from './pages/shared/public-nav.component';
import { ScrollAnimationService } from './animations/services/scroll-animation.service';
import { LandingFooterComponent } from './sections/landing-footer/landing-footer.component';
import { SkeletonSectionComponent } from '../../shared/skeleton-section/skeleton-section.component';
import { ScrollToTopComponent } from '../../shared/components/scroll-to-top/scroll-to-top.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    PublicNavComponent,
    HeroSectionComponent,
    LandingBentoSectionComponent,
    AProposComponent,
    ValeurAgricoleComponent,
    LandingNewsComponent,
    CtaFinalComponent,
    PartnerCarouselComponent,
    LandingFooterComponent,
    SkeletonSectionComponent,
    ScrollToTopComponent,
  ],
  providers: [ScrollAnimationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private scrollService = inject(ScrollAnimationService);
  private themeService = inject(ThemeService);
  private seoService = inject(SeoService);
  private ngZone = inject(NgZone);

  /** Store the user's theme before forcing light on the landing page */
  private previousTheme: Theme | null = null;

  // --- Configuration Constants ---
  /** Offset (px) deducted when programmatically scrolling to a section */
  private static readonly SCROLL_TOP_OFFSET = 80;

  ngOnInit(): void {
    // Scroll to top on page load
    window.scrollTo(0, 0);

    // SEO — set page-specific meta tags, canonical URL, and structured data
    this.seoService.setMeta({
      title: 'Feedin Green — Plateforme Agricole Intelligente | Agriculture Connectée Tunisie',
      description:
        "Feedin Green : votre plateforme IoT pour l'agriculture intelligente en Tunisie. " +
        'Capteurs connectés, gestion des cultures, monitoring en temps réel et automatisation des serres.',
      keywords:
        'feedin, feedin green, feed in, smart farm, agriculture, agriculture tunisie, ' +
        'agriculture intelligente, IoT agricole, capteurs agricoles, serre connectée, ' +
        'gestion exploitation agricole, agriculture de précision, ferme intelligente',
      url: 'https://feedingreen.com/landing',
    });
    this.seoService.setOrganizationSchema();
    this.seoService.setWebApplicationSchema();

    // Force light theme on landing page temporarily (do not save to local storage)
    if (this.themeService.currentTheme !== 'light') {
      this.previousTheme = this.themeService.currentTheme;
      this.themeService.setTheme('light', false, false);
    }

    // Enable scroll optimizations on mobile
    if (typeof window !== 'undefined') {
      this.enableScrollOptimizations();
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.scrollService.killAll();

    // Restore the user's previous theme when leaving the landing page
    if (this.previousTheme) {
      this.themeService.setTheme(this.previousTheme, false, false);
    }

    // Cleanup scroll optimizations
    this.disableScrollOptimizations();
  }

  /**
   * Enable mobile scroll optimizations to prevent heavy reloads
   */
  private enableScrollOptimizations(): void {
    // Use passive scroll listeners for better performance
    const handleScroll = () => {
      // Minimal work in scroll handler - just tracking
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Store reference for cleanup
    (this as any)._scrollHandler = handleScroll;
  }

  /**
   * Cleanup scroll optimizations
   */
  private disableScrollOptimizations(): void {
    if ((this as any)._scrollHandler) {
      window.removeEventListener('scroll', (this as any)._scrollHandler);
    }
  }

  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - LandingComponent.SCROLL_TOP_OFFSET;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }
}
