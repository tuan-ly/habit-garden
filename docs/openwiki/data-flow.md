# Data Flow

## Dashboard Hydration

The dashboard layout authenticates once, then calls `get_dashboard_bootstrap()` for profile, today's mood, and plant types in one database request. `DashboardDataProvider` exposes the result to client providers.

This pattern solves the **Double Fetch Problem**: the page can render from server data, then client contexts reuse that state instead of immediately asking Supabase for the same records.

## Garden Page

`src/app/(dashboard)/garden/page.tsx` hydrates plants and placed decorations from the cached `get_garden_snapshot()` read model, then renders:

```tsx
<PlantsProvider initialPlants={plants}>
  <GardenSnapshotHydrator placedDecorations={placedDecorations} />
  <GardenView weather={weather.type} />
</PlantsProvider>
```

`GardenView` reads plants from `usePlants()`, mood from `useMood()`, profile/plant types from `DashboardDataContext`, and renders the Garden-first sanctuary shell. `IsometricGarden` selects a due plant with the lowest moisture as the suggested focus and passes it to `SanctuaryGardenChrome`.

## Optimistic Updates

`PlantsProvider` is the plant mutation boundary. Activity intents receive a `mutationId`, update only the target entity immediately, and reconcile with the canonical plant/goal returned by the RPC.

- watering a plant
- logging a goal
- moving a plant on the grid
- adding/removing/updating local plant state

`InventoryProvider` applies the same rule to decoration placement and movement. A placement immediately appends a temporary `optimistic-*` decoration and decrements the local inventory stack, then replaces the temporary id with the server id. Movement updates the target entity immediately. Either mutation rolls back only its affected decoration/inventory item on failure; it must not wait for a full inventory or placed-decoration refetch before showing the committed position.

On failure, the provider restores the entity snapshot and offers a retry using the same `mutationId`; this makes retries safe for XP, coins, achievements, and inventory rewards.

The sanctuary action sequence is:

`action dock -> SanctuaryActionDialog -> useGardenInteractions -> PlantsProvider optimistic helper -> server action -> SanctuaryGardenReaction`

The three entry paths reuse existing mutation boundaries:

- `Đã làm` - standard watering or goal log.
- `2 phút` - opens the same mutation flow with tiny-action framing.
- `Nghỉ` - records the existing intentional rest/watering path without shame messaging.

## Mutation Pattern

Client component -> context helper -> compatibility server action -> atomic Supabase RPC -> canonical result -> reconcile or entity rollback.

User-facing mutations must not call `revalidatePath()` or `router.refresh()`. Single-row preference/profile writes may use `update(...).select(...)`; multi-write/reward flows belong in an atomic RPC.

## Cross-Feature Data

Plant rows can embed goal summary data for garden rendering. `getPlants()` joins `plant_types`, fetches active goals and relevant period logs, then attaches `goal`, `today_logs`, `today_log_count`, and `today_value` to `PlantWithType`.

This is a deliberate **Read Model Composition** pattern: the server action shapes data for the UI so the garden does not fan out into many client fetches.
