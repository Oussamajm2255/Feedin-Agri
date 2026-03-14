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
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../core/services/theme.service';

// Sections — ordered by page flow
import { HeroSectionComponent } from './sections/hero/hero-section.component';
import { AProposComponent } from './sections/a-propos/a-propos';
import { ValeurAgricoleComponent } from './sections/valeur-agricole/valeur-agricole.component';
import { CtaFinalComponent } from './sections/cta-final/cta-final.component';
import { LandingBentoSectionComponent } from './sections/landing-bento-section/landing-bento-section.component';

// Shared components
import { PublicNavComponent } from './pages/shared/public-nav.component';
import { ScrollAnimationService } from './animations/services/scroll-animation.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';
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
    CtaFinalComponent,
    FooterComponent,
    SkeletonSectionComponent,
    ScrollToTopComponent
  ],
  providers: [ScrollAnimationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private scrollService = inject(ScrollAnimationService);
  private themeService = inject(ThemeService);
  private ngZone = inject(NgZone);

  /** Store the user's theme before forcing light on the landing page */
  private previousTheme: Theme | null = null;

  // --- Configuration Constants ---
  /** Offset (px) deducted when programmatically scrolling to a section */
  private static readonly SCROLL_TOP_OFFSET = 80;

  ngOnInit(): void {
    // Scroll to top on page load
    window.scrollTo(0, 0);

    // Force light theme on landing page temporarily (do not save to local storage)
    if (this.themeService.currentTheme !== 'light') {
      this.previousTheme = this.themeService.currentTheme;
      this.themeService.setTheme('light', false, false);
    }
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.scrollService.killAll();

    // Restore the user's previous theme when leaving the landing page
    if (this.previousTheme) {
      this.themeService.setTheme(this.previousTheme, false, false);
    }
  }

  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - LandingComponent.SCROLL_TOP_OFFSET;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
