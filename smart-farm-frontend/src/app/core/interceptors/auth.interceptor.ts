/**
 * @file auth.interceptor.ts
 *
 * Responsibility: Authentication — the first interceptor in the pipeline.
 *
 * Architecture decisions:
 *  - Uses HTTP-only cookies (not localStorage) for JWT storage, so the backend
 *    controls token delivery and the browser never exposes the raw token to JS.
 *    `withCredentials: true` is the mechanism that attaches these cookies.
 *  - CSRF protection is implemented via a double-submit cookie pattern:
 *    the server sets a readable `sf_csrf` cookie; we read it and echo it as a
 *    request header (`X-CSRF-Token`). This cannot be forged cross-origin.
 *  - Token refresh uses a single-flight queue: if multiple concurrent requests
 *    receive a 401, only ONE refresh call is made. The others wait on the same
 *    Promise and re-execute after it resolves. This avoids a refresh storm.
 *  - External API calls (OpenWeatherMap) are skipped entirely — they don't
 *    understand our credentials or CSRF scheme.
 */

import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpContextToken,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  catchError,
  switchMap,
  throwError,
  Observable,
  from,
  Subject,
  filter,
  take,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { getCsrfToken, setCsrfToken } from '../security/csrf-token';

// ---------------------------------------------------------------------------
// Token-refresh queue
// Ensures at most one /auth/refresh call is in flight at any time.
// Any interceptor instance that hits a 401 while a refresh is pending
// subscribes to `refreshResult$` and retries when it emits.
// ---------------------------------------------------------------------------

let isRefreshing = false;

/**
 * Emits `true` on successful refresh, `false` on failure.
 * Concurrent 401 handlers wait on this subject.
 */
const refreshResult$ = new Subject<boolean>();

// ---------------------------------------------------------------------------
// Public endpoint allow-list
// Requests to these paths must NOT have credentials attached because they
// are either the auth mechanism itself or public read-only endpoints.
// ---------------------------------------------------------------------------

/** Full-match patterns for endpoints that must bypass auth attachment. */
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/logout',
  '/auth/refresh',
  '/auth/csrf',
  '/users/register',
] as const;

/**
 * Endpoints the backend's CsrfMiddleware exempts. Everything else that changes
 * state (including /auth/refresh) must carry X-CSRF-Token.
 */
const CSRF_EXEMPT_PATHS = [
  '/auth/login',
  '/auth/logout',
  '/auth/csrf',
  '/users/register',
] as const;

/** Marks a request already retried after a CSRF 403, so it isn't retried twice. */
const CSRF_RETRIED = new HttpContextToken<boolean>(() => false);

/** Domains considered external — never send credentials there. */
const EXTERNAL_DOMAINS = [
  'api.openweathermap.org',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'unpkg.com',
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isExternalUrl(url: string): boolean {
  return EXTERNAL_DOMAINS.some((domain) => url.includes(domain));
}

function isPublicEndpoint(url: string): boolean {
  return PUBLIC_PATHS.some((path) => url.includes(path));
}

/** Read a cookie value by name from `document.cookie`. */
function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// ---------------------------------------------------------------------------
// Request cloners
// ---------------------------------------------------------------------------

/** Attach `withCredentials` so the browser sends HTTP-only auth cookies. */
function withCredentials(req: HttpRequest<unknown>): HttpRequest<unknown> {
  return req.clone({ withCredentials: true });
}

function isUnsafeMethod(req: HttpRequest<unknown>): boolean {
  const method = req.method.toUpperCase();
  return !(method === 'GET' || method === 'HEAD' || method === 'OPTIONS');
}

/**
 * Echo the CSRF token as a request header for state-changing methods.
 * Prefer the readable cookie (same-site setups such as local dev); fall back
 * to the copy kept from GET /auth/csrf, since in production the cookie lives
 * on the API's domain and document.cookie can't see it.
 */
function withCsrfHeader(req: HttpRequest<unknown>): HttpRequest<unknown> {
  if (!isUnsafeMethod(req) || CSRF_EXEMPT_PATHS.some((path) => req.url.includes(path))) {
    return req;
  }

  const csrf = (typeof document !== 'undefined' ? getCookie('sf_csrf') : null) ?? getCsrfToken();
  return csrf
    ? req.clone({ setHeaders: { 'X-CSRF-Token': csrf } })
    : req;
}

function isCsrfRejection(error: HttpErrorResponse): boolean {
  return error.status === 403 && /csrf/i.test(String(error.error?.message ?? ''));
}

/**
 * The backend rejected our CSRF token (none yet, or the 1-day cookie was
 * rotated). Fetch a fresh one and retry the request once.
 */
function refreshCsrfAndRetry(
  http: HttpClient,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<any> {
  return http
    .get<{ csrfToken: string }>(`${environment.apiUrl}/auth/csrf`, { withCredentials: true })
    .pipe(
      switchMap(({ csrfToken }) => {
        setCsrfToken(csrfToken);
        const retryReq = withCsrfHeader(
          withCredentials(req.clone({ context: req.context.set(CSRF_RETRIED, true) })),
        );
        return next(retryReq);
      }),
    );
}

// ---------------------------------------------------------------------------
// Refresh logic — shared across all concurrent 401 handlers
// ---------------------------------------------------------------------------

function executeRefresh(
  http: HttpClient,
  router: Router,
  retryReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<any> {
  isRefreshing = true;

  return http
    .post(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
    .pipe(
      switchMap(() => {
        isRefreshing = false;
        refreshResult$.next(true);
        // Retry the original request — the new token is in the refreshed cookie
        return next(retryReq);
      }),
      catchError((refreshError: HttpErrorResponse) => {
        isRefreshing = false;
        refreshResult$.next(false);

        // Only redirect to login for non-silent init requests
        if (!retryReq.url.includes('/auth/me')) {
          router.navigate(['/login']);
        }
        return throwError(() => refreshError);
      }),
    );
}

/** Wait for the in-progress refresh, then retry the original request. */
function waitForRefreshAndRetry(
  retryReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  router: Router,
): Observable<any> {
  return refreshResult$.pipe(
    filter((success) => success !== undefined),
    take(1),
    switchMap((success) => {
      if (success) {
        return next(retryReq);
      }
      router.navigate(['/login']);
      return throwError(() => new Error('Token refresh failed'));
    }),
  );
}

// ---------------------------------------------------------------------------
// Interceptor
// ---------------------------------------------------------------------------

/**
 * `authInterceptor` — functional HTTP interceptor (Angular 15+).
 *
 * Pipeline position: SECOND (inside errorInterceptor)
 * Reason: credentials and CSRF tokens must be on the request before it
 * reaches the cache (which keys on the full request) or the network.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);

  // Pass external API calls through untouched
  if (isExternalUrl(req.url)) {
    return next(req);
  }

  // Build the augmented request
  const authenticatedReq = withCsrfHeader(withCredentials(req));

  return next(authenticatedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // CSRF token missing or rotated: get a fresh one and retry once
      if (isCsrfRejection(error) && isUnsafeMethod(req) && !req.context.get(CSRF_RETRIED)) {
        return refreshCsrfAndRetry(http, req, next);
      }

      // Only attempt refresh on 401 for non-auth endpoints
      const shouldRefresh =
        error.status === 401 &&
        !isPublicEndpoint(req.url) &&
        !req.url.includes('/auth/me');

      if (!shouldRefresh) {
        return throwError(() => error);
      }

      // Single-flight refresh: if a refresh is already in progress, queue behind it
      if (isRefreshing) {
        return waitForRefreshAndRetry(authenticatedReq, next, router);
      }

      return executeRefresh(http, router, authenticatedReq, next);
    }),
  );
};
