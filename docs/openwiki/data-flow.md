# Data Flow

## Dashboard Hydration

The dashboard layout fetches user/profile/shared data on the server and passes it into client providers. `DashboardDataProvider` exposes stable initial data such as user, profile, and plant types.

This pattern solves the **Double Fetch Problem**: the page can render from server data, then client contexts reuse that state instead of immediately asking Supabase for the same records.

## Garden Page

`src/app/(dashboard)/garden/page.tsx` calls `getPlants()` and `getTodayWeather()`, then renders:

```tsx
<PlantsProvider initialPlants={plants}>
  <GardenView weather={weather.type} />
</PlantsProvider>
```

`GardenView` reads plants from `usePlants()`, mood from `useMood()`, profile/plant types from `DashboardDataContext`, and then selects one of the today/garden/list/focus views.

## Optimistic Updates

`PlantsProvider` uses `useOptimistic()` with a reducer for:

- watering a plant
- logging a goal
- moving a plant on the grid
- adding/removing/updating local plant state

Server actions remain the source of truth. Optimistic updates give immediate UI feedback, then `serverPlants` is updated after the action succeeds.

## Mutation Pattern

Client component -> context helper or direct server action -> `src/lib/actions/[feature].ts` -> Supabase -> result -> optimistic context or `revalidatePath()`.

Use context helpers when the UI needs local optimistic behavior. Use direct server action calls for simpler forms where a normal result/revalidation is enough.

## Cross-Feature Data

Plant rows can embed goal summary data for garden rendering. `getPlants()` joins `plant_types`, fetches active goals and relevant period logs, then attaches `goal`, `today_logs`, `today_log_count`, and `today_value` to `PlantWithType`.

This is a deliberate **Read Model Composition** pattern: the server action shapes data for the UI so the garden does not fan out into many client fetches.
