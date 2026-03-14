import {
  ApplicationConfig,
  provideZoneChangeDetection,
  ErrorHandler,
  isDevMode,
} from '@angular/core';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
  withInMemoryScrolling,
  withComponentInputBinding,
} from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';

// ─────────────────────────────────────────────────────────────────────────────
// Interceptor pipeline — order is deliberate. See block comment below.
// ─────────────────────────────────────────────────────────────────────────────
import { authInterceptor }    from './core/interceptors/auth.interceptor';
import { cachingInterceptor } from './core/interceptors/caching.interceptor';
import { retryInterceptor }   from './core/interceptors/retry.interceptor';
import { errorInterceptor }   from './core/interceptors/error.interceptor';

import { GlobalErrorHandler }   from './core/services/global-error-handler.service';
import { AlertService }         from './core/services/alert.service';
import { MatSnackBar }          from '@angular/material/snack-bar';
import { AlertSnackBarAdapter } from './core/services/alert-snackbar-adapter.service';

/**
 * ─── Interceptor Execution Order ─────────────────────────────────────────────
 *
 * Angular applies interceptors in the ORDER LISTED for outgoing requests, and
 * in REVERSE ORDER for incoming responses/errors.
 *
 * Outgoing (request ──► server):
 *   auth  →  caching  →  retry  →  error  →  [network]
 *
 * Incoming (server ──► component):
 *   [network]  →  error  →  retry  →  caching  →  auth
 *
 * ┌─────────────┬────────────────────────────────────────────────────────────┐
 * │ Interceptor │ Reason for its position                                    │
 * ├─────────────┼────────────────────────────────────────────────────────────┤
 * │ 1. auth     │ FIRST on request: every outgoing req must carry credentials │
 * │             │ and CSRF before it reaches the cache or the wire.           │
 * │             │ LAST on response: catches 401 → attempts token refresh      │
 * │             │ before any other error handler sees it.                     │
 * ├─────────────┼────────────────────────────────────────────────────────────┤
 * │ 2. caching  │ Sits after auth so the cache key reflects auth state.       │
 * │             │ Cache hits short-circuit retry & error (never reach them).  │
 * │             │ On the way back it stores successful responses.             │
 * ├─────────────┼────────────────────────────────────────────────────────────┤
 * │ 3. retry    │ Only sees requests that missed the cache. On responses it   │
 * │             │ catches transient failures (network / 5xx) and retries      │
 * │             │ with exponential backoff. Error interceptor sees one error. │
 * ├─────────────┼────────────────────────────────────────────────────────────┤
 * │ 4. error    │ LAST on response. Sees only genuine, unrecoverable errors   │
 * │             │ (refresh failed + all retries exhausted). Translates to     │
 * │             │ toasts, redirects, and logout — exactly once per action.    │
 * └─────────────┴────────────────────────────────────────────────────────────┘
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ Event coalescing — batches CD cycles; reduces re-render frequency
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),

    // ✅ Router features
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),       // Pre-fetch lazy chunks after initial load
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',  // Restore scroll on back/forward navigation
        anchorScrolling: 'enabled',            // Support #anchor links
      }),
      withComponentInputBinding(),             // Bind route params to @Input() automatically
    ),

    // ✅ HttpClient — Fetch API + ordered four-interceptor pipeline
    provideHttpClient(
      withFetch(),                             // Browser Fetch API (faster than XHR, supports streaming)
      withInterceptors([
        authInterceptor,    // 1. Attach credentials & CSRF; handle 401 token refresh
        cachingInterceptor, // 2. Serve cached GET responses; deduplicate in-flight calls
        retryInterceptor,   // 3. Retry transient failures with exponential backoff + jitter
        errorInterceptor,   // 4. Translate final errors to toasts, 403-redirect, session logout
      ]),
    ),

    // ✅ Async animations — non-blocking chunk, loaded only when first needed
    provideAnimationsAsync(),

    // ✅ Chart.js — registered globally (tree-shaken by Angular build optimizer)
    provideCharts(withDefaultRegisterables()),

    // ✅ Service Worker — production only, registered after 30 s of stability
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    // ✅ Global uncaught error boundary (WindowError, unhandledRejection, etc.)
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

    // ✅ Alert / SnackBar bridge
    {
      provide: MatSnackBar,
      useFactory: (alertService: AlertService) =>
        new AlertSnackBarAdapter(alertService) as any,
      deps: [AlertService],
    },
  ],
};
