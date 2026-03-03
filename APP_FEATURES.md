# Habit Garden - Feature Map & User Journey

> Last Updated: 2026-02-16
> Purpose: Cái nhìn toàn cảnh về tất cả feature và hành trình người dùng

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [User Journey Map](#2-user-journey-map)
3. [Feature Details by Category](#3-feature-details-by-category)
4. [Subscription Tiers & Gating](#4-subscription-tiers--gating)
5. [Data Model Summary](#5-data-model-summary)
6. [Page/Route Map](#6-pageroute-map)

---

## 1. Feature Overview

### Feature Matrix

| # | Feature | Category | Gating | Status |
|---|---------|----------|--------|--------|
| 1 | Auth (Email + Google) | Core | None | Done |
| 2 | Plants CRUD | Core | Level (slots) | Done |
| 3 | Isometric Garden | Core | Level (size) | Done |
| 4 | Watering & Activity Logging | Core | None | Done |
| 5 | Moisture & Streak Tracking | Core | None | Done |
| 6 | XP & Leveling (15-20 levels) | Gamification | Tier (level cap) | Done |
| 7 | Achievements (20+) | Gamification | None | Done |
| 8 | Weather System | Gamification | None | Done |
| 9 | Water Reserves | Gamification | Level | Done |
| 10 | Weeds System | Gamification | None | Done |
| 11 | Mood Tracking | Wellbeing | None | Done |
| 12 | Plant Tiers (1-5) | Progression | Level + Tier | Done |
| 13 | Slot Limits | Progression | Level | Done |
| 14 | Garden Expansion | Progression | Level | Done |
| 15 | Garden Decorations | Progression | Level | Done |
| 16 | Goal Tracking (2 modes) | Goals | PRO | Done |
| 17 | Adaptive Goals | Goals | PRO | Done |
| 18 | Identity System | Identity | PREMIUM | Done |
| 19 | Journal & Reflections | Journal | None | Done |
| 20 | Subscription (Paddle) | Monetization | None | Done |
| 21 | PWA & Mobile Support | Platform | None | Done |
| 22 | Onboarding | UX | None | Done |
| 23 | Gentle Growth (no death) | Philosophy | None | Done |

---

## 2. User Journey Map

### Phase 1: First Time User (Level 1-5, "Seedling")

```
Landing Page → Sign Up → Onboarding Modal
                              │
                              ▼
                    Plant First Habit (1 slot)
                              │
                              ▼
                    Daily Watering Loop ◄────────────┐
                    ┌─────────┼──────────┐           │
                    ▼         ▼          ▼           │
              "Just water"  "I did it!"  Rest Day    │
              (+10 XP)      (+10 XP)     (intentional)
                    │         │          │           │
                    ▼         ▼          ▼           │
              Plant grows, streak increases          │
              Moisture restored                      │
              Achievements unlock                    │
                    │                                │
                    └────────────────────────────────┘
```

**Available features:**
- 1-3 plant slots (increases with level)
- Tier 1-2 plants only
- 3x3 garden grid
- Mood check-in (daily)
- Weather effects (XP bonuses)
- Achievements
- Basic journal
- Water reserves (from Level 3)

**Key moments:**
- First watering → Achievement: "First Drop"
- First plant → Achievement: "First Seed"
- 3-day streak → Achievement unlocked
- Level 3 → Water reserves unlock
- Level 5 → More decorations unlock

---

### Phase 2: Growing User (Level 6-12, "Gardener")

```
Level 6 triggers:
  ├── Garden expands to 5x5
  ├── 4 plant slots
  ├── Upgrade prompt: "Unlock Goals with PRO"
  │         │
  │    [FREE user]              [PRO user]
  │    Still waters &           │
  │    grows plants             ▼
  │                     Goal Setup Wizard
  │                     ┌───────┼────────┐
  │                     ▼                ▼
  │              Build Capacity    Total Progress
  │              (progressive      (cumulative
  │               weekly targets)   toward target)
  │                     │                │
  │                     ▼                ▼
  │              Goal Log Modal ◄────────┘
  │              (log value + notes)
  │                     │
  │                     ▼
  │              Weekly Targets → Adaptive Suggestions
  │              Personal Records → Celebrations
  │
  ├── Level 8 → Lantern decorations
  ├── Level 10 → Garden expands to 7x7, fences
  └── Level 12 → Ponds, fountains
```

**New features at PRO:**
- Goal tracking (2 modes: Build Capacity / Total Progress)
- Up to 5 goals
- Adaptive goal system (auto-adjusts difficulty)
- 8 plant slots, tier 1-4 plants
- 5x5 garden
- Level cap 15
- 2 rest days/week
- 6 garden themes
- No ads

---

### Phase 3: Advanced User (Level 13+, "Sage")

```
Level 13 triggers:
  ├── Upgrade prompt: "Unlock Identity with PREMIUM"
  │
  [PREMIUM user]
  │
  ▼
  Identity Dashboard
  ├── Create Identity ("Who do you want to become?")
  │   ├── 8 presets: Reader, Athlete, Developer, Artist...
  │   └── Custom identity
  │
  ├── Link Goals to Identity
  │   └── Multiple goals → One identity
  │       (e.g., "Reader" ← Read 30min/day + Visit library weekly)
  │
  └── Track Identity Progress
      └── Average of linked goals' progress
```

**New features at PREMIUM:**
- Identity system (group goals by life vision)
- Unlimited plants, all tiers (1-5)
- 7x7+ garden (dynamic expansion)
- Unlimited goals
- Level cap 20+
- 3 rest days/week
- All themes & decorations

---

### Daily Loop (All Users)

```
Open App
  │
  ▼
Mood Check-in (proactive prompt)
  │ "How are you feeling today?"
  │  ☀️ Great → 1.0x XP
  │  🌤️ Good  → 1.05x XP
  │  ☁️ Meh   → 1.15x XP
  │  🌧️ Tough → 1.3x XP
  │  ⛈️ Storm → 1.5x XP (rewards persistence!)
  │
  ▼
Garden View (main screen)
  │
  ├── See plants status (thriving/growing/resting/waiting/sleeping)
  ├── See weather effects (sunny/cloudy/rainy/stormy/rainbow)
  ├── See weeds (if missed days)
  │
  ├── Tap plant → Quick actions:
  │   ├── Water ("Just checking in") → +10 XP + bonuses
  │   ├── Complete ("I did it!") → +10 XP + growth
  │   ├── Log Progress (if has goal) → value + XP
  │   ├── Rest Day → intentional break
  │   └── Clear Weeds → +5 XP per weed
  │
  ├── Long press plant → Plant Detail Sheet:
  │   ├── Tab: Overview (status, moisture, growth, streak)
  │   ├── Tab: Journal (activity history)
  │   ├── Tab: Goals (PRO - weekly targets, progress)
  │   └── Tab: Reflections (milestones)
  │
  └── Navigate via Bottom Nav:
      ├── 🌱 Garden (main)
      ├── 📊 Overview (stats by period)
      ├── 📈 Stats (weekly chart, streaks)
      ├── 👤 Profile (level, XP, achievements)
      ├── 🆔 Identity (PREMIUM)
      └── ⚙️ Settings
```

---

### Weekly/Monthly Loop

```
Weekly:
  ├── Check goal progress vs weekly target
  ├── Adaptive system suggests adjustments
  │   ├── Struggling? → Suggest decrease / recovery week
  │   └── Crushing it? → Suggest increase
  ├── Review mood patterns ("best on Fridays")
  └── Rest day budget (1-3/week by tier)

Monthly:
  ├── Overview stats (monthly view)
  ├── Milestone reflections (30 days, 100 days)
  └── Season completion & new season start
```

---

### Subscription Journey

```
FREE user hits limit
  │
  ├── Plant limit (3 plants) → Upgrade modal
  ├── Tier limit (tier 1-2 only) → Upgrade modal
  ├── Level 6 goals gate → "Unlock Goals with PRO"
  ├── Level 10 cap → "Level up more with PRO"
  └── Level 13 identity gate → "Unlock Identity with PREMIUM"
  │
  ▼
Upgrade Modal
  ├── Compare tiers (FREE / PRO / PREMIUM)
  ├── 7-day free trial option
  └── Paddle checkout overlay
  │
  ▼
Subscription Management (Settings)
  ├── View current plan
  ├── Cancel / Resume
  └── Paddle customer portal
```

---

## 3. Feature Details by Category

### 3.1 Core: Plants & Garden

| Feature | Description |
|---------|-------------|
| **Plant CRUD** | Add, edit, delete habits as plants |
| **40+ plant types** | Each with unique art, tier, decay rate |
| **Plant lifecycle** | thriving → growing → resting → waiting → sleeping (never dies!) |
| **Growth %** | 0-100%, visual stages: seed → sprout → growing → mature → established → ancient → legendary |
| **Moisture** | Decays daily per plant type, restored by watering |
| **Streaks** | Current + longest, bonfire effect at 7+ days |
| **Isometric garden** | 3D grid, pan & zoom, touch support |
| **Garden sizing** | 3x3 → 5x5 → 7x7+ (by level) |
| **Plant movement** | Drag to reposition, multi-cell support (1x1, 2x2) |
| **Decorations** | Bushes, rocks, mushrooms, flowers, lanterns, fences, ponds, fountains |

### 3.2 Gamification

| Feature | Description |
|---------|-------------|
| **XP system** | Exponential scaling, 15-20+ levels |
| **XP sources** | Watering (+10), notes (+5), weather bonus, mood bonus, morning bonus, weed clearing |
| **Achievements** | 20+ with 4 tiers, XP rewards (25-200), hidden achievements |
| **Weather** | Daily random: sunny/cloudy/rainy/stormy/rainbow (5% rare!), affects XP & growth |
| **Water reserves** | Emergency watering currency, earned at level-ups |
| **Weeds** | Grow on neglected plants, +5 XP to clear, max 7 per plant |
| **Level-up celebration** | Confetti, modal, unlock display |
| **Plant tiers** | 5 difficulty tiers, unlock by level |
| **Slot limits** | 1 slot (L1) → unlimited (L14+) |

### 3.3 Goals (PRO)

| Feature | Description |
|---------|-------------|
| **Build Capacity** | Progressive weekly targets (e.g., 10→20→30 pages) |
| **Total Progress** | Cumulative toward target (e.g., run 100 miles in 8 weeks) |
| **Progression types** | Linear, exponential, logarithmic, s-curve, step, custom |
| **Frequency** | Daily / weekly / monthly tracking |
| **Adaptive system** | Auto-detects struggling/crushing → suggests adjustments |
| **Personal records** | Tracked and celebrated |
| **Seasons** | Multiple seasons per habit with reflections |

### 3.4 Identity (PREMIUM)

| Feature | Description |
|---------|-------------|
| **Identity creation** | "Who do you want to become?" with 3-step wizard |
| **8 presets** | Reader, Athlete, Developer, Artist, Learner, Mindful, Builder, Explorer |
| **Custom identities** | Custom name, description, icon, color |
| **Goal linking** | Multiple goals → one identity |
| **Progress tracking** | Average of linked goals |

### 3.5 Wellbeing

| Feature | Description |
|---------|-------------|
| **Mood check-in** | Daily 1-5 scale (stormy → sunny) |
| **Mood XP bonus** | Tough days earn MORE XP (up to 1.5x) |
| **Mood insights** | Patterns by weekday, trends |
| **Gentle Growth** | Plants never die, only sleep. Rest is respected. |
| **Rest days** | Intentional breaks (1-3/week by tier) |
| **Journal** | Activity history, milestones, reflections |

### 3.6 Monetization

| Feature | Description |
|---------|-------------|
| **3 tiers** | FREE ($0) / PRO ($4.99/mo) / PREMIUM ($9.99/mo) |
| **Paddle integration** | Checkout overlay, webhooks, subscription management |
| **Feature gating** | Progressive prompts at natural moments |
| **7-day trial** | Free trial for PRO/PREMIUM |

---

## 4. Subscription Tiers & Gating

| Feature | FREE | PRO ($4.99) | PREMIUM ($9.99) |
|---------|------|-------------|-----------------|
| Max Plants | 3 | 8 | Unlimited |
| Plant Tiers | 1-2 | 1-4 | 1-5 |
| Garden Size | 3x3 | 5x5 | 7x7+ |
| Level Cap | 10 | 15 | 20+ |
| Goals | - | 5 goals | Unlimited |
| Identity | - | - | Yes |
| Rest Days/Week | 1 | 2 | 3 |
| Water Reserves | 3 | 7 | 10+ |
| Themes | 1 | 6 | All |
| XP Multiplier | 1.0x | 1.2x | 1.5x |
| Ads | Yes | No | No |

### Gating Triggers

```
Level 6  → "Unlock Goals" (PRO upsell)
Level 10 → Level cap warning (FREE)
Level 13 → "Unlock Identity" (PREMIUM upsell)
Level 15 → Level cap warning (PRO)
3 plants → Plant limit (FREE)
8 plants → Plant limit (PRO)
```

---

## 5. Data Model Summary

### Core Tables
```
profiles ─────── User account, XP, level, tier, reserves
plant_types ──── 40+ plant catalog with tiers & mechanics
plants ──────── User's plants with growth, moisture, streaks, grid position
```

### Activity Tables
```
activity_logs ── Unified: watering, completed, progress, rest_day, reflection
rest_days ────── Intentional rest tracking
reflections ──── Milestone reflections
```

### Goal Tables
```
goals ────────── Seasons with targets, progression, frequency
goal_logs ────── Progress entries (legacy, migrating to activity_logs)
goal_adjustments Adaptive system changes
```

### Gamification Tables
```
achievements ──── 20+ achievement definitions
user_achievements User's unlocked achievements
daily_weather ──── Daily weather (affects XP/growth)
```

### Subscription Tables
```
subscription_tiers ── Tier configs (FREE/PRO/PREMIUM)
subscriptions ─────── User subscription records
subscription_events ── Lifecycle events audit
upgrade_prompts ────── UX tracking
subscription_webhooks  Paddle webhook audit
```

### Identity Tables (PREMIUM)
```
identities ──── User identities with progress
goals.identity_id ── Links goals to identity
```

### Other
```
mood_logs ──── Daily mood entries
notifications ─ Push/in-app notifications
watering_logs ─ Legacy (migrating to activity_logs)
```

---

## 6. Page/Route Map

### Public Pages
| Route | Purpose |
|-------|---------|
| `/` | Landing page (philosophy, features, pricing) |
| `/login` | Email/password + Google OAuth |
| `/signup` | Account creation |
| `/pricing` | Subscription tiers |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/refund` | Refund policy |

### Dashboard Pages (authenticated)
| Route | Purpose | Gating |
|-------|---------|--------|
| `/garden` | Main isometric garden view | None |
| `/overview` | Stats by period (day/week/month/year) | None |
| `/stats` | Weekly chart, streaks, plant stats | None |
| `/profile` | Level, XP, achievements, water reserves | None |
| `/identity` | Identity dashboard | PREMIUM |
| `/settings` | Account, notifications, appearance, subscription | None |

### API Routes
| Route | Purpose |
|-------|---------|
| `POST /api/webhooks/paddle` | Paddle payment webhooks |
| `POST /api/cron/moisture-decay` | Daily moisture decay (17:00 UTC) |
| `POST /api/admin/migrate-grid` | Grid migration utility |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                    Next.js App                   │
├─────────────┬──────────────┬────────────────────┤
│  Public      │  Dashboard    │  API               │
│  /           │  /garden      │  /api/webhooks     │
│  /login      │  /overview    │  /api/cron         │
│  /signup     │  /stats       │                    │
│  /pricing    │  /profile     │                    │
│              │  /identity    │                    │
│              │  /settings    │                    │
├─────────────┴──────────────┴────────────────────┤
│                  Components                      │
│  garden/ plants/ goals/ game-ui/ identity/       │
│  mood/ gamification/ settings/ dev/              │
├─────────────────────────────────────────────────┤
│                 Business Logic                   │
│  Server Actions: plants, goals, activity,        │
│  identity, mood, weeds, journal, adaptive,       │
│  profile, subscription, paddle                   │
├─────────────────────────────────────────────────┤
│                  State (Contexts)                │
│  Plants, Mood, Weeds, GardenSettings,           │
│  Subscription, DevDebug                          │
├─────────────────────────────────────────────────┤
│                 Core Systems                     │
│  xp-system, progression-system, plant-status,   │
│  subscription-limits, mood-system, weather,      │
│  achievements, adaptive-goals, grid-positioning  │
├─────────────────────────────────────────────────┤
│              Supabase (PostgreSQL)               │
│  20 tables, RLS policies, cron jobs, triggers   │
└─────────────────────────────────────────────────┘
```
