-- Part 3: RLS Policies and Journal Tree

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
-- ADD JOURNAL TREE PLANT TYPE
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
) ON CONFLICT DO NOTHING;;
