# Smart Farm Dashboard Upgrade Plan (FeedIn)

## Vision
Transform the current technical IoT dashboard into a **mobile‑first, farmer decision dashboard** that answers in under 10 seconds:
- Is my farm safe?
- What should I do today?
- How are my crops performing?
- Am I saving money and improving yield?

The dashboard must feel **premium, calm, and actionable**, not saturated or overly technical.

---

# Product Principles
1. Dashboard = summary, not analytics.
2. Show actions > raw data.
3. Show risks before metrics.
4. Max 6 main widgets on mobile.
5. Everything detailed lives in dedicated pages.

---

# Target Layout (Mobile‑First)

## Screen Priority Order
1. Safety (Alerts)
2. Decisions (Today’s actions)
3. Reassurance (Farm status)
4. Motivation (Savings & performance)
5. Context (Weather + tasks)
6. Technical info (collapsed footer)

---

# New Dashboard Sections

## 1) Today’s Farm Briefing (AI Summary)
**Goal:** Immediate understanding of the farm state.

### UI
Large hero card with AI icon.
Bullet list of insights.

### Example content
- Nutrient levels slightly low → refill in 48h
- High humidity risk → increase ventilation
- Irrigation optimized → water saved 120L
- Harvest window for lettuce in 3 days

### Backend needs
- Rule engine service (threshold + simple heuristics)
- Aggregated daily insights endpoint

API:
`GET /dashboard/briefing`

---

## 2) Priority Alerts
**Goal:** Risk prevention.

### Alert types
- Critical (temperature, pump failure)
- Warning (disease risk, humidity)
- Info (trend anomalies)

### UI rules
- Max 3 alerts shown
- Color coded
- Tap → alerts page

### Backend needs
Alert engine:
- Sensor thresholds
- Trend anomaly detection
- Device offline detection

API:
`GET /alerts/active`

---

## 3) Farm Status Card
**Goal:** Reassurance.

### Metrics
- Crop health score (0–100)
- System status
- Last sensor sync

### Crop Health Formula (v1)
Weighted score based on:
- Temperature range
- Humidity range
- pH range
- EC range
- Light hours

API:
`GET /farm/health-score`

---

## 4) Today’s Actions (AI Recommendations)
**Goal:** Convert data → decisions.

### Examples
- Increase ventilation 10am–2pm
- Reduce irrigation by 10%
- Add nutrients within 48h

### Backend needs
Recommendation service using:
- Weather forecast
- Sensor data
- Crop profiles

API:
`GET /recommendations/today`

---

## 5) Savings & Efficiency
**Goal:** Show ROI.

### Metrics
- Water saved
- Energy efficiency
- Yield improvement
- Estimated monthly savings

### Backend needs
Analytics service aggregating:
- Irrigation usage
- Lighting usage
- Historical baseline

API:
`GET /analytics/savings`

---

## 6) Weather Impact Card
**Goal:** Translate weather → farm impact.

### Instead of raw weather show
- Growth impact
- Ventilation advice
- Lighting savings potential

API:
`GET /weather/impact`

---

## 7) Tasks & Harvest Planner
**Goal:** Daily planning.

### Examples
- Harvest lettuce in 3 days
- Clean filters in 2 days
- Refill nutrients tomorrow

API:
`GET /tasks/upcoming`

---

## 8) Technical Footer (Collapsed)
Move existing widgets here:
- Devices online
- System health
- Farm info

---

# Angular Frontend Architecture (Angular 20+)

## Feature Modules
Create dashboard domain module:

```
/dashboard
  /components
  /widgets
  /services
  dashboard.page.ts
```

## Widgets Components
- farm-briefing-card
- alerts-card
- farm-status-card
- recommendations-card
- savings-card
- weather-impact-card
- tasks-card
- technical-footer

Use **standalone components**.

## State Management
Use **Signals + RxJS interop**:
- dashboard.store.ts
- Fetch data in parallel.
- Cache responses.

## Data Loading Pattern
Use **forkJoin** for first load.
Lazy refresh every 5 min.

---

# NestJS Backend Architecture

## New Modules
- alerts-module
- recommendations-module
- analytics-module
- insights-module
- weather-module

### Suggested structure
```
modules/
  alerts/
  recommendations/
  analytics/
  insights/
  weather/
```

---

# Data Aggregation Layer
Create **DashboardAggregatorService**

Endpoint:
`GET /dashboard/overview`

Returns single payload:
```
{
  briefing,
  alerts,
  healthScore,
  recommendations,
  savings,
  weatherImpact,
  tasks
}
```

This reduces mobile API calls.

---

# UI/UX Premium Guidelines

## Visual
- Glass cards
- Soft shadows
- Green/teal accent colors
- Rounded corners (20px+)
- Micro animations (hover, loading)

## Mobile rules
- Single column layout
- Swipeable cards
- Sticky alerts
- Skeleton loaders

---

# Prompt for Antigravity (Angular + Nest)

Design and implement a mobile‑first Smart Farm Decision Dashboard using Angular 20+ frontend and NestJS backend.

The dashboard must prioritize:
1. Alerts
2. Daily actions
3. Farm health
4. Savings and performance

Create Angular standalone components for each dashboard widget and a DashboardAggregator endpoint in NestJS returning a single overview payload.

Implement services:
- Alerts service (threshold engine)
- Recommendation engine (rule‑based v1)
- Analytics service (water/energy savings)
- Weather impact service
- Insights generator service

Use Signals for state management and build a responsive mobile‑first layout with premium UI (glass cards, gradients, micro‑animations).

The dashboard must load from a single `/dashboard/overview` endpoint and refresh every 5 minutes.

---

# Implementation Roadmap

## Phase 1 – Backend foundations
- Aggregator endpoint
- Alerts engine
- Recommendations service

## Phase 2 – Frontend widgets
- New layout
- Mobile responsiveness

## Phase 3 – Analytics & savings
- Efficiency calculations

## Phase 4 – Polish
- Animations
- Skeleton loaders
- Performance optimization

---

This plan ensures the dashboard becomes farmer‑centric, actionable, and premium without becoming saturated.

