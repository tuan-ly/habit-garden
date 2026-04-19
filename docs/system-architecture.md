# Habit Garden — System Architecture

> **Purpose**: How the system is built — App Router structure, data flow, auth, cron, payments, and mobile pipeline.
> **Last updated**: 2026-04-19

---

## 1. High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Clients                               │
│  Browser (PWA)   iOS (Capacitor)   Android (Capacitor)  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                    Vercel (Edge)                         │
│  Next.js 16 App Router — webpack mode                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Route Groups                                    │    │
│  │  (auth)/     — login, signup (public)            │    │
│  │  (dashboard)/— garden, stats, profile (authed)   │    │
│  │  api/        — webhooks/paddle, cron/moisture    │    │
│  │  /           — landing page                      │    │
│  └───────────────────┬─────────────────────────────┘    │
│                      │ Server Actions (mutations)        │
│  ┌───────────────────▼─────────────────────────────┐    │
│  │  src/lib/actions/*  — all DB writes go here      │    │
│  └───────────────────┬─────────────────────────────┘    │
└──────────────────────┼──────────────────────────────────┘
                       │
      ┌────────────────┼──────────────────┐
      │                │                  │
┌─────▼──────┐  ┌──────▼──────┐  ┌───────▼──────┐
│  Supabase  │  │  Paddle     │  │  pg_cron     │
│  Postgres  │  │  Billing    │  │  (daily 17:00│
│  Auth      │  │  Webhooks   │  │   UTC)       │
│  RLS       │  └─────────────┘  └──────────────┘
└────────────┘
```

---

## 2. Next.js App Router Structure

### Route Groups

| Group | Path | Auth | Purpose |
|-------|------|------|---------|
| `(auth)` | `/login`, `/signup` | None | Authentication pages |
| `(dashboard)` | `/garden`, `/stats`, `/profile`, `/identity`, `/settings`, `/overview` | Required | Main app pages |
| Root | `/`, `/pricing`, `/privacy`, `/terms`, `/refund` | None | Marketing + legal |

### Rendering Strategy

- All pages default to **React Server Components** (RSC)
- Opt into client rendering with `'use client'` only when needed (interactivity, hooks, context)
- SSR data is fetched in `layout.tsx` and passed as `initialData` props to context providers
- This avoids double-fetching: server fetches once, client hydrates without re-fetching

### Provider Tree (`(dashboard)/layout.tsx`)

```typescript
<DashboardProviders>           // wrapper shell
  <DevDebugProvider>           // dev override state
    <SubscriptionProvider initialTier={tier}>
      <MoodProvider initialMood={mood}>
        <GardenSettingsProvider>
          {children}           // PlantsProvider is per-page
        </GardenSettingsProvider>
      </MoodProvider>
    </SubscriptionProvider>
  </DevDebugProvider>
</DashboardProviders>
```

---

## 3. Server Actions Flow

All mutations follow this pattern:

```
Component (client)
  │  calls server action
  ▼
src/lib/actions/[feature].ts
  1. getAuthUser()             — authenticate
  2. ownership check           — verify user owns the record
  3. supabase query/mutation   — explicit columns, error check
  4. side effects              — XP award, coin award, achievement check
  5. return result             — { data } or { error }
  │
  ▼
Component
  — optimistic UI update (PlantsContext.updatePlant)
  — or revalidatePath() for RSC refresh
```

**Key**: No Supabase call ever originates from a component. Components call server actions only.

---

## 4. Supabase — Auth & RLS

### Authentication

- Provider: Supabase Auth (Email + Google OAuth)
- Client: `@supabase/ssr` 0.8.0 — cookie-based session for SSR compatibility
- Server helper: `getAuthUser()` from `src/lib/auth-cached.ts`
  - Wraps `auth.getUser()` in `React.cache()` — deduplicated per request
  - Returns `null` if unauthenticated; always check before any write

### Row Level Security

- **All tables** have RLS enabled
- Standard pattern: `WHERE user_id = auth.uid()` in policies
- New tables MUST add RLS policies before shipping the migration
- Test RLS policies via Supabase dashboard before any production migration

### Key Tables

| Table | Notes |
|-------|-------|
| `profiles` | XP, level, subscription_tier (auto-synced from subscriptions) |
| `plants` | status, moisture, growth_percentage, grid position, coins |
| `plant_types` | 40+ types with tier, decay rate, visual config |
| `goals` | PRO feature — build_capacity / total_progress modes |
| `goal_logs` | Daily progress entries |
| `activity_logs` | Unified log: watering, completed, progress, reflection, revival |
| `reflections` | Weekly reflection prompt responses |
| `identities` | PREMIUM — identity groupings with progress tracking |
| `subscriptions` | Paddle subscription state |
| `subscription_tiers` | Tier config (free/pro/premium limits) |
| `crafting_recipes` | Craftable decoration recipes |
| `inventory_items` | User's crafted/owned items |
| `decorations` | Placed decorations on garden tiles |
| `coins_ledger` | Coin transaction log |
| `mood_logs` | Daily mood entries (1–5 scale) |
| `achievements` | Achievement definitions |
| `user_achievements` | Unlocked achievements |
| `watering_logs` | Watering history |

---

## 5. Cron Jobs

### Primary: Supabase `pg_cron`

```sql
-- Runs daily at 17:00 UTC (= 00:00 Vietnam time)
SELECT cron.schedule('update-moisture', '0 17 * * *', 'SELECT update_daily_moisture()');
```

**`update_daily_moisture()` logic**:
1. Select all plants with `status IN ('growing', 'thriving', 'resting', 'waiting', 'sleeping')`
2. For each: `current_moisture -= decay_rate`
3. If `current_moisture <= 0`: `status = 'dead'`, `current_moisture = 0`
4. **Excludes**: `mature`, `dead`, `dormant`

### Backup: Next.js API Route

```
POST /api/cron/moisture-decay
Authorization: Bearer {CRON_SECRET}
```

Vercel calls this at the same schedule as a backup. Returns 401 without the secret.

---

## 6. Payment Webhooks (Paddle)

```
Paddle → POST /api/webhooks/paddle
           │
           ▼
       Signature verification (PADDLE_WEBHOOK_SECRET)
           │
           ▼
       Event routing:
         subscription.created   → create subscription row
         subscription.updated   → update status/tier
         subscription.canceled  → mark canceled
         transaction.completed  → log event
           │
           ▼
       Update profiles.subscription_tier (trigger auto-syncs)
       Log to subscription_events (audit trail)
       Log to subscription_webhooks (raw webhook audit)
```

The `profiles.subscription_tier` column is kept in sync via a Postgres trigger that fires on `subscriptions` insert/update.

---

## 7. Mobile Build Pipeline (Capacitor)

Capacitor 8 wraps the Next.js static export for iOS and Android.

```
Next.js (App Router)
    │
    │  npm run build:mobile
    │  (next build --webpack + export)
    ▼
out/  (static HTML/CSS/JS)
    │
    │  npx cap sync
    ▼
ios/   android/  (native project directories)
    │
    ▼
Xcode (iOS)   Android Studio (Android)
```

**Important**: `output: 'export'` must be set in `next.config.ts` for mobile builds (white screen if missing).

For development with live reload, set `server.url` in `capacitor.config.ts` to your dev machine IP.

See [`docs/deployment-guide.md`](./deployment-guide.md) for full mobile build steps.

---

## 8. Data Flow — Daily Habit Loop

```
User opens app
    │
    ├─→ [RSC] layout.tsx fetches: profile, subscription tier, today's mood
    │   Passes as initialData to providers (no client re-fetch on hydration)
    │
    ├─→ [RSC] garden/page.tsx fetches: plants list with plant_types
    │   Passes to PlantsProvider as initialPlants
    │
    ▼
Garden renders (Canvas — IsometricGarden)
    │
    ├─→ User taps plant
    │   → GentleWateringModal opens (client component)
    │
    ├─→ User taps "I did it!"
    │   → logActivity(plantId, 'completed') [Server Action]
    │     → getAuthUser() + ownership check
    │     → UPDATE plants (moisture, growth, status='thriving')
    │     → INSERT activity_logs
    │     → awardXP() + checkAchievements() + awardCoins()
    │     → Returns: { xpGained, leveledUp, newAchievements, coinsEarned }
    │
    ├─→ PlantsContext.updatePlant(result) — optimistic update
    │
    └─→ LevelUpModal / AchievementPopup — if applicable
```

---

## 9. Feature Gating Architecture

```
SubscriptionContext (client-side)
    │
    ├── reads: profiles.subscription_tier (SSR initial → client cached)
    ├── exposes: tier ('free' | 'pro' | 'premium')
    └── imports: subscription-limits.ts
                  ├── getTierLimits(tier) → { maxPlants, maxGoals, ... }
                  ├── canAccessFeature(tier, feature)
                  ├── canPlaceMoreDecorations(tier, currentCount)
                  └── getUpgradePrompt(feature) → modal text

Components check tier via useSubscription() hook.
Server actions re-verify tier server-side (never trust client).
```
