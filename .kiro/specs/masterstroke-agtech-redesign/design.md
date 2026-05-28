# Design Document — FEEDIN Masterstroke AgTech Redesign

## Overview

This design covers the full-stack UI/UX overhaul of the FEEDIN platform's header navigation and dashboard components. The two primary deliverables are:

1. **Dual-Tier Command Bar** — a two-row desktop header that eliminates the current single-row collision problem.
2. **Bento-Command Mobile Navigation** — a 4-pillar bottom tab bar with a full-screen Bento Grid Overlay replacing the unusable 7-item mobile bar.

The dashboard is updated to be a fully dynamic template — every data point is a bound variable from a service.

---

## Architecture

### Component Hierarchy

```
AppComponent
└── HeaderComponent (app-header)          ← Primary redesign target
    ├── Global Context Tier               ← Top row (desktop only)
    │   ├── Logo
    │   ├── Farm Selector Trigger
    │   └── Utility Cluster (theme, lang, alerts, profile)
    ├── Navigation Tier                   ← Bottom row (desktop only)
    │   └── 7 nav links (flex)
    ├── Farm Selector Modal               ← Shared desktop + mobile
    ├── Mobile Top Bar                    ← Logo + Farm Selector (mobile)
    ├── Mobile Bottom Tab Bar             ← 4-pillar (mobile only)
    │   ├── Dashboard tab
    │   ├── Actions tab
    │   ├── Equipment Hub tab
    │   └── More (Bento) tab
    ├── Bento Grid Overlay                ← Full-screen (mobile only)
    └── Action FAB                        ← Fixed (mobile only)

DashboardComponent (app-dashboard)        ← Secondary redesign target
    ├── KPI Cards Section                 ← Dynamic device stats
    ├── Zone Dashboard Section            ← Dynamic zone data
    ├── Weather Panel                     ← Dynamic weather API
    ├── Digital Twin Panel                ← Existing component
    └── Recent Readings Panel             ← Dynamic sensor data
```

### Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| ≥ 1025px | Dual-Tier desktop header, no bottom bar |
| 769px – 1024px | Tablet: single-tier header, condensed nav |
| ≤ 768px | Mobile: top bar (logo + farm selector) + 4-pillar bottom tab bar + Action FAB |

---

## Components and Interfaces

### HeaderComponent Changes

**New template structure (desktop):**
```html
<header class="feedin-header feedin-header--desktop">
  <!-- Tier 1: Global Context -->
  <div class="header-tier header-tier--context">
    <div class="tier-logo">...</div>
    <div class="tier-farm-selector">...</div>
    <div class="tier-utility">...</div>
  </div>
  <!-- Tier 2: Navigation -->
  <nav class="header-tier header-tier--nav">
    <div class="nav-links">...</div>
  </nav>
</header>

<!-- Mobile top bar -->
<header class="feedin-header feedin-header--mobile">
  <div class="mobile-top-bar">...</div>
</header>

<!-- Mobile bottom tab bar -->
<nav class="mobile-bottom-nav">
  <a class="tab tab--dashboard">...</a>
  <a class="tab tab--actions">...</a>
  <a class="tab tab--equipment">...</a>
  <button class="tab tab--more">...</button>
</nav>

<!-- Bento Grid Overlay -->
<div class="bento-overlay" [class.open]="showBentoMenu">
  <div class="bento-grid">...</div>
</div>

<!-- Action FAB -->
<a class="action-fab" routerLink="/actions">...</a>
```

**New component properties:**
```typescript
showBentoMenu = false;          // controls Bento Grid Overlay
bentoNavItems: NavItem[];       // secondary items for Bento grid
primaryMobileItems: NavItem[];  // 3 fixed tabs (dashboard, actions, equipment)
```

**Equipment Hub tab** consolidates `/devices`, `/sensors`, `/sensor-readings` — tapping it navigates to `/devices` as the primary entry point, with the Equipment Hub page providing sub-tabs.

### Farm Selector Modal — Zone Status Teaser

The existing modal is extended to show zone health per farm. Each farm card gains a `ZoneStatusTeaser` sub-component:

```typescript
interface ZoneStatusSummary {
  healthy: number;
  warning: number;
  critical: number;
}
```

The teaser is loaded lazily when the modal opens, using `ZonesService.getFarmDashboard(farmId)`.

### DashboardComponent Changes

No new services are introduced. The component already injects all required services. Changes are:
- Template binds all data points to existing component properties
- Status color classes use the design token variables (`--color-online`, `--color-warning`, `--color-critical`)
- Loading skeletons shown while `isLoading === true`
- Farm name displayed via `getFarmDisplayName()` — never hardcoded

---

## Data Models

### NavItem (existing, extended)

```typescript
export interface NavItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  svgPath: string;
  fontAwesomeIcon: string;
  priority: 'primary' | 'secondary';
  translationKey: string;
  bentoIcon?: string;       // NEW: large icon class for Bento card
  bentoColor?: string;      // NEW: accent color for Bento card
}
```

### ZoneStatusSummary (new, local to header)

```typescript
interface ZoneStatusSummary {
  healthy: number;
  warning: number;
  critical: number;
}
```

### Design Tokens (CSS custom properties)

```scss
:root {
  --color-online:   #2ECC71;   // Active/Online state
  --color-warning:  #F39C12;   // Warning Amber
  --color-critical: #E74C3C;   // Critical Red
  --color-tier1-bg: #121212;   // Global Context Tier background
  --color-tier2-bg: rgba(249, 250, 251, 0.95); // Nav Tier (light)
  --color-tier2-bg-dark: rgba(15, 23, 42, 0.95); // Nav Tier (dark)
  --nav-active-underline: 4px solid var(--color-online);
  --header-tier1-height: 56px;
  --header-tier2-height: 48px;
  --header-total-height: calc(var(--header-tier1-height) + var(--header-tier2-height));
  --mobile-bottom-nav-height: 64px;
  --bento-card-min-height: 120px;
  --bento-card-radius: 24px;
  --fab-size: 56px;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Farm name is never a static string

*For any* authenticated dashboard state, the farm name displayed in the header Farm Selector trigger and in the dashboard title SHALL equal the value returned by `FarmManagementService.getFarmDisplayName()` — never a hardcoded literal.

**Validates: Requirements 6.1**

---

### Property 2: Farm selection propagates to dashboard

*For any* farm selected via `FarmManagementService.selectFarm(farm)`, the dashboard's `devices`, `recentReadings`, `weatherData`, and `zoneDashboardData` SHALL be reloaded for that farm's `farm_id` within one change-detection cycle.

**Validates: Requirements 6.5**

---

### Property 3: Device status counts are consistent

*For any* array of devices loaded from the API, the sum of `getDeviceStatusCount('online') + getDeviceStatusCount('offline') + getDeviceStatusCount('maintenance')` SHALL equal `devices.length`.

**Validates: Requirements 6.2**

---

### Property 4: Online percentage is bounded

*For any* non-empty device array, `getOnlinePercentage()` SHALL return a value in the range [0, 100] inclusive.

**Validates: Requirements 6.2**

---

### Property 5: Bento overlay opens and closes cleanly

*For any* initial state of `showBentoMenu`, toggling it twice SHALL return `showBentoMenu` to its original value (idempotent round-trip).

**Validates: Requirements 3.4**

---

### Property 6: Farm selector modal scroll lock is symmetric

*For any* sequence of `toggleFarmSelector()` calls, `document.body.style.overflow` SHALL be `'hidden'` when `showFarmSelector === true` and `''` when `showFarmSelector === false`.

**Validates: Requirements 2.6**

---

### Property 7: Zone status teaser counts are non-negative

*For any* farm dashboard aggregation returned by `ZonesService.getFarmDashboard()`, the healthy, warning, and critical zone counts SHALL each be ≥ 0, and their sum SHALL equal the total number of zones in the aggregation.

**Validates: Requirements 2.2**

---

### Property 8: Active nav underline matches current route

*For any* navigation to a route, `isRouteActive(route)` SHALL return `true` for exactly the nav item whose route is a prefix of the current URL, and `false` for all others.

**Validates: Requirements 1.4**

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Weather API fails | Show error message in weather panel; do not block rest of dashboard |
| Farm devices API fails | Show empty device list with error toast; `isLoading` set to `false` |
| Zone dashboard API fails | Show "No zones configured" fallback; `zoneDashboardData` set to `null` |
| Farm selector — no farms | Show empty state message inside modal |
| Farm selector — search no results | Show "No farms match" message inside modal |
| Logo image load error | `onLogoError()` hides `<img>` and shows fallback `<mat-icon>` |

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples and edge cases:

- `getOnlinePercentage()` returns 0 when `devices = []`
- `getOnlinePercentage()` returns 100 when all devices are online
- `isRouteActive('/dashboard')` returns `true` when `currentRoute = '/dashboard/overview'`
- `toggleFarmSelector()` sets `showFarmSelector = true` on first call, `false` on second
- `getFarmDeviceCount()` returns correct count filtered by `farm_id`
- `generateAIInsights()` returns at least one insight when `weatherData` is populated
- `getDeviceStatusCount()` returns 0 for unknown status strings

### Property-Based Tests

The project uses **fast-check** (TypeScript/Angular compatible) as the property-based testing library.

Each property-based test SHALL:
- Run a minimum of **100 iterations**
- Be tagged with a comment in the format: `// Feature: masterstroke-agtech-redesign, Property {N}: {property_text}`
- Reference the correctness property number from this design document

**Property test mapping:**

| Property | Test Description |
|---|---|
| Property 3 | Generate random device arrays with random statuses; assert status count sum equals array length |
| Property 4 | Generate random device arrays; assert `getOnlinePercentage()` ∈ [0, 100] |
| Property 5 | Generate random boolean initial state; toggle twice; assert state restored |
| Property 6 | Generate random call sequences; assert scroll lock symmetry |
| Property 7 | Generate random zone aggregations; assert counts ≥ 0 and sum equals total |
| Property 8 | Generate random route strings; assert exactly one nav item matches |

Properties 1 and 2 are integration-level properties validated via Angular component harness tests rather than pure unit property tests.
