# Plant Status System Rules

Path: `src/lib/actions/plants.ts`, `src/lib/actions/activity.ts`, `src/lib/plant-status.ts`

This is the most bug-prone area. Read carefully before changing anything status-related.

## Valid Status Values

```
LIVING (subject to moisture decay):
  growing   — default on plant creation
  thriving  — set by logActivity() when user logs progress
  resting   — computed, may be set by future code
  waiting   — computed, may be set by future code
  sleeping  — computed, may be set by future code

TERMINAL (not subject to decay):
  mature    — growth_percentage reached 100%
  dead      — moisture hit 0, set by cron
  dormant   — DEPRECATED, treat as resting in all UI
```

## Status Flow

```
createPlant()  → status = 'growing'
logActivity()  → status = 'thriving'   (completed / progress)
waterPlant()   → status unchanged      (only updates moisture/growth)
growth >= 100% → status = 'mature'
moisture = 0   → status = 'dead'       (set by cron)
```

## Correct Filter Patterns

```typescript
// All living plants (garden view, focus view)
plants.filter(p => p.status !== 'dead' && p.status !== 'dormant')

// Growing plants only (list view "Growing" section)
plants.filter(p => p.status !== 'mature' && p.status !== 'dead' && p.status !== 'dormant')

// Can plant reach mature?
newGrowth >= 100 && plant.status !== 'mature' && plant.status !== 'dead'
```

## Wrong Patterns — DO NOT USE

```typescript
// ❌ Misses thriving/resting/waiting/sleeping
plants.filter(p => p.status === 'growing')
newGrowth >= 100 && plant.status === 'growing'
.eq('status', 'growing')
```

## Moisture Decay (Cron)

- Runs at **17:00 UTC daily** (= 00:00 Vietnam time)
- Processes statuses: `growing`, `thriving`, `resting`, `waiting`, `sleeping`
- **Excludes**: `mature`, `dead`, `dormant`
- If not watered today → `moisture -= decay_rate`
- If `moisture <= 0` → `status = 'dead'`

## calculatePlantStatus()

`calculatePlantStatus()` in `plant-status.ts` computes status client-side for display only.
It does NOT write to the database.
