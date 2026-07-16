-- Habien 2.0 Phase 6: Identity System
-- Creates identities table and links goals to identities (PREMIUM feature)

-- =====================================================
-- 1. Create identities table
-- =====================================================

CREATE TABLE IF NOT EXISTS identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT 'purple',
  status TEXT DEFAULT 'active',
  progress_percentage NUMERIC DEFAULT 0,
  goals_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name),
  CONSTRAINT valid_identity_status CHECK (status IN ('active', 'achieved', 'paused')),
  CONSTRAINT valid_identity_color CHECK (color IN ('purple', 'blue', 'green', 'amber', 'rose', 'cyan', 'pink', 'orange'))
);

COMMENT ON TABLE identities IS 'User identities for grouping goals (PREMIUM feature)';
COMMENT ON COLUMN identities.name IS 'Identity name, e.g., Reader, Athlete';
COMMENT ON COLUMN identities.progress_percentage IS 'Average progress of all linked goals';

-- =====================================================
-- 2. Add identity_id to goals table
-- =====================================================

ALTER TABLE goals ADD COLUMN IF NOT EXISTS identity_id UUID REFERENCES identities(id) ON DELETE SET NULL;

COMMENT ON COLUMN goals.identity_id IS 'Optional link to identity (PREMIUM feature)';

-- =====================================================
-- 3. Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_identities_user ON identities(user_id);
CREATE INDEX IF NOT EXISTS idx_identities_user_status ON identities(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_identity ON goals(identity_id) WHERE identity_id IS NOT NULL;

-- =====================================================
-- 4. Enable RLS on identities table
-- =====================================================

ALTER TABLE identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own identities"
ON identities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own identities"
ON identities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own identities"
ON identities FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own identities"
ON identities FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- 5. Function to update identity progress
-- =====================================================

CREATE OR REPLACE FUNCTION update_identity_progress(identity_uuid UUID)
RETURNS void AS $$
DECLARE
  avg_progress NUMERIC;
  goal_count INTEGER;
BEGIN
  SELECT
    COALESCE(AVG(
      CASE
        WHEN target_value > 0 THEN (current_value / target_value * 100)
        ELSE 0
      END
    ), 0),
    COUNT(*)
  INTO avg_progress, goal_count
  FROM goals
  WHERE identity_id = identity_uuid
    AND season_status = 'active';

  UPDATE identities
  SET
    progress_percentage = LEAST(avg_progress, 100),
    goals_count = goal_count,
    updated_at = NOW()
  WHERE id = identity_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_identity_progress IS 'Recalculates identity progress based on linked goals';

-- =====================================================
-- 6. Trigger to update identity progress when goal changes
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_update_identity_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD IS NOT NULL AND OLD.identity_id IS NOT NULL THEN
    PERFORM update_identity_progress(OLD.identity_id);
  END IF;

  IF NEW IS NOT NULL AND NEW.identity_id IS NOT NULL THEN
    PERFORM update_identity_progress(NEW.identity_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_goal_identity_progress ON goals;
CREATE TRIGGER trigger_goal_identity_progress
AFTER INSERT OR UPDATE OR DELETE ON goals
FOR EACH ROW
EXECUTE FUNCTION trigger_update_identity_progress();;
