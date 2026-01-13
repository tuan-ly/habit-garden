# 02 - DATABASE SCHEMA

## Overview

Database sử dụng Supabase (PostgreSQL). Thiết kế theo nguyên tắc:
- Normalized để tránh duplicate data
- Proper indexes cho performance
- RLS (Row Level Security) cho bảo mật

## Tables

### profiles
Extends Supabase auth.users với thông tin bổ sung.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  water_reserves INTEGER DEFAULT 2,
  timezone TEXT DEFAULT 'Asia/Ho_Chi_Minh',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1));
  RETURN NEW;
END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
plant_types
Định nghĩa các loại cây với đặc tính riêng.

CopyCREATE TABLE plant_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  description_vi TEXT,
  
  -- Growth settings
  maturity_days INTEGER NOT NULL,
  frequency_type TEXT NOT NULL DEFAULT 'daily',
  frequency_target INTEGER DEFAULT 7,
  
  -- Moisture settings
  moisture_decay_rate INTEGER DEFAULT 15,
  moisture_boost INTEGER DEFAULT 20,
  
  -- Special effects (JSON)
  special_effect JSONB,
  
  -- Categorization
  category TEXT,
  difficulty TEXT DEFAULT 'medium',
  is_premium BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plant types
INSERT INTO plant_types (id, name, name_vi, icon, maturity_days, frequency_type, moisture_decay_rate, special_effect, category, difficulty) VALUES
('grass', 'Grass', 'Cỏ', '🌱', 21, 'daily', 20, NULL, 'basic', 'easy'),
('flower', 'Flower', 'Hoa', '🌸', 45, 'daily', 15, NULL, 'basic', 'easy'),
('vegetable', 'Vegetable', 'Rau', '🥬', 60, 'daily', 15, NULL, 'basic', 'medium'),
('bush', 'Bush', 'Bụi cây', '🌿', 90, 'flexible', 12, NULL, 'basic', 'medium'),
('fruit_tree', 'Fruit Tree', 'Cây ăn quả', '🍎', 180, 'flexible', 10, NULL, 'basic', 'hard'),
('tree', 'Tree', 'Cây thân gỗ', '🌳', 365, 'flexible', 8, NULL, 'basic', 'hard'),

-- Special plants
('bamboo', 'Bamboo', 'Tre', '🎋', 180, 'daily', 12, 
  '{"type": "delayed_growth", "hidden_until": 80, "burst_at": 80}', 
  'special', 'hard'),
('sunflower', 'Sunflower', 'Hướng dương', '🌻', 60, 'daily', 15,
  '{"type": "buff_others", "buff_percentage": 5}',
  'special', 'medium'),
('cherry_blossom', 'Cherry Blossom', 'Anh đào', '🌸', 30, 'daily', 18,
  '{"type": "cycle", "cycle_days": 30, "bloom_days": 7}',
  'special', 'medium'),
('cactus', 'Cactus', 'Xương rồng', '🌵', 90, 'flexible', 5,
  '{"type": "drought_resistant", "decay_multiplier": 0.33}',
  'special', 'easy'),
('lotus', 'Lotus', 'Sen', '🌺', 90, 'daily', 15,
  '{"type": "difficulty_bonus", "hard_day_bonus": 10}',
  'special', 'medium'),
('banyan', 'Banyan', 'Cây đa', '🌳', 365, 'flexible', 8,
  '{"type": "spawn_children", "child_at": 100}',
  'special', 'hard'),
('mushroom', 'Mushroom', 'Nấm', '🍄', 45, 'daily', 15,
  '{"type": "hidden_progress"}',
  'special', 'medium'),
('pine', 'Pine', 'Thông', '🎄', 365, 'flexible', 8,
  '{"type": "immortal_after_mature"}',
  'special', 'hard');
plants
Cây của người dùng.

CopyCREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plant_type_id TEXT REFERENCES plant_types(id) NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  habit_description TEXT,
  
  -- Progress tracking
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_moisture INTEGER DEFAULT 100,
  growth_percentage DECIMAL DEFAULT 0,
  total_waterings INTEGER DEFAULT 0,
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_watered_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'growing',
  matured_at TIMESTAMPTZ,
  died_at TIMESTAMPTZ,
  death_reason TEXT,
  
  -- Goal mode (NULL = simple habit, not NULL = has goal)
  goal_mode TEXT,
  
  -- Settings
  reminder_time TIME,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  adaptive_mode TEXT DEFAULT 'suggest',
  
  -- Metadata
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_plants_user ON plants(user_id);
CREATE INDEX idx_plants_status ON plants(status);
CREATE INDEX idx_plants_user_status ON plants(user_id, status);
watering_logs
Lịch sử tưới nước (check-in).

CopyCREATE TABLE watering_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  watered_at TIMESTAMPTZ DEFAULT NOW(),
  watered_date DATE DEFAULT CURRENT_DATE,
  
  -- Metadata
  difficulty TEXT,
  notes TEXT,
  
  -- XP earned
  xp_earned INTEGER DEFAULT 10,
  morning_bonus BOOLEAN DEFAULT FALSE,
  streak_bonus INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_watering_plant ON watering_logs(plant_id);
CREATE INDEX idx_watering_date ON watering_logs(watered_date);
CREATE INDEX idx_watering_plant_date ON watering_logs(plant_id, watered_date);

-- Unique constraint: one watering per plant per day
CREATE UNIQUE INDEX idx_watering_unique_daily 
ON watering_logs(plant_id, watered_date);
goals
Goal tracking cho numbered habits.

CopyCREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  
  -- Goal settings
  goal_mode TEXT NOT NULL,
  tracking_metric TEXT NOT NULL,
  unit TEXT NOT NULL,
  
  -- Values
  start_value DECIMAL,
  target_value DECIMAL NOT NULL,
  current_value DECIMAL DEFAULT 0,
  initial_amount DECIMAL DEFAULT 0,
  
  -- Timeline
  duration_weeks INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  target_date TIMESTAMPTZ,
  
  -- Progression
  progression_type TEXT DEFAULT 'linear',
  step_size INTEGER DEFAULT 5,
  weekly_targets JSONB,
  
  -- Adaptive settings
  adaptive_mode TEXT DEFAULT 'suggest',
  last_adjusted_at TIMESTAMPTZ,
  adjustment_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_plant ON goals(plant_id);
goal_logs
Log số liệu cho goals.

CopyCREATE TABLE goal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  
  value DECIMAL NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  logged_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  
  week_number INTEGER,
  weekly_target DECIMAL,
  
  is_personal_record BOOLEAN DEFAULT FALSE,
  exceeded_target BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goal_logs_goal ON goal_logs(goal_id);
CREATE INDEX idx_goal_logs_date ON goal_logs(logged_date);
goal_adjustments
Lịch sử điều chỉnh adaptive goals.

CopyCREATE TABLE goal_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE NOT NULL,
  
  adjustment_type TEXT NOT NULL,
  
  old_value JSONB,
  new_value JSONB,
  
  trigger_reason TEXT,
  performance_data JSONB,
  
  suggested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  response TEXT,
  
  auto_applied BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_adjustments_goal ON goal_adjustments(goal_id);
daily_weather
Thời tiết ngẫu nhiên mỗi ngày.

CopyCREATE TABLE daily_weather (
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

$$ LANGUAGE plpgsql;
achievements
Danh sách achievements.

CopyCREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  description TEXT,
  description_vi TEXT,
  icon TEXT NOT NULL,
  
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER,
  requirement_data JSONB,
  
  xp_reward INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO achievements (id, name, name_vi, icon, requirement_type, requirement_value, xp_reward) VALUES
('first_plant', 'First Seed', 'Hạt giống đầu tiên', '🌱', 'plants_created', 1, 10),
('first_mature', 'First Harvest', 'Thu hoạch đầu tiên', '🌳', 'plants_matured', 1, 100),
('five_mature', 'Gardener', 'Người làm vườn', '👨‍🌾', 'plants_matured', 5, 200),
('streak_7', 'Week Warrior', 'Chiến binh 7 ngày', '🔥', 'streak', 7, 50),
('streak_30', 'Month Master', 'Bậc thầy 30 ngày', '💪', 'streak', 30, 200),
('streak_100', 'Century Legend', 'Huyền thoại 100', '👑', 'streak', 100, 500),
('morning_bird', 'Early Bird', 'Chim sớm', '🌅', 'morning_waterings', 10, 50),
('recovery', 'Phoenix', 'Phượng hoàng', '🔄', 'recovered_plants', 1, 100),
('bamboo_master', 'Bamboo Master', 'Bậc thầy tre', '🎋', 'bamboo_matured', 1, 300);
user_achievements
Achievements đã đạt được.

CopyCREATE TABLE user_achievements (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
Row Level Security (RLS)
Copy-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE watering_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Plants policies
CREATE POLICY "Users can view own plants"
  ON plants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plants"
  ON plants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plants"
  ON plants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plants"
  ON plants FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for other tables...
Database Functions
Copy-- Function to update moisture daily (run by cron)
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