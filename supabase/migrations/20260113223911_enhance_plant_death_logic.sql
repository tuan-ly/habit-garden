-- Enhanced update_daily_moisture function with better death handling
CREATE OR REPLACE FUNCTION update_daily_moisture()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weather_moisture_mod INTEGER := 0;
BEGIN
  -- Get today's weather modifier if exists
  SELECT COALESCE(moisture_modifier, 0) INTO weather_moisture_mod
  FROM daily_weather
  WHERE date = CURRENT_DATE;

  -- Decrease moisture for plants that haven't been watered today
  UPDATE plants p
  SET 
    current_moisture = GREATEST(0, current_moisture - pt.moisture_decay_rate + weather_moisture_mod),
    updated_at = NOW()
  FROM plant_types pt
  WHERE p.plant_type_id = pt.id
    AND p.status = 'growing'
    AND (p.last_watered_at IS NULL OR p.last_watered_at::date < CURRENT_DATE);
  
  -- Kill plants that have reached 0 moisture
  UPDATE plants
  SET 
    status = 'dead',
    died_at = NOW(),
    death_reason = 'drought',
    current_streak = 0
  WHERE current_moisture <= 0 
    AND status = 'growing';
END;
$$;

-- Function to get plant health status
CREATE OR REPLACE FUNCTION get_plant_health(p_moisture INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_moisture <= 0 THEN
    RETURN 'dead';
  ELSIF p_moisture <= 20 THEN
    RETURN 'critical';
  ELSIF p_moisture <= 40 THEN
    RETURN 'wilting';
  ELSIF p_moisture <= 60 THEN
    RETURN 'thirsty';
  ELSIF p_moisture <= 80 THEN
    RETURN 'healthy';
  ELSE
    RETURN 'thriving';
  END IF;
END;
$$;

-- Function to revive a dead plant (costs water reserves)
CREATE OR REPLACE FUNCTION revive_plant(p_plant_id UUID, p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plant RECORD;
  v_profile RECORD;
  v_revive_cost INTEGER := 3; -- Costs 3 water reserves to revive
BEGIN
  -- Get plant
  SELECT * INTO v_plant FROM plants WHERE id = p_plant_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plant not found');
  END IF;
  
  -- Check if plant is dead
  IF v_plant.status != 'dead' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plant is not dead');
  END IF;
  
  -- Check if died too long ago (can only revive within 24 hours)
  IF v_plant.died_at < NOW() - INTERVAL '24 hours' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Too late to revive (24 hour limit)');
  END IF;
  
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  -- Check water reserves
  IF v_profile.water_reserves < v_revive_cost THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Not enough water reserves',
      'required', v_revive_cost,
      'available', v_profile.water_reserves
    );
  END IF;
  
  -- Revive the plant
  UPDATE plants
  SET 
    status = 'growing',
    current_moisture = 50, -- Revive at 50% moisture
    died_at = NULL,
    death_reason = NULL,
    updated_at = NOW()
  WHERE id = p_plant_id;
  
  -- Deduct water reserves
  UPDATE profiles
  SET 
    water_reserves = water_reserves - v_revive_cost,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Plant revived!',
    'new_moisture', 50,
    'water_reserves_used', v_revive_cost
  );
END;
$$;;
