
-- Update update_daily_moisture to use each user's timezone
-- This ensures plants are evaluated based on the user's local midnight

CREATE OR REPLACE FUNCTION update_daily_moisture()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  weather_moisture_mod INTEGER := 0;
  v_plant RECORD;
  user_local_date DATE;
  user_tz TEXT;
BEGIN
  -- Process plants per user to respect their timezone
  FOR v_plant IN 
    SELECT 
      p.id,
      p.user_id,
      p.name,
      p.current_moisture,
      p.last_watered_at,
      p.current_streak,
      p.status,
      pt.moisture_decay_rate,
      COALESCE(pr.timezone, 'Asia/Ho_Chi_Minh') as user_timezone
    FROM plants p
    JOIN plant_types pt ON p.plant_type_id = pt.id
    LEFT JOIN profiles pr ON p.user_id = pr.id
    WHERE p.status = 'growing'
  LOOP
    -- Get user's local date
    user_tz := v_plant.user_timezone;
    user_local_date := (NOW() AT TIME ZONE user_tz)::date;
    
    -- Check if plant was watered today in user's timezone
    IF v_plant.last_watered_at IS NOT NULL AND 
       (v_plant.last_watered_at AT TIME ZONE user_tz)::date >= user_local_date THEN
      -- Plant was watered today (user's time), skip decay
      CONTINUE;
    END IF;
    
    -- Get weather modifier for user's local date
    SELECT COALESCE(moisture_modifier, 0) INTO weather_moisture_mod
    FROM daily_weather
    WHERE date = user_local_date;
    
    -- If no weather found, use default (0)
    IF weather_moisture_mod IS NULL THEN
      weather_moisture_mod := 0;
    END IF;
    
    -- Calculate new moisture
    DECLARE
      new_moisture INTEGER;
      decay_rate INTEGER := COALESCE(v_plant.moisture_decay_rate, 10);
    BEGIN
      new_moisture := GREATEST(0, v_plant.current_moisture - decay_rate + weather_moisture_mod);
      
      -- Check if plant should die
      IF new_moisture <= 0 THEN
        -- Kill the plant
        UPDATE plants
        SET 
          current_moisture = 0,
          status = 'dead',
          died_at = NOW(),
          death_reason = 'drought',
          current_streak = 0,
          updated_at = NOW()
        WHERE id = v_plant.id;
        
        -- Send death notification
        PERFORM create_notification(
          v_plant.user_id,
          'plant_died',
          v_plant.name || ' has died',
          v_plant.name || ' đã chết',
          'Your plant died from lack of water. You can revive it within 24 hours using water reserves.',
          'Cây của bạn đã chết vì thiếu nước. Bạn có thể hồi sinh nó trong vòng 24 giờ bằng dự trữ nước.',
          jsonb_build_object('plant_id', v_plant.id)
        );
      ELSE
        -- Just decay moisture
        UPDATE plants
        SET 
          current_moisture = new_moisture,
          updated_at = NOW()
        WHERE id = v_plant.id;
        
        -- Send critical notification if moisture is low
        IF new_moisture <= 20 THEN
          PERFORM create_notification(
            v_plant.user_id,
            'plant_critical',
            v_plant.name || ' needs water urgently!',
            v_plant.name || ' cần được tưới nước gấp!',
            'Your plant is at ' || new_moisture || '% moisture and will die soon without water.',
            'Cây của bạn chỉ còn ' || new_moisture || '% độ ẩm và sẽ chết sớm nếu không được tưới nước.',
            jsonb_build_object('plant_id', v_plant.id, 'moisture', new_moisture)
          );
        END IF;
      END IF;
    END;
  END LOOP;
END;
$$;

-- Add comment explaining the timezone logic
COMMENT ON FUNCTION update_daily_moisture IS 
'Decay moisture for plants not watered today, using each user''s timezone.
Called by pg_cron at 17:00 UTC (covers most timezones'' midnight).
Each plant is evaluated against its owner''s local date from profiles.timezone.
Default timezone: Asia/Ho_Chi_Minh (UTC+7).';
;
