-- Enable RLS on public lookup tables and add read policies
ALTER TABLE plant_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can read plant_types (reference data)
CREATE POLICY "Anyone can read plant types"
  ON plant_types FOR SELECT
  USING (true);

-- Everyone can read daily_weather
CREATE POLICY "Anyone can read daily weather"
  ON daily_weather FOR SELECT
  USING (true);

-- Everyone can read achievements (reference data)
CREATE POLICY "Anyone can read achievements"
  ON achievements FOR SELECT
  USING (true);

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION generate_daily_weather()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  weather_options TEXT[] := ARRAY['sunny', 'cloudy', 'rainy', 'stormy', 'rainbow'];
  weather_weights INTEGER[] := ARRAY[30, 30, 25, 10, 5];
  selected_weather TEXT;
  total_weight INTEGER := 100;
  random_num INTEGER;
  cumulative INTEGER := 0;
  i INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM daily_weather WHERE date = CURRENT_DATE) THEN
    RETURN;
  END IF;
  
  random_num := floor(random() * total_weight);
  FOR i IN 1..array_length(weather_options, 1) LOOP
    cumulative := cumulative + weather_weights[i];
    IF random_num < cumulative THEN
      selected_weather := weather_options[i];
      EXIT;
    END IF;
  END LOOP;
  
  INSERT INTO daily_weather (date, weather_type, growth_modifier, moisture_modifier)
  VALUES (
    CURRENT_DATE,
    selected_weather,
    CASE selected_weather
      WHEN 'sunny' THEN 5
      WHEN 'cloudy' THEN 0
      WHEN 'rainy' THEN 0
      WHEN 'stormy' THEN -5
      WHEN 'rainbow' THEN 10
    END,
    CASE selected_weather
      WHEN 'sunny' THEN -5
      WHEN 'cloudy' THEN 0
      WHEN 'rainy' THEN 10
      WHEN 'stormy' THEN -10
      WHEN 'rainbow' THEN 5
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION update_daily_moisture()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE plants p
  SET 
    current_moisture = GREATEST(0, current_moisture - pt.moisture_decay_rate),
    updated_at = NOW()
  FROM plant_types pt
  WHERE p.plant_type_id = pt.id
    AND p.status = 'growing'
    AND (p.last_watered_at IS NULL OR p.last_watered_at::date < CURRENT_DATE);
  
  UPDATE plants
  SET 
    status = 'dead',
    died_at = NOW(),
    death_reason = 'No water'
  WHERE current_moisture <= 0 
    AND status = 'growing';
END;
$$;

CREATE OR REPLACE FUNCTION calculate_growth(plant_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SET search_path = public
AS $$
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
  
  IF pt.frequency_type = 'daily' THEN
    growth := (p.total_waterings::DECIMAL / pt.maturity_days) * 100;
  ELSE
    waterings_required := (pt.maturity_days / 7) * pt.frequency_target;
    growth := (p.total_waterings::DECIMAL / waterings_required) * 100;
  END IF;
  
  RETURN LEAST(growth, 100);
END;
$$;

CREATE OR REPLACE FUNCTION water_plant(
  p_plant_id UUID,
  p_user_id UUID,
  p_difficulty TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  SELECT * INTO v_plant FROM plants WHERE id = p_plant_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plant not found');
  END IF;
  
  SELECT * INTO v_plant_type FROM plant_types WHERE id = v_plant.plant_type_id;
  
  IF v_plant.last_watered_at IS NOT NULL AND v_plant.last_watered_at::date = CURRENT_DATE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already watered today');
  END IF;
  
  v_is_morning := EXTRACT(HOUR FROM NOW()) < 9;
  IF v_is_morning THEN
    v_xp_earned := v_xp_earned + 5;
  END IF;
  
  IF v_plant.last_watered_at IS NOT NULL AND v_plant.last_watered_at::date = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_plant.current_streak + 1;
    v_streak_bonus := LEAST(v_new_streak, 10);
    v_xp_earned := v_xp_earned + v_streak_bonus;
  ELSE
    v_new_streak := 1;
  END IF;
  
  v_new_moisture := LEAST(100, v_plant.current_moisture + v_plant_type.moisture_boost);
  
  v_new_growth := ((v_plant.total_waterings + 1)::DECIMAL / v_plant_type.maturity_days) * 100;
  v_new_growth := LEAST(v_new_growth, 100);
  
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
  
  INSERT INTO watering_logs (plant_id, user_id, difficulty, notes, xp_earned, morning_bonus, streak_bonus)
  VALUES (p_plant_id, p_user_id, p_difficulty, p_notes, v_xp_earned, v_is_morning, v_streak_bonus);
  
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
$$;;
