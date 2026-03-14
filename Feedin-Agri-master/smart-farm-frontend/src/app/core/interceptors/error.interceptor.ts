/**
 * @file error.interceptor.ts
 *
 * Responsibility: Centralised HTTP error handling — the last interceptor in
 * the pipeline.
 *
 * Architecture decisions:
 *  - Position in pipeline: FOURTH / LAST.
 *    Reason: By the time an error reaches this interceptor, auth has already
 *    tried a token refresh and retry has already exhausted its attempts.
 *    This interceptor sees only genuine, unrecoverable errors.
 *  - Errors are never swallowed: every path ends with `throwError()` so that
 *    component-level `catchError` handlers still receive the error and can
 *    update their local UI state (e.g., hide a spinner).
 *  - Silent endpoints (`/auth/me`, `/auth/csrf`) suppress toasts because these
 *    are background probes — a 401 here is expected for unauthenticated users.
 *  - 403 redirects to `/forbidden` rather than silently logging out, giving
 *    the user a clear message about insufficient permissions.
 *  - 429 (rate limited) is handled separately with a specific user-facing message.
 *  - Network errors (status 0) produce a connectivity warning, not a generic
 *    "Error 0" which would confuse non-technical users.
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';
import { clearHttpCache } from './caching.interceptor';

// ---------------------------------------------------------------------------
// Configuration — silent endpoints
// ---------------------------------------------------------------------------

/**
 * URL fragments for requests where error toasts must be suppressed.
 * These are background health/session probes; their failures are handled
 * programmatically by `AuthService.initAuth()`.
 */
const SILENT_ENDPOINTS: readonly string[] = [
  '/auth/me',
  '/auth/csrf',
];

/**
 * URL fragments for authentication form requests.
 * These get specific, user-friendly copy instead of generic error messages.
 */
const AUTH_FORM_ENDPOINTS: readonly string[] = [
  '/auth/login',
  '/auth/logout',
  '/users/register',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSilent(url: string): boolean {
  return SILENT_ENDPOINTS.some((p) => url.includes(p));
}

function isAuthForm(url: string): boolean {
  return AUTH_FORM_ENDPOINTS.some((p) => url.includes(p));
}

function isAuthRelated(url: string): boolean {
  return url.includes('/auth/');
}

// ---------------------------------------------------------------------------
// Error message resolver
// ---------------------------------------------------------------------------

/**
 * Maps an `HttpErrorResponse` to a user-facing string.
 * Returns `null` when no toast should be shown.
 */
function resolveErrorMessage(
  error: HttpErrorResponse,
  requestUrl: string,
): string | null {
  // Network error (no connection, DNS failure, CORS, or server didn't respond)
  if (error.status === 0 || error.error instanceof ErrorEvent) {
    return isAuthForm(requestUrl)
      ? 'Connection error. Please check your internet connection and try again.'
      : null; // Non-form network errors — suppress toast (service worker or retry handles it)
  }

  switch (error.status) {
    case 400:
      return isAuthForm(requestUrl) ? 'Invalid credentials. Please check your input.' : null;

    case 401:
      // Auth form 401 = wrong password; elsewhere = session-expired (auth interceptor handles redirect)
      return isAuthForm(requestUrl) ? 'Invalid email or password.' : null;

    case 403:
      // 403 gets a redirect — message shown on the forbidden page itself
      return null;

    case 404:
      // Suppress 404s on auth endpoints (e.g., sensor that no longer exists)
      return isAuthRelated(requestUrl) ? null : 'The requested resource was not found.';

    case 409:
      return error.error?.message ?? 'A conflict occurred. This record may already exist.';

    case 422:
      return error.error?.message ?? 'Validation failed. Please check your input.';

    case 429:
      return 'Too many requests. Please slow down and try again in a moment.';

    case 500:
    case 502:
    case 503:
    case 504:
      return 'A server error occurred. Our team has been notified. Please try again shortly.';

    default:
      // For non-auth endpoints, show a generic message with the status code
      return isAuthRelated(requestUrl)
        ? null
        : (error.error?.message ?? `Unexpected error (${error.status}). Please try again.`);
  }
}

// ---------------------------------------------------------------------------
// Interceptor
// ---------------------------------------------------------------------------

/**
 * `errorInterceptor` — functional HTTP interceptor (Angular 15+).
 *
 * Pipeline position: FOURTH / LAST
 * Reason: Only intercepts errors that survive auth refresh attempts AND
 * all retry attempts. Provides a single, consistent UX for unrecoverable errors.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const alertService = inject(AlertService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // ── Silent endpoints — propagate without any UI side-effect ──────────
      if (isSilent(req.url)) {
        return throwError(() => error);
      }

      // ── 401 Unauthorized ──────────────────────────────────────────────────
      // At this point, `authInterceptor` has already tried a token refresh
      // and it failed. Log the user out and clear the cache.
      if (error.status === 401 && !isAuthForm(req.url)) {
        clearHttpCache();
        authService.logout(/* navigate */ false);
        router.navigate(['/login'], {
          queryParams: { reason: 'session-expired' },
        });
        return throwError(() => error);
      }

      // ── 403 Forbidden ─────────────────────────────────────────────────────
      // Redirect to a dedicated forbidden page. The page itself explains why.
      if (error.status === 403) {
        router.navigate(['/forbidden']);
        return throwError(() => error);
      }

      // ── Resolve user-facing message ───────────────────────────────────────
      const message = resolveErrorMessage(error, req.url);
      if (message) {
        alertService.error('Error', message);
      }

      // Always propagate — components must still handle the error state
      return throwError(() => error);
    }),
  );
};
