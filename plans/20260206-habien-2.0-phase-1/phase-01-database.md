# Phase 01: Database Schema Changes

## Overview
Add tier system fields to plant_types and progressive disclosure fields to profiles.

## Changes

### 1. plant_types table
```sql
ALTER TABLE plant_types ADD COLUMN tier INTEGER DEFAULT 1;
ALTER TABLE plant_types ADD COLUMN tier_unlock_level INTEGER DEFAULT 1;
```

### 2. profiles table
```sql
ALTER TABLE profiles ADD COLUMN max_plants INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN unlocked_tiers INTEGER[] DEFAULT '{1}';
ALTER TABLE profiles ADD COLUMN phase TEXT DEFAULT 'seedling';
ALTER TABLE profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN total_mature_plants INTEGER DEFAULT 0;
```

### 3. Seed tier data
Based on existing difficulty mapping:
- Tier 1 (easy): Forgiving Friends - 3-14 day tolerance
- Tier 2 (medium): Reliable Partners - 2-4 day tolerance
- Tier 3 (hard): Demanding Beauties - 1-2 day tolerance

## Implementation Steps

1. Create Supabase migration file
2. Update TypeScript types in `database.ts`
3. Seed existing plant_types with tiers
4. Migrate existing profiles with calculated values

## Files to Modify
- `src/types/database.ts` - Add new fields to types
- Supabase migration (via dashboard or CLI)
