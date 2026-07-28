# Habit Garden — Product Specification

> **Version**: 1.0 (generated from codebase scan 2026-04-28)
> **Stack**: Next.js 15 App Router, Supabase (Postgres + Auth), Tailwind CSS 4, shadcn/ui, Paddle billing
> **Brand**: Habien (habien.com) / "Habit Garden" in UI
> **Supabase Project**: jkhkfsfjnilbfqfatonb

---

## 1. Product Vision

**One-line**: A garden game where every plant represents a real habit, and the trees get more beautiful the longer you keep going — for years.

**Core principles**:
1. **Fun First** — The app must be fun enough to open on a bad day
2. **Redirect, Don't Remove** — Every gamification mechanic serves habit formation
3. **Psychology as Reward** — Behavior science concepts are EARNED, not forced
4. **The Ancient Tree Vision** — Long-term emotional hook: seeing massive trees you planted years ago
5. **Never Look Cheap** — Unfinished is OK, ugly is not

**Target user**: Solopreneur/individual who wants to build habits but always ignores tracking apps. Needs fun + gentle accountability, not strict discipline.

---

## 2. App Structure

### Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Landing page (hero, philosophy, pricing) |
| `/login`, `/signup` | Public | Auth pages |
| `/garden` | Required | Primary screen — isometric garden view |
| `/overview` | Required | Aggregated stats with period selector |
| `/store` | Required | Crafting workshop + coin shop |
| `/profile` | Required | XP/level, achievements, timezone |
| `/settings` | Required | Account, appearance, notifications, subscription |
| `/identity` | Required (PREMIUM) | Identity system |
| `/stats` | Required | Simple weekly activity chart |
| `/pricing` | Public | Standalone pricing page |

### Provider Tree (Dashboard)

```
DevDebugProvider
  DashboardDataProvider (user, profile, plantTypes)
    SubscriptionProvider (tier, feature gates)
      MoodProvider (mood, weather multiplier)
        GardenSettingsProvider (visual effect toggles)
          InventoryProvider (materials, decorations, coins, recipes)
            PlantsProvider (per-page, SSR initial data — garden only)
```

---

## 3. Plant System

### Plant Types

9 named types + generic, organized in 5 tiers:

| Type | Tier | Maturity | Decay Rate | Special Effect |
|------|------|----------|------------|----------------|
| Generic | 1 | varies | varies | — |
| Sunflower | 1 | fast | high | — |
| Cactus | 1 | slow | very low | drought_resistant |
| Cherry Blossom | 2 | medium | medium | cycle (bloom/rest) |
| Rose | 2 | medium | medium | difficulty_bonus |
| Bamboo | 3 | slow | low | delayed_growth, hidden_progress |
| Bonsai | 3 | slow | medium | — |
| Lotus | 4 | slow | medium | — |
| Money Tree | 4 | slow | low | buff_others |

### Tier Unlock Requirements

| Tier | Name | Level | Mature Plants | Longest Streak |
|------|------|-------|--------------|----------------|
| 1 | Forgiving Friends | 1 | 0 | 0 |
| 2 | Reliable Partners | 7 | 1 | 7 days |
| 3 | Demanding Beauties | 10 | 3 | 30 days |
| 4 | Life Companions | 14 | 5 | 66 days |
| 5 | Garden Legends | 18 | 10 | 100 days |

### Plant Status System

**Philosophy: "Plants NEVER die. They only sleep."**

| Status | Condition | Color |
|--------|-----------|-------|
| thriving | Logged activity today | emerald |
| growing | Watered today (not logged) | green |
| resting | 1-3 days inactive | blue |
| waiting | 4 days to grace period (default 7) | amber |
| sleeping | Beyond grace period | slate |
| mature | growth >= 100% (permanent) | emerald→teal gradient |

### Growth Stages (Visual)

| Stage | Growth % | Waterings |
|-------|----------|-----------|
| seed | 0-10% | — |
| sprout | 10-25% | — |
| growing | 25-75% | — |
| blooming | 75-100% | — |
| mature | 100% | — |
| established | — | 365+ |
| ancient | — | 730+ |
| legendary | — | 1000+ |

### Plant Image Assets

Location: `public/plants/{folder}/{stage}.png`

Folders: generic, sunflower, cherry-blossom, cactus, bonsai, lotus, rose, bamboo, money-tree

Stages per folder: `01-seed.png`, `02-sprout.png`, `03-growing.png`, `04-blooming.png`, `05-mature.png`, `dead.png`

**Status**: Only ~6 of 42 needed PNGs exist. Emoji fallback active.

---

## 4. Garden System

### Isometric Grid

- Responsive tile size: 100px mobile / 120px tablet / 140px desktop
- Zoom: 0.5x-2.5x (pinch, scroll wheel, buttons), persisted to localStorage
- Pan: mouse drag + touch drag (8px threshold to distinguish from tap)
- Viewport virtualization: only visible tiles render (2-tile buffer)
- Two modes: **Interact** (tap to water/details) + **Arrange** (move plants, place decorations)

### Grid Size by Level

| Level | Grid | Name |
|-------|------|------|
| 1-5 | 3×3 (9 tiles) | Seedling's Patch |
| 6-8 | 5×5 (25 tiles) | Gardener's Plot |
| 9-11 | 7×7 (49 tiles) | Growing Estate |
| 12+ | Dynamic | Unlimited Garden |

### Plant Slots by Level

| Level | Max Plants |
|-------|-----------|
| 1-3 | 1 |
| 4-5 | 2 |
| 6-8 | 3 |
| 9-11 | 4 |
| 12-14 | 5 |
| 15+ | Unlimited |

### Multi-Cell Plants

Plants can occupy 1×1 or 2×2 tiles (architecture supports NxN). Grid expansion happens on maturity milestones. Growth-blocked flag set when expansion collides with neighbors; displacement algorithm resolves conflicts (spiral search up to radius 10).

### Interactions

- Single tap → opens watering modal
- Double tap (300ms threshold) → opens plant detail sheet
- Right-click → opens plant detail sheet
- Tap empty tile in arrange mode → opens add plant dialog
- All watering/logging uses optimistic UI (instant visual feedback, then server confirm)

### Decorations

- Placed on grid tiles with rotation (0/90/180/270°)
- Undo stack (max 20 actions): place, pickup, move
- Edit mode overlay with inventory panel
- Subscription limits: free=5 placed, pro=20, premium=unlimited

### Visual Effects

- Weather-aware ground lighting (5 weather types × 2 time-of-day = 10 combos)
- Per-plant type CSS effects (glow, shake, particles)
- Ambient particle canvas (butterflies, pollen, fireflies)
- Garden settings: particles, decorations, celebrations, weather effects, reduced motion
- Respects `prefers-reduced-motion`

---

## 5. Core Interaction Loop

### Watering Modal (GentleWateringModal)

Three modes: `choose` → `log` or `water`

**Choose mode**: Plant stats (moisture + growth), "Why I started" reminder, goal context
- "I did it!" → log mode (full activity)
- "Not today" → water mode (check-in only)

**Log mode ("I did it!")**:
- Optional numeric value (for goal plants)
- Notes field with tiered XP bonus preview
- Quick-pick presets adapt to unit (km, min, etc.)
- Easy Mode reminder if enabled

**Water mode ("Not today")**:
- Encouragement message
- Optional notes
- Reduced moisture boost (50% of normal)

### Activity Types

| Type | Trigger | XP | Moisture | Growth |
|------|---------|-----|---------|--------|
| `watering` | "Not today" | 0 base (note bonus only) | 50% boost | No |
| `completed` | "I did it!" (non-goal) | 10 base + bonuses | Full boost | Yes |
| `progress` | "I did it!" (goal) | 10 base + bonuses + PR bonus | Full boost | Yes |

### XP Sources

| Action | XP |
|--------|-----|
| Base watering/log (first of day) | +10 |
| Morning bonus (5-9 AM) | +5 |
| Note (any) | +3 |
| Note > 50 chars | +2 |
| Note > 100 chars | +2 |
| Streak 3d / 7d / 14d / 30d | +5 / +15 / +30 / +50 |
| Difficulty medium / hard | +5 / +10 |
| Weather rainy / rainbow | +5 / +20 |
| Personal record (goal) | +25 |
| Plant matured | +100 |
| First plant matured | +50 |
| Welcome back (3+ days) | +25 |
| Easy Mode (first 30 days) | +20% |
| Journal streak 3d/7d/14d/30d | +3/+5/+8/+12 |

---

## 6. XP & Level System

### Formula

```
XP to advance from level N to N+1 = floor(100 × 1.5^(N-1))
```

| Level | Cumulative XP | Title | Badge |
|-------|-------------|-------|-------|
| 1 | 0 | Seedling | 🌱 |
| 2 | 100 | Sprout | 🌿 |
| 3 | 250 | Gardener | 🪴 |
| 4 | 475 | Cultivator | 🌾 |
| 5 | 812 | Horticulturist | 🌻 |
| 6 | 1,318 | Plant Whisperer | 🌳 |
| 7 | 2,077 | Garden Master | 🏡 |
| 8 | 3,215 | Nature Guardian | 🏞️ |
| 9 | 4,923 | Forest Keeper | 🌲 |
| 10 | 7,484 | Botanical Sage | ✨ |
| 11+ | ... | Flora Champion → Eden Creator | 🏆→👑 |

### Level Caps by Subscription

| Tier | Cap |
|------|-----|
| Free | 10 |
| Pro | 15 |
| Premium | 20 |

### User Phases

| Phase | Levels | Name |
|-------|--------|------|
| Seedling | 1-5 | Early game |
| Gardener | 6-12 | Mid game |
| Sage | 13+ | Late game |

---

## 7. Achievement System

23 achievements across 4 tiers (Bronze/Silver/Gold/Legendary):

### First Steps
| Achievement | Requirement | XP |
|-------------|-----------|-----|
| First Seed | Plant 1st habit | 25 |
| First Drop | Water 1st time | 25 |
| First Bloom | Mature 1st plant | 100 |

### Watering Milestones
| Achievement | Requirement | XP |
|-------------|-----------|-----|
| Getting Started | 10 waterings | 25 |
| Dedicated Gardener | 50 waterings | 50 |
| Century Gardener | 100 waterings | 100 |
| Year-Round Gardener | 365 waterings | 200 |

### Streaks
| Achievement | Requirement | XP |
|-------------|-----------|-----|
| Three-Day Wonder | 3-day streak | 25 |
| Week Warrior | 7-day streak | 50 |
| Fortnight Fighter | 14-day streak | 75 |
| Monthly Master | 30-day streak | 100 |
| Century Streak | 100-day streak | 200 |

### Collection
| Achievement | Requirement | XP |
|-------------|-----------|-----|
| Small Garden | 5 plants | 50 |
| Growing Garden | 10 plants | 100 |
| Fruitful Garden | 5 mature plants | 100 |
| Flourishing Forest | 10 mature plants | 200 |

### Level
| Achievement | Requirement | XP |
|-------------|-----------|-----|
| Rising Gardener | Level 5 | 50 |
| Expert Gardener | Level 10 | 100 |
| Master Gardener | Level 15 | 200 |

### Special
| Achievement | Requirement | XP | Hidden |
|-------------|-----------|-----|--------|
| Early Bird | 10 morning waterings | 50 | No |
| Hard Worker | 10 hard-day waterings | 75 | No |
| Perfect Week | All plants watered 7 days | 100 | No |
| Comeback Kid | Return after 7+ days | 50 | Yes |
| Special Collector | 3 special plants | 100 | No |

---

## 8. Economy & Crafting

### Coin Earning

| Action | Coins |
|--------|-------|
| First daily watering | +5 |
| Additional plant same day | +2 |
| Plant matures | +50 |
| Streak 3d/7d/14d/30d/60d/100d | +10/+25/+50/+100/+200/+500 |

### Materials (harvested from mature plants)

| Material | Rarity | Source Plant |
|----------|--------|-------------|
| Garden Essence ✨ | Common | Generic |
| Sunflower Petal 🌻 | Common | Sunflower |
| Cactus Spine 🌵 | Common | Cactus |
| Bamboo Stick 🎋 | Common | Bamboo |
| Cherry Petal 🌸 | Uncommon | Cherry Blossom |
| Ancient Wood 🪵 | Uncommon | Bonsai |
| Rose Crystal 🌹 | Rare | Rose |
| Lotus Dewdrop 💧 | Rare | Lotus |
| Gold Leaf 🪙 | Epic | Money Tree |

### Decorations (20 types)

| Decoration | Size | Category | Rarity | Level | Price |
|-----------|------|----------|--------|-------|-------|
| Wooden Sign | 1×1 | furniture | common | 1 | 30 |
| Stepping Stone | 1×1 | path | common | 1 | 20 |
| Flower Pot | 1×1 | nature | common | 1 | 25 |
| Garden Bench | 2×2 | furniture | uncommon | 3 | 80 |
| Mushroom Cluster | 1×1 | nature | common | 3 | 30 |
| Berry Bush | 1×1 | nature | uncommon | 3 | craft only |
| Rock Garden | 2×2 | nature | uncommon | 5 | 100 |
| Bamboo Screen | 2×2 | nature | uncommon | 5 | craft only |
| Stone Lantern | 1×1 | lighting | uncommon | 5 | 60 |
| Paper Lantern | 1×1 | lighting | common | 5 | 40 |
| Garden Gnome | 1×1 | special | uncommon | 5 | 50 |
| Firefly Jar | 1×1 | lighting | rare | 7 | craft only |
| Koi Pond | 2×2 | water | rare | 8 | craft only |
| Bamboo Fountain | 1×1 | water | uncommon | 8 | 120 |
| Birdbath | 1×1 | water | uncommon | 8 | 80 |
| Wishing Well | 1×1 | special | rare | 8 | craft only |
| Zen Sand Garden | 2×2 | special | rare | 10 | craft only |
| Golden Pagoda | 2×2 | special | epic | 10 | craft only |
| Crystal Garden | 2×2 | special | epic | 10 | craft only |
| Spirit Tree | 2×2 | special | legendary | 12 | craft only |

### Crafting Recipes (20 total)

All recipes require specific materials. Examples:
- **Wooden Sign** (L1): 2× Bamboo Stick
- **Koi Pond** (L8): 3× Lotus Dewdrop + 2× Ancient Wood
- **Spirit Tree** (L12): 2× Gold Leaf + 3× Ancient Wood + 1× Lotus Dewdrop + 1× Rose Crystal

Recipe access by subscription:
- Free: level ≤ 5, common/uncommon rarity
- Pro: level ≤ 10, up to rare
- Premium: all levels, all rarities

---

## 9. Subscription System

### Tier Comparison

| Feature | Free | Pro ($4.99/mo) | Premium ($9.99/mo) |
|---------|------|----------------|-------------------|
| Plants | 3 | 8 | Unlimited |
| Plant Tiers | 1-2 | 1-4 | 1-5 |
| Garden Size | 3×3 | 5×5 | 7×7+ |
| Goals | No | 5 | Unlimited |
| Identity | No | No | Yes |
| Level Cap | 10 | 15 | 20 |
| XP Multiplier | 1.0× | 1.2× | 1.5× |
| Decorations Placed | 5 | 20 | Unlimited |
| Note Limit | 50 chars | 500 chars | Unlimited |
| Backfill Days | 0 | 3 | 7 |
| Crafting | Yes | Yes | Yes |
| Shop | Yes | Yes | Yes |

### Pricing (VND)

- Pro: 99,000/mo — 950,000/yr
- Premium: 199,000/mo — 1,900,000/yr

### Upgrade Triggers

- Level 6 → Goals unlock prompt (Pro)
- Level 13 → Identity unlock prompt (Premium)
- Plant limit hit → Pro upgrade
- Tier blocked → Pro/Premium upgrade

### Payment: Paddle

Webhook at `/api/webhooks/paddle` handles: subscription created/activated/updated/canceled/paused/resumed, transaction completed/failed.

---

## 10. Goal System (Pro+)

### Two Modes

| Mode | Description | Example |
|------|-------------|---------|
| Build Capacity | Improve each period | Week 1: 20 pages → Week 12: 50 pages |
| Total Progress | Accumulate to total | Save $10,000 |

### Goal Setup

4-step wizard: Mode → Frequency (daily/weekly/monthly, 2-52 weeks) → Target (start/end values, growth pattern) → Preview (editable per-period targets)

### Adaptive System

- 3 modes: suggest / auto / off
- Analyzes performance patterns
- Suggests target modifications
- Recovery week option (50% target reduction)

---

## 11. Identity System (Premium)

- Groups related goals under identity labels ("Reader", "Athlete", etc.)
- 6 presets + custom creation
- 8 color themes, 16 icon options
- Progress auto-computed by DB trigger from linked goals
- Statuses: active / achieved / paused

---

## 12. Mood & Weather

### Mood (1-5 scale)

User sets daily mood, which maps to weather metaphor for XP modifier.

### Weather

Deterministic per calendar date (same for all users):

| Weather | Probability | Growth | Decay | XP |
|---------|-------------|--------|-------|-----|
| Sunny | 35% | 1.0× | 1.2× | 1.0× |
| Cloudy | 30% | 1.0× | 0.9× | 1.0× |
| Rainy | 20% | 1.2× | 0.5× | 1.1× |
| Stormy | 10% | 0.8× | 0.7× | 1.2× |
| Rainbow | 5% | 1.5× | 0.8× | 1.5× |

---

## 13. Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| profiles | User profile, XP, level, coins, streaks, subscription |
| plant_types | Plant template definitions (9+ types) |
| plants | User's planted habits |
| activity_logs | Unified activity log (primary) |
| watering_logs | Legacy watering log (still written) |
| goals | Season/goal per plant |
| goal_logs | Per-value goal entries |
| goal_adjustments | Adaptive adjustment history |
| mood_logs | Daily mood entries |
| reflections | Milestone reflections |
| achievements / user_achievements | Achievement defs + unlocks |
| identities | Identity grouping (Premium) |
| materials | Craftable material definitions |
| decoration_types | Decoration catalog |
| recipes / recipe_ingredients | Crafting recipes |
| user_inventory | Owned materials + decorations |
| placed_decorations | Decorations on garden grid |
| coin_transactions | Coin audit trail |
| subscriptions | Paddle subscription state |
| subscription_tiers | Tier definitions |
| subscription_events | Subscription analytics |
| upgrade_prompts | UX tracking |

### Atomic DB Functions (PostgreSQL)

- `award_coins`, `spend_coins` — atomic coin operations
- `atomic_inventory_increment`, `atomic_inventory_decrement` — inventory ops
- `craft_decoration` — deduct materials + add decoration
- `purchase_decoration` — spend coins + add to inventory
- `pickup_decoration` — remove from grid + return to inventory
- `increment_user_xp` — atomic XP update
- `increment_weed_count` — batch weed growth

### Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `update_daily_moisture()` | 17:00 UTC daily | Moisture decay for all living plants |

---

## 14. Implemented Features

### Complete
- Auth (login/signup/OAuth callback)
- Isometric garden (zoom/pan, tile grid, virtualization)
- Plant CRUD with tier/slot gating
- Watering & activity logging (optimistic UI)
- Growth & status system (gentle — no death)
- XP/Level progression (15 levels, titles, badges)
- Achievement system (23 achievements, claim UI)
- Streak tracking & celebration
- Mood & weather system
- Goal system (2 modes, adaptive, period targets)
- Identity system (Premium, wizard, CRUD)
- Crafting & economy (materials, recipes, coins, shop)
- Decoration placement (place/pickup/move/rotate, undo)
- Subscription system (Paddle, 3 tiers, webhooks)
- Settings (account, appearance, notifications, performance, subscription)
- Dev debug panel (Ctrl+Shift+D)
- PWA support
- Garden visual effects (weather, time-of-day, particles)
- Easy Mode (2-minute rule, +20% XP)
- Welcome back system (+25 XP)

### Partially Implemented / Stubs
- **Plant image assets**: 6 of 42 PNGs exist (emoji fallback active)
- **Decoration/material images**: ~30+ PNGs needed
- **Special effects**: Type system defined but most not client-enforced
- **Garden themes**: Architecture exists, only 1 theme (Classic Garden)
- **Weekly reports**: Feature flag exists, no implementation
- **Backfill watering**: Feature flag exists, no UI
- **Water reserves**: System exists, unclear if fully wired
- **AI suggestions**: Components exist, integration completeness unknown
- **Multi-device**: Tier limit defined, not enforced
- **Ads**: Free tier flag exists, no ad components
- **Cemetery view**: Component exists, not routed
- **Focus garden view**: Component exists, unclear if wired

### Known Bugs / Tech Debt
- `optimizeGridLayout()` is a no-op (TODO comment)
- Paddle `resolveUserId` calls `getUserById(email)` — wrong API method
- `watering_logs` dual-written alongside `activity_logs` (legacy)
- `goals.best_streak` never updated
- `activity_logs.difficulty` column never populated
- `noDeathDays` and achievement checks in tier requirements not implemented
- XP morning bonus inconsistency: xp-constants.ts says 3, xp-system.ts says 5

---

## 15. v3 Design Documents (Not Yet Implemented)

### PLANT-GUIDE.md — Dual Growth Model

9 personality-based plant types with 8 growth stages spanning years:
Bamboo, Sunflower, Oak, Cactus, Lotus, Bonsai, Cherry Blossom, Coconut Palm, Grapevine

Each with unique growth pattern, resilience, watering curves, visual stories, and signature moments.

Includes: selection quiz (3 questions), rebirth system (change plant type while keeping progress), cosmetic skins (v2→v3 mapping of 29+ skins).

### VISION.md — v3 Feature Set (Not Yet Built)

- Extended growth stages (Established → Legendary, spanning years)
- Dormancy replaces death
- Tiny Seed system (2-minute rule as game mechanic)
- Anchors (habit stacking, unlocks at L3)
- Reflection as XP source (weekly prompts, unlocks at L4)
- Mirror Moments (identity discovery achievements)
- Struggle-aware system (welcome back, permission to rest)
- Garden Neighbors (1-3 buddies, Premium)

### Brainstorm: Dual Growth Model (2026-04-28)

Short-cycle plants (3×3 garden, seasonal harvest) vs Long-cycle plants (single tree growing for years). Review-cycle-based maturation. See `decision-dual-growth-model-habit-garden.md` in Brain Opera vault.

---

## 16. Reading Habit Vertical Slice (2026-07-28)

The retention core now includes one complete guided reading journey:

- Home Garden shows a persistent reading plant, plant stage, today pages/target, Start Reading and Growth Plan.
- Focus Session persists a 30-minute start/pause/resume/finish timer and ambient preference across refresh or route leave.
- Completion validates whole pages, records them atomically and reveals target comparison, reward, plant growth and streak.
- Growth Plan shows a deterministic 5→30 pages/day trajectory with previous/current/next milestones, review date, rule and history.

Generic domain models support habits, numeric units, plans, sessions, daily progress and growth state. Reading is configured as `type=reading`, `unit=pages`, 30 minutes, a seven-day review period, an 80% performance threshold and five-page increments capped at 30. Missed thresholds hold the target without guilt or unpredictable regression.

See `docs/reading-habit-vertical-slice.md` and ADR `docs/adr/001-guided-habit-session-aggregate.md`.
