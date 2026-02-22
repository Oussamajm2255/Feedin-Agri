/**
 * CtaFinalComponent
 *
 * SECTION: Final Call to Action
 * Invitation, not pressure — one sentence, one button, one link.
 *
 * PURPOSE: Close the narrative with a calm, confident conversion moment.
 * LAYOUT: Clean centered block, subtle gradient background.
 * TONE: Warm invitation, no aggressive sales language.
 *
 * CTA: "Demander l'accès" (Request Access)
 * Secondary: "Voir comment ça fonctionne" (scrolls to explanation section)
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ScrollRevealDirective } from '../../animations/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-cta-final',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta-final.component.html',
  styleUrls: ['./cta-final.component.scss']
})
export class CtaFinalComponent {
  private router = inject(Router);

  onGetStarted(): void {
    this.router.navigate(['/register']);
  }

  scrollToHow(): void {
    const section = document.getElementById('etapes-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
