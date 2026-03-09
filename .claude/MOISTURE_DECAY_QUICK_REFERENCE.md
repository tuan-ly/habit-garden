# Moisture Decay - Quick Reference

## Status at a Glance

| Aspect | Status |
|--------|--------|
| **Overall** | ✅ Working (Fixed 2026-03-03) |
| **Cron Job** | ✅ Active (17:00 UTC daily) |
| **Function** | ✅ All statuses included |
| **Weather Dependency** | ✅ Removed (no blocking issues) |

## What Happens Daily

```
Cron (17:00 UTC/00:00 VN) → update_daily_moisture()
  ↓
Loop each plant where status IN (growing, thriving, resting, waiting, sleeping)
  ↓
IF watered TODAY (user's timezone) → SKIP
ELSE → moisture -= decay_rate
  ↓
IF moisture ≤ 0 → mark dead (death_reason='drought')
ELSE → update current_moisture
```

## Why Plants Might Not Decay

| Scenario | Status | Action |
|----------|--------|--------|
| Plant in 'thriving' status | ✅ Now included | Already fixed |
| Plant already watered today | ✅ Intentional | Wait until tomorrow |
| Plant status is 'mature' or 'dead' | ✅ By design | Not applicable |
| User timezone not set | ✅ Defaults to VN | Check profile |
| Moisture already 0 | ✅ By design | Plant is dead |

## Key Files

- **Migration**: `supabase/migrations/20260303_fix_moisture_decay_all_statuses.sql`
- **UI**: `src/components/plants/moisture-bar.tsx`
- **Types**: `src/types/supabase.ts` (Function definitions)
- **Previous Fix**: `supabase/migrations/20260219_fix_moisture_decay.sql` (weather removal)

## Debug Queries

**Check if plant should decay today:**
```sql
SELECT p.name, p.status, p.current_moisture, 
       p.last_watered_at, pt.moisture_decay_rate
FROM plants p
JOIN plant_types pt ON p.plant_type_id = pt.id
WHERE p.id = '{plant_id}';
```

**Check user's effective timezone:**
```sql
SELECT id, timezone, COALESCE(timezone, 'Asia/Ho_Chi_Minh') as effective
FROM profiles
WHERE id = '{user_id}';
```

## Recent Changes

### 2026-03-03 (LATEST)
- Added: `thriving`, `resting`, `waiting`, `sleeping` statuses to filter
- Fixed: Plants not decaying after activity logging

### 2026-02-19
- Removed: `daily_weather` table dependency
- Fixed: Cron job failures from missing table

## Troubleshooting

**Issue**: Plants not decaying  
**Check 1**: Verify status is in `(growing, thriving, resting, waiting, sleeping)`  
**Check 2**: Did they get watered today (in their timezone)?  
**Check 3**: Is timezone set in profile?  
**Check 4**: Run cron manually via Supabase dashboard

**Issue**: Cron job failing  
**Check**: Supabase → SQL Editor → Cron Jobs → view execution logs

**Issue**: Inconsistent decay  
**Check**: Timezone mismatch between user and server  
**Fix**: Update `profiles.timezone` to user's actual timezone
