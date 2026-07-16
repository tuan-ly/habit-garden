-- Add Easy Mode (Tiny Seed) fields to plants table
ALTER TABLE plants
  ADD COLUMN IF NOT EXISTS easy_mode BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiny_seed TEXT;

-- Index for querying easy_mode plants
CREATE INDEX IF NOT EXISTS idx_plants_easy_mode ON plants(user_id, easy_mode) WHERE easy_mode = true;

COMMENT ON COLUMN plants.easy_mode IS 'Whether user enabled 2-minute rule for this habit';
COMMENT ON COLUMN plants.tiny_seed IS 'The 2-minute version of the habit (e.g., "Read 1 page" for "Read books")';
