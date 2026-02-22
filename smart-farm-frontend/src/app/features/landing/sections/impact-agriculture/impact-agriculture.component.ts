/**
 * ImpactAgricultureComponent
 *
 * SECTION: "Notre impact sur l'agriculture"
 * Credibility & vision — purpose beyond software.
 *
 * PURPOSE: Show meaning, not metrics. Statements, not aggressive numbers.
 * LAYOUT: Full-width calm background, centered content with impact statements.
 * TONE: Visionary, understated, grounded.
 *
 * SEO: impact agricole, durabilité, économie d'eau, rendement agricole
 */

import {
  Component,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '../../animations/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

interface ImpactStatement {
  id: number;
  metricKey: string;
  labelKey: string;
}

@Component({
  selector: 'app-impact-agriculture',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './impact-agriculture.component.html',
  styleUrls: ['./impact-agriculture.component.scss']
})
export class ImpactAgricultureComponent {
  statements: ImpactStatement[] = [
    {
      id: 0,
      metricKey: 'landing.impact.stats.s1.metric',
      labelKey: 'landing.impact.stats.s1.label'
    },
    {
      id: 1,
      metricKey: 'landing.impact.stats.s2.metric',
      labelKey: 'landing.impact.stats.s2.label'
    },
    {
      id: 2,
      metricKey: 'landing.impact.stats.s3.metric',
      labelKey: 'landing.impact.stats.s3.label'
    }
  ];
}
