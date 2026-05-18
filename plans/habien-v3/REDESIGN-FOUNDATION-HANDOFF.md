# Habien v3 Redesign Foundation Handoff

> Branch: `habien-v3-redesign-foundation`  
> Date: 2026-05-18  
> Scope: Phase 00 + first slice of Phase 01/02

## Goal

Implement Habien v3 as a **Fun-First Cozy Diorama Garden**. The immediate target is visual foundation, not database/game-mechanic migration.

## Completed In This Session

- Created `docs/GARDEN-SCENE-BIBLE.md`.
- Added Habien v3 scene tokens/utilities in `src/app/globals.css`:
  - soil tokens
  - `garden-chrome`
  - `garden-icon-button`
- Improved starter garden composition in `GroundPlaneCanvas`:
  - denser grass/flower/clover detail
  - softer island height
  - soft worn paths through the plot
  - more patch variation
- Improved ambient garden density in `GardenDecorations`:
  - more starter bushes/rocks
  - added automatic `soil-patch` and `tiny-bloom` details on empty cells
- Started UI chrome redesign:
  - `ModeToolbar` now uses cream/sage garden chrome.
  - `ZoomControls` now uses cream/sage garden chrome.
  - `GameHud` level panel now uses cream/sage garden chrome.
  - `GardenView` top view toggle / Zen toggle now use cream/sage garden chrome.
  - `MoodSelector` and `CoinDisplay` now share the garden chrome surface.
  - `PlantTooltip` and `FloatingPlantCard` now use Habien v3 cream/sage/leaf/honey language and Lucide status icons.
- Replaced the loud `MATURE` plant badge with a small in-world sprout marker.
- Cleaned touched-file lint issues in the UI chrome slice.
- Regression correction after visual review:
  - `garden-chrome` no longer turns dark in dark mode.
  - Garden paths are now subtle ground texture instead of a bright X.
  - Rainbow weather effect is now a small sky accent instead of a giant band across the viewport.
  - Bottom `GameNav` now uses cream/sage garden chrome instead of dark slate.
  - Ambient micro-detail density was reduced to avoid noisy speckles.

## Continue Next

1. Finish Phase 01 visual composition:
   - Tune path opacity/width after viewing `/garden`.
   - Confirm ambient props do not overlap plants or feel noisy.
   - Add focal cluster rule if low-level gardens still look too sparse.
   - Make the garden read larger at default zoom or provide a v3 camera reset; screenshots at 75% zoom look too empty.
2. Finish Phase 02 UI chrome:
   - Review `PlantOverlayBadge` for goal plants at multiple tile sizes.
   - Update remaining dark garden surfaces: `GestureHint`, stats garden tooltip, and lower nav if needed.
   - Tune `GameHud` level badge so it feels more collectible and less arcade-token.
3. Verify:
   - Run `npm run lint`.
   - Run a local screenshot check at `/garden` desktop and mobile.
   - If Playwright browser is missing, run `npx.cmd playwright install chromium` only with user approval.

## Latest Verification

- `npx.cmd tsc --noEmit --pretty false` passes.
- Targeted ESLint passes for:
  - `src/components/garden/garden-view.tsx`
  - `src/components/mood/mood-selector.tsx`
  - `src/components/shop/coin-display.tsx`
  - `src/components/garden/plant-tooltip.tsx`
  - `src/components/garden/floating-plant-card.tsx`
- `http://localhost:3001/garden` returns `200`.
- Latest correction: `npx.cmd tsc --noEmit --pretty false` passes.
- Targeted ESLint for sky/nav/ground/decorations has 0 errors, 3 existing warnings:
  - unused `PineTree`
  - unused `OakTree`
  - unnecessary `tileSize` dependency in `GroundPlaneCanvas`

## Important Constraints

- Do not start Phase 04+ DB mechanics until visual foundation is stable.
- Keep current codebase; do not rebuild the garden renderer from scratch.
- Prefer design tokens/utilities over raw Tailwind color scatter.
- Keep DOM animation count low in the garden; canvas/SVG texture is fine.

## Suggested Next Commit

`feat(garden): add habien v3 visual foundation`
