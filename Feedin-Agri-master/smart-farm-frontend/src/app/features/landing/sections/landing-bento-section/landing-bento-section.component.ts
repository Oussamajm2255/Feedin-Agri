import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ScrollRevealDirective } from '../../animations/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

interface BentoCard {
  title: string;
  description: string;
  route: string;
  size: 'large' | 'medium' | 'small';
  icon?: string | any;
  ctaText?: string;
  cssClass?: string;
  backgroundImage?: string;
}

@Component({
  selector: 'app-landing-bento-section',
  standalone: true,
  imports: [CommonModule, RouterModule, ScrollRevealDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing-bento-section.component.html',
  styleUrls: ['./landing-bento-section.component.scss']
})
export class LandingBentoSectionComponent implements OnInit {
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  cards: BentoCard[] = [
    {
      title: 'landing.bento.cards.0.title',
      description: 'landing.bento.cards.0.desc',
      route: '/solutions',
      size: 'large',
      ctaText: 'landing.bento.cards.0.cta',
      cssClass: 'bento-hero has-bg-image',
      backgroundImage: 'assets/landing/images/serre connectée intelligente.jpg',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cpu"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>'
    },
    {
      title: 'landing.bento.cards.1.title',
      description: 'landing.bento.cards.1.desc',
      route: '/solutions',
      size: 'small',
      ctaText: 'landing.bento.cards.1.cta',
      cssClass: 'bento-small bg-glass has-bg-image',
      backgroundImage: 'assets/images/bg1.jpg',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sprout"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>'
    },
    {
      title: 'landing.bento.cards.2.title',
      description: 'landing.bento.cards.2.desc',
      route: '/services',
      size: 'small',
      ctaText: 'landing.bento.cards.2.cta',
      cssClass: 'bento-small bg-glass',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wrench"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
    },
    {
      title: 'landing.bento.cards.3.title',
      description: 'landing.bento.cards.3.desc',
      route: '/formation',
      size: 'small',
      ctaText: 'landing.bento.cards.3.cta',
      cssClass: 'bento-small bg-glass',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-graduation-cap"><path d="M21.42 10.922a2 2 0 0 1-.019 3.022l-7.1 7.1a2 2 0 0 1-2.602.043l-7.1-7.1a2 2 0 0 1-.019-3.022l7.1-7.1a2 2 0 0 1 2.602-.043l7.1 7.1Z"/><path d="M22 10v6"/><path d="M12 18.5v4"/><path d="m14.5 16.5 4-4"/></svg>'
    },
    {
      title: 'landing.bento.cards.4.title',
      description: 'landing.bento.cards.4.desc',
      route: '/about',
      size: 'small',
      ctaText: 'landing.bento.cards.4.cta',
      cssClass: 'bento-small bg-glass',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
    },
    {
      title: 'landing.bento.cards.5.title',
      description: 'landing.bento.cards.5.desc',
      route: '/contact',
      size: 'small',
      ctaText: 'landing.bento.cards.5.cta',
      cssClass: 'bento-closer',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>'
    }
  ];

  ngOnInit(): void {
    // Sanitize the SVG strings so they render properly in [innerHTML]
    this.cards = this.cards.map(card => ({
      ...card,
      icon: card.icon ? this.sanitizer.bypassSecurityTrustHtml(card.icon as string) : undefined
    }));
  }

  onMouseMove(event: MouseEvent, element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Set custom css properties used by scss spotlight radial-gradient
    element.style.setProperty('--mouse-x', `${x}px`);
    element.style.setProperty('--mouse-y', `${y}px`);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
