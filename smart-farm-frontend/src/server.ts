import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

// ──────────────────────────────────────────────
// SSR Polyfills — provide no-op browser globals
// during Node.js prerendering so services that
// reference localStorage, etc. don't crash.
// These are never used at runtime in the browser.
// ──────────────────────────────────────────────
if (typeof globalThis.localStorage === 'undefined') {
  const storage = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() { return storage.size; },
    key: (index: number) => [...storage.keys()][index] ?? null,
  };
}

// ──────────────────────────────────────────────
// Minimal document polyfill for SSR prerendering
// Prevents crashes in services that reference
// document.body, documentElement, etc.
// ──────────────────────────────────────────────
if (typeof globalThis.document === 'undefined') {
  const el = {
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    style: { setProperty: () => {}, getPropertyValue: () => '', removeProperty: () => {}, cssText: '' } as Record<string, any>,
    dataset: {} as Record<string, string>,
    getAttribute: () => null,
    setAttribute: () => {},
    removeAttribute: () => {},
    appendChild: () => {},
    removeChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    closest: () => null,
  };
  const createEl = () => ({ ...el });
  (globalThis as any).document = {
    body: el,
    documentElement: el,
    createElement: createEl,
    createTextNode: () => ({}),
    getElementById: () => null,
    getElementsByClassName: () => [],
    getElementsByTagName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    createEvent: () => ({}),
    head: el,
    title: '',
    cookie: '',
    referrer: '',
    URL: '',
    characterSet: 'utf-8',
    compatMode: 'CSS1Compat',
    contentType: 'text/html',
    dir: 'ltr',
    readyState: 'complete',
    visibilityState: 'visible',
    hidden: false,
  };
}

// ──────────────────────────────────────────────
// Minimal window polyfill for SSR prerendering
// ──────────────────────────────────────────────
if (typeof globalThis.window === 'undefined') {
  const noop = () => {};
  const fakeEventTarget = {
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: noop,
  };
  (globalThis as any).window = {
    ...fakeEventTarget,
    location: { href: '', pathname: '', search: '', hash: '', host: '', hostname: '', origin: '', protocol: 'https:', port: '', assign: noop, replace: noop, reload: noop },
    navigator: { userAgent: 'Node', platform: 'Node', language: 'en', languages: ['en'], cookieEnabled: false, onLine: true, geolocation: null, maxTouchPoints: 0 },
    history: { length: 0, scrollRestoration: 'auto', state: null, pushState: noop, replaceState: noop, go: noop, back: noop, forward: noop },
    screen: { width: 1024, height: 768, availWidth: 1024, availHeight: 768, colorDepth: 24, pixelDepth: 24 },
    innerWidth: 1024, innerHeight: 768, outerWidth: 1024, outerHeight: 768,
    scrollX: 0, scrollY: 0, pageXOffset: 0, pageYOffset: 0, devicePixelRatio: 1,
    matchMedia: () => ({ matches: false, media: '', addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, addListener: noop, removeListener: noop }),
    getComputedStyle: () => ({ getPropertyValue: () => '', cssText: '' }),
    requestAnimationFrame: (cb: Function) => { cb(0); return 0; },
    cancelAnimationFrame: noop, setTimeout, clearTimeout, setInterval, clearInterval,
    performance: { now: () => 0, timing: { navigationStart: 0 } },
    customElements: { get: () => undefined, define: noop, whenDefined: () => Promise.resolve() },
    crypto: { getRandomValues: (arr: any) => arr },
    console, name: '', closed: false, opener: null, length: 0,
    ResizeObserver: class { observe = noop; unobserve = noop; disconnect = noop; },
    MutationObserver: class { observe = noop; disconnect = noop; takeRecords = () => []; },
    IntersectionObserver: class { observe = noop; unobserve = noop; disconnect = noop; takeRecords = () => []; },
  } as any;
  (globalThis as any).window.self = (globalThis as any).window;
  (globalThis as any).window.window = (globalThis as any).window;
  (globalThis as any).window.top = (globalThis as any).window;
  (globalThis as any).window.parent = (globalThis as any).window;
  (globalThis as any).window.localStorage = (globalThis as any).localStorage;
  (globalThis as any).window.sessionStorage = (globalThis as any).localStorage;
  (globalThis as any).window.document = (globalThis as any).document;
  globalThis.window = (globalThis as any).window;
}

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Intercept Railway health check requests before they reach Angular SSR.
 * Railway sends health checks with Host: healthcheck.railway.app, which
 * Angular's SSRF protection rejects as an unallowed host header.
 */
app.use((req, res, next): void => {
  if (req.headers['host']?.includes('healthcheck')) {
    res.status(200).send('healthy\n');
    return;
  }
  next();
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
