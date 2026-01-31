# 09 - UI COMPONENTS

## Design System

### Colors

```css
:root {
  /* Primary - Green */
  --primary-50: #f0fdf4;
  --primary-100: #dcfce7;
  --primary-200: #bbf7d0;
  --primary-300: #86efac;
  --primary-400: #4ade80;
  --primary-500: #22c55e;
  --primary-600: #16a34a;
  --primary-700: #15803d;
  
  /* Secondary - Blue (Water) */
  --secondary-500: #3b82f6;
  
  /* Accent - Amber (Sunlight) */
  --accent-500: #f59e0b;
  
  /* Neutral - Stone */
  --stone-50: #fafaf9;
  --stone-100: #f5f5f4;
  --stone-200: #e7e5e4;
  --stone-500: #78716c;
  --stone-900: #1c1917;
  
  /* Status */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```
Typography
Copy/* Headings */
font-family: 'Inter', sans-serif;
h1: 2rem/2.5rem, font-weight: 700
h2: 1.5rem/2rem, font-weight: 600
h3: 1.25rem/1.75rem, font-weight: 600

/* Body */
body: 1rem/1.5rem, font-weight: 400
small: 0.875rem/1.25rem
Spacing
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
Border Radius
sm: 4px
md: 8px
lg: 12px
xl: 16px
2xl: 24px
full: 9999px
Component List
Layout Components
AppShell
├── Header
│   ├── Logo
│   ├── Navigation
│   └── UserMenu
├── Sidebar (desktop)
├── MainContent
└── BottomNav (mobile)
Garden Components
GardenView
├── GardenHeader
│   ├── WeatherWidget
│   ├── WaterReserves
│   └── QuickStats
├── PlantGrid
│   └── PlantCard (multiple)
├── EmptyState
└── AddPlantButton

PlantCard
├── PlantAnimation
├── PlantInfo
│   ├── Name
│   ├── Type badge
│   └── Streak
├── MoistureBar
├── GrowthProgress
└── QuickActions
Plant Detail Components
PlantDetailSheet (Bottom Sheet / Modal)
├── PlantHeader
│   ├── PlantAnimation (large)
│   ├── Name
│   └── TypeBadge
├── StatsGrid
│   ├── MoistureCard
│   ├── GrowthCard
│   ├── StreakCard
│   └── XPCard
├── GoalSection (if goal plant)
│   ├── WeeklyTargetCard
│   ├── ProgressChart
│   └── LogInput
├── WateringButton
├── HistoryList
└── SettingsButton
Goal Components
GoalSetupWizard
├── StepIndicator
├── ModeSelection
├── DetailsForm
├── ProgressionPicker
├── PreviewChart
└── ConfirmButton

GoalCard
├── ModeIndicator
├── ProgressRing
├── CurrentVsTarget
├── WeeklyProgressBar
└── PRBadges

GoalLogModal
├── NumberInput
├── TargetComparison
├── PRCelebration
├── NotesInput
└── SubmitButton

AdaptiveSuggestion
├── AnalysisSection
├── OptionsCards
├── DetailButton
└── ActionButtons
Gamification Components
XPPopup (toast)
AchievementPopup (modal)
LevelUpCelebration (fullscreen)
StreakBadge
WeatherBanner
LeaderboardCard
Common Components
Button (variants: primary, secondary, ghost, danger)
Card
Input
Select
Modal / Sheet
Toast
ProgressBar
ProgressRing
Avatar
Badge
EmptyState
LoadingSpinner
ErrorState
Key Component Designs
PlantCard
┌──────────────────────────┐
│ [Type Badge]    [Streak] │
│                          │
│      🌳 (animation)      │
│                          │
│    Plant Name            │
│    ──────────── 65%     │
│    💧💧💧░░ 72%          │
│                          │
│  [Water] [Details]       │
└──────────────────────────┘

Size: 160px x 220px (mobile)
      180px x 240px (desktop)
MoistureBar
Component với 5 levels:
💧💧💧💧💧 100% Full
💧💧💧💧░ 80% Good
💧💧💧░░ 60% OK
💧💧░░░ 40% Low
💧░░░░ 20% Critical
░░░░░ 0% Dead

Animation: Fill animation khi tưới
Color: Blue gradient
GrowthProgress
Circular progress ring:
- Outer ring: Growth %
- Inner: Plant stage icon
- Color: Green gradient

Or horizontal bar:
────────────────░░░░░░░░ 65%
🌱 → → → → → → 🌳

Special for Bamboo:
"Rễ đang mọc..." (no %)
Hidden until 80%
WeatherWidget
┌─────────────────────┐
│ ☀️ Nắng đẹp        │
│ +5% growth today   │
└─────────────────────┘

Compact version for header:
☀️ +5%
WateringButton
State: Ready
┌────────────────────────┐
│    💧 Tưới nước        │
└────────────────────────┘

State: Watering (animation)
┌────────────────────────┐
│    💧 Đang tưới...     │
└────────────────────────┘

State: Done
┌────────────────────────┐
│    ✅ Đã tưới hôm nay  │
└────────────────────────┘
Animation Guidelines
Page Transitions
Slide from right (forward)
Slide from left (back)
Fade for modals
Duration: 200-300ms
Micro-interactions
Button press: scale(0.98)
Card hover: translateY(-2px), shadow increase
Toggle: spring animation
Plant Animations
Idle: Subtle sway (CSS keyframes)
Watering: Water drops, plant bounce
Growth: Scale up + sparkles
Death: Wilt animation, grayscale
Loading States
Skeleton for cards
Spinner for buttons
Shimmer for text
Responsive Breakpoints
mobile: < 640px
tablet: 640px - 1024px
desktop: > 1024px

Garden grid:
- mobile: 2 columns
- tablet: 3 columns
- desktop: 4-5 columns
Accessibility
All interactive elements focusable
Color contrast AA minimum
Touch targets minimum 44px
Screen reader labels
Reduced motion support