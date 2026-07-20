-- Add growth_blocked column to plants table
-- This tracks when a plant wants to grow but is blocked by neighboring plants

ALTER TABLE plants 
ADD COLUMN IF NOT EXISTS growth_blocked BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN plants.growth_blocked IS 'True if plant is ready to expand (grow larger grid size) but blocked by neighboring plants';;
