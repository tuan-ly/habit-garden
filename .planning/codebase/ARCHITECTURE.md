# Architecture — Habit Garden

**Mapped:** 2026-04-28

## Pattern

Next.js App Router with Server Actions. No separate API layer — all data mutations happen through server actions in `src/lib/actions/`. Client components use React Context for state management.

## Layers

```
[Browser] → [Next.js App Router]
                ├── Server Components (data fetching, SSR)
                ├── Server Actions (mutations, business logic)
                └── Client Components (interactive UI)
                        ├── Context Providers (state)
                        └── Custom Hooks (behavior)
                            ↓
                    [Supabase PostgreSQL]
                        ├── RLS Policies
                        ├── Atomic RPCs
                        └── Cron Jobs
```

## Data Flow

1. **Dashboard layout** (`src/app/(dashboard)/layout.tsx`) fetches user, profile, plantTypes via Server Components
2. **Provider tree** hydrates contexts: DevDebug → DashboardData → Subscription → Mood → GardenSettings → Inventory → Plants
3. **Server Actions** in `src/lib/actions/` handle all mutations with auth check (`getAuthUser()`) + ownership verification
4. **Optimistic UI** — watering/logging shows instant visual feedback, then confirms with server

## Key Abstractions

| Abstraction | Location | Purpose |
|-------------|----------|---------|
| `getAuthUser()` | `src/lib/auth-cached.ts` | Cached auth check (React.cache) |
| `PlantsProvider` | `src/lib/context/plants-context.tsx` | Plant state + optimistic updates |
| `SubscriptionProvider` | `src/lib/context/subscription-context.tsx` | Tier state + feature gates |
| `InventoryProvider` | `src/lib/context/inventory-context.tsx` | Materials, decorations, coins |
| `subscription-limits.ts` | `src/lib/subscription-limits.ts` | Tier limit definitions + check functions |
| `progression-system.ts` | `src/lib/progression-system.ts` | XP, levels, tiers, unlocks |
| `plant-status.ts` | `src/lib/plant-status.ts` | Client-side status computation (display only) |

## Entry Points

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Public | Landing page |
| `/login`, `/signup` | Public | Auth |
| `/garden` | Protected | Main garden view (isometric) |
| `/overview` | Protected | Stats dashboard |
| `/store` | Protected | Crafting + shop |
| `/profile` | Protected | User profile |
| `/settings` | Protected | Account settings |
| `/identity` | Protected (Premium) | Identity system |
| `/api/cron/moisture-decay` | API | Cron endpoint |
| `/api/webhooks/paddle` | API | Payment webhooks |

## Server Actions (16 files, ~6800 LOC)

| File | Domain |
|------|--------|
| `plants.ts` | Plant CRUD, watering, growth |
| `activity.ts` | Unified activity logging, coins, harvest |
| `goals.ts` | Goal creation, tracking, stats |
| `adaptive.ts` | Adaptive goal adjustments |
| `identity.ts` | Identity system (Premium) |
| `journal.ts` | Reflections |
| `mood.ts` | Daily mood |
| `coins.ts` | Coin operations |
| `crafting.ts` | Recipe crafting |
| `decorations.ts` | Decoration placement |
| `inventory.ts` | Inventory management |
| `paddle.ts` | Webhook handler |
| `subscription.ts` | Tier management |
| `profile.ts` | Profile updates |
| `dev.ts` | Dev-only actions |
| `weeds.ts` | DB compat only (deprecated) |
