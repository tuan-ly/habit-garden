# Habit Garden — Code Standards & Conventions

> **Purpose**: Authoritative coding conventions for this codebase. All new code must follow these rules.
> Source documents: `.claude/rules/actions.md`, `.claude/rules/components.md`, `.claude/rules/database.md`, `.claude/rules/plants-status.md`

---

## 1. Server Actions

**Path**: `src/lib/actions/`

### Auth — Always Use `getAuthUser()`

```typescript
// ✅ CORRECT
import { getAuthUser } from '@/lib/auth-cached'
const user = await getAuthUser()
if (!user) return { error: 'Unauthorized' }

// ❌ NEVER
const { data: { user } } = await supabase.auth.getUser()
```

`getAuthUser()` uses `React.cache()` to deduplicate `auth.getUser()` per request — calling it multiple times within one request is free. Calling `auth.getUser()` directly creates redundant round-trips.

### Ownership Check Pattern

Always verify ownership before any write:

```typescript
const user = await getAuthUser()
if (!user) return { error: 'Unauthorized' }

const { data: record } = await supabase
  .from('table')
  .select('id, user_id')          // Only fetch what you need
  .eq('id', recordId)
  .single()

if (!record || record.user_id !== user.id) return { error: 'Not found' }
```

### Supabase Queries

```typescript
// ✅ Always specify columns explicitly
.select('id, name, status, growth_percentage')

// ❌ NEVER use select('*')
.select('*')
```

Always check errors on every query:
```typescript
const { data, error } = await supabase.from('plants').select('id, name').eq('id', id)
if (error) return { error: error.message }
```

### Action File Rules

| File | Note |
|------|------|
| `weeds.ts` | **DB compat only.** Do NOT add UI, new logic, or new references |
| All others | Add new logic here; never add Supabase calls to components |

---

## 2. React Components

### RSC-First, Client Opt-In

- All components are **React Server Components by default**
- Add `'use client'` only when the component needs: browser APIs, event handlers, React state/effects, context consumers

```typescript
// Server component (default — no directive needed)
export default async function PlantCard({ plantId }: Props) {
  const plant = await getPlant(plantId) // direct server-side fetch
  return <div>{plant.name}</div>
}

// Client component (opt-in)
'use client'
export function WateringButton({ onWater }: Props) {
  const [loading, setLoading] = useState(false)
  // ...
}
```

### No Direct Supabase Calls in Components

Components must never call Supabase directly. All mutations go through Server Actions:

```typescript
// ✅ CORRECT — call a server action
import { waterPlant } from '@/lib/actions/plants'
await waterPlant(plantId)

// ❌ NEVER
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
await supabase.from('plants').update(...)
```

### Context Provider Order

The dashboard provider tree order is **load-bearing** — do not reorder:

```
DashboardProviders
  ├── DevDebugProvider       (1st — others may read dev overrides)
  ├── SubscriptionProvider   (2nd — gating depends on tier)
  ├── MoodProvider           (3rd — independent of subscription)
  └── GardenSettingsProvider (4th)
        └── PlantsProvider   (innermost — consumes all above)
```

### Deprecated / Removed Components

| Component | Status | Action |
|-----------|--------|--------|
| `QuickLogModal` | ARCHIVED | Do not use or restore. File may exist with "(archieved)" in name |
| `WeedsProvider` | REMOVED (2026-03-03) | Do not re-add |
| Weed UI (`src/components/weeds/`) | REMOVED | Do not restore |

---

## 3. Performance — Canvas Over DOM

> **Rule**: Prefer HTML5 Canvas for complex visuals or many moving parts. Minimize DOM CSS/JS animations — they cause lag and jank in the garden.

```typescript
// ✅ CORRECT — use Canvas for garden rendering
// IsometricGarden, AmbientParticlesCanvas, WeatherEffects — all Canvas

// ❌ AVOID for garden elements
// CSS animations, framer-motion on many garden tiles, DOM-based particle systems
```

Framer Motion is acceptable for UI modals, sheets, and one-off transitions. Never for garden tile/plant animations.

---

## 4. Plant Status System

> **Critical**: This is the most bug-prone area. Read carefully before touching anything status-related.

### Valid Statuses

```
LIVING (subject to moisture decay):
  growing   — default on createPlant()
  thriving  — set by logActivity() on completion/progress
  resting   — computed; may be set by future code
  waiting   — computed
  sleeping  — computed

TERMINAL (not subject to decay):
  mature    — growth_percentage reached 100%
  dead      — moisture hit 0 (set by cron)
  dormant   — DEPRECATED; treat as resting in all UI
```

### Correct Filter Patterns

```typescript
// All living plants (garden view, focus view)
plants.filter(p => p.status !== 'dead' && p.status !== 'dormant')

// Growing plants (list view "Growing" section — includes thriving/resting/etc.)
plants.filter(p => p.status !== 'mature' && p.status !== 'dead' && p.status !== 'dormant')

// Maturity check
newGrowth >= 100 && plant.status !== 'mature' && plant.status !== 'dead'
```

### ❌ Wrong Patterns — Do NOT Use

```typescript
plants.filter(p => p.status === 'growing')           // misses thriving/resting/etc.
newGrowth >= 100 && plant.status === 'growing'        // blocks thriving plants from maturing
.eq('status', 'growing')                              // wrong in DB queries too
```

### Status Flow

```
createPlant()  → status = 'growing'
logActivity()  → status = 'thriving'   (on completed/progress)
waterPlant()   → status UNCHANGED      (only moisture/growth update)
growth >= 100% → status = 'mature'
moisture = 0   → status = 'dead'       (cron only)
```

`calculatePlantStatus()` in `plant-status.ts` computes status **client-side for display only** — it does NOT write to the database.

---

## 5. Database Conventions

### RLS — Always On

Every new table must have Row Level Security policies enabled and tested before shipping a migration.

### Migration Naming

```
supabase/migrations/YYYYMMDD_description.sql
```

Examples:
- `20260310_add_reflection_mood_column.sql`
- `20260311_crafting_decoration_system.sql`

Use `apply_migration` tool for DDL. Use `execute_sql` for data-only queries.

### Never Hardcode User IDs

Always retrieve from auth:
```typescript
const user = await getAuthUser()
// use user.id
```

---

## 6. Testing

- Unit tests: Vitest in `src/lib/__tests__/`
- Component tests: co-locate with component or in `__tests__/` sibling
- E2E tests: Playwright in `e2e/`
- Storybook: `src/components/**/__stories__/*.stories.tsx`

Run before every PR:
```bash
npm run test:run     # Vitest (must be 100% pass)
npm run lint         # ESLint
```

---

## 7. Dev-Only Tools

`src/components/dev/` components are **development only**:
- `DevDebugPanel` — toggle with `Ctrl+Shift+D`; allows level/tier override
- `DevDebugProvider` — context; never ship conditional dev code outside this provider
- Gate all dev tools with `DevDebugProvider`, not `process.env.NODE_ENV` inline checks
