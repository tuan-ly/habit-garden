# Garden UI

## Main Entry Points

- `src/app/(dashboard)/garden/page.tsx` - server page, plant fetch, `PlantsProvider`.
- `src/components/garden/garden-view.tsx` - top-level Garden-first experience shell and scenic background.
- `src/components/garden/isometric-garden.tsx` - isometric garden orchestrator.
- `src/components/garden/sanctuary-garden-chrome.tsx` - mobile sanctuary HUD, next-plant focus and three daily actions.
- `src/components/garden/sanctuary-action-dialog.tsx` - no-guilt action entry for completed, tiny and rest paths.
- `src/components/garden/sanctuary-plant-detail-sheet.tsx` - identity-first plant detail and Journey handoff.

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
- decoration placement and movement through inventory context
- modal state through `GardenModals`
- celebration state through `GardenCelebrationLayer`
- sanctuary active-plant selection and the focused hero plant

## Grid Positioning

Grid placement supports multi-cell plants and decorations. Use the helpers in `src/lib/utils/grid-positioning.ts`; do not hand-roll collision rules inside components.

Decorations are first-class placeable entities: their `grid_size` defines a square 1×1, 2×2, 3×3… footprint, they reserve every covered cell, and they can be selected and moved directly on the garden. The edit catalog opens on demand; do not restore a persistent bottom decoration panel or generate decorative objects outside `placed_decorations`.

The legacy level-generated ambient decoration system has been removed. Catalog rows in `decoration_types`, owned quantities in `user_inventory`, and positioned instances in `placed_decorations` are the only decoration sources of truth. Migration `20260712_expand_decoration_grid_footprints.sql` reconciles legacy placed footprints to their catalog size and deterministically moves an item to the nearest free anchor if an expansion would overlap a plant or another decoration. A database trigger prevents new placed rows from drifting from the catalog footprint.

Decoration placement uses a **Placement Ghost Preview**: after selecting an inventory item, hovering or moving a pointer across a tile renders the real decoration asset at its final footprint, scale and rotation with partial opacity. Valid positions use a clear 65% preview; invalid positions are dimmed and marked. The preview is separate from real tile content so it can still explain collisions.

The final inventory item must never be updated to quantity zero because `user_inventory.quantity` enforces `quantity > 0`. Server actions delete the exact row conditionally for quantity-one placement, and migration `20260712173649_fix_inventory_decrement_zero_quantity.sql` fixes the atomic RPC to follow the same delete-at-zero rule.

Important concepts:

- anchor cell - top-left cell for a multi-cell item.
- occupied cells map - maps each grid cell to the plant occupying it.
- required grid size - grows based on user level and placed items.
- displacement moves - used when larger plants need space.

## Current Experience Model

The production `/garden` route is now **Garden-first**:

- no separate Today dashboard or competing mode toggle
- one automatically suggested plant receives the visual focus
- action dock offers `Đã làm`, `2 phút`, and `Nghỉ` with equal reachability
- the primary metric is plants cared for today (`x/y`)
- XP, streaks, achievements, store and stats are not primary Garden-home motivation
- `/overview` is Journey; `/profile` is Me; `/stats` redirects to Journey

Legacy list/focus/edit primitives still exist for compatibility and garden arrangement, but they are not first-level navigation.

## Reaction And Modal Rules

- `useGardenInteractions()` performs existing optimistic mutations and can open a selected action mode directly.
- In sanctuary mode, `GardenCelebrationLayer` renders `SanctuaryGardenReaction`; XP-first overlays are suppressed.
- Mood is no longer a proactive blocking modal. Onboarding is the only automatic entry modal.
- The plant remains the visual focal point before and after an action.
- Use real plant/background assets; do not replace them with emoji or placeholder drawings.

## Plant Focus Interaction

Garden dùng **Spatial Anchoring**: plant luôn được render từ anchor cell của chính nó, gốc cây và bóng đổ cùng nằm trên mặt tile. Không tách plant “hero” khỏi grid để render lại ở tọa độ màn hình cố định.

Trong sanctuary mode, chạm plant sẽ chạy luồng `overview → focus → care → reaction → return`:

- camera pan và zoom theo `grid_row`, `grid_col`, `grid_size` của plant được chọn
- plant được chọn giữ màu và glow; các plant còn lại giảm tương phản
- focus panel hiển thị câu chuyện ngắn, tiến trình và ba lựa chọn `Chăm cây`, `2 phút`, `Nghỉ`
- đóng bằng nút X, Escape hoặc chạm tile trống; camera quay về trạng thái trước đó
- tile plant là button có accessible name `Đến thăm <tên plant>` và hỗ trợ Enter/Space
- animation phải tôn trọng `prefers-reduced-motion`

## UX Constraints

The chosen direction is **Soft Isometric Sanctuary**: warm golden-hour light, sage/cream surfaces, generous organic radii and calm motion. Visible UI must not use death, critical-state, guilt or streak-loss messaging as primary motivation.
