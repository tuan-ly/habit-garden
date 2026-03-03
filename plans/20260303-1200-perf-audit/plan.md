# Performance & Quality Improvement Plan

> **Date**: 2026-03-03
> **Branch**: `feature/habien-3.0`
> **Source**: Code audit of server actions, contexts, and components

## Scope

17 findings across 4 priority tiers. Plan targets measurable improvements: fewer DB round-trips, faster page loads, and one security fix.

## Phases

| # | Phase | Priority | Est. Effort | Status |
|---|-------|----------|-------------|--------|
| 1 | Critical Fixes (Security + N+1) | CRITICAL | 2-3h | Pending |
| 2 | Auth Dedup + SSR Data Fetching | HIGH | 2-3h | Pending |
| 3 | Query Optimization (indexes, select, parallel) | MEDIUM | 2h | Pending |
| 4 | Component Refactor + Context Cleanup | LOW-MED | 3-4h | Pending |

## Expected Impact

- **Phase 1**: Closes auth bypass; getUserGoals drops from ~3N+1 queries to 2; growWeeds from N+1 to 2
- **Phase 2**: ~74 redundant auth.getUser() calls deduped via React.cache(); 2 unnecessary client fetches removed
- **Phase 3**: ~30% less data transferred (select columns); composite indexes speed up activity_logs/goals queries
- **Phase 4**: Better maintainability; no stale closure bugs in WeedsContext

## Ordering Rationale

Phase 1 first because security hole + worst DB perf. Phase 2 next as it's high-impact with low risk. Phase 3 is safe DB-only changes. Phase 4 last since it's refactoring with no user-facing urgency.

## Deferred (YAGNI)

- **Browser Supabase singleton** (#13): `createBrowserClient` from `@supabase/ssr` already deduplicates internally. No action needed.
- **Next.js image optimization** (#17): Only relevant if serving user-uploaded images at scale. Plant PNGs are static assets. Skip for now.
- **Prop drilling** (#15): React Compiler (already enabled) handles memo optimization. Refactoring to context adds complexity without measurable gain.
- **Large component splits** (#14): Only split if actively causing merge conflicts or if adding features to those files. Not urgent.

## Files

- [phase-01-critical-fixes.md](./phase-01-critical-fixes.md)
- [phase-02-auth-data-fetching.md](./phase-02-auth-data-fetching.md)
- [phase-03-query-optimization.md](./phase-03-query-optimization.md)
- [phase-04-component-refactor.md](./phase-04-component-refactor.md)
