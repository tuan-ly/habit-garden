# Scout Report: Phase 2 Garden Expansion Files

> Generated: 2026-02-06

## 1. Garden Grid & Positioning

| File | Purpose |
|------|---------|
| `src/lib/utils/grid-positioning.ts` | Core grid engine: `calculateRequiredGridSize()`, collision detection, multi-cell plants |
| `src/lib/hooks/use-garden-zoom.ts` | Zoom/pan gestures, MIN_ZOOM=0.5, MAX_ZOOM=2.5 |
| `src/lib/hooks/use-visible-tiles.ts` | Viewport culling for performance |
| `src/components/garden/isometric-garden.tsx` | Main container, modes (interact/move), responsive tile sizing |
| `src/components/garden/ground-plane.tsx` | Diamond ground tiles, grass details |
| `src/components/garden/isometric-tile.tsx` | Individual tile rendering, multi-cell support |

**Key insight**: Grid size currently dynamic based on plant positions. Need to add level-based minimum.

---

## 2. Decorations & Themes

| File | Purpose |
|------|---------|
| `src/components/garden/garden-decorations.tsx` | SVG decorations (bushes, rocks, mushrooms, flowers, lanterns) |
| `src/components/garden/themes/theme-types.ts` | GardenTheme interface, TimeOfDay helper |
| `src/components/garden/themes/default-theme.ts` | Classic garden theme (greens, blues) |
| `src/components/garden/garden-sky.tsx` | Sky gradients, clouds, stars, sun/moon, birds |
| `src/components/garden/weather-effects.tsx` | Rain, lightning animations |
| `src/components/garden/ambient-particles.tsx` | DOM-based particles |
| `src/components/garden/ambient-particles-canvas.tsx` | Canvas-based particles (performant) |
| `src/components/garden/watering-celebration.tsx` | Water splash, sparkles, XP display |

**Key insight**: Decoration types exist but no unlock system. Theme system ready but only 1 theme.

---

## 3. Game UI & Celebrations

| File | Purpose |
|------|---------|
| `src/components/game-ui/game-hud.tsx` | XP/level display, progress bar |
| `src/components/game-ui/game-nav.tsx` | Bottom navigation |
| `src/components/plants/water-toast.tsx` | Toast notifications via sonner |
| `src/components/plants/special-effects.tsx` | Plant-specific visual effects |
| `src/lib/xp-system.ts` | Level progression, `checkLevelUp()`, `LEVEL_REWARDS[]` |

**Missing components**:
- ❌ Level-up celebration modal
- ❌ Unlock notification system
- ❌ Garden expansion animation

---

## 4. Progression System

| File | Purpose |
|------|---------|
| `src/lib/progression-system.ts` | Phase 1: `getMaxPlants()`, `canPlantTier()`, tier requirements |
| `src/types/database.ts` | Profile: level, max_plants, unlocked_tiers, phase |

**Phase 2 additions needed**:
- `getGardenSize(level)` function
- `unlocked_decorations` in Profile
- Garden theme storage

---

## Files to Modify (Phase 2)

### Core Logic
1. `src/lib/progression-system.ts` - Add `getGardenSize()`, decoration unlocks
2. `src/lib/utils/grid-positioning.ts` - Enforce minimum grid size by level
3. `src/types/database.ts` - Add unlock fields to Profile

### Components
4. `src/components/garden/isometric-garden.tsx` - Pass level-based grid size
5. `src/components/garden/garden-decorations.tsx` - Filter by unlock state
6. New: `src/components/game-ui/level-up-modal.tsx`
7. New: `src/components/game-ui/unlock-toast.tsx`
8. New: `src/components/garden/expansion-animation.tsx`

### Database
9. Migration: Add `garden_size`, `unlocked_decorations`, `active_theme` to profiles
