-- Create daily_weather table
CREATE TABLE daily_weather (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE DEFAULT CURRENT_DATE,
  weather_type TEXT NOT NULL,
  growth_modifier INTEGER DEFAULT 0,
  moisture_modifier INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to generate daily weather
CREATE OR REPLACE FUNCTION generate_daily_weather()
RETURNS void AS $$
DECLARE
  weather_options TEXT[] := ARRAY['sunny', 'cloudy', 'rainy', 'stormy', 'rainbow'];
  weather_weights INTEGER[] := ARRAY[30, 30, 25, 10, 5];
  selected_weather TEXT;
  total_weight INTEGER := 100;
  random_num INTEGER;
  cumulative INTEGER := 0;
  i INTEGER;
BEGIN
  -- Check if today's weather exists
  IF EXISTS (SELECT 1 FROM daily_weather WHERE date = CURRENT_DATE) THEN
    RETURN;
  END IF;
  
  -- Weighted random selection
  random_num := floor(random() * total_weight);
  FOR i IN 1..array_length(weather_options, 1) LOOP
    cumulative := cumulative + weather_weights[i];
    IF random_num < cumulative THEN
      selected_weather := weather_options[i];
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert weather
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
$$ LANGUAGE plpgsql;;
