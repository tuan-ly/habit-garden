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

## Plant Status

New code should prefer the gentle status language:

- `growing`
- `thriving`
- `resting`
- `waiting`
- `sleeping`
- `mature`

`dead` and `dormant` remain in types for backward compatibility. Treat them carefully and avoid reintroducing harsh UX language.

## Goals

Goals add measurable habit progress. Main modes:

- `build_capacity` - track best/max/min/average style values.
- `total_progress` - accumulate toward a target.

Goal frequency can be daily, weekly, or monthly. Period-aware helpers live in `src/lib/goal-utils.ts` and `src/lib/goal-progress.ts`.

## Guided Habits

The additive guided-habit aggregate supports sessions without changing legacy plant/goal semantics:

- `Habit` - reusable habit identity, numeric unit and default session duration.
- `GoalPlan` - start/end target, timeframe and deterministic review configuration.
- `HabitSession` - running/paused/completion state with persisted elapsed time.
- `DailyProgress` - one per habit/date, accumulating completed numeric value.
- `GrowthState` - current/previous/next target, streak, plant stage and review history.

Reading configures this model as pages, 30 minutes, 5→30 pages/day, seven-day reviews, 80% consistency and five-page increments. Pure progression rules live in `src/lib/habit-growth.ts`.

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
