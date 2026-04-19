# Habit Garden — Project Roadmap

> **Purpose**: History of completed phases and direction for upcoming work.
> **Last updated**: 2026-04-19 | Current phase: **Phase 4 — Polish & Launch**

---

## Completed Phases

### Phase 1 — MVP Core ✅ (Jan 2026)

Foundation: authentication, plant CRUD, isometric garden, moisture/decay, streaks.

**Migration evidence**: `20260114_*` (grid positioning), initial schema.

Key deliverables:
- Email + Google OAuth
- Plant creation with 40+ plant types
- Isometric 3D garden (pan/zoom/touch)
- One-tap watering + moisture bar
- Daily moisture decay (cron at 17:00 UTC)
- Streak tracking
- PWA support + onboarding flow

---

### Phase 2 — Gamification ✅ (Jan–Feb 2026)

XP system, levels, achievements, weather, mood.

**Migration evidence**: `20260120_goal_frequency_types.sql`

Key deliverables:
- XP system (15+ levels, exponential scaling)
- 20+ achievements (4 tiers: Bronze → Legendary)
- Weather system (5 types, daily RNG, XP bonuses)
- Mood check-in (5 levels; tough days earn more XP)
- Level-up modal with confetti
- Stats dashboard

---

### Phase 3 — Goal Tracking ✅ (Feb 2026)

PRO feature: Build Capacity + Total Progress goal modes.

**Migration evidence**: `20260120_goal_frequency_types.sql`, `20260124_gentle_growth_system.sql`, `20260125_activity_types.sql`

Key deliverables:
- Goal Setup Wizard (4 steps)
- Build Capacity mode (progressive weekly targets)
- Total Progress mode (cumulative toward target)
- 6 progression curves (linear, S-curve, step, etc.)
- Personal records + trophies
- Goal Journey Map + Timeline

### Phase 3b — Adaptive Goals ✅ (Feb 2026)

Auto-detection of struggling/crushing → suggest adjustments.

Key deliverables:
- Performance scoring (weekly score, trends)
- 3 adaptive modes: Fixed, Suggest, Auto
- Recovery week (50% target reduction)
- Adjustment history tracking

---

### Phase 4 (Early) — Subscription Infrastructure ✅ (Feb 2026)

**Migration evidence**: `20260211_subscription_infrastructure.sql`

Key deliverables:
- 4 tables: `subscription_tiers`, `subscriptions`, `subscription_events`, `upgrade_prompts`
- `SubscriptionContext` — tier state across app
- Feature gating with natural upgrade prompts
- Level cap enforcement per tier

### Phase 5 — Paddle Payment Integration ✅ (Feb 2026)

Key deliverables:
- Paddle checkout overlay
- Webhook handler (`/api/webhooks/paddle`) with signature verification
- Subscription management in Settings
- FREE / PRO ($4.99/mo) / PREMIUM ($9.99/mo) tiers + annual plans

### Phase 6 — Identity System ✅ (Feb 2026)

PREMIUM feature: group habits into identities with progress tracking.

**Migration evidence**: `20260212_identity_system.sql`

Key deliverables:
- `identities` table with auto-update trigger
- Identity creation wizard (3 steps)
- Goal linking/unlinking to identities
- 8 preset identity suggestions

---

### Phase 7 — Gentle Growth System ✅ (Mar 2026)

Plants never die outright — they go dormant. "Not today" still waters the plant.

**Migration evidence**: `20260124_gentle_growth_system.sql`, `20260219_fix_moisture_decay.sql`, `20260303_fix_moisture_decay_all_statuses.sql`

Key deliverables:
- Status system reconciliation (growing/thriving/resting/waiting/sleeping/mature/dead)
- Dormant revival with Welcome Back bonus (+25 XP)
- "Not today" waters the plant (no guilt path)
- Fixed cron to process all living statuses (not just `growing`)
- `auth-cached.ts` — `React.cache()` dedup for `getUser()`
- Perf audit: N+1 fixes, composite indexes

---

### Phase 8 — Crafting & Decoration Economy ✅ (Mar 2026)

Coin economy + crafting system + decoration placement on garden tiles.

**Migration evidence**: `20260311_crafting_decoration_system.sql`, `20260311_atomic_economy_functions.sql`, `20260419_rls_optimization.sql`

Key deliverables:
- 7 new tables: coins_ledger, crafting_recipes, crafting_sessions, inventory_items, decorations, materials, decoration_types
- Coin economy: earned via watering, streaks, plant maturity (+50 on harvest)
- Auto-harvest material when plant reaches 100% growth
- Workshop, Nature, Lighting, Special recipe categories
- Level gates: Workshop at L3, Nature at L5, Lighting at L8, Special at L10
- Decoration placement UI (Edit Mode overlay on isometric garden)
- Subscription gates: free (5 decorations), pro (20), premium (unlimited)
- `AmbientParticlesCanvas` for background atmosphere

---

## Current Phase: Phase 4 — Polish & Launch 🟡 (Apr 2026)

**Status**: Code complete; blocked on assets + final integration.

### Main Blocker: Asset Gap

| Asset Type | Needed | Exist | Gap |
|------------|--------|-------|-----|
| Plant PNGs (type × stage) | ~42 types | 6 types | **36 types** |
| Decoration/material PNGs | ~30+ | Few | **~25+** |

All plant image slots fall back to `public/plants/generic/[stage].png` — app is functional but visually lacks plant variety.

### Remaining Tasks

| Task | Priority |
|------|----------|
| Generate plant/decoration PNG assets (AI-assisted) | **P0 — launch blocker** |
| Run `20260311_crafting_decoration_system.sql` migration on production Supabase | **P0** |
| SSR data fetching for `InventoryProvider` (currently `initialCoins=0`) | P1 |
| Integration testing with real crafting/decoration data | P1 |
| Responsive design audit | P2 |
| SEO (meta tags, sitemap, Open Graph) | P2 |
| Analytics setup | P2 |
| Push notifications (watering reminders) | P3 |
| Bundle size / lazy loading optimization | P3 |

---

## Upcoming: Community Phase (Phase 5)

Source: `docs/08 - COMMUNITY.md`

Planned features (all PREMIUM):
- **Garden Neighbors**: Link 1–3 accountability buddies via invite code
- **Sunshine System**: One-tap positive encouragement (no criticism, no leaderboards)
- **Presence Indicator**: Green glow when buddy checked in today
- **Milestone Alerts**: "Your buddy hit 100 days!"
- **AI Coaching**: Pattern-based nudges ("You break streaks after weekends")
- **Year in Review**: Annual transformation story

Design principles for social:
- No leaderboards, no comparison anxiety
- Positive-only interactions (sunshine only goes one direction)
- Privacy-first: neighbors see simplified garden visual, no metrics

---

## Long-Term Vision (No Timeline)

- **Ancient/Legendary plant art** — visually dominant garden monuments (art-dependent)
- **Seasonal visuals** — Ancient+ plants show spring blossoms, autumn colors, winter frost
- **Creature effects** — butterflies (Established), birds/fireflies (Ancient)
- **Ancient Tree Aura** — nearby plants grow slightly faster
- **Mirror Moments** — identity discovery after 30+ consistent days (pattern-triggered, not declared)
- **Struggle-Aware System** — warm Welcome Back flow, Permission to Rest, Life Change Detection
