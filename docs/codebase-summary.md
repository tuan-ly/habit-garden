# Habit Garden — Codebase Summary

> **Purpose**: High-level map of the repository. Read this to orient yourself before diving into any feature area.
> **Last updated**: 2026-04-19

---

## Directory Tree (`src/`, depth 3)

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: unauthenticated
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Route group: authenticated app
│   │   ├── garden/               # Main isometric garden page
│   │   ├── overview/             # Stats by period
│   │   ├── stats/                # Streaks, weekly charts
│   │   ├── profile/              # User profile + achievements
│   │   ├── identity/             # Identity system (PREMIUM)
│   │   ├── settings/             # Account & subscription
│   │   ├── layout.tsx            # Dashboard layout + providers
│   │   └── providers.tsx         # Context provider tree
│   ├── api/
│   │   ├── cron/
│   │   │   └── moisture-decay/   # Backup cron endpoint
│   │   └── webhooks/
│   │       └── paddle/           # Payment webhook handler
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
│
├── components/
│   ├── garden/                   # Isometric garden rendering
│   ├── plants/                   # Plant UI (cards, dialogs, modals)
│   ├── goals/                    # Goal tracking UI
│   ├── game-ui/                  # HUD, navigation, modals
│   ├── gamification/             # XP, achievements, stats
│   ├── identity/                 # Identity system (PREMIUM)
│   ├── crafting/                 # Crafting workshop UI
│   ├── inventory/                # Inventory management
│   ├── shop/                     # In-game shop
│   ├── mood/                     # Mood selector
│   ├── onboarding/               # 5-step tutorial flow
│   ├── landing/                  # Marketing pages
│   ├── settings/                 # Settings panels
│   ├── profile/                  # Profile view components
│   ├── dev/                      # Dev-only debug tools
│   └── ui/                       # shadcn/ui base components
│
├── lib/
│   ├── actions/                  # All Server Actions (mutations)
│   ├── context/                  # React Context providers
│   ├── hooks/                    # Custom React hooks
│   ├── __tests__/                # Vitest unit tests
│   ├── auth-cached.ts            # getAuthUser() — ALWAYS use this
│   ├── xp-system.ts              # XP calculation
│   ├── progression-system.ts     # Level unlocks, slots, garden size
│   ├── plant-status.ts           # Client-side status computation
│   ├── subscription-limits.ts    # Tier feature gates
│   ├── subscription-limits.test.ts
│   ├── paddle.ts                 # Paddle client utilities
│   ├── paddle-utils.ts           # Server-side Paddle helpers
│   ├── achievements.ts           # Achievement definitions
│   ├── weather-system.ts         # Daily weather logic
│   └── mood-system.ts            # Mood/XP bonus computation
│
├── types/
│   └── database.ts               # Supabase table types (auto-gen base)
│
└── public/
    └── plants/                   # Plant PNG assets
        ├── generic/              # Fallback images
        ├── sunflower/
        ├── cherry-blossom/
        └── [type]/[stage].png    # Naming convention
```

---

## Key Directories Explained

### `src/app/` — Routes

Uses **Next.js App Router** with two route groups:
- `(auth)/` — login/signup, no authentication required
- `(dashboard)/` — protected pages, wraps everything in the provider tree

All pages are React Server Components by default. Client interactivity is opt-in via `'use client'`.

### `src/components/garden/` — Garden Rendering

Canvas-first rendering for performance. Key files:

| File | Role |
|------|------|
| `isometric-garden.tsx` | Top-level canvas orchestrator; wires garden interactions |
| `garden-view.tsx` | Page-level container; renders IsometricGarden + overlays |
| `garden-tile-grid.tsx` | Tile layout logic for isometric projection |
| `isometric-tile.tsx` | Individual tile (ground + decoration render) |
| `isometric-plant.tsx` | Plant sprite on tile |
| `focus-garden-view.tsx` | Single-plant focus mode |
| `cemetery-view.tsx` | Dead plant history view |
| `weather-effects.tsx` | Rain/lightning/rainbow overlay (Canvas) |
| `ambient-particles-canvas.tsx` | Background particle system (Canvas) |
| `zoom-controls.tsx` | Pinch-to-zoom + button controls |
| `EditMode/` | Decoration placement overlay UI |

### `src/components/plants/` — Plant Interaction

| File | Role |
|------|------|
| `gentle-watering-modal.tsx` | **Main interaction** — water, log, "Not today", Easy Mode |
| `plant-detail-sheet.tsx` | Drawer with tabs: Overview, Journal, Goals, Reflections, Anchor |
| `add-plant-dialog.tsx` | New plant creation (respects tier/slot limits) |
| `plant-card.tsx` | Card view of a plant |
| `plant-visual.tsx` | Plant image + moisture/growth overlay |
| `moisture-bar.tsx` | Moisture level indicator |
| `growth-progress.tsx` | Growth % ring/bar |
| `reflection-modal.tsx` | Weekly reflection prompts |
| `harvest-dialog.tsx` | Plant maturity harvest flow |
| `journal-timeline.tsx` | Activity history log |
| `milestone-timeline.tsx` | Growth stage milestone history |

### `src/components/goals/`

| File | Role |
|------|------|
| `goal-setup-wizard.tsx` | 4-step goal creation wizard |
| `goal-progress.tsx` | Goal progress display |
| `goal-log-modal.tsx` | Quick value logging |
| `goal-progress-chart.tsx` | Weekly chart (Goal Master style) |
| `adaptive-suggestion-modal.tsx` | Shows adaptive adjustment suggestion |
| `goal-journey-map.tsx` | Multi-season overview |
| `goal-timeline.tsx` | Week-by-week breakdown |

### `src/components/game-ui/`

| File | Role |
|------|------|
| `game-hud.tsx` | Floating XP/Level/Weather display |
| `game-nav.tsx` | Bottom navigation bar |
| `level-up-modal.tsx` | Confetti + unlock display on level up |
| `welcome-back-modal.tsx` | Return-after-absence warm message |
| `upgrade-modal.tsx` | Tier upgrade prompt + Paddle checkout |

### `src/lib/actions/` — Server Actions

All database mutations go through Server Actions. **Never call Supabase directly from components.**

| File | Purpose |
|------|---------|
| `plants.ts` | Plant CRUD, watering, growth, maturity |
| `goals.ts` | Goal creation, logging, seasons |
| `activity.ts` | Unified activity logging (all plant actions) |
| `adaptive.ts` | Adaptive goal adjustments |
| `identity.ts` | Identity CRUD + goal linking (PREMIUM) |
| `journal.ts` | Reflection journal entries |
| `mood.ts` | Daily mood logging |
| `paddle.ts` | Paddle subscription server actions |
| `subscription.ts` | Tier management, feature checks |
| `profile.ts` | User profile updates |
| `coins.ts` | Coin economy (award, spend) |
| `crafting.ts` | Recipe crafting |
| `decorations.ts` | Decoration placement/removal |
| `inventory.ts` | Inventory management |
| `dev.ts` | Dev-only helpers |
| `weeds.ts` | **DB compat only — do not extend** |

### `src/lib/context/` — React Contexts

| Context | Purpose |
|---------|---------|
| `PlantsContext` | Plants list + optimistic updates |
| `MoodContext` | Today's mood state |
| `SubscriptionContext` | Current tier + feature gates |
| `GardenSettingsContext` | Garden display preferences |
| `DevDebugContext` | Dev override state (level/tier) |
| `InventoryContext` | Coins + inventory items |

**Provider order** (must not be reordered):
```
DashboardProviders
  ├── DevDebugProvider
  ├── SubscriptionProvider
  ├── MoodProvider
  └── GardenSettingsProvider
        └── PlantsProvider (per-page, SSR initial data)
```

### `src/lib/__tests__/` — Unit Tests (Vitest)

| File | Tests |
|------|-------|
| `progression-system.test.ts` | 82 tests — level unlocks, slots, garden sizing |
| `xp-system.test.ts` | 71 tests — XP calculation, level caps |
| `subscription-limits.test.ts` | 36 tests — tier feature gating |

Total: 202+ tests, 100% pass rate maintained.

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `next.config.ts` | Next.js config (webpack mode, PWA, bundle analyzer) |
| `capacitor.config.ts` | Capacitor mobile build config |
| `tailwind.config.ts` | Tailwind CSS v4 config |
| `vitest.config.ts` | Vitest unit test config |
| `playwright.config.ts` | Playwright e2e test config |
| `.storybook/` | Storybook 8.6 config |
| `supabase/migrations/` | Database migration SQL files |

---

## Public Assets

```
public/
├── plants/[type]/[stage].png   # Plant images (42 types × stages needed)
│                               # Currently: 6 types have images
├── icons/                      # PWA icons
└── manifest.json               # PWA manifest
```

Plant image naming: `public/plants/sunflower/seed.png`, `public/plants/sunflower/sprout.png`, etc. Falls back to `public/plants/generic/[stage].png` if type-specific image missing.
