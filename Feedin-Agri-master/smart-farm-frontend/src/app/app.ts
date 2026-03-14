import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

import { AuthService } from './core/services/auth.service';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';
import { HeaderComponent } from './shared/components/header/header.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AlertsComponent } from './shared/components/alerts/alerts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  // ✅ OnPush: Component only re-renders when inputs change or signals emit
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, CommonModule, HeaderComponent, FooterComponent, AlertsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // ✅ Inject services that affect app-wide state (init side-effects)
  private readonly _languageService = inject(LanguageService);
  private readonly _themeService = inject(ThemeService);

  // ✅ Expose auth signal directly from AuthService (no redundant re-wrapping)
  readonly isAuthenticated = this.authService.isAuthenticated;

  // ✅ Signal-based route-type tracking (efficient, no CDR needed)
  readonly isAdminRoute = signal(false);
  readonly isPendingRoute = signal(false);

  // ✅ Derived signal: show loading overlay until init completes
  private readonly _isLoading = signal(true);
  readonly isLoading = this._isLoading.asReadonly();

  async ngOnInit(): Promise<void> {
    // ✅ Performance measurement in development
    if (typeof performance !== 'undefined') {
      performance.mark('app-init-start');
    }

    // ✅ Track route changes with signal updates
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isAdminRoute.set(event.url.startsWith('/admin'));
        this.isPendingRoute.set(event.url.startsWith('/onboarding/pending'));
      });

    // ✅ Check initial route before auth fetch
    const initialUrl = this.router.url;
    this.isAdminRoute.set(initialUrl.startsWith('/admin'));
    this.isPendingRoute.set(initialUrl.startsWith('/onboarding/pending'));

    try {
      // ✅ Initialize auth — has its own 2s timeout protection per call
      await this.authService.initAuth();
    } catch (err) {
      // Silently continue — app still loads in guest mode
      console.warn('[App] Auth initialization error (non-fatal):', err);
    } finally {
      // ✅ Dismiss loading overlay after auth resolves
      // 200ms is enough for a smooth CSS transition without perceptible delay
      setTimeout(() => {
        this._isLoading.set(false);

        // ✅ Remove the HTML-inlined loader (if still in DOM)
        const loader = document.getElementById('premium-initial-loader');
        if (loader) {
          loader.style.transition = 'opacity 0.5s ease-out';
          loader.style.opacity = '0';
          // Remove from DOM after transition completes
          setTimeout(() => loader?.remove(), 500);
        }

        if (typeof performance !== 'undefined') {
          try {
            performance.mark('app-init-end');
            performance.measure('app-bootstrap', 'app-init-start', 'app-init-end');
          } catch {
            // Non-fatal if browser doesn't support performance API fully
          }
        }
      }, 200);
    }
  }
}

