-- Habien 2.0 Phase 1: Progressive Disclosure Foundation
-- Adds tier system for plants and slot limits by level

-- =====================================================
-- 1. Add tier columns to plant_types
-- =====================================================

-- Add tier column (1-5)
ALTER TABLE plant_types ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1;

-- Add tier unlock level
ALTER TABLE plant_types ADD COLUMN IF NOT EXISTS tier_unlock_level INTEGER DEFAULT 1;

-- =====================================================
-- 2. Add progressive disclosure fields to profiles
-- =====================================================

-- Max plants allowed (based on level)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS max_plants INTEGER DEFAULT 1;

-- Array of unlocked tiers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unlocked_tiers INTEGER[] DEFAULT '{1}';

-- User phase: seedling, gardener, sage
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'seedling';

-- Track longest streak across all plants (for tier unlock)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- Track total mature plants (for tier unlock)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_mature_plants INTEGER DEFAULT 0;

-- =====================================================
-- 3. Seed plant_types with tier data based on difficulty
-- =====================================================

-- Tier 1 (Easy): Forgiving Friends
UPDATE plant_types SET tier = 1, tier_unlock_level = 1 WHERE difficulty = 'easy';

-- Tier 2 (Medium): Reliable Partners
UPDATE plant_types SET tier = 2, tier_unlock_level = 7 WHERE difficulty = 'medium';

-- Tier 3 (Hard): Demanding Beauties
UPDATE plant_types SET tier = 3, tier_unlock_level = 10 WHERE difficulty = 'hard';

-- =====================================================
-- 4. Migrate existing profiles with calculated values
-- =====================================================

-- Update max_plants based on current level
UPDATE profiles SET
  max_plants = CASE
    WHEN level >= 15 THEN 999
    WHEN level >= 12 THEN 5
    WHEN level >= 9 THEN 4
    WHEN level >= 6 THEN 3
    WHEN level >= 4 THEN 2
    ELSE 1
  END;

-- Update unlocked_tiers based on level (simplified - just level check)
UPDATE profiles SET
  unlocked_tiers = CASE
    WHEN level >= 18 THEN '{1,2,3,4,5}'::INTEGER[]
    WHEN level >= 14 THEN '{1,2,3,4}'::INTEGER[]
    WHEN level >= 10 THEN '{1,2,3}'::INTEGER[]
    WHEN level >= 7 THEN '{1,2}'::INTEGER[]
    ELSE '{1}'::INTEGER[]
  END;

-- Update phase based on level
UPDATE profiles SET
  phase = CASE
    WHEN level >= 13 THEN 'sage'
    WHEN level >= 6 THEN 'gardener'
    ELSE 'seedling'
  END;

-- Calculate longest_streak from existing plant data
UPDATE profiles p SET
  longest_streak = COALESCE((
    SELECT MAX(longest_streak)
    FROM plants
    WHERE user_id = p.id
  ), 0);

-- Calculate total_mature_plants from existing plant data
UPDATE profiles p SET
  total_mature_plants = COALESCE((
    SELECT COUNT(*)
    FROM plants
    WHERE user_id = p.id AND status = 'mature'
  ), 0);

-- =====================================================
-- 5. Add constraints
-- =====================================================

-- Ensure tier is between 1 and 5
ALTER TABLE plant_types ADD CONSTRAINT plant_types_tier_check
  CHECK (tier >= 1 AND tier <= 5);

-- Ensure tier_unlock_level is positive
ALTER TABLE plant_types ADD CONSTRAINT plant_types_tier_unlock_level_check
  CHECK (tier_unlock_level >= 1);

-- Ensure phase is valid
ALTER TABLE profiles ADD CONSTRAINT profiles_phase_check
  CHECK (phase IN ('seedling', 'gardener', 'sage'));

-- =====================================================
-- 6. Create index for tier filtering
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_plant_types_tier ON plant_types(tier);
