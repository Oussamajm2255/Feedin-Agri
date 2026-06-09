// ──────────────────────────────────────────────
// Global SSR polyfills — needed by the prerender
// worker and SSR engine BEFORE Angular boots.
// These are never used at runtime in the browser.
// ──────────────────────────────────────────────

// requestAnimationFrame — needed by GSAP plugins at
// module-import time, and by video components.
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (cb: Function) => {
    const timeoutId = setTimeout(() => cb(performance.now()), 16);
    return timeoutId as unknown as number;
  };
}

// cancelAnimationFrame
if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  (globalThis as any).cancelAnimationFrame = (id: unknown) => clearTimeout(id as NodeJS.Timeout);
}

const _global = globalThis as any;
const noop = () => {};

// ──────────────────────────────────────────────
// Global browser API polyfills — needed by various
// libraries that assume browser APIs exist at
// module-import time (e.g. IntersectionObserver,
// ResizeObserver, MutationObserver).
// ──────────────────────────────────────────────
if (typeof globalThis.IntersectionObserver === 'undefined') {
  (globalThis as any).IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  (globalThis as any).ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof globalThis.MutationObserver === 'undefined') {
  (globalThis as any).MutationObserver = class {
    constructor() {}
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

if (typeof globalThis.document === 'undefined' || typeof globalThis.document.createElement !== 'function') {
  // No document at all — define a basic one so DOM-friendly libs don't crash at import time
  (globalThis as any).document = {
    createElement: () => ({
      getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }),
      hasAttribute: () => false,
    }),
  };
}

// ──────────────────────────────────────────────
// window polyfill via Proxy
// Domino's built-in window is a locked Proxy that
// rejects both direct assignment AND
// Object.defineProperty for missing methods like
// scrollTo, scroll, scrollBy.
//
// Strategy: replace globalThis.window with a new
// Proxy that falls through to domino's window for
// existing properties, and returns noop for
// missing ones.
// ──────────────────────────────────────────────
const origWindow = typeof globalThis.window !== 'undefined' ? globalThis.window : undefined;

if (origWindow) {
  // Build a proxy that wraps domino's window but
  // provides noop stubs for missing browser methods.
  const winHandler: ProxyHandler<any> = {
    get(target: any, prop: string | symbol) {
      // Intercept scroll-related methods that domino lacks
      if (prop === 'scrollTo' || prop === 'scroll' || prop === 'scrollBy') {
        return noop;
      }
      const value = Reflect.get(target, prop);
      // If the property exists and is a function, bind it to
      // avoid 'this' context issues with domino's proxy
      if (typeof value === 'function') {
        return value.bind(target);
      }
      return value;
    },
    set(target: any, prop: string | symbol, value: any) {
      return Reflect.set(target, prop, value);
    },
    has(target: any, prop: string | symbol) {
      if (prop === 'scrollTo' || prop === 'scroll' || prop === 'scrollBy') {
        return true;
      }
      return Reflect.has(target, prop);
    },
  };

  try {
    const proxyWindow = new Proxy(origWindow, winHandler);
    Object.defineProperty(globalThis, 'window', {
      value: proxyWindow,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch {
    // Fallback: try direct assignment (unlikely to work but worth a try)
    try { (globalThis as any).window = new Proxy(origWindow, winHandler); } catch { /* give up */ }
  }
}

// Force-set scroll helpers on globalThis directly in case
// code accesses them as bare names (e.g. just `scrollTo(...)`)
function forceSet(target: any, prop: string, value: any) {
  try {
    target[prop] = value;
  } catch {
    try {
      Object.defineProperty(target, prop, {
        value,
        writable: true,
        configurable: true,
      });
    } catch {
      // Give up — the property is completely locked
    }
  }
}

forceSet(_global, 'scrollTo', noop);
forceSet(_global, 'scroll', noop);
forceSet(_global, 'scrollBy', noop);

if (typeof _global.matchMedia !== 'function') {
  forceSet(_global, 'matchMedia', () => ({ matches: false, media: '', addListener: noop, removeListener: noop, addEventListener: noop, removeEventListener: noop, dispatchEvent: noop }));
}

if (typeof _global.getComputedStyle !== 'function') {
  forceSet(_global, 'getComputedStyle', () => ({ getPropertyValue: () => '', cssText: '' }));
}

forceSet(_global, 'requestAnimationFrame', _global.requestAnimationFrame);
forceSet(_global, 'cancelAnimationFrame', _global.cancelAnimationFrame);

// localStorage — may not exist in domino
if (typeof globalThis.localStorage === 'undefined' || typeof _global.localStorage === 'undefined') {
  const storage = new Map<string, string>();
  const ls = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() { return storage.size; },
    key: (index: number) => [...storage.keys()][index] ?? null,
  };
  (globalThis as any).localStorage = ls;
  _global.localStorage = ls;
}

// sessionStorage — alias localStorage for SSR
if (typeof _global.sessionStorage === 'undefined') {
  _global.sessionStorage = _global.localStorage;
}

// ──────────────────────────────────────────────
// document.element polyfill / patch
// Domino provides a document object but elements
// may lack methods that GSAP and other libraries
// need: getBoundingClientRect, hasAttribute.
//
// Strategy #1: Patch domino's Element prototype so
// ALL elements (existing + new) get the methods.
// Strategy #2: Wrap document.createElement as
// fallback for any elements that miss the proto.
// ──────────────────────────────────────────────
function createBoundingRect() {
  return {
    x: 0, y: 0, width: 0, height: 0,
    top: 0, right: 0, bottom: 0, left: 0,
    toJSON: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 }),
  };
}

// Try to patch domino's Element prototype — this is the most
// reliable way to ensure ALL elements get the methods.
try {
  if (typeof globalThis.document !== 'undefined' && typeof globalThis.document.createElement === 'function') {
    const testEl = globalThis.document.createElement('div');
    let proto = Object.getPrototypeOf(testEl);
    // Walk up to find the Element-like prototype
    while (proto && proto !== Object.prototype) {
      if (typeof proto.getBoundingClientRect !== 'function') {
        (proto as any).getBoundingClientRect = createBoundingRect;
      }
      if (typeof proto.hasAttribute !== 'function') {
        (proto as any).hasAttribute = function(name: string) {
          return (this as any).getAttribute?.(name) !== null;
        };
      }
      if (typeof proto.querySelector === 'function' && typeof proto.querySelectorAll !== 'function') {
        (proto as any).querySelectorAll = () => [];
      }
      proto = Object.getPrototypeOf(proto);
    }
  }
} catch {
  // Prototype patching may fail if objects are frozen
}

function patchElement(el: any): void {
  if (!el) return;
  if (typeof el.getBoundingClientRect !== 'function') {
    (el as any).getBoundingClientRect = createBoundingRect;
  }
  if (typeof el.hasAttribute !== 'function') {
    (el as any).hasAttribute = () => false;
  }
}

if (typeof globalThis.document !== 'undefined') {
  const doc = globalThis.document;

  // Wrap createElement to add getBoundingClientRect etc. to every element
  if (typeof doc.createElement === 'function') {
    const origCreateElement = doc.createElement.bind(doc);
    (doc as any).createElement = (tagName: string, options?: any) => {
      const el = origCreateElement(tagName, options);
      patchElement(el);
      return el;
    };
  }

  // Also patch existing body / documentElement
  patchElement(doc.body);
  patchElement(doc.documentElement);

  // Wrap querySelector / getElementById to patch returned elements
  const patchQueryMethod = (fn: Function | undefined, bindTarget: any): Function | undefined => {
    if (typeof fn !== 'function') return fn;
    return (...args: any[]) => {
      const result = fn.apply(bindTarget, args);
      if (result) {
        if (Array.isArray(result) || result instanceof NodeList) {
          for (let i = 0; i < result.length; i++) patchElement(result[i]);
        } else {
          patchElement(result);
        }
      }
      return result;
    };
  };

  (doc as any).getElementById = patchQueryMethod(doc.getElementById, doc);
  (doc as any).querySelector = patchQueryMethod(doc.querySelector, doc);
  (doc as any).querySelectorAll = patchQueryMethod(doc.querySelectorAll, doc);
  (doc as any).getElementsByClassName = patchQueryMethod(doc.getElementsByClassName, doc);
  (doc as any).getElementsByTagName = patchQueryMethod(doc.getElementsByTagName, doc);
} else {
  // Full document polyfill (fallback when domino is not present)
  const el: any = {
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    style: { setProperty: () => {}, getPropertyValue: () => '', removeProperty: () => {}, cssText: '' } as Record<string, any>,
    dataset: {} as Record<string, string>,
    getBoundingClientRect: createBoundingRect,
    hasAttribute: () => false,
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
  const createEl = () => ({ ...el, getBoundingClientRect: createBoundingRect });
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
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(AppComponent, config, context);

export default bootstrap;
