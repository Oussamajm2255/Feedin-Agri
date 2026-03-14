/**
 * SkeletonSectionComponent
 *
 * Pure-CSS shimmer placeholder for deferred sections.
 * Displayed as a @placeholder inside @defer blocks while the real
 * component tree is being fetched / compiled.
 *
 * @Input cards — number of skeleton cards to render (default 3)
 * @Input cols  — number of grid columns (default 3, responsive)
 */

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-section',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton-section.component.html',
  styleUrls: ['./skeleton-section.component.scss']
})
export class SkeletonSectionComponent {
  /** Number of skeleton cards to display */
  @Input() cards = 3;

  /** Number of grid columns (bound to CSS --cols) */
  @Input() cols = 3;

  /** Helper to iterate cards in the template */
  get cardArray(): number[] {
    return Array.from({ length: this.cards }, (_, i) => i);
  }
}
