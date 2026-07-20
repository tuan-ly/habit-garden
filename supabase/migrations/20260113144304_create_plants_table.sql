-- Create plants table
CREATE TABLE plants (
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
CREATE INDEX idx_plants_user_status ON plants(user_id, status);;
