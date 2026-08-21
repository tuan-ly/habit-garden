# Current State

- Date: 2026-08-21
- Milestone: Retention Core — Guided Habit Sessions
- Active task: Capability Plugin Platform release verification
- Status: implementation, local database lifecycle, desktop/mobile UX audit and linked schema deployment complete; authenticated release smoke pending
- Vertical slice: each owned plant has one optional **Hành trình của cây** slot; Reading registers as the first plugin through manifest/server/UI/screen seams, generic `/plant/{plantId}/journey/*` routes, atomic attach/manage RPCs and per-instance archived history
- Non-goals: multiple capabilities on one plant; third-party/runtime plugin loading; Exercise UI; automatic AI habit classification; renaming legacy `habits` tables; deleting archived logs
- Completed: plugin registries and contract tests; generic journey dispatcher/routes; Capability Library and explicit intent confirmation; active/paused/remove management; contextual focus CTA and screen-space charm; focus restoration; paused-route guards; route-synchronized active-session banner; linked migrations `20260814234237` and `20260819134213`; ADR/OpenWiki/audit documentation
- Verification: 37 Vitest files / 380 tests, focused ESLint, TypeScript, production build and the 63-version local/remote migration ledger pass; remote catalog confirms capability metadata columns, unique `habit_id`, `SECURITY INVOKER` RPCs and no anonymous execute privilege; linked ERROR-level database advisors report no issues; local attach/pause/resume/remove work through the production UI and archived history is preserved; focused session-banner and Reading tests pass (3 files / 11 tests) after the navigation-sync fix
- Constraints: both `plant_id` and `habit_id` are unique in assignments; RPCs remain `SECURITY INVOKER`; RLS and owner-scoped foreign keys are the privilege boundary; generic Garden/routes must not branch on Reading; plugin screens are optional; focus mode has one primary action
- Risks: authenticated linked-environment smoke has not run; exact 200% landscape zoom, contrast measurement and screen-reader announcements remain manual release checks
- Blockers: none
- Next smallest step: run one authenticated linked-environment Garden → attach → session → completion → pause/remove smoke
