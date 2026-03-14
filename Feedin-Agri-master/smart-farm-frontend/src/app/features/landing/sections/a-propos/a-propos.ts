/**
 * AProposComponent
 * 
 * "À propos de Feedin" — Credibility & Intention Section
 * 
 * PURPOSE:
 * Answers "Who is Feedin, and why should I trust it?"
 * This is NOT a feature section. It builds trust through
 * calm, institutional storytelling.
 * 
 * PLACEMENT: Immediately after Hero, before Problem.
 * 
 * SEO KEYWORDS (integrated naturally in template):
 * - agriculture intelligente
 * - gestion agricole
 * - irrigation
 * - cultures
 * - durabilité
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '../../animations/directives/scroll-reveal.directive';

import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-a-propos',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './a-propos.html',
  styleUrls: ['./a-propos.scss']
})
export class AProposComponent {
  private router = inject(Router);

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}
