# Habit Garden — Codebase Cleanup Plan
**Created**: 2026-04-19 | **Project**: habit-garden | **Lead**: @coder

## Status Legend
`🔴 CRITICAL` `🟠 HIGH` `🟡 MEDIUM` `🔵 LOW` | `⬜ TODO` `🔄 IN PROGRESS` `✅ DONE`

---

## Phases

| # | Name | Risk | Status | File |
|---|------|------|--------|------|
| 01 | DB Emergency | 🔴 | ⬜ | [phase-01-db-emergency.md](phase-01-db-emergency.md) |
| 02 | Security Hardening | 🔴 | ⬜ | [phase-02-security-hardening.md](phase-02-security-hardening.md) |
| 03 | Status System Correctness | 🔴 | ⬜ | [phase-03-status-system.md](phase-03-status-system.md) |
| 04 | Economy Atomicity | 🟠 | ⬜ | [phase-04-economy-atomicity.md](phase-04-economy-atomicity.md) |
| 05 | RLS Performance | 🟠 | ⬜ | [phase-05-rls-performance.md](phase-05-rls-performance.md) |
| 06 | Component Performance | 🟠 | ⬜ | [phase-06-component-perf.md](phase-06-component-perf.md) |
| 07 | Hook/Context Correctness | 🟠 | ⬜ | [phase-07-hook-context.md](phase-07-hook-context.md) |
| 08 | DRY + Cleanup | 🟡 | ⬜ | [phase-08-dry-cleanup.md](phase-08-dry-cleanup.md) |
| 09 | Polish & A11y | 🔵 | ⬜ | [phase-09-polish-a11y.md](phase-09-polish-a11y.md) |

---

## Critical Path
**01 → 02 → 03** must complete before any feature work. 04 depends on 01. 05 can run in parallel with 03–04. 06–09 are independent.

## Scope Summary
- **🔴 8 critical bugs** — 2 DB gaps, 1 IDOR, 1 race, 2 fire-and-forget, 2 status reducer bugs
- **🟠 ~30 high issues** — non-atomic economy, 14 select(*), 8 SECURITY DEFINER gaps, 5 DOM perf, 6 hook bugs
- **🟡 ~8 medium** — duplication, archived files, orphan modules
- **🔵 ~6 low** — switch gaps, a11y, stale data

## Key Files (Rules Context)
- `.claude/rules/actions.md` — auth, ownership, query rules
- `.claude/rules/database.md` — migration format, table list, RLS rules
- `.claude/rules/plants-status.md` — valid statuses, flow, filter patterns
- `.claude/rules/components.md` — component map, perf rules, archived list

## Execution Order Rationale
Phases 01–03 unblock prod stability. Phase 04 prevents data corruption in economy. Phase 05 is pure DB-side, no UI risk. Phases 06–07 are UI-only, safe to parallelize after 01–03. Phase 08 is refactor only — run last to reduce merge conflicts.
