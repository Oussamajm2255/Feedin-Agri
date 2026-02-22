/**
 * PourAgriculteursComponent
 *
 * SECTION: "Conçu pour les vrais agriculteurs"
 * Human-centered trust section.
 *
 * PURPOSE: Reassure non-technical users that Feedin is built for them.
 * LAYOUT: Centered heading + 3 equal-width cards with visual slots.
 * TONE: Empathetic, grounded, respectful.
 *
 * SEO: agriculteurs, exploitations agricoles, coopératives, agriculture durable
 */

import {
  Component,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollRevealDirective } from '../../animations/directives/scroll-reveal.directive';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

interface FarmerCard {
  id: number;
  titleKey: string;
  descriptionKey: string;
  imageAlt: string;
  imagePath: string;
}

@Component({
  selector: 'app-pour-agriculteurs',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pour-agriculteurs.component.html',
  styleUrls: ['./pour-agriculteurs.component.scss']
})
export class PourAgriculteursComponent {
  cards: FarmerCard[] = [
    {
      id: 0,
      titleKey: 'landing.farmers.cards.c1.title',
      descriptionKey: 'landing.farmers.cards.c1.desc',
      imageAlt: 'Petit agriculteur dans son champ — exploitation familiale et agriculture durable',
      imagePath: 'assets/landing/images/amenagment2.png'
    },
    {
      id: 1,
      titleKey: 'landing.farmers.cards.c2.title',
      descriptionKey: 'landing.farmers.cards.c2.desc',
      imageAlt: 'Grande exploitation agricole vue du ciel — gestion de cultures à grande échelle',
      imagePath: 'assets/landing/images/serres agricoles connectées.jpg'
    },
    {
      id: 2,
      titleKey: 'landing.farmers.cards.c3.title',
      descriptionKey: 'landing.farmers.cards.c3.desc',
      imageAlt: 'Groupe d\'agriculteurs coopératifs — collaboration et agriculture solidaire',
      imagePath: 'assets/landing/images/équipe travaillant dans une serre.png'
    }
  ];
}
