
-- Fix timezone issue in update_daily_moisture function
-- Use Vietnam timezone (UTC+7) for date comparison

CREATE OR REPLACE FUNCTION update_daily_moisture()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  weather_moisture_mod INTEGER := 0;
  v_plant RECORD;
  vn_date DATE;
BEGIN
  -- Get current date in Vietnam timezone (UTC+7)
  vn_date := (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  
  -- Get today's weather modifier if exists
  SELECT COALESCE(moisture_modifier, 0) INTO weather_moisture_mod
  FROM daily_weather
  WHERE date = vn_date;

  -- Decrease moisture for plants that haven't been watered today (Vietnam time)
  -- Compare last_watered_at converted to VN timezone with current VN date
  UPDATE plants p
  SET 
    current_moisture = GREATEST(0, current_moisture - pt.moisture_decay_rate + weather_moisture_mod),
    updated_at = NOW()
  FROM plant_types pt
  WHERE p.plant_type_id = pt.id
    AND p.status = 'growing'
    AND (
      p.last_watered_at IS NULL 
      OR (p.last_watered_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date < vn_date
    );
  
  -- Send notifications for critical plants (moisture <= 20)
  FOR v_plant IN 
    SELECT p.id, p.user_id, p.name, p.current_moisture
    FROM plants p
    WHERE p.status = 'growing' AND p.current_moisture <= 20 AND p.current_moisture > 0
  LOOP
    PERFORM create_notification(
      v_plant.user_id,
      'plant_critical',
      v_plant.name || ' needs water urgently!',
      v_plant.name || ' cần được tưới nước gấp!',
      'Your plant is at ' || v_plant.current_moisture || '% moisture and will die soon without water.',
      'Cây của bạn chỉ còn ' || v_plant.current_moisture || '% độ ẩm và sẽ chết sớm nếu không được tưới nước.',
      jsonb_build_object('plant_id', v_plant.id, 'moisture', v_plant.current_moisture)
    );
  END LOOP;
  
  -- Kill plants that have reached 0 moisture and send notifications
  FOR v_plant IN 
    SELECT p.id, p.user_id, p.name
    FROM plants p
    WHERE p.current_moisture <= 0 AND p.status = 'growing'
  LOOP
    -- Update plant status
    UPDATE plants
    SET 
      status = 'dead',
      died_at = NOW(),
      death_reason = 'drought',
      current_streak = 0
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
  END LOOP;
END;
$$;

-- Add comment explaining the timezone logic
COMMENT ON FUNCTION update_daily_moisture IS 
'Decay moisture for plants not watered today (Vietnam timezone). 
Called by pg_cron at 17:00 UTC = 00:00 VN.
Uses Asia/Ho_Chi_Minh timezone for date comparison to ensure 
users have until midnight VN time to water their plants.';
;
