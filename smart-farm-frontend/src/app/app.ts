import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { AuthService } from './core/services/auth.service';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SmartLoadingScreenSimpleComponent } from './shared/components/smart-loading-screen/smart-loading-screen-simple.component';
import { AlertsComponent } from './shared/components/alerts/alerts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, FooterComponent, SmartLoadingScreenSimpleComponent, AlertsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isAuthenticated = this.authService.isAuthenticated;
  
  // Track if current route is admin or pending
  isAdminRoute = false;
  isPendingRoute = false;

  // Loading screen control
  isLoading = true;

  async ngOnInit() {
    // Always show loading screen first
    this.isLoading = true;

    try {
      // Track route changes
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.isAdminRoute = event.url.startsWith('/admin');
          this.isPendingRoute = event.url.startsWith('/onboarding/pending');
        });

      // Check initial route
      this.isAdminRoute = this.router.url.startsWith('/admin');
      this.isPendingRoute = this.router.url.startsWith('/onboarding/pending');

      // Initialize auth service (has its own timeout protection)
      await this.authService.initAuth().catch(error => {
        console.warn('Auth initialization failed:', error);
      });
    } catch (err) {
      console.error('App initialization error:', err);
    } finally {
      // Hide loading screen after initialization completes (max 2.5s protection)
      setTimeout(() => {
        this.isLoading = false;
        try {
          this.cdr.detectChanges();
        } catch (e) { console.warn('CDR failed', e); }
      }, 500); // Short delay for smooth transition after auth init
    }
  }
}
