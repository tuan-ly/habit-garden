-- Function to update moisture daily (run by cron)
CREATE OR REPLACE FUNCTION update_daily_moisture()
RETURNS void AS $$
BEGIN
  -- Update moisture for all growing plants
  UPDATE plants p
  SET 
    current_moisture = GREATEST(0, current_moisture - pt.moisture_decay_rate),
    updated_at = NOW()
  FROM plant_types pt
  WHERE p.plant_type_id = pt.id
    AND p.status = 'growing'
    AND (p.last_watered_at IS NULL OR p.last_watered_at::date < CURRENT_DATE);
  
  -- Mark dead plants
  UPDATE plants
  SET 
    status = 'dead',
    died_at = NOW(),
    death_reason = 'No water'
  WHERE current_moisture <= 0 
    AND status = 'growing';
END;
$$ LANGUAGE plpgsql;

-- Function to calculate growth percentage
CREATE OR REPLACE FUNCTION calculate_growth(plant_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  p RECORD;
  pt RECORD;
  days_elapsed INTEGER;
  waterings_required INTEGER;
  growth DECIMAL;
BEGIN
  SELECT * INTO p FROM plants WHERE id = plant_id;
  SELECT * INTO pt FROM plant_types WHERE id = p.plant_type_id;
  
  days_elapsed := EXTRACT(DAY FROM NOW() - p.started_at);
  
  -- Calculate based on frequency type
  IF pt.frequency_type = 'daily' THEN
    growth := (p.total_waterings::DECIMAL / pt.maturity_days) * 100;
  ELSE
    waterings_required := (pt.maturity_days / 7) * pt.frequency_target;
    growth := (p.total_waterings::DECIMAL / waterings_required) * 100;
  END IF;
  
  RETURN LEAST(growth, 100);
END;
$$ LANGUAGE plpgsql;

-- Function to water a plant
CREATE OR REPLACE FUNCTION water_plant(
  p_plant_id UUID,
  p_user_id UUID,
  p_difficulty TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_plant RECORD;
  v_plant_type RECORD;
  v_xp_earned INTEGER := 10;
  v_is_morning BOOLEAN;
  v_streak_bonus INTEGER := 0;
  v_new_streak INTEGER;
  v_new_moisture INTEGER;
  v_new_growth DECIMAL;
BEGIN
  -- Get plant and type info
  SELECT * INTO v_plant FROM plants WHERE id = p_plant_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plant not found');
  END IF;
  
  SELECT * INTO v_plant_type FROM plant_types WHERE id = v_plant.plant_type_id;
  
  -- Check if already watered today
  IF v_plant.last_watered_at IS NOT NULL AND v_plant.last_watered_at::date = CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already watered today');
  END IF;
  
  -- Calculate bonuses
  v_is_morning := EXTRACT(HOUR FROM NOW()) < 9;
  IF v_is_morning THEN
    v_xp_earned := v_xp_earned + 5;
  END IF;
  
  -- Calculate streak
  IF v_plant.last_watered_at IS NOT NULL AND v_plant.last_watered_at::date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_plant.current_streak + 1;
    v_streak_bonus := LEAST(v_new_streak, 10); -- Max 10 bonus XP
    v_xp_earned := v_xp_earned + v_streak_bonus;
  ELSE
    v_new_streak := 1;
  END IF;
  
  -- Calculate new moisture
  v_new_moisture := LEAST(100, v_plant.current_moisture + v_plant_type.moisture_boost);
  
  -- Calculate new growth
  v_new_growth := ((v_plant.total_waterings + 1)::DECIMAL / v_plant_type.maturity_days) * 100;
  v_new_growth := LEAST(v_new_growth, 100);
  
  -- Update plant
  UPDATE plants SET
    current_moisture = v_new_moisture,
    growth_percentage = v_new_growth,
    total_waterings = total_waterings + 1,
    current_streak = v_new_streak,
    longest_streak = GREATEST(longest_streak, v_new_streak),
    last_watered_at = NOW(),
    status = CASE WHEN v_new_growth >= 100 THEN 'mature' ELSE status END,
    matured_at = CASE WHEN v_new_growth >= 100 AND matured_at IS NULL THEN NOW() ELSE matured_at END,
    updated_at = NOW()
  WHERE id = p_plant_id;
  
  -- Insert watering log
  INSERT INTO watering_logs (plant_id, user_id, difficulty, notes, xp_earned, morning_bonus, streak_bonus)
  VALUES (p_plant_id, p_user_id, p_difficulty, p_notes, v_xp_earned, v_is_morning, v_streak_bonus);
  
  -- Update user XP
  UPDATE profiles SET
    xp = xp + v_xp_earned,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'xp_earned', v_xp_earned,
    'new_streak', v_new_streak,
    'new_moisture', v_new_moisture,
    'new_growth', v_new_growth,
    'morning_bonus', v_is_morning
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
