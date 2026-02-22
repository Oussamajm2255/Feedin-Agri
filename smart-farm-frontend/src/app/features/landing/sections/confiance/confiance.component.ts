/**
 * ConfianceComponent
 *
 * SECTION: "Confiance, sécurité et fiabilité"
 * Trust & Reassurance for institutions and cooperatives.
 *
 * PURPOSE: Build confidence. Icons + meaningful text grid.
 * LAYOUT: Text left, icon grid right.
 * TONE: Institutional, calm, factual.
 *
 * SEO: sécurité des données, fiabilité, confiance agriculteurs
 */

import {
  Component,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '../../animations/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

interface TrustItem {
  id: number;
  iconId: string;
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'app-confiance',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confiance.component.html',
  styleUrls: ['./confiance.component.scss']
})
export class ConfianceComponent {
  trustItems: TrustItem[] = [
    {
      id: 0,
      iconId: 'lock',
      titleKey: 'landing.trust.items.i1.title',
      descriptionKey: 'landing.trust.items.i1.desc'
    },
    {
      id: 1,
      iconId: 'clock',
      titleKey: 'landing.trust.items.i2.title',
      descriptionKey: 'landing.trust.items.i2.desc'
    },
    {
      id: 2,
      iconId: 'users',
      titleKey: 'landing.trust.items.i3.title',
      descriptionKey: 'landing.trust.items.i3.desc'
    },
    {
      id: 3,
      iconId: 'globe',
      titleKey: 'landing.trust.items.i4.title',
      descriptionKey: 'landing.trust.items.i4.desc'
    },
    {
      id: 4,
      iconId: 'smartphone',
      titleKey: 'landing.trust.items.i5.title',
      descriptionKey: 'landing.trust.items.i5.desc'
    },
    {
      id: 5,
      iconId: 'refresh',
      titleKey: 'landing.trust.items.i6.title',
      descriptionKey: 'landing.trust.items.i6.desc'
    }
  ];
}
