/**
 * @file caching.interceptor.ts
 *
 * Responsibility: In-memory HTTP response cache for GET requests.
 *
 * Architecture decisions:
 *  - Position in pipeline: SECOND (after auth, before retry/error).
 *    Reason: cached responses must already have credentials applied so the
 *    cache key reflects the authenticated state. Returning from cache before
 *    retry/error means cached hits never trigger spurious retry loops.
 *  - Uses a two-level store:
 *      1. `responseCache`   — TTL-keyed responses for repeat callers
 *      2. `inflightCache`   — deduplication for simultaneous callers
 *    This prevents the "thundering herd" problem where 10 components mounting
 *    at the same time fire 10 identical GET requests.
 *  - TTL is endpoint-aware: real-time sensor data expires in 15 s, stable
 *    reference data expires in 60 s.
 *  - `clearHttpCache()` is exported for `AuthService.logout()` to call,
 *    preventing stale authenticated data leaking into the next user session.
 *  - Cache is purposely in-memory (Map), never persisted to localStorage,
 *    so a hard reload always fetches fresh data.
 */

import {
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
  HttpEvent,
} from '@angular/common/http';
import { Observable, of, share, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheEntry {
  /** The full cloned HTTP response. */
  readonly response: HttpResponse<unknown>;
  /** Unix timestamp (ms) after which this entry is considered stale. */
  readonly expiresAt: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Default TTL for stable reference data (farms, crops, zones, devices). */
const DEFAULT_TTL_MS = 60_000; // 60 s

/** Shorter TTL for frequently changing operational data. */
const SHORT_TTL_MS = 15_000; // 15 s

/**
 * Endpoints that must NEVER be cached.
 * These are either sensitive, non-idempotent-adjacent, or real-time streams.
 */
const NEVER_CACHE: readonly string[] = [
  '/auth/',          // Session state — always fresh
  '/notifications',  // Real-time feed
  '/mqtt',           // WebSocket/MQTT bridge
  '/websockets',     // Raw WS endpoints
  '/health',         // Infrastructure probe — must always go to the wire
  '/profile',        // User-specific sensitive data
];

/**
 * Endpoints with a shorter TTL because their data changes frequently
 * but a full round-trip for every render would be too expensive.
 */
const SHORT_TTL_PATTERNS: readonly string[] = [
  '/sensor-readings',
  '/dashboard',
  '/actions',
];

// ---------------------------------------------------------------------------
// Cache stores — module-level singletons
// ---------------------------------------------------------------------------

/** Completed response cache keyed by `url?queryParams`. */
const responseCache = new Map<string, CacheEntry>();

/**
 * In-flight request cache keyed by `url?queryParams`.
 * Maps to a shared Observable so simultaneous callers subscribe to the same
 * network request and each receive their own copy of the response.
 */
const inflightCache = new Map<string, Observable<HttpEvent<unknown>>>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns `true` when a URL is eligible for caching. */
function isCacheable(url: string): boolean {
  return !NEVER_CACHE.some((pattern) => url.includes(pattern));
}

/** Returns the appropriate TTL for a given URL. */
function getTtlMs(url: string): number {
  return SHORT_TTL_PATTERNS.some((p) => url.includes(p))
    ? SHORT_TTL_MS
    : DEFAULT_TTL_MS;
}

/**
 * Builds a stable cache key from the request.
 * Includes query params so `/farms?page=1` and `/farms?page=2` are distinct.
 */
function buildCacheKey(req: HttpRequest<unknown>): string {
  const params = req.params.toString();
  return params ? `${req.url}?${params}` : req.url;
}

/** Returns a valid cached entry, or `undefined` if missing / expired. */
function getValidEntry(key: string): CacheEntry | undefined {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key); // Lazy eviction
    return undefined;
  }
  return entry;
}

/** Evict all entries whose TTL has elapsed. Called periodically to bound memory. */
function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of responseCache) {
    if (entry.expiresAt <= now) responseCache.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Interceptor
// ---------------------------------------------------------------------------

/**
 * `cachingInterceptor` — functional HTTP interceptor (Angular 15+).
 *
 * Pipeline position: SECOND (after `authInterceptor`)
 * Reason: The cache key must include authenticated context. Sitting before
 * retry means cache hits short-circuit without triggering retry logic.
 */
export const cachingInterceptor: HttpInterceptorFn = (req, next) => {
  // Only cache GET requests targeting our own API
  if (req.method !== 'GET' || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  if (!isCacheable(req.url)) {
    return next(req);
  }

  const key = buildCacheKey(req);

  // ── 1. Cache hit ──────────────────────────────────────────────────────────
  const valid = getValidEntry(key);
  if (valid) {
    // Return a clone so downstream operators cannot mutate the cached body
    return of(valid.response.clone());
  }

  // ── 2. Deduplication — join an existing in-flight request ─────────────────
  const inFlight = inflightCache.get(key);
  if (inFlight) return inFlight;

  // ── 3. Cache miss — issue real request, store response, share observable ──
  const ttl = getTtlMs(req.url);
  const now = Date.now();

  const request$ = next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
        responseCache.set(key, {
          response: event.clone(),
          expiresAt: now + ttl,
        });

        // Periodic GC: prune stale entries after every 100 new entries
        if (responseCache.size % 100 === 0) pruneExpired();
      }
    }),
    /**
     * `share()` multicasts the single Observable to all concurrent subscribers.
     * Without this, each subscriber that joined via the in-flight map would
     * trigger a new HTTP request.
     */
    share(),
  );

  inflightCache.set(key, request$);

  // Clean up the in-flight entry once the request settles
  request$.subscribe({
    complete: () => inflightCache.delete(key),
    error: () => inflightCache.delete(key),
  });

  return request$;
};

// ---------------------------------------------------------------------------
// Public API — callable from AuthService and after mutations
// ---------------------------------------------------------------------------

/**
 * Clear the entire in-memory HTTP cache.
 *
 * @usage Call from `AuthService.logout()` to prevent authenticated data
 *        from leaking into the next user's session within the same browser tab.
 *
 * @example
 * ```ts
 * import { clearHttpCache } from '../interceptors/caching.interceptor';
 *
 * logout(): void {
 *   clearHttpCache();                          // ← prevents data leakage
 *   this.http.post('/auth/logout', {}).subscribe();
 *   this.clearAuthState();
 * }
 * ```
 */
export function clearHttpCache(): void {
  responseCache.clear();
  inflightCache.clear();
}

/**
 * Invalidate all cache entries whose keys contain `urlFragment`.
 *
 * @usage Call after successful POST/PUT/DELETE to ensure the next GET
 *        fetches fresh data instead of serving a stale cached response.
 *
 * @example
 * ```ts
 * createFarm(data: FarmDto): Observable<Farm> {
 *   return this.http.post<Farm>('/api/v1/farms', data).pipe(
 *     tap(() => invalidateCacheFor('/api/v1/farms')),
 *   );
 * }
 * ```
 */
export function invalidateCacheFor(urlFragment: string): void {
  for (const key of responseCache.keys()) {
    if (key.includes(urlFragment)) responseCache.delete(key);
  }
}
