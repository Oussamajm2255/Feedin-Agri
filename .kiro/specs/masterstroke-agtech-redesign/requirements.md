# Requirements Document

## Introduction

This document defines the requirements for the FEEDIN AgTech platform UI/UX redesign — a "Masterstroke" overhaul targeting the header navigation system and dashboard component. The goal is to eliminate header overlap/collision issues, implement a Dual-Tier desktop command bar, replace the 7-item mobile bottom bar with a 4-pillar Bento-Command navigation system, and update the dashboard to display fully dynamic, real-time farm data. All UI elements must be sunlight-readable, farmer-rugged, and production-ready.

## Glossary

- **FEEDIN**: The agricultural IoT platform being redesigned.
- **Header**: The top navigation component (`app-header`) rendered on all authenticated pages.
- **Dual-Tier Command Bar**: A two-row desktop header — a Global Context Tier (top) and a Navigation Tier (bottom).
- **Global Context Tier**: The top header row containing branding, the Farm Selector, and the utility cluster (alerts, theme, language, profile).
- **Navigation Tier**: The bottom header row containing the 7 primary navigation links.
- **Farm Selector**: A dropdown trigger that opens a modal/panel listing available farms with zone status teasers.
- **Zone Status Teaser**: A compact summary of zone health/status shown inside the Farm Selector modal for each farm.
- **Bento-Command Navigation**: The mobile 4-pillar bottom tab bar replacing the current 7-item bar.
- **Bento Grid Overlay**: A full-screen grid panel opened by the "Plus/More" tab, mapping secondary navigation items into fat-finger-friendly cards.
- **Action FAB**: A Floating Action Button providing one-tap access to the Actions route, always thumb-reachable on mobile.
- **Equipment Hub**: A consolidated mobile tab combining Devices, Sensors, and Live Readings into a single technical view.
- **Active/Online State**: Visual indicator using vibrant green (#2ECC71) for online devices and active nav items.
- **Warning Amber**: Color used for sensor threshold warnings (e.g., #F39C12).
- **Critical Red**: Color used for critical sensor alerts (e.g., #E74C3C).
- **Glassmorphism**: A translucent frosted-glass visual style applied to the Navigation Tier background.
- **Dashboard**: The `app-dashboard` component displaying farm health metrics, device status, sensor readings, weather, and zone data.
- **Dynamic Variable**: Any data point (farm name, device count, sensor reading) sourced from a service or API — never hardcoded.
- **FarmManagementService**: The Angular service managing farm selection state across the application.
- **ZonesService**: The Angular service providing zone data and dashboard aggregations.
- **BreakpointService**: The Angular service providing reactive mobile/tablet/desktop breakpoint signals.
- **RTL**: Right-to-left text direction, required for Arabic (ar-TN) language support.

---

## Requirements

### Requirement 1

**User Story:** As a farm operator using a desktop browser, I want a two-tier header that separates branding/context from navigation, so that I never experience overlap or collision between header elements.

#### Acceptance Criteria

1. THE Header SHALL render a Global Context Tier as the top row with a background color of Deep Matte Charcoal (#121212), containing the FEEDIN logo on the left, the Farm Selector in the center, and the utility cluster (alerts, dark mode toggle, language switcher, user profile) on the right.
2. THE Header SHALL render a Navigation Tier as the bottom row with a high-contrast light grey or translucent glassmorphism background, containing all 7 primary navigation links in a horizontal flex container with 32px horizontal spacing between items.
3. WHEN the viewport width is 1025px or greater, THE Header SHALL display the Dual-Tier layout and SHALL NOT display the mobile bottom tab bar.
4. WHEN a navigation link is active, THE Navigation Tier SHALL indicate the active state with a 4px vibrant green (#2ECC71) underline and a font-weight shift to bold or semi-bold.
5. THE Header SHALL maintain zero overlap between the Global Context Tier and the Navigation Tier at all supported viewport widths above 1024px.
6. WHEN the page content scrolls, THE Header SHALL remain fixed at the top of the viewport and SHALL NOT obscure page content by applying appropriate top padding to the main content area equal to the combined height of both tiers.

---

### Requirement 2

**User Story:** As a farm operator, I want a Farm Selector in the header that shows a zone status teaser, so that I can switch farms and get an at-a-glance zone health overview without navigating away.

#### Acceptance Criteria

1. WHEN a user clicks the Farm Selector trigger, THE Header SHALL open a modal/panel that lists all farms available to the authenticated user, sourced dynamically from FarmManagementService.
2. WHEN the Farm Selector modal is open, THE Header SHALL display a Zone Status Teaser for each farm card, showing the count of healthy, warning, and critical zones sourced from ZonesService.
3. WHEN a user selects a farm from the modal, THE Header SHALL call FarmManagementService.selectFarm() with the chosen farm and close the modal.
4. WHEN the Farm Selector modal is open, THE Header SHALL include a search input that filters the farm list in real time based on farm name or location.
5. IF no farms match the search query, THEN THE Header SHALL display an empty state message within the modal.
6. WHEN the Farm Selector modal is open, THE Header SHALL prevent body scroll and SHALL restore body scroll upon modal close.

---

### Requirement 3

**User Story:** As a farmer using a mobile device in the field, I want a 4-pillar bottom navigation bar, so that I can reach the most critical functions with one thumb tap without being overwhelmed by 7 items.

#### Acceptance Criteria

1. WHEN the viewport width is 768px or less, THE Header SHALL display a 4-pillar bottom tab bar containing: Dashboard, Actions Hub, Equipment Hub, and a "More" (Bento) tab — and SHALL NOT display the desktop Dual-Tier header navigation row.
2. THE Bottom Tab Bar SHALL render each tab with a minimum touch target height of 56px and a minimum touch target width of 64px to meet fat-finger usability standards.
3. WHEN a bottom tab is active, THE Bottom Tab Bar SHALL indicate the active state using the vibrant green (#2ECC71) color on the tab icon and label.
4. WHEN the "More" tab is tapped, THE Header SHALL open a full-screen Bento Grid Overlay containing secondary navigation items (Crops, Zones, Sensors, Live Readings, Settings, Profile) as cards in a 2-column CSS Grid layout.
5. WHEN the Bento Grid Overlay is open, THE Header SHALL render each card with a minimum height of 120px, 24px border radius, elevated white card style, and a large high-stroke icon.
6. WHEN a card in the Bento Grid Overlay is tapped, THE Header SHALL navigate to the corresponding route and close the overlay.

---

### Requirement 4

**User Story:** As a farmer in the field, I want an always-visible Action FAB on mobile, so that I can trigger automated sequences with a single thumb tap without hunting through menus.

#### Acceptance Criteria

1. WHILE the user is authenticated and the viewport width is 768px or less, THE Header SHALL render a Floating Action Button (FAB) that navigates to the /actions route.
2. THE Action FAB SHALL be positioned fixed at the bottom-right of the viewport, above the bottom tab bar, with a minimum size of 56x56px.
3. THE Action FAB SHALL use the vibrant green (#2ECC71) background color and a high-contrast white icon.
4. WHEN the Action FAB is tapped, THE Header SHALL navigate to the /actions route.
5. THE Action FAB SHALL remain visible and accessible regardless of page scroll position.

---

### Requirement 5

**User Story:** As a farmer working outdoors in bright sunlight, I want high-contrast UI elements with clear status indicators, so that I can read sensor data and device states without squinting or misreading alerts.

#### Acceptance Criteria

1. THE Header and Dashboard SHALL use a minimum contrast ratio of 4.5:1 for all secondary text labels against their background colors, in both light and dark themes.
2. WHEN a device or sensor status is "online" or "active", THE Dashboard SHALL display the status indicator using vibrant green (#2ECC71).
3. WHEN a sensor reading crosses a warning threshold, THE Dashboard SHALL display the alert indicator using Warning Amber (#F39C12).
4. WHEN a sensor reading crosses a critical threshold, THE Dashboard SHALL display the alert indicator using Critical Red (#E74C3C).
5. THE Header Navigation Tier active state indicator SHALL use the 4px vibrant green (#2ECC71) underline with sufficient contrast against both light and glassmorphism backgrounds.

---

### Requirement 6

**User Story:** As a developer maintaining the FEEDIN platform, I want all dashboard data points to be dynamic variables bound to services, so that the UI never displays hardcoded farm names, device counts, or sensor readings.

#### Acceptance Criteria

1. THE Dashboard SHALL source the displayed farm name exclusively from FarmManagementService.getFarmDisplayName() and SHALL NOT contain any hardcoded farm name strings in the template.
2. THE Dashboard SHALL source device counts, online/offline/maintenance breakdowns, and device lists exclusively from ApiService responses bound to component properties.
3. THE Dashboard SHALL source sensor readings exclusively from ApiService.getSensorReadings() and SHALL NOT display placeholder or mock sensor values.
4. THE Dashboard SHALL source weather data exclusively from WeatherService and SHALL display a loading state while the weather API call is in progress.
5. WHEN the selected farm changes via FarmManagementService, THE Dashboard SHALL reload all farm-specific data (devices, zones, weather, sensor readings) for the newly selected farm.
6. THE Dashboard SHALL source zone data exclusively from ZonesService and SHALL display zone cards dynamically based on the zones returned for the selected farm.

---

### Requirement 7

**User Story:** As a user switching between Arabic, French, and English, I want the header and dashboard to fully support RTL layout and translated labels, so that the interface feels native in my language.

#### Acceptance Criteria

1. WHEN the active language is ar-TN, THE Header SHALL apply RTL layout direction to all header tiers, reversing the order of logo/farm-selector/utility-cluster and mirroring flex directions.
2. WHEN the active language is ar-TN, THE Header SHALL apply RTL layout direction to the bottom tab bar and Bento Grid Overlay.
3. THE Header navigation labels SHALL be sourced from LanguageService.t() using the defined translation keys and SHALL NOT contain hardcoded English strings in the template.
4. THE Dashboard metric labels, status strings, and section headings SHALL be sourced from LanguageService.t() using defined translation keys.
5. WHEN the language changes, THE Header and Dashboard SHALL update all translated strings reactively without requiring a page reload.

---

### Requirement 8

**User Story:** As a developer, I want the header and dashboard to use clean, maintainable CSS with CSS Grid for the Bento layout and Flexbox for the header tiers, so that the responsive transition between desktop and mobile is handled via media queries without JavaScript layout hacks.

#### Acceptance Criteria

1. THE Header SHALL implement the Dual-Tier desktop layout using CSS Flexbox with no JavaScript-driven layout switching for the desktop tier arrangement.
2. THE Bento Grid Overlay SHALL implement the 2-column card grid using CSS Grid (grid-template-columns: repeat(2, 1fr)).
3. THE Header SHALL implement the responsive breakpoint transition between the Dual-Tier desktop layout and the 4-pillar mobile bottom bar exclusively via CSS media queries at the 768px and 1024px breakpoints.
4. THE Header SHALL NOT use inline styles for layout-critical properties (widths, flex directions, grid templates) that are already handled by CSS classes and media queries.
5. WHEN the viewport transitions between mobile and desktop breakpoints, THE Header SHALL switch layouts without a visible flash or layout shift.
