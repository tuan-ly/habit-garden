# Concerns — Habit Garden

**Mapped:** 2026-04-28

## Known Bugs

| Issue | Severity | Location |
|-------|----------|----------|
| `optimizeGridLayout()` is a no-op (TODO) | Low | Garden grid |
| Paddle `resolveUserId` calls `getUserById(email)` — wrong API method | Medium | `src/lib/actions/paddle.ts` |
| `goals.best_streak` never updated | Low | `src/lib/actions/goals.ts` |
| `activity_logs.difficulty` column never populated | Low | `src/lib/actions/activity.ts` |
| XP morning bonus inconsistency: constants says 3, system says 5 | Low | `xp-constants.ts` vs `xp-system.ts` |
| `noDeathDays` achievement check not implemented | Low | Tier requirements |

## Technical Debt

| Debt | Impact | Location |
|------|--------|----------|
| `watering_logs` dual-written alongside `activity_logs` (legacy) | Wasted writes | `activity.ts` |
| `weeds.ts` kept for DB compat — dead feature | Confusion | `src/lib/actions/weeds.ts` |
| `QuickLogModal` archived but file may still exist | Clutter | Components |
| `energy_logs` table still exists (legacy, replaced by `mood_logs`) | DB clutter | Supabase |
| SSR data fetching missing for `InventoryProvider` (uses `initialCoins=0`) | UX flash | Dashboard layout |
| Plant images: 6 of 42 PNGs exist (emoji fallback) | Visual quality | `public/plants/` |
| Decoration/material images: ~30+ PNGs missing | Visual quality | `public/` |

## Roadmap-Only Config Flags (No Implementation)

These exist in `subscription-limits.ts` but have ZERO backend code:

- `hasWeeklyReports`, `backfillDays`, `hasAds`, `offlineDays`
- `devices`, `aiSuggestions`, `earlyAccess`, `prioritySupport`

**Risk:** UI could accidentally reference these as "active features."

## Removed Code (2026-04-28 Cleanup)

- `special-effects.tsx` — deleted (zero imports)
- `water-reserves.ts` + `water-reserves.tsx` — deleted (zero imports, DB column unused)
- `cemetery-view.tsx` — deleted (never routed)
- Money Tree references removed from source (DB record may persist)

## Security Considerations

- All tables have RLS policies
- Auth uses `getAuthUser()` cached wrapper consistently (68 direct calls replaced)
- Paddle webhook signature verification implemented
- No SQL injection vectors (all through Supabase client)
- No XSS vectors identified (React handles escaping)
- **Missing:** Rate limiting on server actions
- **Missing:** Input validation on some server actions (relies on TypeScript)

## Performance Considerations

- Garden virtualization: only visible tiles render (2-tile buffer)
- `React.cache()` deduplicates auth per request
- Sequential queries replaced with `Promise.all` in stats
- **Potential issue:** Large gardens (12+ grid) may have render performance concerns
- **No caching:** No Redis/CDN caching layer
- **No image optimization:** Using `public/` static files, not Next.js Image optimization for plant PNGs

## Fragile Areas

| Area | Why Fragile | Last Incident |
|------|-------------|---------------|
| Plant status system | Two competing status systems (DB cron vs client) | 2026-03-03: 3 root cause bugs |
| Moisture decay cron | Depends on Supabase cron + backup Next.js route | 2026-02-19: query failed silently |
| Provider ordering | Wrong order breaks contexts | Documented in rules |
| Subscription gating | Spread across many components | — |
