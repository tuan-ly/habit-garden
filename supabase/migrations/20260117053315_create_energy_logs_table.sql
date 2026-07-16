-- Energy Logs table for tracking daily energy levels
-- Energy affects goal target adjustments (not XP bonuses)

CREATE TABLE IF NOT EXISTS public.energy_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  energy_level smallint NOT NULL CHECK (energy_level BETWEEN 1 AND 4),
  -- 1 = Empty (rest day), 2 = Low, 3 = Medium, 4 = Full
  note text,
  set_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  -- One entry per user per day
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see/modify their own energy logs
CREATE POLICY "Users can view own energy logs"
  ON public.energy_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own energy logs"
  ON public.energy_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own energy logs"
  ON public.energy_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_energy_logs_user_date 
  ON public.energy_logs(user_id, date DESC);

-- Comment for documentation
COMMENT ON TABLE public.energy_logs IS 'Daily energy tracking - affects goal target adjustments';
COMMENT ON COLUMN public.energy_logs.energy_level IS '1=Empty (rest), 2=Low, 3=Medium, 4=Full';;
