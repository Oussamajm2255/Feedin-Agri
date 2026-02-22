import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { CustomDropdownComponent } from '../../../shared/components/custom-dropdown/custom-dropdown.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

/**
 * OnboardingPendingComponent
 * 
 * CRITICAL PAGE — Onboarding Status / Pending Approval
 * 
 * Purpose:
 *  - Reassure the user their request was received
 *  - Explain what happens next
 *  - Make the platform feel alive before access is granted
 *  - Prevent anxiety, repeated emails, and confusion
 * 
 * Design Language:
 *  - Earth tones (green, sand, neutral gray)
 *  - Large typography, high contrast, calm spacing
 *  - ZERO dashboard components, no charts, no fake data
 *  - No spinners, no percentages, no loading wheels
 */
@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatMenuModule, 
    MatTooltipModule, 
    MatDividerModule,
    LanguageSwitcherComponent,
    CustomDropdownComponent,
    TranslatePipe
  ],
  templateUrl: './pending.html',
  styleUrl: './pending.scss',
})
export class Pending implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  public themeService = inject(ThemeService);
  public languageService = inject(LanguageService);

  user = this.authService.user;
  currentTheme = this.themeService.theme$;
  
  userName = signal('');
  showFeaturesModal = signal(false);

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName.set(user.first_name || 'there');
    }
  }

  openFeaturesModal(): void {
    this.showFeaturesModal.set(true);
  }

  closeFeaturesModal(): void {
    this.showFeaturesModal.set(false);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getInitials(): string {
    const user = this.user();
    if (!user) return 'U';
    
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (user.email) return user.email.substring(0, 2).toUpperCase();
    return 'U';
  }

  onLanguageItemSelected(item: any): void {
    this.languageService.setLanguage(item.id);
  }

  getSelectedLanguageId(): string {
    return this.languageService.getCurrentLanguageCode();
  }

  languageDropdownItems = [
    {
      id: 'en-US',
      label: 'English',
      subtitle: 'English',
      flag: 'https://flagcdn.com/w40/us.png',
      badge: 'EN'
    },
    {
      id: 'fr-FR',
      label: 'Français',
      subtitle: 'French',
      flag: 'https://flagcdn.com/w40/fr.png',
      badge: 'FR'
    },
    {
      id: 'ar-TN',
      label: 'العربية',
      subtitle: 'Arabic',
      flag: 'https://flagcdn.com/w40/tn.png',
      badge: 'AR'
    }
  ];

  logout(): void {
    this.authService.logout(true);
  }
}
