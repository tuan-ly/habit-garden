# Garden UI

## Main Entry Points

- `src/app/(dashboard)/garden/page.tsx` - server page, plant fetch, `PlantsProvider`.
- `src/components/garden/garden-view.tsx` - top-level client orchestrator for today/garden/list/focus modes.
- `src/components/garden/isometric-garden.tsx` - isometric garden orchestrator.

## Rendering Strategy

The garden follows a **Canvas-First Rendering** rule: use canvas for high-volume visuals such as ground planes, particles, weather effects, and tile-heavy scenes. DOM/Radix components are still appropriate for modals, sheets, HUD, forms, toolbars, and menus.

Avoid Framer Motion for many garden elements. It is acceptable for small UI transitions and modal-level polish.

## Isometric Garden Responsibilities

`IsometricGarden` owns or coordinates:

- zoom and pan through `useGardenZoom()`
- visible tile calculation through `useVisibleTiles()`
- garden mode through `ModeToolbar`
- edit mode through `useEditMode()` and `EditModeOverlay`
- grid sizing and occupancy via `src/lib/utils/grid-positioning.ts`
- decoration placement through inventory context
- modal state through `GardenModals`
- celebration state through `GardenCelebrationLayer`

## Grid Positioning

Grid placement supports multi-cell plants and decorations. Use the helpers in `src/lib/utils/grid-positioning.ts`; do not hand-roll collision rules inside components.

Important concepts:

- anchor cell - top-left cell for a multi-cell item.
- occupied cells map - maps each grid cell to the plant occupying it.
- required grid size - grows based on user level and placed items.
- displacement moves - used when larger plants need space.

## View Modes

`GardenView` supports:

- `today` - dashboard/check-in oriented view.
- `garden` - isometric garden.
- `list` - plant list.
- `focus` - focused calming view.

The selected mode is stored in `localStorage` under `gardenViewMode`.

## UX Constraints

The app can be incomplete, but visible UI must not feel cheap. Hide unfinished features rather than showing rough placeholders. Maintain premium spacing, polished empty states, and coherent game-like visual tone.
