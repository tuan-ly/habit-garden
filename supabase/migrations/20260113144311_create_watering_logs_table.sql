-- Create watering_logs table
CREATE TABLE watering_logs (
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
ON watering_logs(plant_id, watered_date);;
