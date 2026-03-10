# Moisture Decay Investigation Report

**Date**: 2026-03-07
**Supabase Project ID**: `jkhkfsfjnilbfqfatonb` (primary, us-east-1)
**Alternative Project ID**: `nokkicjusrucrpnnbzlg` (habien-v3, ap-southeast-1)

---

## Executive Summary

The moisture decay system has been **actively maintained and fixed multiple times**. The latest fix (2026-03-03) corrected a critical issue where **plants with `status='thriving'` were not receiving moisture decay** because the Supabase function only processed `status='growing'`.

**Status**: ✅ **FIXED** (as of 2026-03-03)

---

## Root Cause Analysis

### Issue #1: Incomplete Plant Status Filtering (2026-02-19)
**Status**: ✅ Fixed

**Problem**:
- Initial `update_daily_moisture()` function only processed plants where `status = 'growing'`
- However, `activity.ts` (log_activity) sets status to `'thriving'` on successful activity logging
- Result: Plants in `thriving`, `resting`, `waiting`, or `sleeping` status were never receiving decay updates

**Original Code** (2026-02-19):
```sql
WHERE p.status = 'growing'
```

**Current Code** (2026-03-03):
```sql
WHERE p.status IN ('growing', 'thriving', 'resting', 'waiting', 'sleeping')
```

### Issue #2: Missing Weather Table Dependency (2026-02-19)
**Status**: ✅ Fixed

**Problem**:
- Early version tried to join with `daily_weather` table
- Table didn't exist → cron job failed
- No weather modifier was actually needed for basic decay

**Solution**:
- Removed `daily_weather` dependency
- Simplified to just use `moisture_decay_rate` from `plant_types`

---

## Current Function Definition

**Location**: `supabase/migrations/20260303_fix_moisture_decay_all_statuses.sql`

### Function: `update_daily_moisture()`

```sql
CREATE OR REPLACE FUNCTION public.update_daily_moisture()
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  v_plant RECORD;
  v_user_tz TEXT;
  v_user_local_date DATE;
  v_new_moisture INTEGER;
BEGIN
  -- Loop through all LIVING plants (not dead, not mature)
  -- Must include all gentle-growth statuses: growing, thriving, resting, waiting, sleeping
  FOR v_plant IN
    SELECT
      p.id,
      p.user_id,
      p.name,
      p.current_moisture,
      p.last_watered_at,
      p.status,
      pt.moisture_decay_rate,
      COALESCE(pr.timezone, 'Asia/Ho_Chi_Minh') as user_timezone
    FROM plants p
    JOIN plant_types pt ON p.plant_type_id = pt.id
    LEFT JOIN profiles pr ON p.user_id = pr.id
    WHERE p.status IN ('growing', 'thriving', 'resting', 'waiting', 'sleeping')
  LOOP
    -- Get user's local date
    v_user_tz := v_plant.user_timezone;
    v_user_local_date := (NOW() AT TIME ZONE v_user_tz)::date;

    -- Skip if plant was watered today (in user's timezone)
    IF v_plant.last_watered_at IS NOT NULL AND
       (v_plant.last_watered_at AT TIME ZONE v_user_tz)::date >= v_user_local_date THEN
      CONTINUE;
    END IF;

    -- Calculate new moisture
    v_new_moisture := GREATEST(0, v_plant.current_moisture - v_plant.moisture_decay_rate);

    -- Update moisture or mark as dead
    IF v_new_moisture <= 0 THEN
      UPDATE plants
      SET
        current_moisture = 0,
        status = 'dead',
        died_at = NOW(),
        death_reason = 'drought',
        current_streak = 0,
        updated_at = NOW()
      WHERE id = v_plant.id;
    ELSE
      UPDATE plants
      SET
        current_moisture = v_new_moisture,
        updated_at = NOW()
      WHERE id = v_plant.id;
    END IF;
  END LOOP;
END;
$function$;
```

### Key Logic

1. **Status Filter**: Processes plants in: `growing`, `thriving`, `resting`, `waiting`, `sleeping`
2. **Timezone Awareness**: Uses user's timezone to determine "today"
3. **Daily Skip**: If plant watered today (in user's timezone), skip decay
4. **Moisture Calculation**: `current_moisture - moisture_decay_rate` (minimum 0)
5. **Death Handling**: When moisture ≤ 0, set status to `dead` with `death_reason='drought'`

---

## Related Functions

### Function: `trigger_moisture_decay()`

```sql
-- Location: src/types/supabase.ts
trigger_moisture_decay: { Args: Record<PropertyKey, never>; Returns: Json }
```

**Purpose**: Alternative trigger for manual moisture decay (not used in current implementation)

---

## Cron Job Schedule

### Schedule Definition

**Cron Expression**: Daily at **17:00 UTC** (equivalent to **00:00 Asia/Ho_Chi_Minh**)

This is configured in **Supabase dashboard** under:
- **SQL Editor** → **Cron Jobs** section
- Job name: `update_daily_moisture`
- Function: `public.update_daily_moisture()`

### Next Execution

Runs automatically every 24 hours at scheduled time.

---

## Why Only Some Plants Decay?

### Common Reasons

1. **Plant Status Mismatch** ✅ Fixed (2026-03-03)
   - If plant status is `mature` or `dead`, it's excluded from decay
   - If plant status is NOT in `[growing, thriving, resting, waiting, sleeping]`, excluded

2. **Already Watered Today**
   - If `last_watered_at` date (in user's timezone) is today, decay is skipped
   - This is intentional behavior - watered plants shouldn't decay same day

3. **Moisture Already at 0**
   - If `current_moisture = 0` and plant is marked `dead`, no further decay

4. **Timezone Mismatch**
   - If user timezone is not set, defaults to `Asia/Ho_Chi_Minh`
   - Verify timezone in `profiles.timezone` column

### How to Debug

**Query to check plant status**:
```sql
SELECT
  p.id,
  p.name,
  p.status,
  p.current_moisture,
  p.last_watered_at,
  pr.timezone,
  pt.moisture_decay_rate,
  COALESCE(pr.timezone, 'Asia/Ho_Chi_Minh') as effective_timezone
FROM plants p
JOIN plant_types pt ON p.plant_type_id = pt.id
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.status NOT IN ('dead', 'mature')
ORDER BY p.updated_at DESC
LIMIT 20;
```

**Expected behavior**: Moisture should decrease by `moisture_decay_rate` each day unless watered

---

## Related Code

### Server-Side Calls

**File**: `src/lib/actions/plants.ts`

Currently, the function is **NOT called from Next.js code**. Instead:
- Supabase cron job runs independently on schedule
- Function is available for RPC calls if needed

### Client-Side Impact

**Moisture display components**:
- `src/components/plants/moisture-bar.tsx` - Visual representation
- `src/components/garden/plant-tooltip.tsx` - Hover info
- Refreshes on page load via `getPlants()`

---

## Migration History

| Date | File | Issue | Solution |
|------|------|-------|----------|
| 2026-02-19 | `20260219_fix_moisture_decay.sql` | Cron failed: missing `daily_weather` table | Removed weather dependency |
| 2026-03-03 | `20260303_fix_moisture_decay_all_statuses.sql` | `thriving` status plants skipped | Added all gentle-growth statuses |

---

## Verification Steps

### 1. Check Function Status
```sql
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_daily_moisture'
AND routine_schema = 'public';
```

### 2. Check Recent Cron Executions
- Supabase Dashboard → **SQL Editor** → **Cron Jobs** → click job → view execution history

### 3. Verify Plant Decay
```sql
SELECT
  p.name,
  p.status,
  p.current_moisture,
  p.updated_at,
  pt.moisture_decay_rate
FROM plants p
JOIN plant_types pt ON p.plant_type_id = pt.id
WHERE p.user_id = '{user_id}'
AND p.status IN ('growing', 'thriving', 'resting', 'waiting', 'sleeping')
ORDER BY p.updated_at DESC
LIMIT 10;
```

---

## Next Actions

1. **Monitor**: Check Supabase dashboard for cron execution history over next 7 days
2. **Test**: Create test plant and verify moisture decreases daily
3. **Document**: If issues persist, check:
   - Supabase function logs
   - Cron job execution status
   - User timezone configuration
4. **Consider**: Add manual trigger endpoint if automatic cron needs backup

---

## Notes

- **Both Supabase Projects**: Primary (jkhkfsfjnilbfqfatonb) and v3 (nokkicjusrucrpnnbzlg) should have same function
- **Branch**: Feature branch `feature/ux-improvements-v3` is active
- **Latest Commit**: cd33b19 includes welcome back system and onboarding redesign
