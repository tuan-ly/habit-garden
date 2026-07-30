# Current State

- Date: 2026-07-30
- Milestone: Retention Core — Guided Habit Sessions
- Active task: Complete explicit Capability Attachment UX for normal plants
- Status: complete
- Vertical slice: a persisted plant owns garden identity/placement and optionally exposes a Reading capability backed by sessions, daily progress, goal plan and growth state
- Completed: removed VirtualPlant from garden core; restored move-to-empty behavior; added owned `habits.plant_id`; backfilled existing habits; added explicit attach/move Reading control to normal plant focus/detail; added visible Reading badge and focus CTA; removed implicit `/reading` plant provisioning; synced completion to plant activity; applied migration `20260729155039` to linked Supabase
- Verification: typecheck pass; focused ESLint pass; 29 Vitest files / 344 tests pass; production build pass; authenticated Chromium Reading E2E pass; migration ledger has 59 unique versions; remote column/FK/unique/RLS invariants pass
- Risks: local full-chain migration replay still depends on Docker Desktop; attach-new-capability is covered by action/UI tests while Chromium acceptance used the existing backfilled Reading capability
- Blockers: none
- Next smallest step: review the complete R2 diff and commit the Capability Attachment slice
