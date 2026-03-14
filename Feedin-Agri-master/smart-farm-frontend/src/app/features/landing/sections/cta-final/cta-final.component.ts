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
 * CTA: "Contacter un expert" (Contact an Expert)
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

  /** Route used by the primary CTA */
  private static readonly CONTACT_ROUTE = '/contact';
  /** Route used by the secondary link */
  private static readonly SOLUTIONS_ROUTE = '/solutions';

  onGetStarted(): void {
    this.router.navigate([CtaFinalComponent.CONTACT_ROUTE]);
  }

  navigateToSolutions(): void {
    this.router.navigate([CtaFinalComponent.SOLUTIONS_ROUTE]);
  }
}
