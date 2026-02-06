# Phase 03: UI Components

## Overview
Add tier badge and slot limit indicator components.

## New Components

### 1. TierBadge (`src/components/ui/tier-badge.tsx`)
- Display tier stars (1-5)
- Color-coded by tier
- Tooltip with tier name

### 2. SlotIndicator (`src/components/garden/slot-indicator.tsx`)
- Show X/Y plants used
- Progress bar style
- Warning when near limit

## Modified Components

### AddPlantDialog (`src/components/plants/add-plant-dialog.tsx`)
- Filter plant types by unlocked tiers
- Show locked tiers with unlock requirements
- Check slot limit before allowing creation
- Show tier badge on plant cards

## Implementation Steps

1. Create TierBadge component
2. Create SlotIndicator component
3. Update AddPlantDialog to filter by tier
4. Add slot limit check to plant creation

## Files to Create
- `src/components/ui/tier-badge.tsx`
- `src/components/garden/slot-indicator.tsx`

## Files to Modify
- `src/components/plants/add-plant-dialog.tsx`
