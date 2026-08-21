# Current State

- Date: 2026-08-21
- Milestone: Retention Core — Guided Habit Sessions
- Active task: Capability Plugin Platform release verification
- Status: plugin platform and user-scoped running-session migrations deployed; authenticated release smoke pending
- Vertical slice: each owned plant has one optional **Hành trình của cây** slot; Reading registers as the first plugin through manifest/server/UI/screen seams, generic `/plant/{plantId}/journey/*` routes, atomic attach/manage RPCs and per-instance archived history
- Non-goals: multiple capabilities on one plant; third-party/runtime plugin loading; Exercise UI; automatic AI habit classification; renaming legacy `habits` tables; deleting archived logs
- Completed: plugin registries and contract tests; generic journey dispatcher/routes; Capability Library and explicit intent confirmation; active/paused/remove management; contextual focus CTA and screen-space charm; focus restoration; paused-route guards; route-synchronized active-session banner hidden on its own timer/completion surfaces; user-scoped single-running-session invariant with structured conflict routing; linked migrations `20260814234237`, `20260819134213` and `20260821052602`; ADR/OpenWiki/audit documentation
- Verification: 64-version PostgreSQL 17 replay, transactional duplicate-running probe, local ERROR-level security/performance advisors, 38 Vitest files / 388 tests, focused ESLint, TypeScript and production build pass; linked catalog confirms `habit_sessions_one_running_per_user`, the duplicate-running query returns zero rows, migration ledger contains `20260821052602`, and linked ERROR-level security/performance advisors report no issues; full repository lint remains blocked by pre-existing legacy/generated-file errors outside this slice
- Constraints: both `plant_id` and `habit_id` are unique in assignments; at most one `running` session exists per user while `paused` and `awaiting_completion` remain per-instance; RPCs remain `SECURITY INVOKER`; RLS and owner-scoped foreign keys are the privilege boundary; generic Garden/routes must not branch on Reading; plugin screens are optional; focus mode has one primary action
- Risks: authenticated linked-environment smoke has not run; exact 200% landscape zoom, contrast measurement and screen-reader announcements remain manual release checks
- Blockers: none
- Next smallest step: run an authenticated two-plant start/resume conflict smoke against the linked environment
