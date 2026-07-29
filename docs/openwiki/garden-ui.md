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

Garden camera transforms follow **Direct Manipulation**: pan, wheel/pinch zoom, and grid-size changes must update without a CSS transition. Cinematic easing is reserved for explicit plant-focus camera moves. Static canvas materials should reuse small deterministic texture tiles instead of regenerating pixel-density noise whenever the grid changes size.

Sanctuary idle framing follows **Camera Safe Area**. `camera-safe-area.ts` computes **Visual Scene Bounds** from ground plane, transformed plant/decor alpha bounds and shadows, then fits those bounds inside HUD-aware insets using the actual garden container measured by `ResizeObserver`. Mobile (`<640`) insets are left/right `16`, top `256`, bottom `120`; desktop insets are left/right `32`, top `112`, bottom `144`. Base fit is separate from user zoom/pan, so Reset restores user zoom `1` and pan `0`, resize recomputes base fit, and direct manipulation may intentionally leave the safe frame. Plant focus and non-sanctuary camera behavior remain separate.

Sanctuary terrain uses **Hybrid Procedural Terrain**: `ground-plane-geometry.ts` owns deterministic responsive face samples and shared visual height, while `GroundPlaneCanvas` clips decoded, lighting-neutral soil/edge materials into those faces. The cinematic bank keeps a uniform `0.32 × tileSize` visual depth from both side edges through the front center so the junction does not become a focal point; Stats Garden does not use this path. Both soil faces share one continuous texture sample and a smooth directional-light overlay. Their shared front-bottom point remains a controlled rounded cusp, connected to the center cap by a low-contrast feathered crease, so the planes remain legible without a hard mechanical seam. Material assets must trigger at most one static offscreen redraw after decode, and pan/zoom/focus must only composite or transform existing output.

The sanctuary surface includes deterministic **Non-occupying Terrain Inlays**: one low-contrast curved wear path enters off-center, and two sparse grass/flower clusters soften the left and right edge caps. These are part of the ground material, never inventory decorations: they do not reserve cells, participate in collision, create selection targets or replace `placed_decorations`.

## Isometric Garden Responsibilities

`IsometricGarden` owns or coordinates:

- real and virtual habit-plant tiles from `PlantsProvider`; virtual plants occupy deterministic free 1×1 cells, do not participate in plant-care/edit mutations, and route to the guided habit flow
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

Clicking a valid destination commits the ghost immediately through **Optimistic UI**: clear the selection/ghost at click time and render the real decoration at full opacity while the server mutation runs. Placement uses a temporary client id until the server id arrives; movement changes the existing entity in place. Restore the previous item and selection if the mutation fails.

Storing a placed decoration follows the same rule: clear its selection and remove it from the garden before awaiting the server action. The action returns the canonical inventory item so `InventoryProvider` can reconcile the affected stack without refetching the full inventory; restore the same placed entity and selection if the mutation fails.

Placed decoration art follows **Ground Anchoring**: image and emoji fallbacks are bottom-aligned and shifted to the contact point instead of visually centered inside a square canvas. Each decoration anchor also exposes a compact silhouette hit-area above its diamond and an accessible `Chọn <name>` label, so users can select the visible object rather than guessing its ground tile. Decorations remain visually static on hover; hover enlargement is a plant-only affordance.

Ground Anchoring is implemented as explicit **Sprite Anchor Point** metadata in the generated game-asset manifest, not a shared pixel offset. `anchorX` and `anchorY` describe the artwork's actual ground-contact point in normalized source-canvas coordinates; the renderer maps that point to the tile/shadow center and scales around it. `offsetX/Y` are reviewed tile-relative nudges applied on an outer wrapper, so asset/growth/footprint scale cannot magnify them. PNG anchors should be measured from alpha bounds, while emoji/missing-manifest fallbacks use reviewed anchors with scale `1`, offset `0`. Ghost and placed renderers must both go through the same grounded transform path so they cannot drift apart; offsets never alter shadow, occupancy or collision.

Development asset review uses **Asset Calibration Studio** at `/dev/asset-studio`. Its **Calibration Bench** renders every occupied isometric cell and resolves visual metadata by `exact footprint profile → base override → auto analysis → defaults`; plant profiles cover `1×1–4×4` without changing progression rules. Editor magnification scales the entire logical scene, never the sprite alone. The collapsible **Production Sandbox** reuses the production ground plane, tile-size contract and safe frame for center/edge/corner checks. Decoration canonical footprints live in `config/game-asset-catalog.json`; a reviewed change produces a source-controlled reconciliation migration but the development route never connects to Supabase directly. Do not edit generated manifests or restore component-level scale/footprint guesses.

`InventoryProvider` loads `placed_decorations` once after hydration and includes them in inventory refreshes. Do not rely only on mutation responses to populate placed state; otherwise decorations disappear and become unselectable after reload.

Edit Mode uses one bottom **Edit Dock**. It contains labeled Undo and Done actions, plus Rotate and Store when an object is selected. Plant movement also uses this dock for the selected plant name, placement instruction, and Cancel action. The top plant info bar is interact-mode-only, following a **State-Driven Context Slot** rule: garden information and arrangement guidance never compete for the same attention area. Do not restore duplicate top placement badges, the dashed screen border, grid toggle, or a second Done control; the ghost preview and ground footprint already explain placement.

The final inventory item must never be updated to quantity zero because `user_inventory.quantity` enforces `quantity > 0`. Server actions delete the exact row conditionally for quantity-one placement, and migration `20260712173649_fix_inventory_decrement_zero_quantity.sql` fixes the atomic RPC to follow the same delete-at-zero rule.

Important concepts:

- anchor cell - top-left cell for a multi-cell item.
- occupied cells map - maps each grid cell to the plant occupying it.
- required grid size - grows based on user level and placed items.
- displacement moves - used when larger plants need space.

## Current Experience Model

The production `/garden` route is now **Garden-first**:

- no separate Today dashboard or competing mode toggle
- one automatically suggested plant is named in the action UI while the idle garden keeps every plant at its natural visual weight
- action dock offers `Đã làm`, `2 phút`, and `Nghỉ` with equal reachability
- the primary metric is plants cared for today (`x/y`)
- XP, streaks, achievements, store and stats are not primary Garden-home motivation
- `/overview` is Journey; `/profile` is Me; `/stats` redirects to Journey

Legacy list/focus/edit primitives still exist for compatibility and garden arrangement, but they are not first-level navigation.

The sanctuary header also links to the additive `/reading` Home Garden. That route owns the guided reading journey and must not replace or fork the existing sanctuary plant-care mutations. The `/garden` server page maps the reading journey to a `VirtualPlant` and renders its active-session indicator; the dashboard layout shows a global resume banner for a running session. Selecting the virtual tile routes to `/reading`, or directly to `/reading/session` while that habit has an active session.

## Reaction And Modal Rules

- `useGardenInteractions()` performs existing optimistic mutations and can open a selected action mode directly.
- In sanctuary mode, `GardenCelebrationLayer` renders `SanctuaryGardenReaction`; XP-first overlays are suppressed.
- Mood is no longer a proactive blocking modal. Onboarding is the only automatic entry modal.
- The idle garden remains visually balanced before and after an action; stronger focus is reserved for a plant the user explicitly opens.
- Use real plant/background assets; do not replace them with emoji or placeholder drawings.

## Plant Focus Interaction

Garden dùng **Spatial Anchoring**: plant luôn được render từ anchor cell của chính nó, gốc cây và bóng đổ cùng nằm trên mặt tile. Không tách plant “hero” khỏi grid để render lại ở tọa độ màn hình cố định.

Plant shadows follow **Shadow Consistency**: every plant uses one compact contact shadow plus, in cinematic mode, one soft lower-left cast shadow for the upper-right light source. Both layers scale with the plant's growth stage and footprint so a seedling never carries the visual weight of a mature plant.

Trong sanctuary mode, chạm plant sẽ chạy luồng `overview → focus → care → reaction → return`:

- camera pan và zoom theo `grid_row`, `grid_col`, `grid_size` của plant được chọn
- plant được chọn giữ màu và glow; các plant còn lại giảm tương phản
- focus panel hiển thị câu chuyện ngắn, tiến trình và ba lựa chọn `Chăm cây`, `2 phút`, `Nghỉ`
- đóng bằng nút X, Escape hoặc chạm tile trống; camera quay về trạng thái trước đó
- tile plant là button có accessible name `Đến thăm <tên plant>` và hỗ trợ Enter/Space
- animation phải tôn trọng `prefers-reduced-motion`

Plant focus follows **Exclusive Focus State**: while a focused plant is open, hover information and hover enlargement are suppressed across the garden. The selected plant receives one world-space **Focus Frame** anchored to its tile behind the sprite; the frame travels with the cinematic camera, adapts to the plant footprint, and never replaces or detaches the plant from the grid. The focus camera uses a responsive positive vertical offset so the frame sits below the top HUD and remains visually grouped with the bottom information panel.

Focus zoom follows **Safe-area-constrained Zoom**: entering focus uses a dedicated cinematic scale instead of inheriting the user's idle zoom. The authored mobile/desktop scale is an upper bound, then the camera reduces it from the actual viewport width, height, focus frame and asset-manifest alpha bounds so tall plant silhouettes keep breathing room below the HUD across devices. Zoom controls are unavailable during focus and the unchanged idle camera is restored on exit.

Focus composition follows **Focus-to-Panel Spacing**: `SanctuaryGardenChrome` measures the real information-panel top edge with `ResizeObserver`, and the camera keeps the selected plant contact point at least `20px` (mobile) or `24px` (desktop) above it. This measured boundary avoids device, browser zoom and display-scaling differences that a viewport-only offset cannot capture.

## UX Constraints

The chosen direction is **Soft Isometric Sanctuary**: warm golden-hour light, sage/cream surfaces, generous organic radii and calm motion. Visible UI must not use death, critical-state, guilt or streak-loss messaging as primary motivation.
