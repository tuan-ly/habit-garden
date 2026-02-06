# Phase 2: Garden Expansion System

> **Status**: PLANNED
> **Depends On**: Phase 1 (DONE)
> **Estimated Effort**: 3-4 days

---

## Context

Phase 1 implemented tier system and slot limits. Users can now have limited plants based on level. However, the garden visually looks the same at Level 1 and Level 15.

**Problem**: No visual feedback for progression. Garden always uses dynamic grid size based on plant positions.

**Solution**: Garden size tied to level. Small garden grows into large estate.

---

## Overview

### Feature 1: Garden Size by Level

```
Level 1-5:   3x3  (9 tiles)   - Seedling's patch
Level 6-8:   5x5  (25 tiles)  - Gardener's plot
Level 9-11:  7x7  (49 tiles)  - Growing estate
Level 12+:   Dynamic          - Full garden (current behavior)
```

### Feature 2: Decoration Unlocks

```
Level 1:   Basic (bushes, rocks)
Level 5:   Mushrooms, flower patches
Level 8:   Lanterns (night glow effect)
Level 10:  Garden fence/border decorations
Level 12:  Ponds/water features
Level 15:  Custom themes
```

### Feature 3: Celebration Animations

- Level-up modal with unlock preview
- Unlock notification toasts
- Garden expansion animation (tiles ripple outward)
- Decoration reveal effects

---

## Requirements

### Functional

1. Garden grid enforces minimum size based on user level
2. Grid can still expand beyond minimum if plants require space
3. Decorations filtered by user's unlocked set
4. Level-up triggers modal showing new unlocks
5. Expansion animates smoothly (not jarring jump)

### Non-Functional

1. No performance regression on large gardens
2. Works on mobile (touch devices)
3. Decorations render performantly (SVG, not images)

---

## Architecture

### Data Model Changes

```typescript
// Profile additions (database.ts)
interface Profile {
  // ... existing fields
  garden_size: number          // Current garden grid size
  unlocked_decorations: string[] // ['bush', 'rock', 'mushroom', ...]
  active_theme: string         // 'default' | 'autumn' | 'winter' | ...
}
```

### New Functions (progression-system.ts)

```typescript
// Get minimum garden size for level
function getGardenSize(level: number): number {
  if (level >= 12) return 0  // Dynamic (no minimum)
  if (level >= 9) return 7   // 7x7
  if (level >= 6) return 5   // 5x5
  return 3                   // 3x3
}

// Get decorations unlocked at level
function getUnlockedDecorations(level: number): string[] {
  const decos = ['bush', 'rock']
  if (level >= 5) decos.push('mushroom', 'flower-patch')
  if (level >= 8) decos.push('lantern')
  if (level >= 10) decos.push('fence-post', 'fence-corner')
  if (level >= 12) decos.push('pond', 'fountain')
  return decos
}

// Check what unlocks at a specific level
function getLevelUnlocks(level: number): LevelUnlock[] {
  const unlocks: LevelUnlock[] = []

  // Garden size upgrades
  if (level === 6) unlocks.push({ type: 'garden', name: '5x5 Garden', icon: '🏡' })
  if (level === 9) unlocks.push({ type: 'garden', name: '7x7 Garden', icon: '🏘️' })
  if (level === 12) unlocks.push({ type: 'garden', name: 'Unlimited Garden', icon: '🏰' })

  // Decoration unlocks
  if (level === 5) unlocks.push({ type: 'decoration', name: 'Mushrooms & Flowers', icon: '🍄' })
  if (level === 8) unlocks.push({ type: 'decoration', name: 'Garden Lanterns', icon: '🏮' })
  if (level === 10) unlocks.push({ type: 'decoration', name: 'Garden Fences', icon: '🪵' })
  if (level === 12) unlocks.push({ type: 'decoration', name: 'Water Features', icon: '💧' })

  return unlocks
}
```

### Grid Positioning Changes (grid-positioning.ts)

```typescript
// Modify calculateRequiredGridSize to accept minimum
function calculateRequiredGridSize(
  plants: PlantForGrid[],
  minimumSize: number = 2
): number {
  const plantBasedSize = calculatePlantExtent(plants)
  return Math.max(plantBasedSize, minimumSize)
}
```

### Component Changes

**isometric-garden.tsx**:
```typescript
// Pass level-based minimum to grid calculation
const minimumGridSize = getGardenSize(profile.level)
const gridSize = calculateRequiredGridSize(livingPlants, minimumGridSize)
```

**garden-decorations.tsx**:
```typescript
// Filter decorations by unlocked set
function generateDecorations(
  gridSize: number,
  tileSize: number,
  unlockedTypes: string[]
): DecoElement[] {
  // Only generate decorations that are unlocked
  // ...
}
```

---

## Implementation Steps

### Step 1: Database Migration

```sql
-- Add garden expansion fields to profiles
ALTER TABLE profiles ADD COLUMN garden_size INTEGER DEFAULT 3;
ALTER TABLE profiles ADD COLUMN unlocked_decorations TEXT[] DEFAULT '{bush,rock}';
ALTER TABLE profiles ADD COLUMN active_theme TEXT DEFAULT 'default';

-- Update existing users based on level
UPDATE profiles SET
  garden_size = CASE
    WHEN level >= 12 THEN 0
    WHEN level >= 9 THEN 7
    WHEN level >= 6 THEN 5
    ELSE 3
  END,
  unlocked_decorations = CASE
    WHEN level >= 12 THEN '{bush,rock,mushroom,flower-patch,lantern,fence-post,pond}'
    WHEN level >= 10 THEN '{bush,rock,mushroom,flower-patch,lantern,fence-post}'
    WHEN level >= 8 THEN '{bush,rock,mushroom,flower-patch,lantern}'
    WHEN level >= 5 THEN '{bush,rock,mushroom,flower-patch}'
    ELSE '{bush,rock}'
  END;
```

### Step 2: Core Logic (progression-system.ts)

1. Add `getGardenSize(level)` function
2. Add `getUnlockedDecorations(level)` function
3. Add `getLevelUnlocks(level)` function
4. Add `LevelUnlock` interface

### Step 3: Grid Positioning (grid-positioning.ts)

1. Modify `calculateRequiredGridSize` to accept `minimumSize` param
2. Update all call sites to pass minimum

### Step 4: Garden Component (isometric-garden.tsx)

1. Accept `profile` or `level` prop
2. Calculate `minimumGridSize` using `getGardenSize(level)`
3. Pass to `calculateRequiredGridSize`

### Step 5: Decorations (garden-decorations.tsx)

1. Accept `unlockedTypes` prop
2. Filter `generateDecorations` by unlocked types
3. Add new decoration SVGs (fence, pond, fountain)

### Step 6: Level-Up Modal (NEW)

Create `src/components/game-ui/level-up-modal.tsx`:
- Shows on level up
- Displays new level, title, badge
- Shows unlocked features/decorations
- Celebratory animation

### Step 7: Unlock Toast (NEW)

Create `src/components/game-ui/unlock-toast.tsx`:
- Brief toast for minor unlocks
- Uses sonner toast system
- Shows icon + name

### Step 8: Expansion Animation (NEW)

Create `src/components/garden/expansion-animation.tsx`:
- Triggered when garden size increases
- Tiles ripple outward from center
- Subtle glow effect on new tiles

---

## Todo List

- [ ] Create migration for profile fields
- [ ] Add `getGardenSize()` to progression-system.ts
- [ ] Add `getUnlockedDecorations()` to progression-system.ts
- [ ] Add `getLevelUnlocks()` to progression-system.ts
- [ ] Modify `calculateRequiredGridSize()` for minimum size
- [ ] Update isometric-garden.tsx to use level-based grid
- [ ] Update garden-decorations.tsx for unlock filtering
- [ ] Add fence-post, fence-corner SVG decorations
- [ ] Add pond, fountain SVG decorations
- [ ] Create level-up-modal.tsx component
- [ ] Create unlock-toast.tsx component
- [ ] Create expansion-animation.tsx component
- [ ] Update xp-system.ts to trigger level-up events
- [ ] Test at each level threshold (5, 6, 8, 9, 10, 12)
- [ ] Mobile responsiveness testing

---

## Success Criteria

1. Garden visually grows from 3x3 to 5x5 to 7x7 as user levels
2. New decorations appear at correct levels
3. Level-up modal shows with unlock preview
4. Expansion animation plays smoothly (60fps)
5. No regression in garden performance
6. Works correctly on mobile devices

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/game-ui/level-up-modal.tsx` | Level up celebration modal |
| `src/components/game-ui/unlock-toast.tsx` | Feature unlock notification |
| `src/components/garden/expansion-animation.tsx` | Garden size increase animation |

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/progression-system.ts` | Add garden size/decoration functions |
| `src/lib/utils/grid-positioning.ts` | Add minimumSize parameter |
| `src/components/garden/isometric-garden.tsx` | Use level-based grid size |
| `src/components/garden/garden-decorations.tsx` | Filter by unlocked types, add new SVGs |
| `src/types/database.ts` | Add Profile fields |
| `src/lib/xp-system.ts` | Trigger level-up events |

---

## Risks

1. **Performance**: More decorations = slower render
   - Mitigation: Canvas renderer option, decoration limit

2. **Animation jank**: Expansion could feel jerky
   - Mitigation: Use CSS transitions, test on low-end devices

3. **Existing users**: May have plants outside new minimum grid
   - Mitigation: Grid always expands to fit plants (minimum, not maximum)
