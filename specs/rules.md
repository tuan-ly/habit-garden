# Habit Garden — Business Rules

> Rules that must NEVER be violated, regardless of feature changes.

---

## Core Rules

1. **Plant loss phải được xác nhận.** Cron có thể đặt cây thành `dead`, nhưng cây vẫn ở trên map cho đến khi chủ sở hữu chủ động nói lời tạm biệt; không xóa record lịch sử.
2. **No guilt mechanics.** Every message is warm, forward-looking. Never punish absence.
3. **Fun first.** If a feature isn't fun, it doesn't ship. Psychology serves fun, not the other way around.
4. **Never look cheap.** Missing features OK, ugly UI never OK.
5. **Free tier is genuinely useful.** 3 plants with full game mechanics. Upgrade = more, not unlock core.

## Auth Rules

- Always use `getAuthUser()` from `@/lib/auth-cached` — never call `auth.getUser()` directly
- Always check ownership before any write: verify `user.id === record.user_id`
- Never hardcode user IDs

## Database Rules

- Always enable RLS policies on new tables
- Never use `select('*')` — specify columns explicitly
- Check for errors on every query
- Use atomic PostgreSQL functions for financial operations (coins, inventory, crafting)
- Migration filenames: `YYYYMMDD_description.sql`

## Guided Capability Rules

- Mỗi cây có tối đa một row trong `plant_capability_assignments`; mỗi assignment trỏ tới một capability instance riêng, còn nhiều cây có thể chọn cùng capability type.
- `habit_sessions`, `daily_progress`, `goal_plans` và `growth_states` theo `habit_id` là nguồn sự thật riêng của cây đã assign; không dùng chung target hoặc log giữa hai cây.
- `habit_sessions.source_plant_id` chỉ giữ route context và side-effect một lần, không chia tách ownership của log.
- Không fan-out `record_activity_atomic` theo số cây được assign vì sẽ nhân đôi XP/coin và có thể làm bẩn goal riêng của cây.

## Status System Rules

- Valid living statuses: growing, thriving, resting, waiting, sleeping
- Terminal statuses: mature, dead (legacy), dormant (legacy)
- `dead` với `death_acknowledged_at = null` là pending loss: vẫn chiếm ô/slot và chỉ hiện Goodbye dialog.
- Filter cây hiển thị trên garden: `isVisibleInGarden(plant)`; không copy điều kiện status thủ công.
- Never use `status === 'growing'` alone — misses thriving/resting/waiting/sleeping
- `calculatePlantStatus()` is display-only, never writes to DB

## Economy Rules

- All coin/inventory operations MUST use atomic PostgreSQL RPCs
- Never allow negative coin balance
- Rebirth Stones (future): earned only, never purchased with real money
- Decorations can always be picked up (returned to inventory)

## Subscription Rules

- Core loop (plant, water, grow, XP, basic achievements) must be fully functional for free
- Never block core mechanics behind paywall
- Never create anxiety to sell (no countdown timers, no "pay to save dying plant")
- Upgrade prompts only at natural moments (hit limit, hit level cap, milestone)

## UI/Component Rules

- Prefer HTML5 Canvas for complex visuals
- Minimize DOM CSS/JS animations — performance first
- Dev components gated with DevDebugProvider, never in production paths
- Do not add UI for weed system (removed 2026-03)
- WeedsProvider was removed 2026-03-03 — do not re-add

## Special Effects Rules

- Plant-type CSS animations (glow, particles, petals) = pure visual decoration, NO backend enforcement
- Do NOT add badges or text that claim gameplay effects (e.g. "+10%", "🛡️ -30% decay") unless backend enforces them
- `moisture_decay_rate` is already per-plant-type in DB — this IS the drought resistance mechanic
- Special effect types in `database.ts` are roadmap definitions, not active features
- `special-effects.tsx` was removed (2026-04-28) — zero imports existed

## Removed / Deleted (2026-04-28 cleanup)

- `special-effects.tsx`: entire file deleted (zero imports anywhere in src/)
- `water-reserves.ts` + `water-reserves.tsx`: deleted (full system but zero imports, DB column unused)
- `cemetery-view.tsx`: deleted (complete component but never imported/routed)
- **Money Tree** plant type: all source references removed (CSS, image mapping, color configs). DB record may still exist — do not reference in new code.

## Deprecated / Do Not Touch

- `weeds.ts` action file: DB compat only, no new logic
- `QuickLogModal`: archived, do not restore
- `energy_logs` table: legacy, mood_logs is canonical
- `watering_logs`: legacy dual-write, activity_logs is canonical

## Roadmap-Only Flags (NOT implemented — no code behind them)

These exist in `subscription-limits.ts` as config values but have ZERO implementation:

- `hasWeeklyReports` — no page, no action, no email
- `backfillDays` — no UI, no retroactive watering action
- `hasAds` — no ad SDK, no ad components
- `offlineDays` — no service worker, no caching
- `devices` — no session tracking, no enforcement
- `aiSuggestions` — not even exposed in subscription context
- `earlyAccess` — no implementation
- `prioritySupport` — no implementation

Do NOT build UI that references these flags as "active features" until backend exists.
