# Project State — Habit Garden

## Project Reference

See: .planning/PROJECT.md (updated 2026-08-15)

**Core value:** The app must be fun enough that users open it on their worst day.
**Current focus:** Finish the authenticated linked-environment smoke for the deployed Capability Plugin Platform without widening scope

## Current Milestone

**Milestone:** Retention Core — Guided Habit Sessions
**Started:** 2026-07-28
**Status:** R5 Capability Plugin Platform is locally implemented, audited and deployed at the schema layer; authenticated release smoke remains pending

## Phase Status

| # | Phase | Status | Started | Completed |
|---|-------|--------|---------|-----------|
| R1 | Reading Habit Vertical Slice | complete | 2026-07-28 | 2026-07-28 |
| R2 | Reading Plant Capability Attachment | complete | 2026-07-29 | 2026-07-30 |
| R3 | Shared Capability Assignments | release pending | 2026-08-14 | — |
| R4 | Per-Plant Capability Instances | release pending | 2026-08-15 | — |
| R5 | Capability Plugin Platform & Library | release pending | 2026-08-19 | — |
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

### 2026-07-30: R2 Release Closure
- Committed Capability Attachment as `0fd1339`
- Pushed `develop` to GitHub and received a successful Vercel deployment status
- Re-ran the 59-version migration ledger check, typecheck, all 344 tests and the production build
- Kept generated Playwright reports outside the product change scope
- Deferred the next implementation slice until the R2 closure documentation is reviewed and committed

### 2026-08-03: R2 Documentation Review
- Reconciled the roadmap release criteria with the actual linked-schema verification and the deferred Docker-dependent local replay
- Reviewed the closure documents against ADR 002, the guided-session OpenWiki pages and commit `0fd1339`
- Kept generated Playwright reports outside the documentation commit scope

### 2026-08-12: Reading Plant Identity Continuity
- Found a split identity: `habits.plant_id` still referenced the correct plant, but Reading Home rendered a generic plant from `growth_states.plant_stage`
- Added the owned linked `PlantWithType` to the Reading journey read model and reused the canonical plant renderer, name and type across Reading surfaces
- Added component, persistence-contract and authenticated-flow regression assertions for plant ID, name and image continuity
- Passed focused lint, typecheck, all 345 Vitest tests, production build and an authenticated local Garden → Reading browser smoke
- Initially kept `/reading`; this route choice was superseded by the plant-scoped decision on 2026-08-14

### 2026-08-14: Plant-Scoped Reading Route
- Replaced the global Reading entry with `/plant/{plantId}` and nested session, completion and Growth Plan routes under the same plant
- Removed the global Reading navigation items; Garden and the active-session banner now carry the concrete linked plant ID
- Scoped Reading capability and session resolution by authenticated owner, requested plant, capability type and active state
- Added a capability-empty plant state so a normal plant cannot display another plant's Reading journey
- Passed focused lint, typecheck, all 354 Vitest tests, the 60-version migration ledger check and production build; authenticated E2E is discovered but credentials are not configured

### 2026-08-14: Shared Capability Assignments
- Reframed the direct one-to-one plant link as a **Capability Assignment**: each plant keeps one capability slot while one capability can serve many plants
- Started an expand/contract rollout with owned `plant_capability_assignments`, a nullable legacy anchor and additive compatibility synchronization
- Made completed capability sessions the shared event stream projected on every assigned plant; existing session results, reflections, daily progress and Growth Plan stay keyed by `habit_id`
- Added nullable `habit_sessions.source_plant_id` solely for route/resume context; it does not partition capability history
- Replaced attach/move semantics with additive, idempotent assignment in the application working tree
- Clean PostgreSQL 17 replay, schema-catalog/advisor checks, the 61-version migration ledger, focused lint, typecheck, all 34 Vitest files / 363 tests and production build pass; the linked migration ledger confirms `20260814145405` remains pending remotely, and the Reading E2E remains discoverable across five projects
- Linked schema deployment, authenticated E2E and app release remain pending before R3 closure

### 2026-08-15: Shared Capability Linked Migration
- Applied `20260814145405_shared_capability_assignments.sql` to the linked `habit-garden` Supabase project
- Confirmed all 61 local and remote migration versions match
- Verified 1 legacy capability assignment was backfilled with 0 missing links and 0 session-source mismatches
- Verified assignment RLS and 4 policies, owner FKs, plant primary key, fan-out/source indexes and the compatibility trigger
- Ran linked ERROR-level database advisors with no issues; authenticated E2E and app release remain pending

### 2026-08-15: Per-Plant Capability Instances
- Clarified that reuse applies to the Reading capability type, not to one shared progress aggregate
- Changed assignment cardinality to one plant ↔ one `habit` instance while allowing multiple instances with type `reading`
- Kept target, Growth Plan, sessions, daily progress and journal projection keyed by the plant's unique `habit_id`
- Added a split migration for any already-shared assignments and rebuilt affected daily aggregates from sourced completed sessions
- Added ADR 004 and updated UI copy/tests
- Passed clean PostgreSQL 17 replay, a seeded shared-data split scenario, local catalog/advisors, all 364 tests, typecheck, focused lint and production build
- Linked dry-run shows only `20260814234237` pending; authenticated E2E remains pending

### 2026-08-19: Capability Plugin Platform & Library
- Introduced manifest, server, client UI, journey renderer and optional screen registries under `src/capabilities/`
- Migrated Reading to generic plant journey routes and removed Reading-specific branches from Garden core, lifecycle dispatch and active-session presentation
- Added Capability Library, explicit intent confirmation, Plant Detail lifecycle management, focus-panel detail entry and a scale-independent plant charm
- Added atomic `SECURITY INVOKER` attach/manage RPCs with advisory locking, config/version metadata and archive semantics
- Fixed post-attach bootstrap upserts, keyboard focus restoration, paused-route guards, reduced-motion handling and Vietnamese accessible close labels
- Completed desktop/mobile UX audit with local Supabase; exact 200% landscape zoom and full screen-reader/contrast testing remain release checks
- Passed 37 Vitest files / 380 tests, focused ESLint, TypeScript, the 63-version migration ledger, production build and local ERROR-level database advisors
- Linked ledger shows `20260814234237` and `20260819134213` pending; no linked migration was applied in this task

### 2026-08-21: Capability Platform Linked Migrations
- Applied `20260814234237_isolate_capability_instances_per_plant.sql` and `20260819134213_capability_plugin_platform.sql` to linked project `jkhkfsfjnilbfqfatonb`
- Confirmed all 63 local and remote migration versions match
- Verified `habits.config`, `definition_version` and `archived_at`, plus unique assignment `habit_id`
- Verified both lifecycle RPCs remain `SECURITY INVOKER`; authenticated and system roles can execute while `anon` cannot
- Ran linked ERROR-level database advisors with no issues; authenticated Garden lifecycle smoke remains pending

### 2026-08-21: User-Scoped Running Session
- Replaced the ADR 004 concurrent-timer consequence with a **User-Scoped Single Running Session** invariant
- Added a partial unique index on running `habit_sessions.user_id`; existing duplicate timers are normalized while per-plant progress and open-session history stay isolated
- Added `ACTIVE_SESSION_CONFLICT` handling so start/resume routes users to the canonical running plant instead of creating or auto-pausing another timer
- Passed the 64-version PostgreSQL 17 replay, transactional uniqueness probe, 38 Vitest files / 388 tests, TypeScript, focused ESLint, production build and local ERROR-level advisors
- Applied `20260821052602_enforce_single_running_session_per_user.sql` to linked project `jkhkfsfjnilbfqfatonb`
- Verified the partial unique index, zero duplicate-running users, the remote migration ledger entry and clean linked ERROR-level security/performance advisors; authenticated two-plant smoke remains pending

## Decisions Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-04-28 | Adopt GSD workflow | Better phase management than SDD for complex multi-phase features |
| 2026-04-28 | Coarse granularity | 4 phases, solopreneur doesn't need fine-grained tracking |
| 2026-04-28 | Quality model profile | Opus for research/roadmap agents — deeper analysis worth the cost |
| 2026-07-28 | Additive guided-session aggregate | Prove persistent sessions and deterministic Growth Plans through Reading without rewriting legacy plants/goals |
| 2026-07-28 | Gentle missed-period behavior | Hold the current target and log history; never regress or surprise-increase after missed days |
| 2026-07-29 | Guided habits are plant capabilities (superseded by ADR 003) | Keep plants as the spatial/lifecycle root; the original direct one-to-one attachment was later replaced |
| 2026-08-14 | Plant-scoped Reading route | Use `/plant/{plantId}` as the resource identity; Reading is conditional behavior rendered inside that plant |
| 2026-08-14 | Shared capability assignments and event stream | Give each plant one capability slot, allow many plants to share one capability, and keep logs/progression capability-owned |
| 2026-08-15 | Per-plant capability instances | Reuse capability type across plants while keeping each plant's target and log independent |
| 2026-08-19 | Capability Plugin Platform + Capability Slot | Make new guided behavior an internal module registered at explicit server/client seams, while users manage one optional “Hành trình của cây” per plant |
| 2026-08-21 | User-scoped single running session | Keep capability progress isolated per plant while allowing only one active focus timer per user across all instances |

---
*Last updated: 2026-08-21 after deploying and verifying the user-scoped running-session invariant*
