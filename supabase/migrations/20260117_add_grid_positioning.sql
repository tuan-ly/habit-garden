-- Migration: Add Grid Positioning Fields to Plants Table
-- Date: 2026-01-17
-- Purpose: Support multi-cell plants that can occupy multiple grid cells

-- Add new columns for grid positioning
ALTER TABLE plants
ADD COLUMN IF NOT EXISTS grid_size INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS grid_row INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS grid_col INTEGER NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN plants.grid_size IS 'Number of cells the plant occupies in one dimension (1=1x1, 2=2x2, 3=3x3, etc.)';
COMMENT ON COLUMN plants.grid_row IS 'Top-left row position of the plant in the garden grid';
COMMENT ON COLUMN plants.grid_col IS 'Top-left column position of the plant in the garden grid';

-- Create index for efficient grid queries
CREATE INDEX IF NOT EXISTS idx_plants_grid_position ON plants(user_id, grid_row, grid_col);

-- Note: The 'position' column is kept for backward compatibility but will be deprecated
-- New plants should use grid_row and grid_col instead
