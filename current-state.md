# Current State

- Date: 2026-08-14
- Milestone: Retention Core — Guided Habit Sessions
- Active task: Replace global Reading navigation with plant-scoped routing
- Status: complete
- Vertical slice: `/plant/{plantId}` resolves one owned persisted plant and conditionally renders its Reading capability, with session, completion and Growth Plan nested under that same identity
- Completed: removed VirtualPlant from garden core; restored move-to-empty behavior; added owned `habits.plant_id`; backfilled existing habits; added explicit attach/move Reading control to normal plant focus/detail; added visible Reading badge and focus CTA; synced completion to plant activity; applied migration `20260729155039` to linked Supabase; committed as `0fd1339`; pushed `develop`; Vercel deployment completed successfully; reviewed closure docs against ADR 002 and OpenWiki; reconciled the Docker-dependent replay gap; made `ReadingJourneySnapshot` carry the owned linked `PlantWithType`; replaced the generic Reading tree with the linked plant renderer; deleted the global `/reading` route and navigation; added `/plant/[plantId]` plus plant-scoped Reading child routes; scoped capability/session reads by owner and requested plant; carried `plant_id` through active-session resume
- Verification: migration ledger has 60 unique versions; typecheck pass; focused lint pass; 32 Vitest files / 354 tests pass; production build pass and manifest contains only plant-scoped Reading routes; authenticated E2E scenario is discovered; remote column/FK/unique/RLS invariants and the earlier Vercel commit status remain pass
- Risks: local full-chain migration replay still depends on Docker Desktop; authenticated Playwright was not run because E2E credentials are not configured; the in-app browser could not access localhost due URL policy, so this change relies on component/persistence tests, E2E route assertions and the production route manifest
- Blockers: none
- Next smallest step: review the plant-scoped Reading diff before staging it separately from the existing staged closure documents
