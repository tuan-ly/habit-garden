-- Part 2: Create unique index and new tables

-- Unique constraint for plant + season combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_plant_season
ON goals(plant_id, season_number);

-- =====================================================
-- 3. CREATE ACTIVITY_LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  season_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL DEFAULT 'watering',
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  logged_date DATE DEFAULT CURRENT_DATE,
  value NUMERIC,
  notes TEXT,
  difficulty TEXT,
  is_first_of_day BOOLEAN DEFAULT FALSE,
  xp_earned INTEGER DEFAULT 0,
  morning_bonus BOOLEAN DEFAULT FALSE,
  streak_bonus INTEGER DEFAULT 0,
  is_personal_record BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT activity_logs_type_check
  CHECK (activity_type IN ('watering', 'progress', 'rest_day', 'reflection'))
);

CREATE INDEX IF NOT EXISTS idx_activity_plant ON activity_logs(plant_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_logs(logged_date);
CREATE INDEX IF NOT EXISTS idx_activity_plant_date ON activity_logs(plant_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_logs(activity_type);

-- =====================================================
-- 4. CREATE REST_DAYS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS rest_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rest_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plant_id, rest_date)
);

CREATE INDEX IF NOT EXISTS idx_rest_days_plant ON rest_days(plant_id);
CREATE INDEX IF NOT EXISTS idx_rest_days_date ON rest_days(rest_date);
CREATE INDEX IF NOT EXISTS idx_rest_days_user ON rest_days(user_id);

-- =====================================================
-- 5. CREATE REFLECTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  milestone_value INTEGER,
  life_changes TEXT[],
  personal_note TEXT,
  mood TEXT,
  total_value_at_reflection NUMERIC,
  days_active_at_reflection INTEGER,
  season_number_at_reflection INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT reflections_milestone_check
  CHECK (milestone_type IN ('days_30', 'days_100', 'season_complete', 'year_1', 'custom'))
);

CREATE INDEX IF NOT EXISTS idx_reflections_plant ON reflections(plant_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_milestone ON reflections(milestone_type);;
