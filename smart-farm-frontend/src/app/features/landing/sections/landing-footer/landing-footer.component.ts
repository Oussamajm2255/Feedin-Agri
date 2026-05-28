/**
 * LandingFooterComponent
 *
 * Enterprise-grade footer dedicated to the public landing page.
 * Features a 4-column layout: Brand, Useful Links, News, and Location/Map.
 * Maintains the green agricultural aesthetic (gradient, leaf decorations,
 * rounded corners) consistent with the shared footer design language.
 */

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing-footer.component.html',
  styleUrls: ['./landing-footer.component.scss'],
})
export class LandingFooterComponent {
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  /** Dynamic copyright year */
  readonly currentYear = new Date().getFullYear();

  /** Sanitized Google Maps embed URL for the technical headquarters at Technopôle Manouba, Manouba, Tunisia */
  readonly mapEmbedUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3234.5!2d10.094704!3d36.811329!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sTechnopole+Manouba%2C+2010+Manouba+-+Tunisie!5e0!3m2!1sfr!2stn!4v1700000000000!5m2!1sfr!2stn',
  );

  /** Navigation links shown in "Liens Utiles" column */
  readonly navLinks: ReadonlyArray<{ labelKey: string; route: string }> = [
    { labelKey: 'landing.footer.links.home', route: '/landing' },
    { labelKey: 'landing.footer.links.about', route: '/about' },
    { labelKey: 'landing.footer.links.services', route: '/services' },
    { labelKey: 'landing.footer.links.solutions', route: '/solutions' },
    { labelKey: 'landing.footer.links.formation', route: '/formation' },
    { labelKey: 'landing.footer.links.contact', route: '/contact' },
  ];

  /** Social media links */
  readonly socialLinks: ReadonlyArray<{ icon: string; url: string; label: string }> = [
    { icon: 'facebook', url: 'https://www.facebook.com/profile.php?id=100089482084748', label: 'Facebook' },
    { icon: 'linkedin', url: 'https://www.linkedin.com/company/feedin-green', label: 'LinkedIn' },
  ];

  /**
   * Navigate to an internal route.
   * @param route - The router path to navigate to.
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
