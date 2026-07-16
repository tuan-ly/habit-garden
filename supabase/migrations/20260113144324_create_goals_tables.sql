-- Create goals table
CREATE TABLE goals (
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

-- Create goal_logs table
CREATE TABLE goal_logs (
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

-- Create goal_adjustments table
CREATE TABLE goal_adjustments (
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

CREATE INDEX idx_adjustments_goal ON goal_adjustments(goal_id);;
