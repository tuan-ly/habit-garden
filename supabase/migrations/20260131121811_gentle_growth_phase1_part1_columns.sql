-- Part 1: Add columns to plants and goals tables

-- =====================================================
-- 1. UPDATE PLANTS TABLE - Gentle Growth Fields
-- =====================================================

ALTER TABLE plants ADD COLUMN IF NOT EXISTS why_i_started TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS maturity_level INTEGER DEFAULT 1;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS visual_stage TEXT DEFAULT 'seed';
ALTER TABLE plants ADD COLUMN IF NOT EXISTS rest_days_allowed INTEGER DEFAULT 2;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7;
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

ALTER TABLE goals ADD COLUMN IF NOT EXISTS season_number INTEGER DEFAULT 1;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS season_name TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS season_status TEXT DEFAULT 'active';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS days_active INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS rest_days_used INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS end_reflection TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- Add constraint for season_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goals_season_status_check'
  ) THEN
    ALTER TABLE goals ADD CONSTRAINT goals_season_status_check
    CHECK (season_status IN ('active', 'completed', 'ended'));
  END IF;
END $$;;
