CREATE OR REPLACE FUNCTION public.update_daily_moisture()
RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  v_plant RECORD;
  v_user_tz text;
  v_user_local_date date;
  v_new_moisture integer;
BEGIN
  FOR v_plant IN
    SELECT p.id, p.user_id, p.name, p.current_moisture, p.last_watered_at, p.status,
           pt.moisture_decay_rate,
           COALESCE(pr.timezone, 'Asia/Ho_Chi_Minh') as user_timezone
    FROM public.plants p
    JOIN public.plant_types pt ON p.plant_type_id = pt.id
    LEFT JOIN public.profiles pr ON p.user_id = pr.id
    WHERE p.status IN ('growing','thriving','resting','waiting','sleeping')
  LOOP
    v_user_tz := v_plant.user_timezone;
    v_user_local_date := (now() AT TIME ZONE v_user_tz)::date;

    IF v_plant.last_watered_at IS NOT NULL AND
       (v_plant.last_watered_at AT TIME ZONE v_user_tz)::date >= v_user_local_date THEN
      CONTINUE;
    END IF;

    v_new_moisture := GREATEST(0, v_plant.current_moisture - v_plant.moisture_decay_rate);

    IF v_new_moisture <= 0 THEN
      UPDATE public.plants
      SET current_moisture = 0, status = 'dead', died_at = now(),
          death_reason = 'drought', current_streak = 0, updated_at = now()
      WHERE id = v_plant.id;
    ELSE
      UPDATE public.plants
      SET current_moisture = v_new_moisture, updated_at = now()
      WHERE id = v_plant.id;
    END IF;
  END LOOP;
END; $$;;
