-- Fix moisture decay function: include all living plant statuses
-- Bug: function only processed status='growing', missing 'thriving'/'resting'/'waiting'/'sleeping'
-- When users log activity (activity.ts), plant status changes to 'thriving' → never got decay

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
    v_user_tz := v_plant.user_timezone;
    v_user_local_date := (NOW() AT TIME ZONE v_user_tz)::date;

    IF v_plant.last_watered_at IS NOT NULL AND
       (v_plant.last_watered_at AT TIME ZONE v_user_tz)::date >= v_user_local_date THEN
      CONTINUE;
    END IF;

    v_new_moisture := GREATEST(0, v_plant.current_moisture - v_plant.moisture_decay_rate);

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
$function$;;
