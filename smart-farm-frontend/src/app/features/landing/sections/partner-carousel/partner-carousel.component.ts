/**
 * PartnerCarouselComponent
 *
 * Premium infinite-scroll logo carousel showcasing trusted partners.
 * Uses pure CSS animation (no external libraries) for smooth,
 * jank-free horizontal scrolling with hover-to-pause behavior.
 *
 * @section Landing Page — below Hero, above Bento Grid
 */
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

/** Partner logo entry */
interface Partner {
  /** Display name (used as alt text for accessibility) */
  readonly name: string;
  /** Relative path to the logo asset */
  readonly logo: string;
}

@Component({
  selector: 'app-partner-carousel',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './partner-carousel.component.html',
  styleUrls: ['./partner-carousel.component.scss'],
})
export class PartnerCarouselComponent {
  /** Partner data — single source of truth */
  readonly partners: readonly Partner[] = [
    { name: 'DrillSERV Tunisia', logo: 'assets/partner/drillserv.png' },
    { name: 'Lahtik', logo: 'assets/partner/flahtek.jpeg' },
    { name: 'WEglobal', logo: 'assets/partner/weglobal.png' },
    { name: 'APIA', logo: 'assets/partner/apia.png' },
    { name: 'Terasens', logo: 'assets/partner/TerraSens.png' },
    { name: 'Smart Capital', logo: 'assets/partner/smartcapital-logo.png' },
    { name: 'Smart Farm', logo: 'assets/partner/smart-farm.jpg' },
    { name: 'S2T', logo: 'assets/partner/smart-tunisian-tchnopark.png' },
    { name: 'TEC', logo: 'assets/partner/TEC.jpeg' },
    { name: 'TUNSA', logo: 'assets/partner/Tunsa.jpeg' },
  ];

  /**
   * Doubled array for seamless infinite loop rendering.
   * The CSS animation translates by -50% so when the first set
   * scrolls off-screen, the duplicate set provides continuity.
   */
  readonly doubledPartners: readonly Partner[] = [...this.partners, ...this.partners];
}
