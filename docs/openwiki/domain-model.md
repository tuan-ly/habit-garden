# Domain Model

## Plants

Plants represent habits. The main type is `PlantWithType` in `src/types/database.ts`, combining a `plants` row with its `plant_types` metadata and optional goal read model.

Important fields:

- `current_moisture` - current hydration meter.
- `growth_percentage` - growth toward maturity.
- `status` - lifecycle state.
- `grid_row`, `grid_col`, `grid_size` - isometric garden placement.
- `goal_mode` - whether this plant has a goal-tracking layer.
- `visual_stage`, `maturity_level`, `grace_period_days` - gentle-growth concepts.
- `death_acknowledged_at` - dấu mốc người dùng đã xác nhận lời tạm biệt cho một cây `dead`.

## Plant Status

New code should prefer the gentle status language:

- `growing`
- `thriving`
- `resting`
- `waiting`
- `sleeping`
- `mature`

`dead` and `dormant` remain in types for backward compatibility. Một cây `dead` có `death_acknowledged_at = null` là pending loss: vẫn render, giữ grid footprint/plant slot và mở Goodbye dialog theo thứ tự `died_at`. Khi action `acknowledgePlantDeath` lưu timestamp, cây rời garden nhưng record lịch sử vẫn còn. Dùng `isVisibleInGarden()` thay vì tự lọc theo `status`.

## Goals

Goals add measurable habit progress. Main modes:

- `build_capacity` - track best/max/min/average style values.
- `total_progress` - accumulate toward a target.

Goal frequency can be daily, weekly, or monthly. Period-aware helpers live in `src/lib/goal-utils.ts` and `src/lib/goal-progress.ts`.

## Guided Plant Capabilities

**Capability Assignment** is the association that lets a reusable guided capability appear on real persisted plants without creating another plant representation:

- `Plant` - visual identity, lifecycle and persisted garden placement; may have zero or one assignment.
- `PlantCapabilityAssignment` - owned `plant_id → habit_id` link; `plant_id` is unique while `habit_id` may repeat across many plants.
- `Habit` - reusable capability defining type, numeric unit and default session duration; it does not own a canonical plant identity.
- `GoalPlan` - start/end target, timeframe and deterministic review configuration, keyed by `habit_id`.
- `HabitSession` - running/paused/completion state with persisted elapsed time, keyed by `habit_id`.
- `DailyProgress` - one per capability/date, accumulating completed numeric value.
- `GrowthState` - capability-level current/previous/next target, streak, plant stage and review history.

**Shared Capability Event Stream** means completed sessions, progress and reflections belong to the capability. Journal, activity-history and milestone surfaces on any assigned plant project that same stream through `habit_id`; they do not create or filter a separate copy per plant.

`HabitSession.source_plant_id` is nullable **Route Context**: it remembers which assigned `/plant/{plantId}` route opened the session so resume and return navigation can preserve context. It never partitions the event stream or owns progress, and deletion of the source plant must not delete the session.

Reading configures this model as pages, 30 minutes, 5→30 pages/day, seven-day reviews, 80% consistency and five-page increments. `PlantWithType.guided_habit` is per-plant assignment metadata; multiple plants may expose summaries with the same capability id. Pure progression rules live in `src/lib/habit-growth.ts`. See [ADR 003](../adr/003-shared-capability-assignments.md).

## Mood And Weather

Mood is user-facing emotional state. Garden weather can be derived from mood in `GardenView`: high mood trends sunny, lower mood trends rainy/stormy. Weather also appears in XP and visual systems.

## Progression

Progression covers XP, levels, plant slots, tier unlocks, garden size, and decoration unlocks. Key files:

- `src/lib/xp-system.ts`
- `src/lib/progression-system.ts`
- `src/lib/coin-rewards.ts`
- `src/lib/subscription-limits.ts`

## Economy And Crafting

Coins, inventory, crafting recipes, and decorations support the garden customization loop. Server actions live in `src/lib/actions/coins.ts`, `crafting.ts`, `inventory.ts`, and `decorations.ts`.

Inventory UI state is available through `InventoryProvider`.

## Subscription

Subscription tier gates plant slots, goals, identity features, and premium capabilities. Paddle webhooks sync remote billing state into Supabase subscription/profile state.
