import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * SelectivePreloadStrategy
 *
 * Preloads landing public sub-pages after a 1-second delay (they are the most
 * likely navigation targets). Admin & dashboard chunks are deferred by 10
 * seconds, so they never compete with critical landing resources. All other
 * lazy routes (auth, settings, etc.) are not preloaded at all.
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    const path = route.path || '';

    // Landing public pages — preload after 1s (high navigation probability)
    const publicPaths = [
      'about', 'services', 'solutions', 'formation',
      'projets', 'contact', 'store',
    ];
    if (publicPaths.includes(path)) {
      return timer(1000).pipe(switchMap(() => load()));
    }

    // Admin & dashboard — defer until 10s of idle (low probability on landing)
    if (path === 'admin' || path === 'dashboard') {
      return timer(10000).pipe(switchMap(() => load()));
    }

    // Everything else — no preload, load on demand
    return of(null);
  }
}
