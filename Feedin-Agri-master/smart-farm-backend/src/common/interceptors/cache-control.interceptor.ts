import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import * as crypto from 'crypto';

/**
 * CacheControlInterceptor
 *
 * Sets Cache-Control + ETag headers on GET responses to allow browsers
 * and CDNs to cache read-only data and reduce redundant round-trips.
 *
 * Features:
 *  - Cache-Control with stale-while-revalidate for smooth background refresh
 *  - ETag based on response body hash, enabling conditional requests (304 Not Modified)
 *  - Skips non-GET requests automatically
 *
 * Usage:
 *   @UseInterceptors(new CacheControlInterceptor(120))  // 2-minute cache
 *   @Get('stats')
 *   getStats() { ... }
 *
 *   // Or with a custom etag group for cache busting:
 *   @UseInterceptors(new CacheControlInterceptor(300, 'farm-data'))
 *   @Get('farms')
 *   getAllFarms() { ... }
 */
@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  /**
   * @param maxAge      - Max-age in seconds (default: 60s)
   * @param cacheScope  - Optional scope tag for cache partitioning ('public' | 'private')
   */
  constructor(
    private readonly maxAge: number = 60,
    private readonly cacheScope: 'public' | 'private' = 'public',
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Only cache GET and HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        const response = context.switchToHttp().getResponse();

        // Don't override if headers already set downstream
        if (response.headersSent) return;

        // ✅ Set Cache-Control with stale-while-revalidate for smooth updates
        const swr = Math.min(this.maxAge * 3, 3600); // SWR up to 1 hour
        response.setHeader(
          'Cache-Control',
          `${this.cacheScope}, max-age=${this.maxAge}, stale-while-revalidate=${swr}`,
        );

        // ✅ Generate ETag from response content hash (for conditional requests)
        // This enables browsers to send If-None-Match and get 304 Not Modified
        if (responseBody !== undefined && responseBody !== null) {
          try {
            const bodyStr =
              typeof responseBody === 'string'
                ? responseBody
                : JSON.stringify(responseBody);
            const etag = `"${crypto.createHash('sha256').update(bodyStr).digest('hex').substring(0, 16)}"`;
            response.setHeader('ETag', etag);
          } catch {
            // ETag generation is best-effort — don't fail the request
          }
        }

        // ✅ Vary header ensures proxies cache separate responses per Accept-Encoding
        response.setHeader('Vary', 'Accept-Encoding, Accept');
      }),
    );
  }
}
