/**
 * LandingComponent
 * 
 * Main container for the public landing page.
 * Orchestrates all sections and manages global page state.
 * 
 * PAGE ORDER (PRODUCTION):
 * 1. Hero
 * 2. À propos de Feedin
 * 3. Ce que Feedin apporte à l'agriculture (Value)
 * 4. Comment Feedin fonctionne (Steps)
 * 5. Conçu pour les vrais agriculteurs (Trust Cards)
 * 6. Impact sur l'agriculture (Credibility)
 * 7. Confiance, sécurité et fiabilité (Reassurance)
 * 8. Appel à l'action final (CTA)
 * 9. Footer
 */

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  inject,
  AfterViewInit,
  ElementRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { toSignal } from '@angular/core/rxjs-interop';

// Sections — ordered by page flow
import { HeroSectionComponent } from './sections/hero/hero-section.component';
import { AProposComponent } from './sections/a-propos/a-propos';
import { ValeurAgricoleComponent } from './sections/valeur-agricole/valeur-agricole.component';
import { CommentCaMarcheComponent } from './sections/comment-ca-marche/comment-ca-marche.component';
import { PourAgriculteursComponent } from './sections/pour-agriculteurs/pour-agriculteurs.component';
import { ImpactAgricultureComponent } from './sections/impact-agriculture/impact-agriculture.component';
import { ConfianceComponent } from './sections/confiance/confiance.component';
import { CtaFinalComponent } from './sections/cta-final/cta-final.component';

// Services
import { ScrollAnimationService } from './animations/services/scroll-animation.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    AProposComponent,
    ValeurAgricoleComponent,
    CommentCaMarcheComponent,
    PourAgriculteursComponent,
    ImpactAgricultureComponent,
    ConfianceComponent,
    CtaFinalComponent,
    FooterComponent,
    TranslatePipe,
    LanguageSwitcherComponent
  ],
  providers: [ScrollAnimationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private scrollService = inject(ScrollAnimationService);
  private themeService = inject(ThemeService);
  private elementRef = inject(ElementRef);
  private ngZone = inject(NgZone);

  isScrolled = signal(false);
  activeSection = signal<string>('hero-section');
  floatingMenuOpen = signal(false);

  theme = toSignal(this.themeService.theme$);

  // Bound scroll handler reference (for cleanup)
  private scrollHandler = this.handleScroll.bind(this);

  // Section IDs for scroll spy
  private sections = [
    'hero-section',
    'about-section',
    'valeur-section',
    'etapes-section',
    'agriculteurs-section',
    'impact-agriculture-section',
    'confiance-section'
  ];

  private handleScroll(): void {
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const wasScrolled = this.isScrolled();
    const nowScrolled = scrollY > 100;

    if (wasScrolled !== nowScrolled) {
      this.ngZone.run(() => this.isScrolled.set(nowScrolled));
    }
  }

  ngOnInit(): void {
    // Scroll to top on page load
    window.scrollTo(0, 0);

    // Attach scroll listener outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
    });
  }

  ngAfterViewInit(): void {
    this.handleScroll();
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Trigger when section is in the upper part of the screen
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.activeSection.set(entry.target.id);
        }
      });
    }, options);

    this.sections.forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
  }

  ngOnDestroy(): void {
    this.scrollService.killAll();
    window.removeEventListener('scroll', this.scrollHandler);
  }

  /**
   * ScrollSpy Logic: Detects which section is currently in view
   */
  private detectActiveSection(scrollY: number): void {
    // Logic replaced by IntersectionObserver for better performance
  }

  scrollTo(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      this.activeSection.set(sectionId);
    }
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    this.activeSection.set('hero-section');
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleFloatingMenu(): void {
    this.floatingMenuOpen.update(v => !v);
  }

  closeFloatingMenu(): void {
    this.floatingMenuOpen.set(false);
  }
}
