# 🚀 PHASE 2 — PERFORMANCE FIXES
## FeedinGreen · Performance Optimization Guide

---

## Overview

| Fix | Title | Impact | Effort | Metric Improved |
|-----|-------|--------|--------|-----------------|
| P1 | Remove ffmpeg + duplicate charting libs from frontend | HIGH | 5 min | Bundle Size |
| P2 | Tighten Angular production budgets | HIGH | 5 min | Bundle Size |
| P3 | Compression Middleware | SKIP | — | Already configured ✅ |
| P4 | Health Endpoint + Cold Start Prevention | SKIP | — | Already configured ✅ |
| P5 | Lazy Load All Angular Routes | SKIP | — | Already configured ✅ |
| P6 | NgOptimizedImage audit | MEDIUM | 15 min | LCP / CLS |
| P7 | Angular Production Build Optimization | MEDIUM | 5 min | Bundle Size |
| P8 | Font & Preconnect Optimization | SKIP | — | Already configured ✅ |
| P9 | PostgreSQL Connection Pooling | SKIP | — | Already configured ✅ |
| P10 | Cache-Control Headers for Static Assets | MEDIUM | 10 min | Repeat Visits |
| P11 | SSR Setup | HIGH | 30 min | LCP / TTFB / PageSpeed +15-25 |
| P12 | Add `disableErrorMessages` to ValidationPipe in prod | LOW | 2 min | Best Practices |

---

## FIX P1 — Remove ffmpeg + Duplicate Charting Libs from Frontend
**Layer:** Angular | **Impact:** HIGH | **Effort:** 5 min

### Problem
`ffmpeg-static` (~100MB) and `fluent-ffmpeg` are server-side packages bundled in the **frontend**.
3 charting libraries coexist: `chart.js`/`ng2-charts`, `echarts`/`ngx-echarts`, `@swimlane/ngx-charts`.

### Files
- `smart-farm-frontend/package.json`

### Steps
1. Open `smart-farm-frontend/package.json`
2. Remove from `dependencies`:
   - `"ffmpeg-static": "^5.3.0"`
   - `"fluent-ffmpeg": "^2.1.3"`
3. **Decide on ONE charting library** (recommendation: keep `echarts`/`ngx-echarts` as it's the most feature-rich):
   - If keeping echarts, remove: `"chart.js"`, `"ng2-charts"`, `"@swimlane/ngx-charts"`
   - Then refactor any components using chart.js/ngx-charts to use echarts
4. Run: `cd smart-farm-frontend && npm install`

### Expected
- Bundle size reduction: **-30-50%** on initial load
- PageSpeed: **+5-10 pts**

---

## FIX P2 — Tighten Angular Production Budgets
**Layer:** Angular | **Impact:** HIGH | **Effort:** 5 min

### Problem
Current budgets (`2mb warning / 3mb error`) are far too generous. They mask bloat.

### Files
- `smart-farm-frontend/angular.json`

### BEFORE
```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "2mb",
    "maximumError": "3mb"
  },
  {
    "type": "anyComponentStyle",
    "maximumWarning": "200kb",
    "maximumError": "250kb"
  }
]
```

### AFTER
```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "500kb",
    "maximumError": "1mb"
  },
  {
    "type": "anyComponentStyle",
    "maximumWarning": "4kb",
    "maximumError": "8kb"
  }
]
```

### Metric: Bundle Size awareness — exposes bloat during builds

---

## FIX P3 — Compression Middleware
**Already configured — skipping.** ✅

`app.use(compression())` is in `smart-farm-backend/src/main.ts:24`.

---

## FIX P4 — Health Endpoint + Cold Start Prevention
**Already configured — skipping.** ✅

Health endpoint exists at `api/v1/health` with database, mqtt, sensors, and detailed sub-routes.

### Remaining Action (Manual)
> Set up a **free UptimeRobot monitor**:
> - URL: `https://feedingreen.up.railway.app/api/v1/health`
> - Interval: every 5 minutes
> - This prevents Railway cold starts (3-8s TTFB → 200ms)

---

## FIX P5 — Lazy Load All Angular Routes
**Already configured — skipping.** ✅

Every route in `app.routes.ts` uses `loadComponent` or `loadChildren`.

---

## FIX P6 — NgOptimizedImage Audit
**Layer:** Angular | **Impact:** MEDIUM | **Effort:** 15 min

### Problem
`NgOptimizedImage` is imported in 6+ landing section components, but only 1 actual `ngSrc` binding was found. Other components may be using `[src]` or dynamic binding instead of `ngSrc`.

### Steps
1. Search all `.html` files in `src/app/` for any `<img` tags or `[src]=` bindings
2. For each found:
   - Import `NgOptimizedImage` in the component's `imports` array
   - Replace `src=` or `[src]=` with `ngSrc=` or `[ngSrc]=`
   - Add explicit `width=` and `height=` attributes (required)
   - Add `priority` to the FIRST visible / hero image only
3. Do NOT add `loading="lazy"` manually — NgOptimizedImage handles it

### Expected: LCP -30-50%, CLS fixed, PageSpeed +5-10 pts

---

## FIX P7 — Angular Production Build Optimization
**Layer:** Angular | **Impact:** MEDIUM | **Effort:** 5 min

### Status
Most settings are already correct in `angular.json`:
- `"optimization": true` ✅
- `"outputHashing": "all"` ✅
- `"sourceMap": false` ✅
- `"namedChunks": false` ✅
- `"extractLicenses": true` ✅

### Only Change Needed
Tighten the budgets (covered in Fix P2 above).

---

## FIX P8 — Font & Preconnect Optimization
**Already configured — skipping.** ✅

- `<link rel="preconnect">` for Google Fonts ✅
- `&display=swap` on Google Fonts URL ✅
- Non-render-blocking with `media="print" onload="this.media='all'"` ✅

---

## FIX P9 — PostgreSQL Connection Pooling
**Already configured — skipping.** ✅

`extra: { max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 30000 }` in `typeorm.config.ts`.

---

## FIX P10 — Cache-Control Headers for Static Assets
**Layer:** NestJS | **Impact:** MEDIUM | **Effort:** 10 min

### Problem
No Cache-Control headers on static file responses. Repeat visits re-download everything.

### Files
- `smart-farm-backend/src/main.ts`

### Steps
Add in `main.ts` after `app.use(compression())`:

```typescript
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

// Change NestFactory.create to:
const app = await NestFactory.create<NestExpressApplication>(AppModule, { ... });

// Add static asset serving with cache headers:
app.useStaticAssets(join(__dirname, '..', 'public'), {
  maxAge: '1y',
  immutable: true,
});
```

> **Note:** Angular's `outputHashing: "all"` ensures safe long-term caching because every file gets a unique hash on each build.

### Expected: Repeat page visits fully served from browser cache

---

## FIX P11 — SSR Setup
**Layer:** Angular + NestJS | **Impact:** HIGH | **Effort:** 30 min

### Problem
SSR is not configured. This is the single largest possible performance gain.

### Steps
1. Run in the Angular project: `cd smart-farm-frontend && ng add @angular/ssr`
2. This will update:
   - `angular.json` (server target)
   - `app.config.ts` with `provideClientHydration()`
   - Create `server.ts`
3. Update NestJS to serve Angular SSR output
4. Update Dockerfile accordingly

### Expected: LCP -1-2s, TTFB dramatically improved, PageSpeed +15-25 pts

> ⚠️ This is a complex change that may require debugging. Implement after all other fixes.

---

## FIX P12 — ValidationPipe disableErrorMessages in Production
**Layer:** NestJS | **Impact:** LOW | **Effort:** 2 min

### Files
- `smart-farm-backend/src/main.ts`

### BEFORE
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### AFTER
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### Expected: Prevents leaking validation structure in production error responses

---

## Summary Table

| Fix | Status | Files Changed | Metric Improved |
|-----|--------|---------------|-----------------|
| P1 | 🔧 TODO | package.json | Bundle Size |
| P2 | 🔧 TODO | angular.json | Bundle Size |
| P3 | ✅ SKIP | — | Compression |
| P4 | ✅ SKIP (set up UptimeRobot manually) | — | TTFB |
| P5 | ✅ SKIP | — | Bundle Size |
| P6 | 🔧 TODO | Component .html/.ts files | LCP / CLS |
| P7 | ✅ SKIP | — | Bundle Size |
| P8 | ✅ SKIP | — | FCP |
| P9 | ✅ SKIP | — | API Response |
| P10 | 🔧 TODO | main.ts | Repeat Visits |
| P11 | 🔧 TODO (complex) | Multiple files | LCP / TTFB |
| P12 | 🔧 TODO | main.ts | Best Practices |

---

> **Phase 2 guide complete. Proceed with implementation.**
