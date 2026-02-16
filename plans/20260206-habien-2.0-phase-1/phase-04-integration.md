# Phase 04: Integration & Validation

## Overview
Integrate tier system into existing flows and validate functionality.

## Integration Points

### 1. Plant Creation Flow
- Validate tier before allowing plant creation
- Validate slot limit before allowing plant creation
- Return appropriate error messages

### 2. Profile Updates
- Update `total_mature_plants` when plant matures
- Update `longest_streak` on watering
- Recalculate `max_plants` and `unlocked_tiers` on level up

### 3. Garden Display
- Show tier badge on plant cards
- Show slot indicator in garden toolbar

## Implementation Steps

1. Update `createPlant` to validate tier and slots
2. Update `waterPlant` to sync profile stats
3. Add tier badge to plant visual components
4. Add slot indicator to garden toolbar

## Files to Modify
- `src/lib/actions/plants.ts`
- `src/components/plants/plant-visual.tsx` (if exists)
- `src/components/garden/mode-toolbar.tsx`

## Testing
- [ ] Create plant with full slots (should fail)
- [ ] Create plant with locked tier (should fail)
- [ ] Level up and verify new slots/tiers unlock
- [ ] Verify tier badge displays correctly
