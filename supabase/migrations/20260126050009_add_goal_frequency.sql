-- Migration: Add Goal Frequency Fields
-- Date: 2026-01-26
-- Purpose: Support daily/weekly/monthly goal tracking frequencies

-- Add frequency columns to goals table
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS frequency_target INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS period_start_day INTEGER NOT NULL DEFAULT 1;

-- Add comments for documentation
COMMENT ON COLUMN goals.frequency IS 'Goal tracking frequency: daily, weekly, or monthly';
COMMENT ON COLUMN goals.frequency_target IS 'Number of times to complete the goal within the frequency period';
COMMENT ON COLUMN goals.period_start_day IS 'Start day of week (1=Monday) or month (1-31) for weekly/monthly goals';

-- Add check constraint for valid frequency values
ALTER TABLE goals
ADD CONSTRAINT goals_frequency_check CHECK (frequency IN ('daily', 'weekly', 'monthly'));

-- Create index for efficient frequency-based queries
CREATE INDEX IF NOT EXISTS idx_goals_frequency ON goals(frequency);;
