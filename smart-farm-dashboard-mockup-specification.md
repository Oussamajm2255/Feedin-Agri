# Smart Farm Dashboard Mobile-First Mockup Specification

## Document Overview
This document provides a detailed mockup specification for transforming the current IoT dashboard into a **mobile-first, farmer decision dashboard** that prioritizes actionable insights over raw data.

---

## 1. DESIGN VISION & PRINCIPLES

### Core Vision
Create a dashboard that answers in under 10 seconds:
- ✅ **Is my farm safe?**
- ✅ **What should I do today?**
- ✅ **How are my crops performing?**
- ✅ **Am I saving money and improving yield?**

### Design Philosophy
1. **Dashboard = Summary, Not Analytics** - Keep it concise
2. **Show Actions > Raw Data** - Farmers need decisions, not numbers
3. **Show Risks Before Metrics** - Safety first
4. **Max 6 Main Widgets on Mobile** - Avoid cognitive overload
5. **Everything Detailed Lives in Dedicated Pages** - Dashboard is for quick scanning

### Emotional Tone
- **Premium** - High-end, professional feel
- **Calm** - Not overwhelming or saturated
- **Actionable** - Clear next steps, not just information

---

## 2. MOBILE-FIRST LAYOUT SPECIFICATION

### Screen Priority Order (Mobile Viewport: 375x812)

```
┌─────────────────────────────┐
│ 1. SAFETY (Alerts)          │ ← Sticky at top, always visible
├─────────────────────────────┤
│ 2. DECISIONS (Actions)      │ ← AI recommendations
├─────────────────────────────┤
│ 3. REASSURANCE (Status)     │ ✅ Farm health overview
├─────────────────────────────┤
│ 4. MOTIVATION (Savings)     │ 📊 ROI & performance
├─────────────────────────────┤
│ 5. CONTEXT (Weather+Tasks)  │ 🌤️ Daily planning
├─────────────────────────────┤
│ 6. TECHNICAL (Footer)       │ ↓ Collapsed by default
└─────────────────────────────┘
```

### Responsive Breakpoints
```scss
$mobile: 375px - 480px;      // Primary mobile
$tablet-sm: 768px;           // Small tablet
$tablet: 1024px;             // Tablet
$desktop: 1440px;            // Desktop
```

### Mobile Layout Rules
- **Single column** layout on mobile (375px - 480px)
- **Swipeable cards** for horizontal navigation
- **Sticky alerts** at top of viewport
- **Skeleton loaders** during data fetch
- **Touch targets** minimum 44x44px
- **Thumb-friendly** spacing (16px minimum between interactive elements)

---

## 3. DASHBOARD SECTIONS DETAILED MOCKUP

### 3.1 Today's Farm Briefing (AI Summary)

#### Purpose
Immediate understanding of the farm state at a glance.

#### UI Specification

**Mobile Layout (375px)**
```
┌──────────────────────────────────────┐
│ 🤖 AI FARM INSIGHTS              ▼   │
├──────────────────────────────────────┤
│ ╭──────────────────────────────────╮ │
│ │  🌟 Good morning, Ahmed!        │ │
│ │                                  │ │
│ │  • Nutrient levels slightly     │ │
│ │    low → refill in 48h          │ │
│ │                                  │ │
│ │  • High humidity risk →         │ │
│ │    increase ventilation         │ │
│ │                                  │ │
│ │  • Irrigation optimized →       │ │
│ │    water saved 120L today       │ │
│ │                                  │ │
│ │  • Harvest window for lettuce   │ │
│ │    in 3 days                    │ │
│ │                                  │ │
│ │  [View Full Report →]           │ │
│ ╰──────────────────────────────────╯ │
└──────────────────────────────────────┘
```

**Desktop Layout (1440px)**
```
┌─────────────────────────────────────────────────────────┐
│ 🤖 AI FARM INSIGHTS                              [Expand]│
├─────────────────────────────────────────────────────────┤
│ ╭─────────────────────────────────────────────────────╮ │
│ │  🌟 Good morning, Ahmed! Here's your farm briefing: │ │
│ │                                                     │ │
│ │  ┌─────────────────┐  ┌──────────────────────────┐ │ │
│ │  │ ⚠️ Nutrients     │  │ 💧 Irrigation Optimized  │ │ │
│ │  │ Levels slightly  │  │ Water saved 120L today   │ │ │
│ │  │ low → refill     │  │ vs. last week: +15%      │ │ │
│ │  │ within 48h       │  │                          │ │ │
│ │  └─────────────────┘  └──────────────────────────┘ │ │
│ │                                                     │ │
│ │  ┌─────────────────┐  ┌──────────────────────────┐ │ │
│ │  │ 💨 Humidity Risk│  │ 🥬 Harvest Planning      │ │ │
│ │  │ Increase vent.   │  │ Lettuce ready in 3 days  │ │ │
│ │  │ 10am-2pm today   │  │ Optimal conditions met   │ │ │
│ │  └─────────────────┘  └──────────────────────────┘ │ │
│ │                                                     │ │
│ │  [View Detailed Analytics →]                        │ │
│ ╰─────────────────────────────────────────────────────╯ │
└─────────────────────────────────────────────────────────┘
```

#### Component Specs
- **Card Style**: Glass morphism with backdrop blur
- **Background**: `rgba(255, 255, 255, 0.8)` with `backdrop-filter: blur(10px)`
- **Border**: `1px solid rgba(255, 255, 255, 0.3)`
- **Border Radius**: `24px`
- **Padding**: `24px` mobile, `32px` desktop
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.08)`
- **Icon**: AI sparkles icon (custom SVG or Material `auto_awesome`)
- **Typography**:
  - Header: `20px` bold (mobile), `24px` (desktop)
  - Body: `14px` regular with `1.6` line-height
  - CTA: `14px` semi-bold with arrow icon

#### Color Palette
```scss
$briefing-bg: rgba(255, 255, 255, 0.8);
$briefing-border: rgba(16, 185, 129, 0.2);
$briefing-accent: #10b981; // Primary green
$briefing-text: #1f2937;
$briefing-text-secondary: #6b7280;
```

#### Backend Integration
```typescript
// API Endpoint
GET /dashboard/briefing

// Response Structure
{
  insights: [
    {
      type: 'warning' | 'info' | 'success',
      title: string,
      message: string,
      action?: string,
      timeWindow?: string
    }
  ],
  summary: string,
  generatedAt: ISO8601
}
```

#### Angular Component Structure
```typescript
@Component({
  selector: 'farm-briefing-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: './farm-briefing-card.component.html',
  styles: ['./farm-briefing-card.component.scss']
})
export class FarmBriefingCardComponent {
  @Input() insights: Insight[] = [];
  @Output() viewReport = new EventEmitter<void>();
  
  isExpanded = signal(false);
  
  constructor(private briefingService: BriefingService) {}
  
  // Fetch briefing data on init
  ngOnInit() {
    this.briefingService.getBriefing().subscribe(data => {
      this.insights.set(data.insights);
    });
  }
}
```

---

### 3.2 Priority Alerts

#### Purpose
Risk prevention - show critical issues requiring immediate attention.

#### Alert Types & Severity
```
🔴 CRITICAL (Red)     - Temperature extremes, pump failure
🟡 WARNING (Amber)    - Disease risk, humidity, nutrients  
ℹ️ INFO (Blue)        - Trend anomalies, scheduled maintenance
```

#### UI Specification

**Mobile Layout (375px)**
```
┌─────────────────────────────┐
│ ⚠️ ACTIVE ALERTS (2)        │
├─────────────────────────────┤
│ ╭─────────────────────────╮ │
│ │ 🔴 HIGH TEMP WARNING    │ │
│ │ Zone 3: Greenhouse A    │ │
│ │ 38.5°C exceeds 35°C     │ │
│ │ threshold               │ │
│ │ [Take Action] [Dismiss] │ │
│ ╰─────────────────────────╯ │
│                             │
│ ╭─────────────────────────╮ │
│ │ 🟡 HUMIDITY RISK        │ │
│ │ Zone 1: Seedling Area   │ │
│ │ 85% - Monitor closely   │ │
│ │ [View Details]          │ │
│ ╰─────────────────────────╯ │
│                             │
│ [View All Alerts →]         │
└─────────────────────────────┘
```

**Desktop Layout (1440px)**
```
┌──────────────────────────────────────────────┐
│ ⚠️ ACTIVE ALERTS (2)                 [Filter] │
├──────────────────────────────────────────────┤
│ ╭──────────────────────────────────────────╮ │
│ │ 🔴 CRITICAL                2 min ago     │ │
│ │ High Temperature Warning                 │ │
│ │ Zone 3: Greenhouse A - 38.5°C            │ │
│ │ Exceeds maximum threshold of 35°C        │ │
│ │                                          │ │
│ │ Recommended Action:                      │ │
│ │ • Increase ventilation immediately       │ │
│ │ • Activate cooling system                │ │
│ │                                          │ │
│ │ [✅ Acknowledge] [🔧 Take Action] [✕]     │ │
│ ╰──────────────────────────────────────────╯ │
│                                              │
│ ╭──────────────────────────────────────────╮ │
│ │ 🟡 WARNING                   15 min ago  │ │
│ │ High Humidity Risk                       │ │
│ │ Zone 1: Seedling Area - 85%              │ │
│ │ Fungal disease risk elevated             │ │
│ │                                          │ │
│ │ Recommended Action:                      │ │
│ │ • Increase air circulation               │ │
│ │ • Reduce misting frequency               │ │
│ │                                          │ │
│ │ [📊 View Details] [✅ Acknowledge] [✕]    │ │
│ ╰──────────────────────────────────────────╯ │
│                                              │
│ [View All Alerts (12) →]                     │
└──────────────────────────────────────────────┘
```

#### Component Specs
- **Max Alerts Shown**: 3 on mobile, 5 on desktop
- **Color Coding**:
  - Critical: `background: rgba(239, 68, 68, 0.1)`, `border: 2px solid #ef4444`
  - Warning: `background: rgba(245, 158, 11, 0.1)`, `border: 2px solid #f59e0b`
  - Info: `background: rgba(59, 130, 246, 0.1)`, `border: 2px solid #3b82f6`
- **Border Radius**: `16px`
- **Padding**: `20px`
- **Animations**: Slide-in from right with `300ms` ease-out
- **Sticky Behavior**: Top alert sticky on mobile scroll

#### Alert Card Structure
```html
<article class="alert-card" [class]="alert.severity">
  <div class="alert-header">
    <div class="alert-icon">
      <mat-icon>{{ getAlertIcon(alert.severity) }}</mat-icon>
    </div>
    <div class="alert-meta">
      <span class="alert-severity">{{ alert.severity | uppercase }}</span>
      <span class="alert-time">{{ alert.timestamp | timeAgo }}</span>
    </div>
    <button class="dismiss-btn" (click)="dismiss(alert.id)">
      <mat-icon>close</mat-icon>
    </button>
  </div>
  
  <div class="alert-content">
    <h3 class="alert-title">{{ alert.title }}</h3>
    <p class="alert-description">{{ alert.message }}</p>
    <div class="alert-location" *ngIf="alert.zone">
      <mat-icon>location_on</mat-icon>
      <span>{{ alert.zone }}</span>
    </div>
  </div>
  
  <div class="alert-actions">
    <button mat-button color="primary" (click)="takeAction(alert)">
      Take Action
    </button>
    <button mat-button (click)="viewDetails(alert)">
      View Details
    </button>
  </div>
</article>
```

#### Backend Integration
```typescript
// API Endpoint
GET /alerts/active?limit=3

// Response Structure
{
  alerts: [
    {
      id: string,
      severity: 'critical' | 'warning' | 'info',
      title: string,
      message: string,
      zone?: string,
      sensorId?: string,
      threshold: number,
      currentValue: number,
      recommendedActions: string[],
      timestamp: ISO8601,
      acknowledged: boolean
    }
  ],
  total: number
}
```

---

### 3.3 Farm Status Card

#### Purpose
Reassurance - overall farm health at a glance.

#### UI Specification

**Mobile Layout (375px)**
```
┌─────────────────────────────┐
│ 🌿 FARM HEALTH STATUS       │
├─────────────────────────────┤
│ ╭─────────────────────────╮ │
│ │                         │ │
│ │      ╭─────────╮        │ │
│ │     ╱    87     ╲       │ │
│ │    │   HEALTH    │      │ │
│ │     ╲  SCORE    ╱       │ │
│ │      ╰─────────╯        │ │
│ │                         │ │
│ │  ✅ All systems normal  │ │
│ │                         │ │
│ │  🌡️  Temp: 24°C (OK)    │ │
│ │  💧  Humidity: 65% (OK) │ │
│ │  🔬  pH: 6.5 (OK)       │ │
│ │  ⚡  EC: 1.8 (OK)        │ │
│ │                         │ │
│ │  Last sync: 2 min ago   │ │
│ ╰─────────────────────────╯ │
└─────────────────────────────┘
```

**Desktop Layout (1440px)**
```
┌──────────────────────────────────────────────┐
│ 🌿 FARM HEALTH STATUS                        │
├──────────────────────────────────────────────┤
│ ╭──────────────────────────────────────────╮ │
│ │                                          │ │
│ │    ╭──────────────╮  System Status: ✅   │ │
│ │   ╱      87        ╲  All zones normal   │ │
│ │  │   HEALTH SCORE   │  Devices: 12/12    │ │
│ │   ╲   (Excellent)  ╱   Last sync: 2m    │ │
│ │    ╰──────────────╯                     │ │
│ │                                          │ │
│ │  ┌──────────────────────────────────┐   │ │
│ │  │ METRICS OVERVIEW                 │   │ │
│ │  │                                  │   │ │
│ │  │ 🌡️ Temperature   24°C  ✅ Normal │   │ │
│ │  │ 💧 Humidity      65%   ✅ Normal │   │ │
│ │  │ 🔬 pH Level      6.5   ✅ Normal │   │ │
│ │  │ ⚡ EC            1.8   ✅ Normal │   │ │
│ │  │ ☀️ Light Hours   14h   ✅ Normal │   │ │
│ │  └──────────────────────────────────┘   │ │
│ │                                          │ │
│ │  [View Detailed Health Report →]        │ │
│ ╰──────────────────────────────────────────╯ │
└──────────────────────────────────────────────┘
```

#### Crop Health Score Formula (v1)
```typescript
// Weighted scoring system
const cropHealthScore = (
  (temperatureScore * 0.25) +
  (humidityScore * 0.25) +
  (pHScore * 0.20) +
  (ECScore * 0.15) +
  (lightHoursScore * 0.15)
) * 100;

// Each metric scored 0-1 based on optimal ranges
function calculateMetricScore(
  currentValue: number, 
  optimalMin: number, 
  optimalMax: number
): number {
  if (currentValue >= optimalMin && currentValue <= optimalMax) {
    return 1.0; // Perfect score
  }
  
  const distance = currentValue < optimalMin 
    ? optimalMin - currentValue 
    : currentValue - optimalMax;
    
  return Math.max(0, 1 - (distance / (optimalMax - optimalMin)));
}
```

#### Component Specs
- **Health Score Circle**: SVG circular progress indicator
  - Radius: `60px` mobile, `80px` desktop
  - Stroke width: `8px`
  - Colors: Green gradient (`#10b981` to `#34d399`)
  - Animation: Count-up from 0 to score on load
- **Background**: Glass card with soft gradient
- **Border Radius**: `20px`
- **Padding**: `24px`

#### Color Palette by Score
```scss
// Excellent (80-100)
$score-excellent: linear-gradient(135deg, #10b981, #34d399);

// Good (60-79)
$score-good: linear-gradient(135deg, #3b82f6, #60a5fa);

// Fair (40-59)
$score-fair: linear-gradient(135deg, #f59e0b, #fbbf24);

// Poor (0-39)
$score-poor: linear-gradient(135deg, #ef4444, #f87171);
```

---

### 3.4 Today's Actions (AI Recommendations)

#### Purpose
Convert data into actionable decisions.

#### UI Specification

**Mobile Layout (375px)**
```
┌─────────────────────────────┐
│ 📋 TODAY'S ACTIONS (4)      │
├─────────────────────────────┤
│ ╭─────────────────────────╮ │
│ │ ⏰ 10:00 AM             │ │
│ │ 💨 Increase Ventilation │ │
│ │ Zone: Greenhouse A      │ │
│ │                         │ │
│ │ High temp expected      │ │
│ │ 10am-2pm                │ │
│ │                         │ │
│ │ [✅ Done] [⏰ Remind]    │ │
│ ╰─────────────────────────╯ │
│                             │
│ ╭─────────────────────────╮ │
│ │ 💧 Reduce Irrigation    │ │
│ │ Zone: All zones         │ │
│ │ By: 10%                 │ │
│ │                         │ │
│ │ Rain forecasted         │ │
│ │ this afternoon          │ │
│ │                         │ │
│ │ [✅ Done] [⏸️ Skip]      │ │
│ ╰─────────────────────────╯ │
│                             │
│ ╭─────────────────────────╮ │
│ │ 🧪 Add Nutrients        │ │
│ │ Zone: Seedling Area     │ │
│ │ Within: 48 hours        │ │
│ │                         │ │
│ │ N levels at 65%         │ │
│ │                         │ │
│ │ [✅ Done] [📖 Learn]     │ │
│ ╰─────────────────────────╯ │
│                             │
│ [View All Tasks →]          │
└─────────────────────────────┘
```

**Desktop Layout (1440px)**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 TODAY'S ACTIONS (4)                           [Filter]│
├─────────────────────────────────────────────────────────┤
│ ╭─────────────────────────────────────────────────────╮ │
│ │ ⏰ SCHEDULED: 10:00 AM                              │ │
│ │ 💨 Increase Ventilation                             │ │
│ │                                                     │ │
│ │ 📍 Zone: Greenhouse A                               │ │
│ │ 📊 Duration: 4 hours (10am-2pm)                     │ │
│ │                                                     │ │
│ │ 💡 Reason:                                           │ │
│ │ High temperature expected (38°C+)                    │ │
│ │ Weather forecast shows clear skies                   │ │
│ │                                                     │ │
│ │ 🎯 Expected Impact:                                  │ │
│ │ Reduce temperature by 3-5°C                          │ │
│ │                                                     │ │
│ │ [✅ Mark Complete] [⏰ Snooze] [📊 Details] [✕ Skip] │ │
│ ╰─────────────────────────────────────────────────────╯ │
│                                                         │
│ ╭─────────────────────────────────────────────────────╮ │
│ │ 💧 Reduce Irrigation by 10%                         │ │
│ │                                                     │ │
│ │ 📍 Zone: All zones                                  │ │
│ │ 🌧️ Reason: Rain forecasted (80% probability)        │ │
│ │ 💰 Savings: ~50L water                              │ │
│ │                                                     │ │
│ │ [✅ Mark Complete] [⏸️ Skip] [📊 Details]            │ │
│ ╰─────────────────────────────────────────────────────╯ │
│                                                         │
│ [View All Recommendations →]                            │
└─────────────────────────────────────────────────────────┘
```

#### Component Specs
- **Card Style**: Swipeable cards with priority ordering
- **Time Indicator**: Left border accent color by urgency
  - Immediate: Red (`#ef4444`)
  - Within 2h: Amber (`#f59e0b`)
  - Within 24h: Blue (`#3b82f6`)
- **Action Buttons**: Large touch targets (44x44px minimum)
- **Swipe Actions**:
  - Swipe right: Mark complete
  - Swipe left: Snooze/Skip
- **Animations**: Subtle bounce on new action appearance

#### Recommendation Engine Logic
```typescript
interface Recommendation {
  id: string;
  type: 'ventilation' | 'irrigation' | 'nutrients' | 'harvest' | 'maintenance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  zone: string;
  timeWindow?: {
    start: string;
    end: string;
  };
  reason: string;
  expectedImpact: string;
  estimatedSavings?: number;
  weatherTrigger?: boolean;
}

// Rule-based v1 engine
function generateRecommendations(
  sensorData: SensorReading[],
  weatherForecast: WeatherData,
  cropProfiles: CropProfile[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Temperature-based ventilation
  if (weatherForecast.maxTemp > 35) {
    recommendations.push({
      type: 'ventilation',
      priority: 'high',
      title: 'Increase Ventilation',
      description: 'High temperature expected',
      timeWindow: { start: '10:00', end: '14:00' },
      reason: `Forecast: ${weatherForecast.maxTemp}°C`,
      expectedImpact: 'Reduce temperature by 3-5°C'
    });
  }
  
  // Rain-based irrigation adjustment
  if (weatherForecast.rainProbability > 0.7) {
    recommendations.push({
      type: 'irrigation',
      priority: 'medium',
      title: 'Reduce Irrigation',
      description: `Reduce by 10%`,
      reason: `Rain forecasted (${weatherForecast.rainProbability * 100}%)`,
      expectedImpact: 'Save ~50L water',
      estimatedSavings: 50
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
```

---

### 3.5 Savings & Efficiency

#### Purpose
Show ROI and motivate continued smart farming practices.

#### UI Specification

**Mobile Layout (375px)**
```
┌─────────────────────────────┐
│ 💰 SAVINGS & EFFICIENCY     │
├─────────────────────────────┤
│ ╭─────────────────────────╮ │
│ │                         │ │
│ │   💧 Water Saved        │ │
│ │   ╭───────────╮         │ │
│ │   │  1,250L   │         │ │
│ │   ╰───────────╯         │ │
│ │   This month: +15%      │ │
│ │   vs. traditional       │ │
│ │                         │ │
│ ╰─────────────────────────╯ │
│                             │
│ ╭─────────────────────────╮ │
│ │ ⚡ Energy Efficiency     │ │
│ │ ╭───────────╮           │ │
│ │ │   92%     │           │ │
│ │ ╰───────────╯           │ │
│ │ Optimized lighting      │ │
│ │ Savings: €45/month      │ │
│ ╰─────────────────────────╯ │
│                             │
│ ╭─────────────────────────╮ │
│ │ 📈 Yield Improvement     │ │
│ │ ╭───────────╮           │ │
│ │ │  +23%     │           │ │
│ │ ╰───────────╯           │ │
│ │ vs. last season         │ │
│ │ Est. +€320 revenue      │ │
│ ╰─────────────────────────╯ │
│                             │
│ ╭─────────────────────────╮ │
│ │ 💵 Est. Monthly Savings  │ │
│ │ ╭───────────╮           │ │
│ │ │   €285    │           │ │
│ │ ╰───────────╯           │ │
│ │ Breakdown →             │ │
│ ╰─────────────────────────╯ │
└─────────────────────────────┘
```

**Desktop Layout (1440px)**
```
┌─────────────────────────────────────────────────────────┐
│ 💰 SAVINGS & EFFICIENCY                          [Month] │
├─────────────────────────────────────────────────────────┤
│ ╭──────────────╮ ╭──────────────╮ ╭──────────────╮     │
│ │ 💧 WATER     │ │ ⚡ ENERGY    │ │ 📈 YIELD     │     │
│ │              │ │              │ │              │     │
│ │   1,250L     │ │    92%       │ │    +23%      │     │
│ │              │ │              │ │              │     │
│ │ +15% vs trad │ │ €45 saved    │ │ +€320 est.   │     │
│ │              │ │              │ │              │     │
│ │ [Details →]  │ │ [Details →]  │ │ [Details →]  │     │
│ ╰──────────────╯ ╰──────────────╯ ╰──────────────╯     │
│                                                         │
│ ╭─────────────────────────────────────────────────────╮ │
│ │ 💵 TOTAL ESTIMATED MONTHLY SAVINGS                  │ │
│ │                                                     │ │
│ │   €285                                              │ │
│ │                                                     │ │
│ │   Breakdown:                                        │ │
│ │   💧 Water:    €120 (42%)                          │ │
│ │   ⚡ Energy:   €45  (16%)                          │ │
│ │   🧪 Nutrients: €75 (26%)                          │ │
│ │   📦 Yield:    €320 (additional revenue)           │ │
│ │                                                     │ │
│ │   [View Full Analytics →]                          │ │
│ ╰─────────────────────────────────────────────────────╯ │
└─────────────────────────────────────────────────────────┘
```

#### Component Specs
- **Card Layout**: 3-column grid on mobile (stacked), horizontal on desktop
- **Metric Display**: Large numbers with icon badges
- **Progress Indicators**: Circular progress for efficiency percentages
- **Trend Arrows**: Up/down arrows with percentage change
- **Color Coding**:
  - Positive: Green (`#10b981`)
  - Neutral: Blue (`#3b82f6`)
  - Negative: Red (`#ef4444`)
- **Animations**: Number counting animation on load

#### Analytics Calculation Logic
```typescript
interface SavingsMetrics {
  waterSaved: {
    liters: number;
    percentage: number;
    monetaryValue: number;
  };
  energyEfficiency: {
    percentage: number;
    savings: number;
  };
  yieldImprovement: {
    percentage: number;
    estimatedRevenue: number;
  };
  totalMonthlySavings: number;
}

function calculateSavings(
  currentUsage: ResourceUsage,
  historicalBaseline: ResourceUsage,
  cropYield: YieldData
): SavingsMetrics {
  const waterSaved = currentUsage.water - historicalBaseline.water;
  const energySaved = currentUsage.energy - historicalBaseline.energy;
  
  return {
    waterSaved: {
      liters: waterSaved,
      percentage: (waterSaved / historicalBaseline.water) * 100,
      monetaryValue: waterSaved * 0.003 // € per liter
    },
    energyEfficiency: {
      percentage: (energySaved / historicalBaseline.energy) * 100,
      savings: energySaved * 0.15 // € per kWh
    },
    yieldImprovement: {
      percentage: ((cropYield.current - cropYield.previous) / cropYield.previous) * 100,
      estimatedRevenue: (cropYield.current - cropYield.previous) * cropYield.pricePerKg
    },
    totalMonthlySavings: // Calculate total
  };
}
```

---

### 3.6 Weather Impact Card

#### Purpose
Translate weather data into farm-specific impact and actions.

#### UI Specification

**Mobile Layout (375px)**
```
┌─────────────────────────────┐
│ 🌤️ WEATHER IMPACT          │
├─────────────────────────────┤
│ ╭─────────────────────────╮ │
│ │ Today: 28°C, Sunny      │ │
│ │                         │ │
│ │ 🌱 Growth Impact: HIGH  │ │
│ │ Optimal for tomatoes    │ │
│ │                         │ │
│ │ 💨 Ventilation: NEEDED  │ │
│ │ 10am-4pm, all zones     │ │
│ │                         │ │
│ │ ☀️ Lighting Savings:    │ │
│ │ €3.50 potential         │ │
│ │ Natural light optimal   │ │
│ ╰─────────────────────────╯ │
│                             │
│ ╭─────────────────────────╮ │
│ │ Tomorrow Forecast       │ │
│ │ ⛅ 24°C, Partly Cloudy  │ │
│ │                         │ │
│ │ 💧 Irrigation:          │ │
│ │ Maintain schedule       │ │
│ │                         │ │
│ │ 🌡️ Heat Risk: LOW       │ │
│ │ No action needed        │ │
│ ╰─────────────────────────╯ │
│                             │
│ [View 7-Day Forecast →]     │
└─────────────────────────────┘
```

**Desktop Layout (1440px)**
```
┌─────────────────────────────────────────────────────────┐
│ 🌤️ WEATHER IMPACT                              [Today]  │
├─────────────────────────────────────────────────────────┤
│ ╭─────────────────────────────────────────────────────╮ │
│ │ CURRENT CONDITIONS                                  │ │
│ │                                                     │ │
│ │ 🌡️ 28°C ☀️ Sunny                                   │ │
│ │ 💧 Humidity: 45%                                    │ │
│ │ 💨 Wind: 12 km/h                                    │ │
│ │                                                     │ │
│ │ ┌──────────────────────────────────────────────┐   │ │
│ │ │ FARM IMPACT ANALYSIS                         │   │ │
│ │ │                                              │   │ │
│ │ │ 🌱 Growth Impact: HIGH                       │   │ │
│ │ │ Optimal conditions for:                      │   │ │
│ │ │ • Tomatoes (ripening accelerated)            │   │ │
│ │ │ • Peppers (photosynthesis peak)              │   │ │
│ │ │                                              │   │ │
│ │ │ 💨 Ventilation Required: 10am-4pm            │   │ │
│ │ │ All zones - Prevent heat stress              │   │ │
│ │ │                                              │   │ │
│ │ │ ☀️ Lighting Savings Potential: €3.50/day     │   │ │
│ │ │ Natural light sufficient - Reduce LEDs       │   │ │
│ │ │                                              │   │ │
│ │ │ 💧 Irrigation: Increase by 15%               │   │ │
│ │ │ High evaporation rate expected               │   │ │
│ │ └──────────────────────────────────────────────┘   │ │
│ ╰─────────────────────────────────────────────────────╯ │
│                                                         │
│ ╭─────────────────────────────────────────────────────╮ │
│ │ 7-DAY FORECAST & PLANNING                           │ │
│ │                                                     │ │
│ │ Mon 28°C ☀️   HIGH growth   Ventilate               │ │
│ │ Tue 24°C ⛅   MOD growth    Normal ops              │ │
│ │ Wed 22°C 🌧️  LOW growth    Reduce irrigation       │ │
│ │ Thu 25°C ☀️   HIGH growth   Ventilate               │ │
│ │ Fri 27°C ☀️   HIGH growth   Ventilate               │ │
│ │ Sat 26°C ⛅   MOD growth    Normal ops              │ │
│ │ Sun 23°C 🌧️  LOW growth    Maintenance day         │ │
│ │                                                     │ │
│ │ [View Detailed Forecast →]                         │ │
│ ╰─────────────────────────────────────────────────────╯ │
└─────────────────────────────────────────────────────────┘
```

#### Component Specs
- **Impact Indicators**: Color-coded badges
  - HIGH: Green background
  - MODERATE: Amber background
  - LOW: Blue background
- **Weather Icons**: Custom SVG or OpenWeatherMap icons
- **Forecast Strip**: Horizontal scrollable on mobile
- **Background**: Subtle weather-themed gradient based on conditions
- **Animations**: Fade-in for impact recommendations

#### Weather Impact Logic
```typescript
interface WeatherImpact {
  growthImpact: 'HIGH' | 'MODERATE' | 'LOW';
  optimalCrops: string[];
  ventilation: {
    required: boolean;
    timeWindow?: string;
    zones?: string[];
  };
  lightingSavings: number;
  irrigation: {
    adjustment: number; // percentage
    reason: string;
  };
  heatRisk: 'HIGH' | 'MODERATE' | 'LOW';
}

function calculateWeatherImpact(
  weather: WeatherData,
  cropProfiles: CropProfile[]
): WeatherImpact {
  const impact: WeatherImpact = {
    growthImpact: 'MODERATE',
    optimalCrops: [],
    ventilation: { required: false },
    lightingSavings: 0,
    irrigation: { adjustment: 0, reason: '' },
    heatRisk: 'LOW'
  };
  
  // Growth impact based on temperature
  if (weather.temp >= 25 && weather.temp <= 30 && weather.sunlight > 6) {
    impact.growthImpact = 'HIGH';
    impact.optimalCrops = cropProfiles
      .filter(c => c.optimalTempRange.includes(weather.temp))
      .map(c => c.name);
  }
  
  // Ventilation need
  if (weather.temp > 35) {
    impact.ventilation = {
      required: true,
      timeWindow: '10am-4pm',
      zones: ['all']
    };
  }
  
  // Lighting savings
  if (weather.sunlight > 8) {
    impact.lightingSavings = 3.50; // € per day
  }
  
  // Irrigation adjustment
  if (weather.temp > 30 && weather.humidity < 40) {
    impact.irrigation = {
      adjustment: 15,
      reason: 'High evaporation rate'
    };
  }
  
  // Heat risk
  if (weather.temp > 38) {
    impact.heatRisk = 'HIGH';
  }
  
  return impact;
}
```

---

### 3.7 Tasks & Harvest Planner

#### Purpose
Daily planning - keep track of upcoming tasks and harvest windows.

#### UI Specification

**Mobile Layout (375px)**
```
┌─────────────────────────────┐
│ 📅 TASKS & HARVEST          │
├─────────────────────────────┤
│ ╭─────────────────────────╮ │
│ │ TODAY (3)               │ │
│ │                         │ │
│ │ 🥬 Harvest Lettuce      │ │
│ │ Zone 2 - Ready now      │ │
│ │ Est. 2.5 kg             │ │
│ │                         │ │
│ │ [✅ Complete] [📷 Photo] │ │
│ ╰─────────────────────────╯ │
│                             │
│ ╭─────────────────────────╮ │
│ │ TOMORROW (2)            │ │
│ │                         │ │
│ │ 🧪 Refill Nutrients     │ │
│ │ Zone 1 - Due in 48h     │ │
│ │ N-P-K solution          │ │
│ │                         │ │
│ │ [⏰ Schedule] [✕ Skip]   │ │
│ ╰─────────────────────────╯ │
│                             │
│ ╭─────────────────────────╮ │
│ │ THIS WEEK (5)           │ │
│ │                         │ │
│ │ 🔧 Clean Filters        │ │
│ │ Due in 2 days           │ │
│ │ Maintenance task        │ │
│ │                         │ │
│ │ 🌱 Transplant Seedlings │ │
│ │ Zone 3 - Day 21 reached │ │
│ │                         │ │
│ │ [View All →]            │ │
│ ╰─────────────────────────╯ │
└─────────────────────────────┘
```

**Desktop Layout (1440px)**
```
┌─────────────────────────────────────────────────────────┐
│ 📅 TASKS & HARVEST PLANNER                      [Week]  │
├─────────────────────────────────────────────────────────┤
│ ╭─────────────────────────────────────────────────────╮ │
│ │ TODAY - 3 TASKS                                     │ │
│ │                                                     │ │
│ │ ┌──────────────────────────────────────────────┐   │ │
│ │ │ 🥬 Harvest Lettuce                           │   │ │
│ │ │                                             │   │ │
│ │ │ 📍 Zone 2: Hydroponic Bed A                 │   │ │
│ │ │ 📅 Ready: Now (Day 45)                      │   │ │
│ │ │ ⚖️ Est. Yield: 2.5 kg                       │   │ │
│ │ │                                             │   │ │
│ │ │ ✅ Mark Complete  📷 Add Photo  📝 Log Note │   │ │
│ │ └──────────────────────────────────────────────┘   │ │
│ │                                                     │ │
│ │ ┌──────────────────────────────────────────────┐   │ │
│ │ │ 🧪 Refill Nutrients                          │   │ │
│ │ │                                             │   │ │
│ │ │ 📍 Zone 1: Seedling Area                    │   │ │
│ │ │ ⏰ Due: Within 48 hours                     │   │ │
│ │ │ 🧬 Type: N-P-K Solution (20-10-20)          │   │ │
│ │ │                                             │   │ │
│ │ │ ⏰ Schedule  ✕ Skip  📖 Mixing Guide        │   │ │
│ │ └──────────────────────────────────────────────┘   │ │
│ ╰─────────────────────────────────────────────────────╯ │
│                                                         │
│ ╭─────────────────────────────────────────────────────╮ │
│ │ UPCOMING THIS WEEK                                  │ │
│ │                                                     │ │
│ │ Tue  🔧 Clean Filters          Maintenance  Due 2d  │ │
│ │ Wed  🌱 Transplant Seedlings   Planting     Day 21  │ │
│ │ Thu  💧 Check Irrigation       Inspection   Weekly  │ │
│ │ Fri  🥕 Harvest Carrots        Harvest      Ready   │ │
│ │ Sat  📊 Inventory Check        Admin        Monthly │ │
│ │                                                     │ │
│ │ [View Full Calendar →]                             │ │
│ ╰─────────────────────────────────────────────────────╯ │
└─────────────────────────────────────────────────────────┘
```

#### Component Specs
- **Task Cards**: Swipeable with checkbox completion
- **Priority Indicators**: Left border color by urgency
  - Due today: Red
  - Due tomorrow: Amber
  - Due this week: Blue
- **Harvest Badges**: Green badge with yield estimate
- **Swipe Actions**:
  - Swipe right: Mark complete
  - Swipe left: Reschedule
- **Calendar Integration**: Tap to add to phone calendar
- **Photo Capture**: Camera icon for harvest photos

#### Task Data Structure
```typescript
interface Task {
  id: string;
  type: 'harvest' | 'maintenance' | 'planting' | 'inspection' | 'admin';
  title: string;
  zone: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  estimatedYield?: {
    amount: number;
    unit: 'kg' | 'units';
  };
  notes?: string;
  photos?: string[];
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    nextDue?: Date;
  };
}
```

---

### 3.8 Technical Footer (Collapsed)

#### Purpose
Move technical details to collapsed footer - accessible but not prominent.

#### UI Specification

**Mobile Layout (375px) - Collapsed by Default**
```
┌─────────────────────────────┐
│ ▼ TECHNICAL DETAILS         │
├─────────────────────────────┤
│ (Collapsed - tap to expand) │
└─────────────────────────────┘

When Expanded:
┌─────────────────────────────┐
│ ▲ TECHNICAL DETAILS         │
├─────────────────────────────┤
│ ╭─────────────────────────╮ │
│ │ 📡 Devices Online: 12/12│ │
│ │ Last sync: 2 min ago    │ │
│ │                         │ │
│ │ 🖥️ System Status: ✅    │ │
│ │ API: Connected           │ │
│ │ MQTT: Active             │ │
│ │                         │ │
│ │ 🌐 Farm ID: FARM-001    │ │
│ │ Location: 45.8, -73.5   │ │
│ │ Area: 2.5 hectares      │ │
│ │                         │ │
│ │ [System Settings →]     │ │
│ ╰─────────────────────────╯ │
└─────────────────────────────┘
```

#### Component Specs
- **Default State**: Collapsed
- **Expand Icon**: Chevron rotation animation
- **Background**: Muted gray (`#f9fafb`)
- **Border**: Top border only (`1px solid #e5e7eb`)
- **Padding**: `16px` when expanded
- **Font Size**: Smaller text (`13px`)
- **Purpose**: Technical troubleshooting info

---

## 4. PREMIUM UI/UX DESIGN GUIDELINES

### 4.1 Visual Design

#### Glass Card Effect
```scss
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}
```

#### Soft Shadows
```scss
.shadow-soft {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.shadow-medium {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.shadow-strong {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
```

#### Green/Teal Accent Colors
```scss
$primary-green: #10b981;
$primary-teal: #14b8a6;
$accent-green-light: #34d399;
$accent-green-dark: #059669;

// Usage
- Success states: $primary-green
- Positive trends: $accent-green-light
- Active elements: $primary-teal
- Hover states: $accent-green-dark
```

#### Rounded Corners
```scss
// Consistent border radius
$radius-sm: 12px;   // Small elements
$radius-md: 16px;   // Cards
$radius-lg: 20px;   // Main panels
$radius-xl: 24px;   // Hero cards
```

### 4.2 Micro Animations

#### Hover Effects
```scss
.card {
  transition: all 150ms ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}
```

#### Loading States
```scss
// Skeleton shimmer
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 2000px 100%;
  animation: shimmer 2s infinite;
}
```

#### Number Counting Animation
```typescript
function animateNumber(element: HTMLElement, target: number, duration: number = 1000) {
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(start + (target - start) * easeOut);
    
    element.textContent = currentValue.toString();
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}
```

### 4.3 Mobile-First Responsive Rules

#### Single Column Layout
```scss
.dashboard {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1440px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

#### Swipeable Cards
```typescript
// Touch gesture handling
@HostListener('touchstart', ['$event'])
onTouchStart(event: TouchEvent) {
  this.startX = event.touches[0].clientX;
}

@HostListener('touchmove', ['$event'])
onTouchMove(event: TouchEvent) {
  const currentX = event.touches[0].clientX;
  this.swipeOffset = currentX - this.startX;
}

@HostListener('touchend')
onTouchEnd() {
  if (Math.abs(this.swipeOffset) > 100) {
    this.swipeOffset > 0 
      ? this.onSwipeRight.emit()
      : this.onSwipeLeft.emit();
  }
  this.swipeOffset = 0;
}
```

#### Sticky Alerts
```css
.sticky-alerts {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

#### Skeleton Loaders
```html
<!-- Loading state example -->
<div class="skeleton-card" *ngIf="loading">
  <div class="skeleton-header"></div>
  <div class="skeleton-line skeleton-line-short"></div>
  <div class="skeleton-line"></div>
  <div class="skeleton-line skeleton-line-medium"></div>
</div>

<!-- Content when loaded -->
<div class="content-card" *ngIf="!loading && data">
  <!-- Actual content -->
</div>
```

### 4.4 Touch Target Specifications

```scss
// Minimum touch targets
button, 
.clickable {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
  
  // Icon buttons
  &.icon-button {
    width: 44px;
    height: 44px;
    border-radius: 50%;
  }
}

// Spacing between interactive elements
.touch-spacing {
  margin: 8px; // Minimum 16px between touch targets
}
```

---

## 5. ANGULAR STANDALONE COMPONENTS ARCHITECTURE

### 5.1 Component Structure

```
src/app/features/dashboard/
├── dashboard.page.ts                    # Main page container
├── dashboard.store.ts                   # Signal store
├── components/
│   ├── farm-briefing-card/
│   │   ├── farm-briefing-card.component.ts
│   │   ├── farm-briefing-card.component.html
│   │   └── farm-briefing-card.component.scss
│   ├── alerts-card/
│   │   ├── alerts-card.component.ts
│   │   ├── alerts-card.component.html
│   │   └── alerts-card.component.scss
│   ├── farm-status-card/
│   │   ├── farm-status-card.component.ts
│   │   ├── farm-status-card.component.html
│   │   └── farm-status-card.component.scss
│   ├── recommendations-card/
│   │   ├── recommendations-card.component.ts
│   │   ├── recommendations-card.component.html
│   │   └── recommendations-card.component.scss
│   ├── savings-card/
│   │   ├── savings-card.component.ts
│   │   ├── savings-card.component.html
│   │   └── savings-card.component.scss
│   ├── weather-impact-card/
│   │   ├── weather-impact-card.component.ts
│   │   ├── weather-impact-card.component.html
│   │   └── weather-impact-card.component.scss
│   ├── tasks-card/
│   │   ├── tasks-card.component.ts
│   │   ├── tasks-card.component.html
│   │   └── tasks-card.component.scss
│   └── technical-footer/
│       ├── technical-footer.component.ts
│       ├── technical-footer.component.html
│       └── technical-footer.component.scss
└── services/
    ├── dashboard-aggregator.service.ts
    ├── alerts.service.ts
    ├── recommendations.service.ts
    ├── analytics.service.ts
    └── weather-impact.service.ts
```

### 5.2 Dashboard Store (Signals)

```typescript
import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, catchError, of } from 'rxjs';

interface DashboardState {
  briefing: BriefingData | null;
  alerts: AlertData[];
  healthScore: number | null;
  recommendations: RecommendationData[];
  savings: SavingsData | null;
  weatherImpact: WeatherImpactData | null;
  tasks: TaskData[];
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private state = signal<DashboardState>({
    briefing: null,
    alerts: [],
    healthScore: null,
    recommendations: [],
    savings: null,
    weatherImpact: null,
    tasks: [],
    loading: false,
    error: null,
    lastRefreshed: null
  });

  // Computed signals
  readonly hasCriticalAlerts = computed(() => 
    this.state().alerts.some(a => a.severity === 'critical')
  );
  
  readonly priorityActionsCount = computed(() => 
    this.state().recommendations.filter(r => r.priority === 'high').length
  );
  
  readonly farmHealthStatus = computed(() => {
    const score = this.state().healthScore;
    if (!score) return 'unknown';
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  });

  constructor(private http: HttpClient) {
    // Auto-refresh every 5 minutes
    effect(() => {
      const lastRefresh = this.state().lastRefreshed;
      if (lastRefresh) {
        const age = Date.now() - lastRefresh.getTime();
        if (age > 300000) { // 5 minutes
          this.refreshData();
        }
      }
    });
  }

  // Load all dashboard data in parallel
  loadDashboardData() {
    this.state.update(s => ({ ...s, loading: true, error: null }));
    
    forkJoin({
      briefing: this.http.get<BriefingData>('/dashboard/briefing')
        .pipe(catchError(() => of(null))),
      alerts: this.http.get<AlertData[]>('/alerts/active?limit=3')
        .pipe(catchError(() => of([]))),
      healthScore: this.http.get<{ score: number }>('/farm/health-score')
        .pipe(catchError(() => of({ score: 0 }))),
      recommendations: this.http.get<RecommendationData[]>('/recommendations/today')
        .pipe(catchError(() => of([]))),
      savings: this.http.get<SavingsData>('/analytics/savings')
        .pipe(catchError(() => of(null))),
      weatherImpact: this.http.get<WeatherImpactData>('/weather/impact')
        .pipe(catchError(() => of(null))),
      tasks: this.http.get<TaskData[]>('/tasks/upcoming')
        .pipe(catchError(() => of([])))
    }).subscribe({
      next: (data) => {
        this.state.update(s => ({
          ...s,
          ...data,
          loading: false,
          lastRefreshed: new Date()
        }));
      },
      error: (error) => {
        this.state.update(s => ({
          ...s,
          loading: false,
          error: error.message
        }));
      }
    });
  }

  // Refresh data
  refreshData() {
    this.loadDashboardData();
  }

  // Selectors
  selectBriefing() {
    return computed(() => this.state().briefing);
  }
  
  selectAlerts() {
    return computed(() => this.state().alerts);
  }
  
  // ... more selectors
}
```

### 5.3 Data Loading Pattern

```typescript
@Component({
  // ... component config
})
export class DashboardPageComponent implements OnInit {
  private store = inject(DashboardStore);
  
  // Signals from store
  readonly briefing = this.store.selectBriefing();
  readonly alerts = this.store.selectAlerts();
  readonly loading = computed(() => this.store.state().loading);
  
  ngOnInit() {
    // Initial load
    this.store.loadDashboardData();
  }
  
  // Manual refresh
  onRefresh() {
    this.store.refreshData();
  }
}
```

---

## 6. SINGLE AGGREGATOR ENDPOINT

### Backend: `/dashboard/overview`

```typescript
// NestJS Controller
@Controller('dashboard')
export class DashboardController {
  constructor(
    private aggregator: DashboardAggregatorService
  ) {}

  @Get('overview')
  async getDashboardOverview(@User() user: UserEntity) {
    return this.aggregator.getOverview(user.id);
  }
}

// Aggregator Service
@Injectable()
export class DashboardAggregatorService {
  constructor(
    private alertsService: AlertsService,
    private recommendationsService: RecommendationsService,
    private analyticsService: AnalyticsService,
    private weatherService: WeatherService,
    private insightsService: InsightsService,
    private tasksService: TasksService
  ) {}

  async getOverview(userId: string) {
    // Fetch all data in parallel
    const [
      briefing,
      alerts,
      healthScore,
      recommendations,
      savings,
      weatherImpact,
      tasks
    ] = await Promise.all([
      this.insightsService.generateBriefing(userId),
      this.alertsService.getActiveAlerts(userId, { limit: 3 }),
      this.analyticsService.calculateHealthScore(userId),
      this.recommendationsService.getTodayRecommendations(userId),
      this.analyticsService.getSavingsMetrics(userId),
      this.weatherService.getWeatherImpact(userId),
      this.tasksService.getUpcomingTasks(userId)
    ]);

    return {
      briefing,
      alerts,
      healthScore,
      recommendations,
      savings,
      weatherImpact,
      tasks,
      generatedAt: new Date().toISOString()
    };
  }
}
```

### Response Structure

```typescript
interface DashboardOverviewResponse {
  briefing: {
    insights: Array<{
      type: 'warning' | 'info' | 'success';
      title: string;
      message: string;
      action?: string;
    }>;
    summary: string;
    generatedAt: string;
  };
  alerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    zone?: string;
    timestamp: string;
  }>;
  healthScore: {
    score: number;
    breakdown: {
      temperature: number;
      humidity: number;
      pH: number;
      EC: number;
      lightHours: number;
    };
  };
  recommendations: Array<{
    id: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    timeWindow?: { start: string; end: string };
    reason: string;
    expectedImpact: string;
  }>;
  savings: {
    waterSaved: { liters: number; monetaryValue: number };
    energyEfficiency: { percentage: number; savings: number };
    yieldImprovement: { percentage: number; estimatedRevenue: number };
    totalMonthlySavings: number;
  };
  weatherImpact: {
    current: { temp: number; condition: string };
    growthImpact: 'HIGH' | 'MODERATE' | 'LOW';
    ventilation: { required: boolean; timeWindow?: string };
    lightingSavings: number;
    irrigation: { adjustment: number };
  };
  tasks: Array<{
    id: string;
    type: string;
    title: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    status: string;
  }>;
  generatedAt: string;
}
```

---

## 7. IMPLEMENTATION CHECKLIST

### Phase 1: Backend Foundations
- [ ] Create `/dashboard/overview` aggregator endpoint
- [ ] Implement alerts engine with threshold detection
- [ ] Build recommendations service (rule-based v1)
- [ ] Add weather impact calculation service
- [ ] Create insights generator service
- [ ] Implement health score calculation

### Phase 2: Frontend Widgets
- [ ] Create `FarmBriefingCardComponent`
- [ ] Create `AlertsCardComponent` with sticky behavior
- [ ] Create `FarmStatusCardComponent` with circular progress
- [ ] Create `RecommendationsCardComponent` with swipe actions
- [ ] Create `SavingsCardComponent` with animated numbers
- [ ] Create `WeatherImpactCardComponent`
- [ ] Create `TasksCardComponent` with swipe completion
- [ ] Create `TechnicalFooterComponent` (collapsed)
- [ ] Build mobile-first responsive layout
- [ ] Implement skeleton loaders

### Phase 3: Analytics & Savings
- [ ] Build efficiency calculation algorithms
- [ ] Implement water savings tracking
- [ ] Add energy efficiency metrics
- [ ] Create yield improvement tracking
- [ ] Design ROI visualization

### Phase 4: Polish & Optimization
- [ ] Add micro animations (hover, loading, transitions)
- [ ] Implement skeleton loading states
- [ ] Optimize performance (OnPush change detection)
- [ ] Add PWA offline support
- [ ] Implement data caching strategies
- [ ] Add touch gesture refinements
- [ ] Test on multiple devices
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## 8. DESIGN TOKENS SUMMARY

```scss
// Colors
$primary-green: #10b981;
$primary-teal: #14b8a6;
$accent-green-light: #34d399;
$accent-green-dark: #059669;
$critical-red: #ef4444;
$warning-amber: #f59e0b;
$info-blue: #3b82f6;

// Spacing
$spacing-xs: 8px;
$spacing-sm: 12px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;

// Border Radius
$radius-sm: 12px;
$radius-md: 16px;
$radius-lg: 20px;
$radius-xl: 24px;

// Shadows
$shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.06);
$shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.08);
$shadow-strong: 0 8px 32px rgba(0, 0, 0, 0.12);

// Typography
$font-xs: 11px;
$font-sm: 13px;
$font-base: 14px;
$font-lg: 16px;
$font-xl: 20px;
$font-2xl: 24px;

// Breakpoints
$mobile: 375px;
$mobile-lg: 480px;
$tablet-sm: 768px;
$tablet: 1024px;
$desktop: 1440px;
```

---

## 9. FINAL NOTES

This mockup specification ensures the dashboard becomes:

✅ **Farmer-Centric** - Focuses on what farmers need to know, not what sensors measure  
✅ **Actionable** - Every section drives decisions, not just displays data  
✅ **Premium** - Glass cards, soft shadows, micro animations create high-end feel  
✅ **Mobile-First** - Single column, swipeable cards, sticky alerts, touch-optimized  
✅ **Performant** - Single API call, cached data, skeleton loaders, OnPush detection  
✅ **Scalable** - Modular components, easy to extend with new widgets  

**Next Steps:**
1. Review this specification with stakeholders
2. Create high-fidelity visual mockups (Figma/Sketch)
3. Begin Phase 1 backend implementation
4. Iterate based on user testing feedback

---

*Document Version: 1.0*  
*Last Updated: April 17, 2026*  
*Status: Ready for Implementation*
