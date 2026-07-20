-- Create mood_logs table for tracking daily mood/weather
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_level SMALLINT NOT NULL CHECK (mood_level >= 1 AND mood_level <= 5),
  note TEXT,
  set_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One mood entry per user per day
  CONSTRAINT unique_user_mood_per_day UNIQUE (user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date ON mood_logs(user_id, date DESC);

-- Enable RLS
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own mood logs
CREATE POLICY "Users can view own mood logs"
  ON mood_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood logs"
  ON mood_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood logs"
  ON mood_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood logs"
  ON mood_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE mood_logs IS 'Tracks daily user mood using weather metaphors (Sunny=5, Stormy=1). Used for XP bonuses on tough days.';;
