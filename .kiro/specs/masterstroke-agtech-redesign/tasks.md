# Implementation Plan — FEEDIN Masterstroke AgTech Redesign

- [ ] 1. Add CSS design tokens and shared SCSS variables
  - Add CSS custom properties (`--color-online`, `--color-warning`, `--color-critical`, `--header-tier1-height`, `--header-tier2-height`, `--header-total-height`, `--mobile-bottom-nav-height`, `--bento-card-min-height`, `--bento-card-radius`, `--fab-size`) to `src/styles.scss` or a dedicated `_design-tokens.scss` partial
  - Add dark-theme overrides for tier backgrounds
  - _Requirements: 1.1, 1.2, 5.2, 5.3, 5.4_

- [ ] 2. Extend NavItem interface and update navItems array in HeaderComponent
  - Add `bentoIcon?: string` and `bentoColor?: string` fields to the `NavItem` interface in `header.component.ts`
  - Populate `bentoIcon` and `bentoColor` for all 7 nav items
  - Add `bentoNavItems` computed getter returning items with `priority === 'secondary'` plus Zones, Settings, Profile
  - _Requirements: 3.4, 3.5_

- [ ] 3. Implement Dual-Tier desktop header layout (HTML + SCSS)
  - Refactor `header.component.html` to split the single `.header-content` div into two tiers: `.header-tier--context` (logo, farm selector, utility cluster) and `.header-tier--nav` (7 nav links)
  - Update `header.component.scss` to style Tier 1 with `background: var(--color-tier1-bg)` and Tier 2 with glassmorphism/light-grey background
  - Apply `display: flex` with `justify-content: space-between` to each tier
  - Set `--header-tier1-height: 56px` and `--header-tier2-height: 48px`; apply `padding-top: var(--header-total-height)` to the main content wrapper
  - Add 4px vibrant green underline active state to nav links using `border-bottom: var(--nav-active-underline)` and `font-weight: 600` when `isRouteActive(item.route)` is true
  - Hide Dual-Tier layout on viewports ≤ 1024px via `@media (max-width: 1024px) { display: none }`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ]* 3.1 Write property test for active nav route matching
  - **Property 8: Active nav underline matches current route**
  - Use fast-check to generate random route strings; assert `isRouteActive(route)` returns true for at most one nav item
  - Tag: `// Feature: masterstroke-agtech-redesign, Property 8: Active nav underline matches current route`
  - **Validates: Requirements 1.4**

- [ ] 4. Implement 4-pillar mobile bottom tab bar (HTML + SCSS)
  - Replace the existing 7-item `.mobile-bottom-nav` in `header.component.html` with a 4-tab bar: Dashboard, Actions Hub, Equipment Hub, More (Bento)
  - Each tab must have `min-height: 56px`, `min-width: 64px`, icon + label layout
  - Apply `color: var(--color-online)` to the active tab icon and label
  - Show only on `@media (max-width: 768px)`
  - Equipment Hub tab navigates to `/devices`
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 5. Implement Bento Grid Overlay (HTML + SCSS + TS)
  - Add `showBentoMenu = false` property to `HeaderComponent`
  - Add `toggleBentoMenu()` and `closeBentoMenu()` methods
  - Add Bento Grid Overlay markup to `header.component.html`: full-screen overlay div with `display: grid; grid-template-columns: repeat(2, 1fr)` containing cards for secondary nav items
  - Each card: `min-height: var(--bento-card-min-height)`, `border-radius: var(--bento-card-radius)`, elevated white card style, large icon, label
  - Wire the "More" tab to `toggleBentoMenu()`; wire each card to `navigateTo(item.route); closeBentoMenu()`
  - Add escape key handler to close overlay
  - _Requirements: 3.4, 3.5, 3.6_

- [ ]* 5.1 Write property test for Bento overlay toggle idempotence
  - **Property 5: Bento overlay opens and closes cleanly**
  - Use fast-check to generate random initial boolean states; toggle twice; assert state is restored
  - Tag: `// Feature: masterstroke-agtech-redesign, Property 5: Bento overlay opens and closes cleanly`
  - **Validates: Requirements 3.4**

- [ ] 6. Implement Action FAB (HTML + SCSS)
  - Add `.action-fab` anchor element to `header.component.html` with `routerLink="/actions"`, shown only when `isAuthenticated() && isMobile()`
  - Style: `position: fixed`, `bottom: calc(var(--mobile-bottom-nav-height) + 16px)`, `right: 16px`, `width: var(--fab-size)`, `height: var(--fab-size)`, `background: var(--color-online)`, white bolt icon, `border-radius: 50%`, `z-index: 1001`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Extend Farm Selector modal with Zone Status Teaser
  - Add `ZoneStatusSummary` interface (`{ healthy: number; warning: number; critical: number }`) to `header.component.ts`
  - Add `farmZoneCache = signal<Map<string, ZoneStatusSummary>>(new Map())` property
  - Add `loadZoneStatusForFarm(farm: Farm)` method that calls `ZonesService.getFarmDashboard(farm.farm_id)` and computes healthy/warning/critical counts from zone alert data, storing results in `farmZoneCache`
  - Call `loadZoneStatusForFarm()` for each farm when the modal opens
  - Update `header.component.html` farm card markup to include a zone teaser row showing colored dot + count for each status
  - _Requirements: 2.1, 2.2_

- [ ]* 7.1 Write property test for zone status teaser counts
  - **Property 7: Zone status teaser counts are non-negative**
  - Use fast-check to generate random zone aggregation objects; assert healthy/warning/critical ≥ 0 and sum equals total zones
  - Tag: `// Feature: masterstroke-agtech-redesign, Property 7: Zone status teaser counts are non-negative`
  - **Validates: Requirements 2.2**

- [ ]* 7.2 Write property test for farm selector scroll lock symmetry
  - **Property 6: Farm selector modal scroll lock is symmetric**
  - Generate random sequences of `toggleFarmSelector()` / `closeFarmSelector()` calls; assert `document.body.style.overflow` matches `showFarmSelector` state
  - Tag: `// Feature: masterstroke-agtech-redesign, Property 6: Farm selector modal scroll lock is symmetric`
  - **Validates: Requirements 2.6**

- [ ]* 7.3 Write property test for farm search filter consistency
  - **Property for 2.4: Farm filter returns only matching farms**
  - Use fast-check to generate random farm arrays and query strings; call `filterFarms()` logic; assert every returned farm's name or location contains the query (case-insensitive)
  - Tag: `// Feature: masterstroke-agtech-redesign, Property 2.4: Farm filter returns only matching farms`
  - **Validates: Requirements 2.4**

- [ ] 8. Update dashboard component template for zero static data
  - Audit `dashboard.component.html` and remove any hardcoded farm names, device counts, or sensor values
  - Ensure farm name is rendered exclusively via `{{ getFarmDisplayName() }}`
  - Ensure all device count displays use `{{ devices.length }}`, `{{ getDeviceStatusCount('online') }}`, etc.
  - Ensure all sensor reading displays are bound to `recentReadings` array items
  - Add loading skeleton markup (`*ngIf="isLoading"`) for KPI cards, zone section, and weather panel
  - Apply status color classes using design token variables: `[class.status-online]="device.status === 'online'"` etc.
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

- [ ]* 8.1 Write property test for device status count invariant
  - **Property 3: Device status counts are consistent**
  - Use fast-check to generate random device arrays with random statuses; assert `online + offline + maintenance === devices.length`
  - Tag: `// Feature: masterstroke-agtech-redesign, Property 3: Device status counts are consistent`
  - **Validates: Requirements 6.2**

- [ ]* 8.2 Write property test for online percentage bounds
  - **Property 4: Online percentage is bounded**
  - Use fast-check to generate random non-empty device arrays; assert `getOnlinePercentage()` ∈ [0, 100]
  - Tag: `// Feature: masterstroke-agtech-redesign, Property 4: Online percentage is bounded`
  - **Validates: Requirements 6.2**

- [ ]* 8.3 Write property test for zone filter purity
  - **Property for 6.6: getFilteredZones returns only matching zones**
  - Use fast-check to generate random zone dashboard data and selected zone IDs; assert all returned zones match the selected zone ID when a zone is selected, or all zones are returned when none is selected
  - Tag: `// Feature: masterstroke-agtech-redesign, Property 6.6: getFilteredZones returns only matching zones`
  - **Validates: Requirements 6.6**

- [ ] 9. Implement RTL layout support for new header tiers
  - Ensure `.header-tier--context` and `.header-tier--nav` apply `flex-direction: row-reverse` when `[class.rtl]="isRTL()"` is set on the host
  - Ensure `.mobile-bottom-nav` and `.bento-overlay` apply RTL mirroring
  - Verify all nav labels use `getNavLabel(item.translationKey)` — no hardcoded English strings
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 10. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Apply sunlight-ready contrast and status color classes to dashboard
  - Add SCSS rules for `.status-online { color: var(--color-online) }`, `.status-warning { color: var(--color-warning) }`, `.status-critical { color: var(--color-critical) }` to `dashboard.component.scss`
  - Apply these classes to device status badges, sensor alert indicators, and KPI card status badges
  - Verify secondary label text meets 4.5:1 contrast ratio against card backgrounds in both light and dark themes
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 12. Final Checkpoint — Ensure all tests pass, ask the user if questions arise.
