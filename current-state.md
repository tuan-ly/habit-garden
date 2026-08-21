# Current State

- Date: 2026-08-21
- Milestone: Retention Core — Per-Plant Story Recall
- Active task: Living Chapters usable hybrid for `/overview/[plantId]` — Done
- Status: implemented, authenticated-browser verified and design-QA passed
- Vertical slice: Journey and Plant Detail open one owner-scoped plant story; automatic monthly chapters merge capability-instance sessions or legacy plant activities, preview two current-month entries, expand complete months, filter months with notes and switch between plants
- Non-goals: manual chapter creation or naming; requiring notes; editing/deleting historical logs; new Supabase schema or migration; seasonal archive thumbnails; changing progression, XP or capability rules
- Completed: lifetime `PlantStorySnapshot` read model with exhaustive 500-row paging; authenticated action and ownership scope; `/overview/[plantId]` page plus loading/error/not-found states; compact plant identity and bounded switcher; current-month expand/collapse; newest-first archive and note filter; Journey and Plant Detail deep links; responsive mobile/desktop UI; source-vs-implementation QA evidence and E2E coverage
- Verification: 5 focused Vitest files / 18 tests pass; scoped ESLint pass; TypeScript `--noEmit` pass; production build pass; authenticated Chromium Plant Story E2E pass; in-app Browser verified `390×844`, `768×1152` and `1280×900`, current-month expansion, note filter, plant switching and no new console warnings/errors; root `design-qa.md` ends with `final result: passed`
- Constraints: assigned plants must project only their unique `habit_id`; unassigned plants retain plant-local activities; current month always exists even when empty; history must not stop at one Supabase response page; notes remain optional; acknowledged/historical plants remain readable; global label stays `Hành trình` while the detail page says `Câu chuyện của`
- Risks: the linked-environment two-plant running-session release smoke from the previous milestone is still outstanding; the authenticated QA account had no previous-month data, so populated archive visuals are covered by deterministic component fixtures/tests while the real browser verified the empty archive state
- Blockers: none
- Next smallest step: run the authenticated two-plant start/resume conflict smoke against the linked environment
