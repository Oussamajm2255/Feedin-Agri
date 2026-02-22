/**
 * CommentCaMarcheComponent
 *
 * SECTION: "Comment Feedin fonctionne"
 * Step-based flow — make the platform understandable in 10 seconds.
 *
 * PURPOSE: Clarity, not complexity. 4 steps, human language.
 * LAYOUT: Horizontal steps (desktop), vertical timeline (mobile)
 * TONE: Instructional, warm, no tech jargon.
 *
 * SEO: exploitation agricole, suivi des cultures, gestion parcellaire
 */

import {
  Component,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '../../animations/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

interface Step {
  number: number;
  iconId: string;
  titleKey: string;
  descriptionKey: string;
  imagePath: string;
}

@Component({
  selector: 'app-comment-ca-marche',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './comment-ca-marche.component.html',
  styleUrls: ['./comment-ca-marche.component.scss']
})
export class CommentCaMarcheComponent {
  steps: Step[] = [
    {
      number: 1,
      iconId: 'seedling',
      titleKey: 'landing.howItWorks.steps.s1.title',
      descriptionKey: 'landing.howItWorks.steps.s1.desc',
      imagePath: 'assets/landing/images/serre agricole connectée.png'
    },
    {
      number: 2,
      iconId: 'monitor',
      titleKey: 'landing.howItWorks.steps.s2.title',
      descriptionKey: 'landing.howItWorks.steps.s2.desc',
      imagePath: 'assets/landing/images/dashboard iot & capteurs.png'
    },
    {
      number: 3,
      iconId: 'target',
      titleKey: 'landing.howItWorks.steps.s3.title',
      descriptionKey: 'landing.howItWorks.steps.s3.desc',
      imagePath: 'assets/landing/images/systèmes dautomatisation de serr.png'
    },
    {
      number: 4,
      iconId: 'trending-up',
      titleKey: 'landing.howItWorks.steps.s4.title',
      descriptionKey: 'landing.howItWorks.steps.s4.desc',
      imagePath: 'assets/landing/images/dashboard de supervision.png'
    }
  ];
}
