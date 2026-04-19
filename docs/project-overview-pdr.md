# Habit Garden — Project Overview & PDR

> **Purpose**: Single source of truth for the product vision, user targets, subscription model, feature scope, and success metrics.
> **Last synced**: 2026-04-19 | Sources: `APP_FEATURES.md`, `PROJECT-MANIFEST.md`, `.claude/MEMO.md`

---

## 1. What Is Habit Garden?

Habit Garden (codename **Habien v3**) turns habit-building into a garden game. Each habit is a plant — water it daily (check in), watch it grow over months and years. Neglect sends it dormant; consistency eventually produces a magnificent ancient tree that no amount of grinding can shortcut.

> **v3 Mission**: *"Build a habit garden so fun you open it every day, so smart it actually changes you."*

### Core Philosophy

| Principle | Description |
|-----------|-------------|
| **Fun First** | The app must be enjoyable to open on a bad day — not out of obligation |
| **Redirect, Don't Remove** | All v2 mechanics (XP, streaks, achievements) kept; v3 redirects them to reward *real* habit behaviors |
| **Psychology as Reward** | Behavior-science features (2-Min Rule, Habit Stacking, Identity, Reflection) are *earned*, never forced |
| **The Ancient Tree Vision** | Long-term hook: a massive tree that represents 3 years of showing up — time is the only currency |

---

## 2. Target Users

| Persona | Description |
|---------|-------------|
| **Habit Starters** | People who want to build habits but lack motivation; respond to visual feedback |
| **Gamification Fans** | Users who thrive on XP, streaks, levels, achievements |
| **Gentle Trackers** | Users who want a non-punishing, low-guilt system ("not today" still waters the plant) |
| **Long-Term Builders** | Users motivated by multi-year consistency and the "ancient tree" payoff |

---

## 3. Current Phase

**Phase 4 — Polish & Launch** (In Progress)

| Area | Status |
|------|--------|
| Auth (Email + Google) | ✅ Done |
| Plants CRUD + Isometric Garden | ✅ Done |
| Watering / Moisture / Streaks | ✅ Done |
| XP, Levels (15+), Achievements (20+) | ✅ Done |
| Weather System + Mood Tracking | ✅ Done |
| Goal Tracking (Build Capacity + Total Progress) | ✅ Done |
| Adaptive Goals | ✅ Done |
| PWA / Mobile (Capacitor) | ✅ Done |
| Identity System (PREMIUM) | ✅ Done |
| Paddle Payments Integration | ✅ Done |
| Crafting & Decoration Economy | ✅ Done (Phase 7) |
| Plant PNG assets | ⚠️ Partial (6/42 exist — asset gap is main launch blocker) |
| Decoration/material assets | ⚠️ Partial (~30+ needed) |
| SSR fetch for InventoryProvider | ⏳ Pending |

---

## 4. Subscription Tiers

| Feature | FREE "The Seed" | PRO "The Garden" ($4.99/mo) | PREMIUM "The Sage" ($9.99/mo) |
|---------|:---:|:---:|:---:|
| Max Plants | 3 | 8 | Unlimited |
| Plant Tiers | 1–2 | 1–4 | 1–5 |
| Garden Size | 3×3 | 5×5 | 7×7+ dynamic |
| Level Cap | 10 | 15 | 20+ |
| Goals | — | 5 active | Unlimited |
| Identity Zones | — | ✅ | ✅ |
| Garden Neighbors | — | — | ✅ (1–3 buddies) |
| AI Coaching | — | — | ✅ |
| XP Multiplier | 1.0× | 1.2× | 1.5× |
| Decorations (placed) | 5 | 20 | Unlimited |
| Crafting / Shop | Limited | ✅ | ✅ |
| Annual plans | — | $47.99/yr | $95.99/yr |

**Trial**: 7-day free trial for PRO/PREMIUM. 30-day money-back guarantee. Pause up to 3 months/year.

### Gating Philosophy

Upgrade prompts appear only at **natural moments** — never mid-habit, never as an anxiety wall:

```
3 plants used       → Plant limit reached
Level 6             → "Unlock Goals with PRO"
Level 10            → FREE level cap warning
Tier 3 plant desire → Tier limit reached
Mirror Moment       → Identity Zone upsell (curiosity-driven)
```

---

## 5. Feature Scope

### Core (All Tiers)

- 40+ plant types with unique art across 8 growth stages
- Isometric garden (3D grid, pan/zoom, touch, drag-to-reposition)
- One-tap watering + "Not today" check-in (no guilt path)
- Daily moisture decay (cron at 17:00 UTC) — plants go dormant (not dead) at 0%
- XP system + 15-20+ levels + 30+ achievements
- Weather system (5 types, daily RNG, affects XP)
- Mood check-in (5 levels; tough days earn *more* XP — 1.5× at "Stormy")
- Streaks, Easy Mode (2-min rule), Anchors (habit stacking)
- Reflection Journal, Mirror Moments (identity discovery at 30 days)
- Cemetery view for dead plants

### PRO Features

- Goal Tracking: Build Capacity + Total Progress modes
- Adaptive Goal system (auto-detect struggle/crushing → suggest adjustments)
- Identity Zones (group related plants in themed garden section)
- 5 active goals, weekly insights, progression curves

### PREMIUM Features

- Identity System dashboard (PREMIUM gating)
- Garden Neighbors (1–3 accountability buddies via invite code)
- Sunshine system (one-tap positive encouragement)
- AI Coaching nudges (pattern-based)
- Year in Review

### Crafting & Economy (Phase 7, all tiers with gates)

- Coin economy: earned via watering, streaks, plant maturity
- Crafting recipes (Workshop, Nature, Lighting, Special categories)
- Inventory system + decoration placement on garden tiles
- Auto-harvest material when plant reaches 100% growth

---

## 6. Plant Growth Timeline

| Stage | Time | Watering Need |
|-------|------|---------------|
| Seed | Day 1–3 | Daily |
| Sprout | Day 4–7 | Daily |
| Growing | Day 8–30 | Daily |
| Mature | Day 31–90 | Daily |
| Established | Day 91–180 | Every 2–3 days |
| Venerable | Day 181–365 | Every 3–5 days |
| Ancient | Year 1–3 | Weekly |
| Legendary | Year 3+ | Self-sustaining |

Growth is **time × consistency** — cannot be bought or grinded. Missing days pauses growth (no regression). Dormant plants do not lose growth days.

---

## 7. Page & Route Map

### Public

| Route | Purpose |
|-------|---------|
| `/` | Landing page (philosophy, pricing, ancient tree vision) |
| `/login` | Email + Google OAuth |
| `/signup` | Account creation |
| `/pricing` | Tier comparison |
| `/privacy`, `/terms`, `/refund` | Legal pages |

### Dashboard (authenticated)

| Route | Purpose |
|-------|---------|
| `/garden` | Main isometric garden |
| `/overview` | Stats by period |
| `/stats` | Streaks, weekly charts |
| `/profile` | Level, XP, achievements, identity badges |
| `/identity` | Identity system (PREMIUM) |
| `/settings` | Account, subscription, notifications |

### API

| Route | Purpose |
|-------|---------|
| `POST /api/webhooks/paddle` | Paddle payment webhooks |
| `POST /api/cron/moisture-decay` | Daily moisture backup route |

---

## 8. Success Metrics

### North Star

**Plants that reach Ancient stage (1+ year of consistency)** — captures fun, real habit formation, and the ancient tree vision in one metric.

### Primary

| Metric | Target |
|--------|--------|
| Day 7 retention | 60%+ |
| Day 30 retention | 40%+ |
| Day 90 retention | 25%+ |
| Plants reaching Established (Day 91) | 30%+ of active plants |
| Mirror Moment trigger rate | 20%+ of 30-day users |
| Average session time | 30–60 seconds |

### Revenue

| Metric | Target |
|--------|--------|
| Free → PRO conversion | 8–12% of 30-day retained |
| PRO → PREMIUM conversion | 15–20% of PRO users |
| Annual plan rate | 30%+ of subscribers |
| Monthly churn | < 8% |
| 30-day refund rate | < 5% |

### Anti-Metrics (explicitly NOT optimized)

- **DAU as primary KPI** — a 30-second session is success
- **Time in app** — this is not social media
- **Streak length as north star** — creates anxiety; consistency rate is healthier
