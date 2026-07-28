# ADR 001: Guided Habit Session Aggregate

- Status: Accepted
- Date: 2026-07-28

## Context

Legacy plants and goals record check-ins but cannot persist an in-progress guided session or deterministic review history. The reading vertical slice needs refresh-safe timers, numeric completion, daily aggregation and gradual target changes without coupling the model to reading-only UI.

## Decision

Add an additive generic aggregate: `Habit`, `Goal Plan`, `Habit Session`, `Daily Progress` and `Growth State`. Keep the legacy plant/goal schema intact during rollout. Derive a running timer from persisted `accumulated_seconds` plus `last_resumed_at`; use one open-session constraint; complete through an invoker-safe atomic RPC. Store plan configuration in rows and evaluate a review only when its date is due.

For reading, configure 30 minutes, pages, 5→30 targets, seven-day reviews, an 80% threshold and five-page increments. A missed threshold holds the target and records history rather than reducing it.

## Consequences

- Sessions resume consistently across refreshes and devices.
- Completion cannot partially update progress, streak and growth.
- The same model can support other numeric units without adding their UI now.
- Legacy goals and new plans coexist temporarily; future work may add an adapter or migration after the reading slice proves the model.
