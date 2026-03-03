# Habit Garden (Habien) - Feature Map & User Journey

> Last Updated: 2026-03-03
> Version: Habien v3 — Fun First, Transform While Playing
> Purpose: Cái nhìn toàn cảnh về tất cả feature và hành trình người dùng

---

## Table of Contents

1. [Philosophy & Design Principles](#1-philosophy--design-principles)
2. [Feature Overview](#2-feature-overview)
3. [User Journey Map](#3-user-journey-map)
4. [Feature Details by Category](#4-feature-details-by-category)
5. [Subscription Tiers & Gating](#5-subscription-tiers--gating)
6. [Data Model Summary](#6-data-model-summary)
7. [Page/Route Map](#7-pageroute-map)
8. [Architecture Diagram](#8-architecture-diagram)

---

## 1. Philosophy & Design Principles

### v3 Mission

> "Build a habit garden so fun you open it every day, so smart it actually changes you."

### The Three Core Principles

**Principle 1: Fun First**
The app must be fun enough to open on a bad day. Not because users "should" but because they WANT to see their garden. Gamification is the engine — not the enemy.

**Principle 2: Redirect, Don't Remove**
Every v2 mechanic stays. XP, streaks, achievements, levels — all kept. v3 redirects them to reward behaviors that actually build habits, instead of just rewarding time spent.

**Principle 3: Psychology as Reward**
Every behavior science concept (2-Minute Rule, Habit Stacking, Identity, Reflection) is implemented as something the user EARNS, not something they are forced to do. No lectures — only XP.

### The Ancient Tree Vision

The long-term emotional hook: **Looking at your garden 3 years from now and seeing a massive, beautiful ancient tree where you once planted a tiny seed.** That tree represents time, consistency, and who you became. No money or grinding produces it — only showing up, day after day, for years.

---

## 2. Feature Overview

### Feature Matrix

| # | Feature | Category | Gating | Status |
|---|---------|----------|--------|--------|
| 1 | Auth (Email + Google) | Core | None | Done |
| 2 | Plants CRUD | Core | Level (slots) | Done |
| 3 | Isometric Garden | Core | Level (size) | Done |
| 4 | One-Tap Watering & Activity Logging | Core | None | Done |
| 5 | Moisture & Streak Tracking | Core | None | Done |
| 6 | Plant Dormancy & Revival | Core | None | In Progress (Phase 0) |
| 7 | Extended Growth Stages (8 stages) | Core | None | In Progress (Phase 0+3) |
| 8 | Growth Timer (days of consistency) | Core | None | In Progress (Phase 0) |
| 9 | Easy Mode / Tiny Seed (2-min rule) | Behavior | None | Planned (Phase 1) |
| 10 | Anchors / Habit Stacking | Behavior | Level 3 unlock | Planned (Phase 1) |
| 11 | Reflection Journal (weekly prompts) | Behavior | Level 4 unlock | Planned (Phase 2) |
| 12 | Mirror Moments (identity discovery) | Identity | None (FREE) | Planned (Phase 2) |
| 13 | Identity Badges (profile) | Identity | None (FREE) | Planned (Phase 2) |
| 14 | Identity Zones (garden grouping) | Identity | PRO | Planned (Phase 2) |
| 15 | Struggle-Aware System | Wellbeing | None | Planned (Phase 4) |
| 16 | XP & Leveling (15-20 levels) | Gamification | Tier (level cap) | Done |
| 17 | Achievements (30+) | Gamification | None / PRO | Done + Extending |
| 18 | Weather System | Gamification | None | Done |
| 19 | Water Reserves | Gamification | Level | Done |
| 20 | Mood Tracking | Wellbeing | None | Done |
| 21 | Plant Tiers (1-5) | Progression | Level + Tier | Done |
| 22 | Slot Limits | Progression | Level | Done |
| 23 | Garden Expansion | Progression | Level | Done |
| 24 | Garden Decorations | Progression | Level | Done |
| 25 | Ancient Tree Aura (nearby boost) | Garden | Ancient stage | Planned (Phase 3) |
| 26 | Goal Tracking (2 modes) | Goals | PRO | Done |
| 27 | Adaptive Goals | Goals | PRO | Done |
| 28 | Weekly Insights | Goals | PRO | Planned (Phase 5) |
| 29 | Subscription (Paddle) | Monetization | None | Done |
| 30 | Garden Neighbors & Sunshine | Social | PREMIUM | Planned (Phase 6) |
| 31 | AI Coaching Nudges | AI | PREMIUM | Planned (Phase 6) |
| 32 | PWA & Mobile Support | Platform | None | Done |
| 33 | Onboarding | UX | None | Done |

---

## 3. User Journey Map

### Phase 1: New Gardener (Level 1-5, "Seedling")

```
Landing Page → Sign Up → "Plant your first seed"
                               │
                               ▼
                    Plant First Habit (1 slot)
                    [Optional: Easy Mode ON]
                    "Set a 2-minute version"
                               │
                               ▼
                    Daily Watering Loop ◄────────────────┐
                    ┌──────────┼──────────┐              │
                    ▼          ▼          ▼              │
              "Just water"  "I did it!"  Rest Day        │
              (+10 XP)      (+10 XP)     (intentional)   │
                    │          │          │              │
                    ▼          ▼          ▼              │
                 Plant grows, streak increases           │
                 Moisture restored, achievements unlock   │
                    │                                    │
         [Miss 3+ days? Plant goes DORMANT]              │
                    │                                    │
         "Welcome back! [Plant] missed you."             │
         (+25 XP revival bonus, NO progress lost)        │
                    └────────────────────────────────────┘
```

**Available features:**
- 1-3 plant slots (increases with level)
- Tier 1-2 plants only
- 3x3 garden grid
- Easy Mode (Tiny Seed) toggle — optional +20% XP for 30 days
- Mood check-in (daily)
- Weather effects (XP bonuses)
- Achievements (15 basic)
- Basic journal
- Water reserves (from Level 3)
- Anchors unlock at Level 3
- Reflection journal unlocks at Level 4
- Mirror Moments (identity discovery) — FREE

**Key moments:**
- First watering → "First Drop" achievement
- First plant → "First Seed" achievement
- 3-day streak → Streak achievement
- Level 3 → Water reserves + Anchor feature unlock
- Level 4 → Reflection journal unlock
- Day 7 of Easy Mode → "Tiny but Mighty" achievement
- 7-day anchor streak → "Anchored" achievement (+10% XP for this plant)
- Return after 3+ days → "Welcome Back" bonus (+25 XP)
- Plant revived from dormancy → "The Dormant Revival" achievement

---

### Phase 2: Growing Gardener (Level 6-12, "Gardener")

```
Level 6 triggers:
  ├── Garden expands to 5x5
  ├── 4 plant slots
  ├── Upgrade prompt: "Unlock Goals with PRO" (at natural moment)
  │
  [FREE user continues]          [PRO user]
  Plants growing, streaks           │
  Mirror Moments can trigger        ▼
                             Goal Setup Wizard
                             ┌───────┼────────┐
                             ▼                ▼
                      Build Capacity    Total Progress
                      (weekly targets)  (cumulative goal)
                             │                │
                             ▼                ▼
                      Goal Log Modal ◄────────┘
                             │
                             ▼
                      Weekly Insights → Adaptive Suggestions
                      Identity Zones (PRO) → Garden grouping

Day 30 of consistent reading habit → MIRROR MOMENT (FREE!)
  "Your garden noticed. 30 days of reading.
   You're not just someone who reads sometimes.
   You're becoming a Reader."
   Achievement: "The Reader Emerges" (+50 XP)
   Unlocks: Reader identity badge on profile

Plant reaches Day 91 → ESTABLISHED stage (all tiers)
  Butterflies appear. Reduced watering need (every 2-3 days OK).
  Celebration: "The Established One" (+200 XP)
```

**New features unlocked:**
- PRO: Goal tracking (2 modes), 5 goals max
- PRO: Weekly insights, adaptive system
- PRO: Identity Zones (themed plant grouping in garden)
- All: Mirror Moments (pattern-based identity discoveries)
- All: Established growth stage (Day 91-180)
- Level 8 → Lantern decorations
- Level 10 → Garden expands to 7x7, fences
- Level 12 → Ponds, fountains

---

### Phase 3: Advanced Gardener (Level 13+, "Sage")

```
Plant reaches Day 181 → VENERABLE stage
  Larger, richer. Unique details appear (flowers, fruit, bark).
  Affects nearby tiles (shade, moss).
  Celebration: "The Venerable One" (+500 XP)

Plant reaches Year 1 → ANCIENT stage
  Significantly larger. Seasonal visual changes.
  Small creatures appear (birds, butterflies, fireflies).
  OTHER nearby plants grow slightly faster ("ancient tree aura")
  Celebration: "The Ancient Gardener" (+1000 XP)

Plant reaches Year 3 → LEGENDARY stage
  Massive, awe-inspiring. Unique one-of-a-kind visual per plant type.
  Garden landmark. Custom particle effects.
  Celebration: "Living Legend" (+2500 XP)
  Achievement: "A tree older than most apps."

PREMIUM unlocks:
  Garden Neighbors → Link 1-3 accountability buddies
  Sunshine System → One-tap encouragement
  AI Coaching → Pattern-based suggestions ("You break streaks after weekends")
  Year in Review → Transformation story
```

**New features at PREMIUM:**
- Garden Neighbors (1-3 buddies, invite code)
- Sunshine system (send/receive encouragement)
- AI coaching nudges
- Advanced pattern recognition
- Year in Review feature
- Unlimited plants, all tiers (1-5)
- 7x7+ garden (dynamic expansion)
- Level cap 20+
- 14 water reserves, 3 rest days/week

---

### Plant Growth Timeline

```
STAGE       TIME          VISUAL                        WATERING NEED
─────────── ────────────  ────────────────────────────  ─────────────
Seed        Day 1-3       Tiny seed in soil             Daily
Sprout      Day 4-7       Small green shoot             Daily
Growing     Day 8-30      Recognizable plant             Daily
Mature      Day 31-90     Full-sized, beautiful          Daily
Established Day 91-180    Slightly larger, butterflies   Every 2-3 days
Venerable   Day 181-365   Bigger, unique details,        Every 3-5 days
                          affects nearby tiles
Ancient     Year 1-3      Dominant presence,             Weekly
                          creatures, seasonal changes,
                          aura boosts nearby plants
Legendary   Year 3+       Massive, unique art,           Self-sustaining
                          garden monument                (water for XP)
```

**Key rules:**
- Growth is time + consistency, NOT XP. Cannot be bought or grinded.
- Each counted day = watering occurred. Days without watering: plant pauses (no regression).
- Dormant plants do NOT lose growth_days. Revive from dormancy = continue from same stage.

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
  ├── See plant stages (Seed/Sprout/Growing/Mature/Established/Venerable/Ancient/Legendary)
  ├── See plant status (thriving/growing/resting/waiting/sleeping/dormant)
  ├── See weather effects (sunny/cloudy/rainy/stormy/rainbow)
  ├── See ancient tree aura effects on nearby plants (Ancient+)
  │
  ├── Tap plant → Quick actions:
  │   ├── Water ("Just checking in") → +10 XP + bonuses
  │   ├── Complete ("I did it!") → +10 XP + growth
  │   ├── Easy Mode check-in (if enabled) → +2 bonus XP
  │   ├── Log Progress (if has goal) → value + XP
  │   ├── Rest Day → intentional break
  │   └── Revive! (if dormant) → +25 XP + "Welcome back!" moment
  │
  ├── Long press plant → Plant Detail Sheet:
  │   ├── Tab: Overview (stage, growth_days, moisture, streak)
  │   ├── Tab: Journal (activity history)
  │   ├── Tab: Goals (PRO - weekly targets, progress)
  │   ├── Tab: Reflections (milestones + weekly prompts with XP)
  │   └── Tab: Anchor (set habit stacking anchor, L3+)
  │
  └── Navigate via Bottom Nav:
      ├── 🌱 Garden (main)
      ├── 📊 Overview (stats by period)
      ├── 📈 Stats (weekly chart, streaks)
      ├── 👤 Profile (level, XP, achievements, identity badges)
      └── ⚙️ Settings
```

---

### Struggle-Aware System

```
User returns after 3+ days:
  "Welcome back! Your garden has been waiting for you.
   [Plant] is a little sleepy, but happy to see you.
   No judgment. Let's water one plant and call it a win."
  → +25 XP Welcome Back bonus

Pattern of declining check-ins detected:
  "Your garden senses you might need a breather.
   It's okay. Even gardens have winters.
   [Put plants to sleep] | [Take a rest day] | [I'm fine]"
  → Manual dormancy option (no decay while dormant)

Dramatic pattern break (was daily 60+ days, now 7+ days absent):
  "Something changed. You were checking in every day for [X] days.
   Your [Ancient Oak] has been growing for 247 days.
   It's not going anywhere. When you're ready: [Water one plant]"
  → No guilt. Just warmth.
```

---

### Subscription Journey

```
FREE user hits natural limit
  │
  ├── Plant limit (3 plants) → Upgrade modal at natural moment
  ├── Tier limit (tier 1-2 only) → Upgrade modal
  ├── Level 6 → "Unlock Goals with PRO" (goals are valuable, not paywall)
  ├── Level 10 cap → "Level up more with PRO"
  └── Mirror Moment + wanting Identity Zone → PRO upsell
  │
  ▼
Upgrade Modal
  ├── Compare tiers (FREE "The Seed" / PRO "The Garden" / PREMIUM "The Sage")
  ├── 7-day free trial option
  ├── 30-day money-back guarantee
  └── Paddle checkout overlay
  │
  ▼
Subscription Management (Settings)
  ├── View current plan
  ├── Cancel / Resume / Pause (up to 3 months/year)
  └── Paddle customer portal
```

---

## 4. Feature Details by Category

### 4.1 Core: Plants & Garden

| Feature | Description |
|---------|-------------|
| **Plant CRUD** | Add, edit, delete habits as plants |
| **40+ plant types** | Each with unique art, tier, decay rate |
| **8 growth stages** | Seed → Sprout → Growing → Mature → Established → Venerable → Ancient → Legendary |
| **Growth timer** | `growth_days`: counts days of consistency (time-based, not XP-based) |
| **Plant dormancy** | Moisture = 0 → dormant (asleep, not dead). Revive with one water. No progress lost. |
| **Dormancy revival** | Welcome back message + +25 XP bonus on first water |
| **Moisture decay** | Decays daily per plant type, restored by watering |
| **Reduced watering at higher stages** | Established: 2-3 days; Venerable: 3-5 days; Ancient: 1/week; Legendary: self-sustaining |
| **Streaks** | Current + longest, bonfire effect at 7+ days |
| **Isometric garden** | 3D grid, pan & zoom, touch support |
| **Garden sizing** | 3x3 → 5x5 → 7x7+ (by level and tier) |
| **Plant movement** | Drag to reposition, multi-cell support (1x1, 2x2) |
| **Decorations** | Bushes, rocks, mushrooms, flowers, lanterns, fences, ponds, fountains |
| **Ancient Tree Aura** | Ancient+ plants give nearby plants a small growth day bonus |
| **Seasonal visuals** | Ancient+ plants show spring blossoms, autumn colors, winter frost |
| **Creature effects** | Established: butterflies; Ancient: birds, fireflies |

### 4.2 Gamification

| Feature | Description |
|---------|-------------|
| **XP system** | Exponential scaling, 15-20+ levels |
| **XP sources** | Watering (+10), notes (+5), Easy Mode (+2 bonus), anchor check-in (+3), weather bonus, mood bonus, morning bonus, reflection journal (15-25), milestone stages (200-2500), welcome back (+25) |
| **Achievements** | 30+ with 4 tiers, XP rewards (20-10000), hidden achievements, Mirror Moments |
| **Weather** | Daily random: sunny/cloudy/rainy/stormy/rainbow (5% rare!), affects XP & growth |
| **Water reserves** | Emergency watering currency, earned at level-ups |
| **Level-up celebration** | Confetti, modal, unlock display |
| **Plant tiers** | 5 difficulty tiers, unlock by level |
| **Slot limits** | 1 slot (L1) → unlimited (L14+) |
| **Growth celebrations** | Special ceremony + XP burst for each milestone stage (Established, Venerable, Ancient, Legendary) |

### 4.3 Behavior Features (v3 New)

| Feature | Unlock | Description |
|---------|--------|-------------|
| **Easy Mode / Tiny Seed** | Day 1 (optional toggle) | 2-minute version of habit. +20% XP for first 30 days. Not baby mode — the smart mode. |
| **Anchors** | Level 3 | "After I ___, I will [habit]." Link to existing routine. 7-day anchor streak → +10% permanent XP for this plant. |
| **Reflection Journal** | Level 4 | Weekly prompts: how did it feel? what changed? why do you love it? Each prompt gives 15-25 XP. Complete all 4 → "Why I Love This" achievement + 100 XP. |
| **Mirror Moments** | FREE (pattern-triggered) | After 30+ consistent days, the app surfaces a surprise achievement: "You're becoming a Reader." Backed by evidence, not declaration. |

### 4.4 Identity System (v3 Redesigned)

| Feature | Tier | Description |
|---------|------|-------------|
| **Mirror Moments** | FREE | Identity discovered through patterns, not declared on Day 1. Day 30 reading → "The Reader Emerges" |
| **Identity Badges** | FREE | Earned badges displayed on profile (Reader, Athlete, Learner, Developer, Artist, Builder, Mindful, Explorer) |
| **Identity Zones** | PRO | 3+ habit-related plants auto-group in garden with themed background |

### 4.5 Goals (PRO)

| Feature | Description |
|---------|-------------|
| **Build Capacity** | Progressive weekly targets (e.g., 10→20→30 pages) |
| **Total Progress** | Cumulative toward target (e.g., run 100 miles in 8 weeks) |
| **Progression types** | Linear, exponential, logarithmic, s-curve, step, custom |
| **Frequency** | Daily / weekly / monthly tracking |
| **Adaptive system** | Auto-detects struggling/crushing → suggests adjustments |
| **Personal records** | Tracked and celebrated |
| **Seasons** | Multiple seasons per habit with reflections |
| **Weekly Insights** | Consistency patterns, best days, trends |

### 4.6 Wellbeing

| Feature | Description |
|---------|-------------|
| **Mood check-in** | Daily 1-5 scale (stormy → sunny) |
| **Mood XP bonus** | Tough days earn MORE XP (up to 1.5x) — rewards persistence |
| **Gentle Growth** | Plants never die, only go dormant. Rest is respected. |
| **Rest days** | Intentional breaks (1-3/week by tier) |
| **Struggle-Aware System** | Welcome Back flow, Permission to Rest, Life Change Detection — all warm, no guilt |
| **Manual dormancy** | User can put plants to sleep (no decay, no judgment) |

### 4.7 Social — Garden Neighbors (PREMIUM)

| Feature | Description |
|---------|-------------|
| **Buddy linking** | 1-3 people via invite code |
| **Garden preview** | See simplified visual of neighbor's garden (no metrics) |
| **Presence indicator** | Green glow if buddy showed up today |
| **Sunshine** | One-tap encouragement notification — positive only, no criticism |
| **Milestone alerts** | "Your buddy hit 100 days!" |
| **No leaderboards** | No comparison, no anxiety. Benevolent accountability only. |

### 4.8 AI (PREMIUM)

| Feature | Description |
|---------|-------------|
| **AI Coaching Nudges** | Pattern-based suggestions at the right moment |
| **Advanced Pattern Recognition** | "You break streaks after weekends" |
| **Year in Review** | Annual transformation story |

### 4.9 Monetization

| Feature | Description |
|---------|-------------|
| **3 tiers** | FREE "The Seed" / PRO "The Garden" ($4.99/mo) / PREMIUM "The Sage" ($9.99/mo) |
| **Annual plans** | PRO $47.99/yr, PREMIUM $95.99/yr |
| **Paddle integration** | Checkout overlay, webhooks, subscription management |
| **Feature gating** | Prompts at natural moments only — never anxiety-inducing, never mid-habit |
| **7-day trial** | Free trial for PRO/PREMIUM |
| **30-day guarantee** | Money-back, no questions |
| **Pause feature** | Up to 3 months/year without charge (PRO/PREMIUM) |

---

## 5. Subscription Tiers & Gating

| Feature | FREE "The Seed" | PRO "The Garden" ($4.99) | PREMIUM "The Sage" ($9.99) |
|---------|-----------------|--------------------------|----------------------------|
| Max Plants | 3 | 8 | Unlimited |
| Plant Tiers | 1-2 | 1-4 | 1-5 (Garden Legends) |
| Garden Size | 3x3 | 5x5 | 7x7+ dynamic |
| Level Cap | 10 | 15 | 20+ |
| Growth Stages | All (seed → legendary) | All | All |
| XP/Levels | Full | Full | Full |
| Streaks | Full | Full | Full |
| Easy Mode | Full | Full | Full |
| Anchors | Full (unlocks L3) | Full | Full |
| Reflection Journal | Basic prompts (L4) | Advanced (CBT-informed) | Advanced |
| Mirror Moments | Full | Full | Full |
| Identity Badges | Full | Full | Full |
| Identity Zones | - | Yes | Yes |
| Goals | - | 5 active goals | Unlimited |
| Weekly Insights | - | Yes | Yes |
| Achievements | 15 basic | Full set (30+) | Full set |
| Garden Themes | 1 | 5 | All + customs |
| Decorations | Basic | Full | Premium (animated) |
| Water Reserves | 3 | 7 | 14 |
| Rest Days/Week | 1 | 2 | 3 |
| Backfill Watering | - | 3 days | 7 days |
| XP Multiplier | 1.0x | 1.2x | 1.5x |
| Garden Neighbors | - | - | 1-3 buddies |
| Sunshine System | - | - | Yes |
| AI Coaching | - | - | Yes |
| Year in Review | - | - | Yes |
| Data Export | - | CSV | CSV |
| Ads | None | None | None |
| Pause Subscription | - | 3 mo/yr | 3 mo/yr |

### Gating Triggers (Natural Moments Only)

```
3 plants     → Plant limit (FREE) — user already loves the app
Tier 3 plant → Tier limit (FREE)
Level 6      → "Unlock Goals with PRO" — at a milestone, not a wall
Level 10     → Level cap warning (FREE)
Mirror Moment + Identity Zone desire → PRO upsell (natural curiosity)
Level 13     → "Unlock more with PRO/PREMIUM"
Level 15     → Level cap warning (PRO)
8 plants     → Plant limit (PRO)
Social desire → "Garden Neighbors with PREMIUM"
```

---

## 6. Data Model Summary

### Core Tables

```
profiles ─────── User account, XP, level, tier, reserves
plant_types ──── 40+ plant catalog with tiers & mechanics
plants ──────── User's plants:
                 growth, moisture, streaks, grid position
                 growth_days (consistency days counter)
                 last_growth_date (last counted day)
                 tiny_seed (2-min version text)
                 easy_mode (BOOLEAN)
                 anchor_habit, anchor_time
                 status: thriving/growing/resting/waiting/sleeping/dormant
                 visual_stage: seed/sprout/growing/mature/established/venerable/ancient/legendary
```

### Activity Tables

```
activity_logs ── Unified: watering, completed, progress, rest_day, reflection, revival
rest_days ────── Intentional rest tracking
reflections ──── Milestone reflections
```

### Behavior Tables (v3 New)

```
reflection_prompts ── Library of weekly prompts (age-triggered, XP reward)
plant_reflections ─── User responses to prompts (unique per plant+prompt)
identity_badges ────── Earned identity badges (triggered by Mirror Moments)
```

### Goal Tables

```
goals ────────── Seasons with targets, progression, frequency
goal_logs ────── Progress entries
goal_adjustments Adaptive system changes
```

### Gamification Tables

```
achievements ──── 30+ achievement definitions
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

### Social Tables (PREMIUM, Phase 6)

```
garden_neighbors ── User buddy relationships (invite_code, status)
sunshine ─────────── Encouragement sends (from/to/sent_at)
```

### Other

```
mood_logs ──── Daily mood entries
notifications ─ Push/in-app notifications
```

---

## 7. Page/Route Map

### Public Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page (philosophy, ancient tree vision, features, pricing) |
| `/login` | Email/password + Google OAuth |
| `/signup` | Account creation |
| `/pricing` | Subscription tiers (Seed / Garden / Sage) |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/refund` | Refund policy + 30-day guarantee |

### Dashboard Pages (authenticated)

| Route | Purpose | Gating |
|-------|---------|--------|
| `/garden` | Main isometric garden view | None |
| `/overview` | Stats by period (day/week/month/year) | None |
| `/stats` | Weekly chart, streaks, plant stats | None |
| `/profile` | Level, XP, achievements, identity badges | None |
| `/settings` | Account, notifications, appearance, subscription | None |

### API Routes

| Route | Purpose |
|-------|---------|
| `POST /api/webhooks/paddle` | Paddle payment webhooks |
| `POST /api/cron/moisture-decay` | Daily moisture decay (17:00 UTC / 00:00 VN) |

---

## 8. Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│                      Next.js App                        │
├──────────────┬───────────────┬────────────────────────-┤
│  Public       │  Dashboard     │  API                   │
│  /            │  /garden       │  /api/webhooks/paddle  │
│  /login       │  /overview     │  /api/cron/moisture    │
│  /signup      │  /stats        │                        │
│  /pricing     │  /profile      │                        │
│               │  /settings     │                        │
├──────────────┴───────────────┴─────────────────────────┤
│                      Components                          │
│  garden/ plants/ goals/ game-ui/ identity/              │
│  mood/ gamification/ settings/ dev/                     │
├─────────────────────────────────────────────────────────┤
│                    Business Logic                        │
│  Server Actions: plants, goals, activity,               │
│  identity, mood, journal, adaptive,                     │
│  profile, subscription, paddle                          │
├─────────────────────────────────────────────────────────┤
│                  State (Contexts)                        │
│  Plants, Mood, GardenSettings,                          │
│  Subscription, DevDebug                                 │
├─────────────────────────────────────────────────────────┤
│                   Core Systems                           │
│  xp-system, progression-system, plant-status,           │
│  subscription-limits, mood-system, weather,             │
│  achievements, adaptive-goals, grid-positioning,        │
│  growth-stages, anchor-system, mirror-moments           │
├─────────────────────────────────────────────────────────┤
│                Supabase (PostgreSQL)                     │
│  20+ tables, RLS policies, cron jobs, triggers          │
│  Project: habien-v3 (id: nokkicjusrucrpnnbzlg)         │
└─────────────────────────────────────────────────────────┘
```

---

## 9. XP Sources Reference

### Existing (v2, Keep All)

| Action | XP | Notes |
|--------|-----|-------|
| Daily watering | 10 | Core mechanic |
| Watering note | 5 | Optional note |
| Weather bonus | 2-5 | Daily variety |
| Streak bonus | varies | Consistency reward |
| Mood bonus | 0-5 | Tough days earn more |
| Morning bonus | 3 | Early check-in |

### New (v3)

| Action | XP | Phase |
|--------|-----|-------|
| Easy Mode daily completion | +2 (20% bonus) | Phase 1 |
| Anchor check-in (within window) | +3 | Phase 1 |
| Weekly reflection prompt | 15-25 | Phase 2 |
| "Why I Love This" completion | 100 | Phase 2 |
| Mirror Moment earned | 50-150 | Phase 2 |
| Welcome Back water (after 3+ days) | 25 | Phase 4 |
| Plant reaching Established | 200 | Phase 0 |
| Plant reaching Venerable | 500 | Phase 3 |
| Plant reaching Ancient | 1000 | Phase 3 |
| Plant reaching Legendary | 2500 | Phase 3 |

---

## 10. Achievements Reference

### v2 Achievements (Keep + Extend)

| Achievement | Trigger | XP |
|-------------|---------|-----|
| First Drop | First watering | 25 |
| First Seed | First plant | 25 |
| 3-Day Streak | 3 consecutive days | 25 |
| 7-Day Streak | 7 consecutive days (bonfire) | 50 |
| ... | ... | ... |

### v3 New Achievements

| Achievement | Trigger | XP |
|-------------|---------|-----|
| "Tiny but Mighty" | 7 days of Easy Mode completion | 30 |
| "Anchored" | 7-day anchor streak (any plant) | 50 |
| "The Journal" | Complete 4 weekly reflections for one plant | 100 |
| "Why I Love This" | Write all 4 reflection prompts for one plant | 100 |
| "Welcome Back" | Return after 3+ day absence | 25 |
| "The Dormant Revival" | Revive a dormant plant | 30 |
| "The Reader Emerges" | Mirror Moment: 30 days of reading habit | 50 |
| "The Athlete Emerges" | Mirror Moment: 60 days of exercise habit | 100 |
| "The Learner Emerges" | Mirror Moment: 3 learning habits, 90 days | 150 |
| "The Established One" | First plant reaches Established (Day 91) | 200 |
| "The Venerable Garden" | First plant reaches Venerable (Day 181) | 500 |
| "The Ancient Gardener" | First plant reaches Ancient (Year 1) | 1000 |
| "The Ancient Forest" | 3+ Ancient trees in garden | 2000 |
| "Living Legend" | First plant reaches Legendary (Year 3) | 2500 |
| "Decade Garden" | Any plant reaches 3650 growth days | 10000 |
| "Sunshine Sender" | Send sunshine to a neighbor | 20 |

---

## 11. Implementation Roadmap

| Phase | Focus | Priority | Status |
|-------|-------|----------|--------|
| Phase 0 | Dormancy + Extended Growth (Established stage) | Critical | In Progress |
| Phase 1 | Tiny Seed (Easy Mode) + Anchors | High | Planned |
| Phase 2 | Reflection Journal + Mirror Moments + Identity Badges | High | Planned |
| Phase 3 | Advanced Growth Stages (Venerable/Ancient/Legendary art) | High (art-dependent) | Planned |
| Phase 4 | Struggle-Aware System | Medium | Planned |
| Phase 5 | Monetization Adjustment (Identity Zones, tier updates) | Medium | Planned |
| Phase 6 | Garden Neighbors + AI Coaching | Lower | Planned |

---

## 12. Success Metrics

### North Star Metric

**Plants that reach the Ancient stage (1+ year of consistency).** This captures everything: user had fun, built a real habit, and experienced the ancient tree vision.

### Primary Metrics

| Metric | Target |
|--------|--------|
| Day 7 retention | 60%+ |
| Day 30 retention | 40%+ |
| Day 90 retention | 25%+ |
| Plants reaching Established (Day 91) | 30%+ of active plants |
| Mirror Moment trigger rate | 20%+ of 30-day users |
| Average session time | 30-60 seconds |

### Revenue Metrics

| Metric | Target |
|--------|--------|
| Free-to-PRO conversion | 8-12% of 30-day retained |
| PRO-to-PREMIUM conversion | 15-20% of PRO users |
| Annual plan rate | 30%+ of subscribers |
| Monthly churn | < 8% |
| 30-day refund rate | < 5% |

### Anti-Metrics (Do NOT Optimize)

| Metric | Why NOT |
|--------|---------|
| DAU as primary KPI | A 30-second session is SUCCESS |
| Time in app | Not social media |
| Streak length as north star | Creates anxiety; consistency rate is healthier |

---

*Document updated: 2026-03-03*
*Based on: Habien v3 VISION.md (plans/habien-v3/VISION.md)*
*Reflects: Fun-first philosophy, ancient tree vision, behavior science as reward*
