/**
 * ValeurAgricoleComponent (now acting as "Process" Section)
 *
 * SECTION: "Comment ça marche"
 * PURPOSE: Explain the process with a clean, Apple-like SaaS design.
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
export class ValeurAgricoleComponent {}
