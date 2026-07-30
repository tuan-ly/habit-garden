# Project State — Habit Garden

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-28)

**Core value:** The app must be fun enough that users open it on their worst day.
**Current focus:** Review and close the completed Reading Plant Capability Attachment slice

## Current Milestone

**Milestone:** Retention Core — Guided Habit Sessions
**Started:** 2026-07-28
**Status:** Capability Attachment data model, explicit UX and linked migration complete

## Phase Status

| # | Phase | Status | Started | Completed |
|---|-------|--------|---------|-----------|
| R1 | Reading Habit Vertical Slice | complete | 2026-07-28 | 2026-07-28 |
| R2 | Reading Plant Capability Attachment | complete | 2026-07-29 | 2026-07-30 |
| 1 | Dual Growth Core (older backlog) | pending | — | — |
| 2 | Plant Personality & Harvest Loop (older backlog) | pending | — | — |
| 3 | Visual Assets (older backlog) | pending | — | — |
| 4 | Polish & Ship (older backlog) | pending | — | — |

## Session History

### 2026-04-28: Project Initialization
- Mapped codebase (7 docs in .planning/codebase/)
- Created PROJECT.md from existing specs/product.md + specs/rules.md
- Defined 17 requirements across 4 categories
- Created 4-phase roadmap (coarse granularity)
- Migrated from SDD workflow to GSD

### 2026-07-28: Reading Habit Vertical Slice
- Added a reusable guided-session aggregate and deterministic progression engine
- Added atomic Supabase persistence and explicit authenticated table grants
- Delivered Reading Home, refresh-safe Focus Session, Completion and Growth Plan routes
- Passed 335 unit/component tests, changed-file lint, typecheck, build, 58-migration replay, authenticated Chromium E2E and manual desktop/mobile exercise
- Recorded the full-repository lint baseline (60 pre-existing errors outside the slice) without expanding into unrelated refactors

### 2026-07-29: Reading Plant Capability Attachment
- Rejected the Virtual Plant projection after it widened core garden invariants and regressed plant movement
- Restored `PlantWithType[]` as the garden source of truth
- Linked guided habits to owned persisted plants through `habits.plant_id`
- Added Reading capability routing and idempotent plant activity synchronization

### 2026-07-30: Linked Schema Deployment
- Applied migration `20260729155039` to the linked Supabase project
- Verified the non-null plant link, ownership FK, unique capability constraint and INSERT/UPDATE RLS policies
- Confirmed authenticated `habits` and `plants` reads through the Data API

### 2026-07-30: Capability UX Gap
- Found that `/reading` still provisions a grass plant implicitly
- Confirmed there is no user-facing action to attach Reading while creating or inspecting a normal plant
- Reopened R2 until attachment is explicit and visibly represented in the garden

### 2026-07-30: Explicit Capability Attachment
- Added attach/move Reading control to the production plant focus panel and detail sheet
- Added a visible Reading badge and direct journey CTA on the attached real plant
- Removed implicit plant creation from `/reading`; missing capabilities now return users to the garden
- Passed 344 tests, typecheck, focused lint, production build and authenticated Chromium Reading E2E
- Added movement, capability and persistence regression coverage

## Decisions Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-04-28 | Adopt GSD workflow | Better phase management than SDD for complex multi-phase features |
| 2026-04-28 | Coarse granularity | 4 phases, solopreneur doesn't need fine-grained tracking |
| 2026-04-28 | Quality model profile | Opus for research/roadmap agents — deeper analysis worth the cost |
| 2026-07-28 | Additive guided-session aggregate | Prove persistent sessions and deterministic Growth Plans through Reading without rewriting legacy plants/goals |
| 2026-07-28 | Gentle missed-period behavior | Hold the current target and log history; never regress or surprise-increase after missed days |
| 2026-07-29 | Guided habits are plant capabilities | Keep plants as the spatial/lifecycle root; attach Reading and future guided behavior instead of projecting virtual plants |

---
*Last updated: 2026-07-30 after completing explicit Capability Attachment*
