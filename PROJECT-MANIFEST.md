# Habit Garden - Project Manifest

> **Last Updated**: 2026-01-22
> **Version**: 0.4.0-beta
> **Status**: Phase 4 - Polish & Launch (In Progress)

---

## 1. Product Vision

### What is Habit Garden?

**Habit Garden** biến việc xây dựng thói quen thành một trò chơi trồng cây. Mỗi habit là một cây, tưới nước = hoàn thành habit, cây sẽ lớn dần và vườn của bạn sẽ thịnh vượng.

### Core Philosophy

```
Habit = Plant
Daily Check-in = Watering
Consistency = Growth
Neglect = Death
```

### Target Users

- Người muốn xây dựng thói quen nhưng thiếu động lực
- Người thích gamification
- Người học từ visual feedback

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui + Radix UI |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Cron | Supabase pg_cron |
| Hosting | Vercel |

---

## 3. Feature Inventory

### 3.1 Core Features (Phase 1) ✅

| Feature | Status | Description |
|---------|--------|-------------|
| Authentication | ✅ Done | Login, Register, Logout, Protected routes |
| User Profile | ✅ Done | Avatar, name, settings |
| Plant Creation | ✅ Done | Choose type, name, habit description |
| Garden View | ✅ Done | Isometric 3D grid with plants |
| List View | ✅ Done | Card-based plant list |
| Plant Detail | ✅ Done | Stats, history, actions |
| Watering | ✅ Done | One-tap water, daily limit |
| Moisture System | ✅ Done | Decay over time, visual bars |
| Growth Progress | ✅ Done | 5 stages: seed → mature |
| Plant Death | ✅ Done | Dies at 0% moisture |
| Streak Tracking | ✅ Done | Consecutive watering days |

### 3.2 Gamification (Phase 2) ✅

| Feature | Status | Description |
|---------|--------|-------------|
| XP System | ✅ Done | Earn XP from actions |
| 15 Levels | ✅ Done | Seedling → Eden Creator |
| 20+ Achievements | ✅ Done | 4 tiers: Bronze → Legendary |
| Weather System | ✅ Done | 5 types affecting XP/growth |
| Special Plants | ✅ Done | 8 types with unique effects |
| Water Reserves | ✅ Done | Streak protection |
| Stats Dashboard | ✅ Done | Overview of progress |
| Cemetery | ✅ Done | Dead plants history |

**Special Plant Types:**
| Plant | Effect |
|-------|--------|
| 🎋 Bamboo | Delayed growth, then explosive |
| 🌻 Sunflower | Buffs nearby plants |
| 🌸 Cherry Blossom | Cycling bloom animation |
| 🌵 Cactus | Drought resistant |
| 🪷 Lotus | Bonus XP on hard days |
| 🌹 Rose | Standard beauty |
| 🎍 Bonsai | Slow but steady |
| 💰 Money Tree | Prosperity symbol |

### 3.3 Goal Tracking (Phase 3) ✅

| Feature | Status | Description |
|---------|--------|-------------|
| Build Capacity Mode | ✅ Done | Improve over time (2km → 10km) |
| Total Progress Mode | ✅ Done | Accumulate to target ($10,000) |
| Goal Wizard | ✅ Done | 4-step setup with previews |
| Weekly Targets | ✅ Done | Auto-generated from curves |
| Progression Curves | ✅ Done | Steady, S-Curve, Step, etc. |
| Daily Logging | ✅ Done | Quick value input |
| Personal Records | ✅ Done | Track PRs with trophies |
| Progress Charts | ✅ Done | Goal Master style visuals |
| Goal Timeline | ✅ Done | Week-by-week breakdown |

### 3.4 Adaptive Goals (Phase 3b) ✅

| Feature | Status | Description |
|---------|--------|-------------|
| Performance Analysis | ✅ Done | Weekly score, trends |
| Trigger Detection | ✅ Done | Auto-detect when to adjust |
| Suggestions | ✅ Done | Increase/Decrease/Recovery |
| 3 Adaptive Modes | ✅ Done | Fixed, Suggest, Auto |
| Recovery Week | ✅ Done | 50% target reduction |
| Adjustment History | ✅ Done | Track all changes |

### 3.5 Mood/Weather System ✅

| Feature | Status | Description |
|---------|--------|-------------|
| 5 Mood Levels | ✅ Done | Sunny → Stormy |
| XP Multipliers | ✅ Done | Tough days = more XP |
| Weather Visuals | ✅ Done | Rain, lightning, effects |
| Garden Atmosphere | ✅ Done | Sky changes with weather |

### 3.6 UX Enhancements ✅

| Feature | Status | Description |
|---------|--------|-------------|
| One-Tap Watering | ✅ Done | Tap plant to water |
| Long-Press Info | ✅ Done | Hold for details |
| Floating HUD | ✅ Done | XP/Level/Weather display |
| Bottom Navigation | ✅ Done | Game-style nav |
| Plant Drag-and-Drop | ✅ Done | Reposition plants |
| Zoom Controls | ✅ Done | Pinch or buttons |
| Watering Celebration | ✅ Done | 3-second animation |
| Optimistic Updates | ✅ Done | Instant UI feedback |

### 3.7 Visual System ✅

| Feature | Status | Description |
|---------|--------|-------------|
| Plant Images | ✅ Done | PNG per growth stage |
| 5 Growth Stages | ✅ Done | seed → mature |
| CSS Animations | ✅ Done | Sway, glow, wilting |
| Isometric View | ✅ Done | 3D garden perspective |
| Multi-Cell Plants | ✅ Done | 1x1 → 3x3 expansion |
| Weather Effects | ✅ Done | Rain, lightning overlay |

### 3.8 Infrastructure ✅

| Feature | Status | Description |
|---------|--------|-------------|
| PWA Support | ✅ Done | Installable app |
| Onboarding Flow | ✅ Done | 5-step tutorial |
| Error Boundaries | ✅ Done | Graceful error handling |
| Loading States | ✅ Done | Skeleton loaders |
| Timezone Support | ✅ Done | Per-user timezone |
| Cron Job | ✅ Done | Daily moisture decay |

### 3.9 Pending Features (Phase 4)

| Feature | Status | Description |
|---------|--------|-------------|
| Performance Optimization | ⏳ Planned | Bundle size, lazy loading |
| SEO Setup | ⏳ Planned | Meta tags, sitemap |
| Analytics | ⏳ Planned | Usage tracking |
| Landing Page | ⏳ Planned | Marketing page |
| Push Notifications | ⏳ Planned | Reminders |

### 3.10 Future Features (Phase 5)

| Feature | Status | Description |
|---------|--------|-------------|
| Buddy Gardens | 💭 Future | 1-on-1 pairing |
| Group Gardens | 💭 Future | Team challenges |
| Friend System | 💭 Future | Social connections |
| Leaderboards | 💭 Future | Competitive element |
| Premium Subscription | 💭 Future | Advanced features |

---

## 4. File Architecture

```
habit-garden/
├── .claude/                    # AI Assistant docs
│   ├── MEMO.md                 # Current state (READ FIRST!)
│   ├── DECISIONS.md            # Architecture decisions
│   ├── DEVLOG.md               # Development journal
│   ├── CHANGELOG.md            # Version history
│   └── ROADMAP.md              # Product roadmap
│
├── doc/                        # Technical documentation
│   ├── 01 - PROJECT-OVERVIEW.md
│   ├── 02 - DATABASE-SCHEMA.md
│   ├── 03 - PLANT-SYSTEM.md
│   ├── 04 - WATERING-MOISTURE.md
│   ├── 05 - GOAL-TRACKING.md
│   ├── 06 - ADAPTIVE-GOALS.md
│   ├── 07 - GAMIFICATION.md
│   └── 11 - IMPLEMENTATION-PHASES.md
│
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login, Signup
│   │   ├── (dashboard)/        # Main app
│   │   │   ├── garden/         # Garden page
│   │   │   ├── overview/       # Stats overview
│   │   │   ├── profile/        # User profile
│   │   │   ├── stats/          # Detailed stats
│   │   │   └── settings/       # Settings
│   │   └── api/                # API routes
│   │       └── cron/           # Cron endpoints
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── plants/             # Plant-specific UI
│   │   │   ├── plant-visual.tsx
│   │   │   ├── plant-image.tsx
│   │   │   ├── plant-card.tsx
│   │   │   ├── plant-detail-sheet.tsx
│   │   │   └── add-plant-dialog.tsx
│   │   ├── garden/             # Garden layout
│   │   │   ├── garden-view.tsx
│   │   │   ├── isometric-garden.tsx
│   │   │   ├── isometric-tile.tsx
│   │   │   ├── isometric-plant.tsx
│   │   │   ├── ground-plane.tsx
│   │   │   ├── garden-sky.tsx
│   │   │   └── weather-effects.tsx
│   │   ├── goals/              # Goal tracking UI
│   │   │   ├── goal-setup-wizard.tsx
│   │   │   ├── goal-progress-chart.tsx
│   │   │   └── goal-stats.tsx
│   │   ├── gamification/       # XP, achievements
│   │   ├── mood/               # Mood/Weather selector
│   │   ├── game-ui/            # HUD, navigation
│   │   └── onboarding/         # Tutorial
│   │
│   ├── lib/
│   │   ├── actions/            # Server actions
│   │   │   ├── plants.ts       # Plant CRUD, watering
│   │   │   ├── goals.ts        # Goal management
│   │   │   ├── profile.ts      # User profile
│   │   │   └── mood.ts         # Mood logging
│   │   ├── context/            # React contexts
│   │   │   ├── plants-context.tsx
│   │   │   └── mood-context.tsx
│   │   ├── hooks/              # Custom hooks
│   │   ├── utils/              # Utilities
│   │   │   └── grid-positioning.ts
│   │   ├── supabase/           # DB client
│   │   ├── xp-system.ts        # XP calculations
│   │   ├── achievements.ts     # Achievement defs
│   │   ├── weather-system.ts   # Weather logic
│   │   └── mood-system.ts      # Mood/XP bonuses
│   │
│   └── types/
│       └── database.ts         # Type definitions
│
└── public/
    └── plants/                 # Plant images
        ├── generic/            # Default plant
        ├── sunflower/
        ├── cherry-blossom/
        └── ...
```

---

## 5. Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User data, XP, level, settings |
| `plants` | User's plants with stats |
| `plant_types` | Plant type definitions |
| `watering_logs` | Watering history |
| `goals` | Goal configurations |
| `goal_logs` | Daily goal values |
| `goal_adjustments` | Adaptive adjustment history |
| `mood_logs` | Daily mood tracking |
| `user_achievements` | Unlocked achievements |
| `notifications` | User notifications |

---

## 6. Key Algorithms

### Growth Stage Calculation
```typescript
if (growth < 10) return 'seed'
if (growth < 25) return 'sprout'
if (growth < 50) return 'growing'
if (growth < 75) return 'blooming'
return 'mature'
```

### XP Calculation
```typescript
baseXP = 10
+ weatherBonus (5-15)
+ moodBonus (0-50%)
+ streakBonus (streak * 2, max 20)
+ morningBonus (10, 6-9 AM)
```

### Moisture Decay
```
Daily decay = 12%
Critical threshold = 30%
Death threshold = 0%
```

### Weather Distribution
```typescript
Sunny: 35%
Cloudy: 25%
Rainy: 20%
Stormy: 10%
Rainbow: 10% (rare, bonus day)
```

---

## 7. Development Phases

| Phase | Status | Timeline |
|-------|--------|----------|
| 1. MVP Core | ✅ Complete | Week 1-6 |
| 2. Gamification | ✅ Complete | Week 7-10 |
| 3. Goal Tracking | ✅ Complete | Week 11-14 |
| 3b. Adaptive Goals | ✅ Complete | Week 13-14 |
| 4. Polish & Launch | 🟡 In Progress | Week 15-16 |
| 5. Community | 💭 Future | TBD |

---

## 8. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cron
CRON_SECRET=
```

---

## 9. Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Generate PWA icons
npm run generate-icons
```

---

## 10. Documentation Index

| Need info about... | Read this file |
|--------------------|----------------|
| Current state | `.claude/MEMO.md` |
| Architecture decisions | `.claude/DECISIONS.md` |
| Development history | `.claude/DEVLOG.md` |
| Release notes | `.claude/CHANGELOG.md` |
| Product roadmap | `.claude/ROADMAP.md` |
| Tech stack, setup | `doc/01 - PROJECT-OVERVIEW.md` |
| Database schema | `doc/02 - DATABASE-SCHEMA.md` |
| Plant system | `doc/03 - PLANT-SYSTEM.md` |
| Watering mechanics | `doc/04 - WATERING-MOISTURE.md` |
| Goal tracking | `doc/05 - GOAL-TRACKING.md` |
| Adaptive goals | `doc/06 - ADAPTIVE-GOALS.md` |
| Gamification | `doc/07 - GAMIFICATION.md` |
| Task breakdown | `doc/11 - IMPLEMENTATION-PHASES.md` |

---

## 11. Quick Stats

| Metric | Value |
|--------|-------|
| Total Components | ~90 |
| Server Actions | ~15 |
| Database Tables | ~10 |
| Phases Completed | 4/5 |
| Features Shipped | 50+ |
| Lines of Code | ~15,000+ |

---

## 12. Contact & Resources

- **Repository**: habit-garden
- **Documentation**: `/doc/` folder
- **AI Context**: `/.claude/` folder

---

*This manifest is auto-generated and should be updated when major features are added.*
