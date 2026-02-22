/**
 * ValeurAgricoleComponent
 *
 * SECTION: "Ce que Feedin apporte à l'agriculture"
 * VALUE PROPOSITION — reinterpreted as agriculture-first storytelling.
 *
 * PURPOSE: Explain how Feedin helps agriculture, NOT what tech it uses.
 * TONE: Calm, human, clear — no jargon, no AI buzzwords.
 *
 * SEO: gestion agricole, irrigation, cultures, agriculture durable
 */

import {
  Component,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '../../animations/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-valeur-agricole',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './valeur-agricole.component.html',
  styleUrls: ['./valeur-agricole.component.scss']
})
export class ValeurAgricoleComponent {
  benefits = [
    {
      textKey: 'landing.value.benefits.b1'
    },
    {
      textKey: 'landing.value.benefits.b2'
    },
    {
      textKey: 'landing.value.benefits.b3'
    },
    {
      textKey: 'landing.value.benefits.b4'
    }
  ];
}
