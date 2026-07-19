-- Gentle Growth Phase 1 Migration
-- Implements: activity_logs, rest_days, reflections + plant/goal updates

-- =====================================================
-- 1. UPDATE PLANTS TABLE - Gentle Growth Fields
-- =====================================================

-- Add "Why I Started" motivation field
ALTER TABLE plants ADD COLUMN IF NOT EXISTS why_i_started TEXT;

-- Add maturity tracking (1-10 scale)
ALTER TABLE plants ADD COLUMN IF NOT EXISTS maturity_level INTEGER DEFAULT 1;

-- Add visual stage for display
-- Stages: seed, sprout, growing, mature, established, ancient, legendary
ALTER TABLE plants ADD COLUMN IF NOT EXISTS visual_stage TEXT DEFAULT 'seed';

-- Rest day configuration per plant
ALTER TABLE plants ADD COLUMN IF NOT EXISTS rest_days_allowed INTEGER DEFAULT 2;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7;

-- Rhythm tracking (computed from activity_logs)
ALTER TABLE plants ADD COLUMN IF NOT EXISTS days_this_week INTEGER DEFAULT 0;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS days_this_month INTEGER DEFAULT 0;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS consistency_percentage NUMERIC DEFAULT 0;

-- Add constraint for visual_stage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plants_visual_stage_check'
  ) THEN
    ALTER TABLE plants ADD CONSTRAINT plants_visual_stage_check
    CHECK (visual_stage IN ('seed', 'sprout', 'growing', 'mature', 'established', 'ancient', 'legendary'));
  END IF;
END $$;

-- =====================================================
-- 2. UPDATE GOALS TABLE - Season Support
-- =====================================================

-- Season tracking
ALTER TABLE goals ADD COLUMN IF NOT EXISTS season_number INTEGER DEFAULT 1;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS season_name TEXT;

-- Season status: active, completed, ended
ALTER TABLE goals ADD COLUMN IF NOT EXISTS season_status TEXT DEFAULT 'active';

-- Season completion tracking
ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS days_active INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS rest_days_used INTEGER DEFAULT 0;

-- Reflection at season end
ALTER TABLE goals ADD COLUMN IF NOT EXISTS end_reflection TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- Unique constraint for plant + season combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_plant_season
ON goals(plant_id, season_number);

-- Add constraint for season_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_season_status_check'
  ) THEN
    ALTER TABLE goals ADD CONSTRAINT goals_season_status_check
    CHECK (season_status IN ('active', 'completed', 'ended'));
  END IF;
END $$;

-- =====================================================
-- 3. CREATE ACTIVITY_LOGS TABLE - Unified Logging
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  season_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Activity type: watering, progress, rest_day, reflection
  activity_type TEXT NOT NULL DEFAULT 'watering',

  -- Timing
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  logged_date DATE DEFAULT CURRENT_DATE,

  -- Data
  value NUMERIC,
  notes TEXT,
  difficulty TEXT,

  -- Flags
  is_first_of_day BOOLEAN DEFAULT FALSE,

  -- XP & rewards
  xp_earned INTEGER DEFAULT 0,
  morning_bonus BOOLEAN DEFAULT FALSE,
  streak_bonus INTEGER DEFAULT 0,
  is_personal_record BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint for activity_type
  CONSTRAINT activity_logs_type_check
  CHECK (activity_type IN ('watering', 'progress', 'rest_day', 'reflection'))
);

-- Indexes for activity_logs
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

-- Indexes for rest_days
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

  -- Milestone info
  milestone_type TEXT NOT NULL,
  milestone_value INTEGER,

  -- Reflection content
  life_changes TEXT[],
  personal_note TEXT,
  mood TEXT,

  -- Snapshot at reflection time
  total_value_at_reflection NUMERIC,
  days_active_at_reflection INTEGER,
  season_number_at_reflection INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint for milestone_type
  CONSTRAINT reflections_milestone_check
  CHECK (milestone_type IN ('days_30', 'days_100', 'season_complete', 'year_1', 'custom'))
);

-- Indexes for reflections
CREATE INDEX IF NOT EXISTS idx_reflections_plant ON reflections(plant_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_milestone ON reflections(milestone_type);

-- =====================================================
-- 6. ADD JOURNAL TREE PLANT TYPE
-- =====================================================

INSERT INTO plant_types (
  id, name, name_vi, icon, description, description_vi,
  maturity_days, frequency_type, frequency_target,
  moisture_decay_rate, moisture_boost,
  special_effect, category, difficulty, is_premium
) VALUES (
  gen_random_uuid(),
  'Journal Tree',
  'Cây Nhật Ký',
  '📔',
  'A special tree that grows with your thoughts and reflections',
  'Cây đặc biệt lớn lên cùng suy nghĩ và reflections của bạn',
  365,
  'flexible',
  1,
  5,
  100,
  '{"type": "journal_tree", "growth_per_entry": 0.1}'::jsonb,
  'special',
  'easy',
  false
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. DATA MIGRATION - Migrate existing data
-- =====================================================

-- Step 1: Update plants with gentle growth fields
UPDATE plants SET
  maturity_level = CASE
    WHEN growth_percentage >= 100 THEN 5
    WHEN growth_percentage >= 75 THEN 4
    WHEN growth_percentage >= 50 THEN 3
    WHEN growth_percentage >= 25 THEN 2
    ELSE 1
  END,
  visual_stage = CASE
    WHEN growth_percentage >= 100 THEN 'mature'
    WHEN growth_percentage >= 75 THEN 'growing'
    WHEN growth_percentage >= 50 THEN 'sprout'
    ELSE 'seed'
  END,
  why_i_started = COALESCE(why_i_started, habit_description)
WHERE why_i_started IS NULL OR maturity_level IS NULL;

-- Step 2: Set season_number = 1 for existing goals
UPDATE goals SET
  season_number = COALESCE(season_number, 1),
  season_name = COALESCE(season_name, name || ' (Season 1)'),
  season_status = CASE
    WHEN current_value >= target_value THEN 'completed'
    ELSE 'active'
  END
WHERE season_number IS NULL;

-- Step 3: Migrate watering_logs to activity_logs
INSERT INTO activity_logs (
  plant_id, user_id, activity_type, logged_at, logged_date,
  notes, xp_earned, morning_bonus, is_first_of_day, difficulty
)
SELECT
  plant_id, user_id, 'watering', watered_at, watered_date,
  notes, xp_earned, morning_bonus, is_first_of_day, difficulty
FROM watering_logs
WHERE NOT EXISTS (
  SELECT 1 FROM activity_logs al
  WHERE al.plant_id = watering_logs.plant_id
  AND al.logged_date = watering_logs.watered_date
  AND al.activity_type = 'watering'
);

-- Step 4: Migrate goal_logs to activity_logs
INSERT INTO activity_logs (
  plant_id, season_id, user_id, activity_type, logged_at, logged_date,
  value, notes, xp_earned, is_personal_record
)
SELECT
  gl.plant_id, gl.goal_id, gl.user_id, 'progress', gl.logged_at, gl.logged_date,
  gl.value, gl.notes, gl.xp_earned, gl.is_personal_record
FROM goal_logs gl
WHERE NOT EXISTS (
  SELECT 1 FROM activity_logs al
  WHERE al.plant_id = gl.plant_id
  AND al.logged_date = gl.logged_date
  AND al.activity_type = 'progress'
  AND al.value = gl.value
);

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rest_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Activity logs policies
CREATE POLICY "Users can view their own activity logs"
ON activity_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
ON activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity logs"
ON activity_logs FOR UPDATE
USING (auth.uid() = user_id);

-- Rest days policies
CREATE POLICY "Users can view their own rest days"
ON rest_days FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rest days"
ON rest_days FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rest days"
ON rest_days FOR DELETE
USING (auth.uid() = user_id);

-- Reflections policies
CREATE POLICY "Users can view their own reflections"
ON reflections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reflections"
ON reflections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections"
ON reflections FOR UPDATE
USING (auth.uid() = user_id);

-- =====================================================
-- DONE
-- =====================================================
