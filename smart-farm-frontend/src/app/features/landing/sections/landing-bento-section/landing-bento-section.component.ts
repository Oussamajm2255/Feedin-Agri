import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ScrollRevealDirective } from '../../animations/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { LanguageService } from '../../../../core/services/language.service';

/**
 * Represents a single segment card in the bento grid.
 */
interface BentoCard {
  /** Translation key for the bold segment header */
  header: string;
  /** Translation key for the curated 2-sentence description */
  description: string;
  /** Translation keys for the 3 bullet-point service summaries */
  bullets: string[];
  /** Target route for the CTA button (anchor-based) */
  route: string;
  /** Translation key for the CTA button text */
  ctaText: string;
  /** Optional bespoke SVG icon */
  icon?: string | any;
  /** Optional background image path */
  backgroundImage?: string;
  /** CSS class for the card (segment-specific theming) */
  cssClass?: string;
  /** Unique ID for accessibility */
  id: string;
}

@Component({
  selector: 'app-landing-bento-section',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollRevealDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing-bento-section.component.html',
  styleUrls: ['./landing-bento-section.component.scss'],
})
export class LandingBentoSectionComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private languageService = inject(LanguageService);
  private ngZone = inject(NgZone);

  /** RAF handle for throttled spotlight updates */
  private rafId: number | null = null;

  /** Skeleton loading state (own readiness) */
  public isLoading = signal<boolean>(true);

  /** LanguageService loading flag */
  public isLanguageLoading = this.languageService.isLoading;

  /** Combined loading gate — show skeleton until translations are fully ready */
  public showSkeleton = computed(() => {
    const isTransLoading = this.isLanguageLoading();
    const hasTranslations = Object.keys(this.languageService.translations()).length > 0;
    return this.isLoading() || isTransLoading || !hasTranslations;
  });

  constructor() {
    effect(
      () => {
        const translations = this.languageService.translations();
        if (translations && Object.keys(translations).length > 0) {
          setTimeout(() => this.isLoading.set(false), 300);
        }
      },
      { allowSignalWrites: true },
    );
  }

  /**
   * The three primary service segments.
   * Each maps to a top-level service axis on the Nos Services / Solutions pages.
   */
  cards: BentoCard[] = [
    {
      id: 'bento-smart-farming',
      header: 'landing.bento.cards.0.header',
      description: 'landing.bento.cards.0.desc',
      bullets: [
        'landing.bento.cards.0.bullets.0',
        'landing.bento.cards.0.bullets.1',
        'landing.bento.cards.0.bullets.2',
      ],
      route: '/services#smart-farming',
      ctaText: 'landing.bento.cards.0.cta',
      cssClass: 'segment-green has-image',
      backgroundImage: 'assets/landing/images/serre-connectee-intelligente.jpg',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>',
    },
    {
      id: 'bento-automation',
      header: 'landing.bento.cards.1.header',
      description: 'landing.bento.cards.1.desc',
      bullets: [
        'landing.bento.cards.1.bullets.0',
        'landing.bento.cards.1.bullets.1',
        'landing.bento.cards.1.bullets.2',
      ],
      route: '/services#automation',
      ctaText: 'landing.bento.cards.1.cta',
      cssClass: 'segment-dark has-image',
      backgroundImage: 'assets/landing/images/systemes-automatisation-serres.jpg',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>',
    },
    {
      id: 'bento-development',
      header: 'landing.bento.cards.2.header',
      description: 'landing.bento.cards.2.desc',
      bullets: [
        'landing.bento.cards.2.bullets.0',
        'landing.bento.cards.2.bullets.1',
        'landing.bento.cards.2.bullets.2',
      ],
      route: '/services#development',
      ctaText: 'landing.bento.cards.2.cta',
      cssClass: 'segment-teal has-image',
      backgroundImage: 'assets/landing/images/etude-projet-formation.png',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    },
  ];

  ngOnInit(): void {
    this.cards = this.cards.map((card) => ({
      ...card,
      icon: card.icon ? this.sanitizer.bypassSecurityTrustHtml(card.icon as string) : undefined,
    }));
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
  }

  /**
   * Tracks mouse position on a card for the radial spotlight effect.
   * Uses requestAnimationFrame for jank-free rendering outside Angular zone.
   */
  onMouseMove(event: MouseEvent, element: HTMLElement): void {
    const clientX = event.clientX;
    const clientY = event.clientY;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        element.style.setProperty('--mouse-x', `${clientX - rect.left}px`);
        element.style.setProperty('--mouse-y', `${clientY - rect.top}px`);
        this.rafId = null;
      });
    });
  }

  /**
   * Navigates to the card's target route (supports hash anchors).
   */
  navigateTo(route: string): void {
    const [path, fragment] = route.split('#');
    this.router.navigate([path], fragment ? { fragment } : {});
  }

  /**
   * Handles keyboard navigation — Enter or Space triggers the card click.
   */
  onCardKeydown(event: KeyboardEvent, route: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.navigateTo(route);
    }
  }
}
