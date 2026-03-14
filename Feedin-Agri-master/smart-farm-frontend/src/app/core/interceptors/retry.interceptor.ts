/**
 * @file retry.interceptor.ts
 *
 * Responsibility: Network resilience — automatic retry with exponential backoff.
 *
 * Architecture decisions:
 *  - Position in pipeline: THIRD (after auth & cache, before error).
 *    Reason: We only retry requests that actually hit the network (cache hits
 *    never reach this interceptor). Sitting before `errorInterceptor` means
 *    `errorInterceptor` only sees the *final* failure after all retries are
 *    exhausted, so the user sees exactly one error toast — not one per attempt.
 *  - Uses RxJS `retryWhen` with exponential backoff to avoid hammering a
 *    struggling server. Jitter (±20 %) prevents the "retry thundering herd"
 *    when many clients fail simultaneously.
 *  - Only retries transient failures:
 *      • Network errors (status 0 — no connection / CORS / DNS failure)
 *      • Server errors (status >= 500 — database hiccup, cold-start, etc.)
 *    It does NOT retry client errors (4xx) because those are deterministic —
 *    a 401, 403, or 422 will not succeed on a second attempt.
 *  - GET requests only by default — retrying a POST could cause duplicate
 *    side-effects (e.g., creating the same resource twice).
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError, timer } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Maximum number of retry attempts per request. */
const MAX_RETRIES = 3;

/** Base delay in milliseconds for the first retry. */
const BASE_DELAY_MS = 500;

/** Maximum cap for computed delay (prevents unbounded backoff). */
const MAX_DELAY_MS = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the error is worth retrying.
 *
 * Criteria:
 *  - `status === 0`  → network-level failure (no connection, DNS, CORS)
 *  - `status >= 500` → server-side transient error (502, 503, 504 are common
 *                      during Railway/Heroku cold-starts or deployments)
 */
function isRetryableError(error: HttpErrorResponse): boolean {
  return error.status === 0 || error.status >= 500;
}

/**
 * Compute exponential backoff delay with ±20 % jitter.
 *
 * Formula: `min(base * 2^attempt, maxDelay) * jitter`
 *
 * @param attempt - Zero-based attempt index (0 = first retry).
 */
function getBackoffDelayMs(attempt: number): number {
  const exponential = BASE_DELAY_MS * Math.pow(2, attempt);
  const capped = Math.min(exponential, MAX_DELAY_MS);
  // Add ±20 % random jitter to desync concurrent retries
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.round(capped * jitter);
}

// ---------------------------------------------------------------------------
// Interceptor
// ---------------------------------------------------------------------------

/**
 * `retryInterceptor` — functional HTTP interceptor (Angular 15+).
 *
 * Pipeline position: THIRD (after `authInterceptor` and `cachingInterceptor`)
 *
 * Retry policy:
 *  - 3 attempts maximum
 *  - Exponential backoff: 500 ms → 1 000 ms → 2 000 ms (with jitter)
 *  - Retryable: network errors (status 0) + server errors (>= 500)
 *  - Non-retryable: client errors (4xx), cached responses, mutation requests
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  /**
   * Only auto-retry GET (and HEAD) requests.
   * Retrying POST/PUT/PATCH/DELETE risks duplicate side-effects.
   * Consumers who need retry on mutations should implement their own logic
   * at the service level with explicit idempotency keys.
   */
  const isIdempotent = req.method === 'GET' || req.method === 'HEAD';

  if (!isIdempotent) {
    return next(req);
  }

  // Attempt counter — we use a closure variable so the recursive retry
  // function shares state with the outer interceptor call.
  let attempt = 0;

  /**
   * Wraps `next(req)` and retries on transient errors.
   * Each call increments `attempt` so the backoff grows correctly.
   */
  function executeWithRetry(): ReturnType<typeof next> {
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!isRetryableError(error) || attempt >= MAX_RETRIES) {
          // Give up — propagate to errorInterceptor
          return throwError(() => error);
        }

        const delayMs = getBackoffDelayMs(attempt);
        attempt++;

        // `timer(delayMs)` emits once after the delay, then `switchMap`
        // replaces it with a fresh attempt. This is the idiomatic RxJS
        // retry-with-delay pattern that keeps the chain linear.
        return timer(delayMs).pipe(switchMap(() => executeWithRetry()));
      }),
    );
  }

  return executeWithRetry();
};
