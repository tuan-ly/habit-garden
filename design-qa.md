# Design QA — Plant-on-tile Focus Transition

## Evidence

- Source visual truth: `D:/Code/habit-garden/docs/design/references/soft-isometric-sanctuary.png`
- Overview implementation: `D:/Code/habit-garden/docs/design-qa/plant-focus-overview-final.png`
- Focus implementation: `D:/Code/habit-garden/docs/design-qa/plant-focus-open-final.png`
- Action dialog: `D:/Code/habit-garden/docs/design-qa/plant-focus-action.png`
- Return state: `D:/Code/habit-garden/docs/design-qa/plant-focus-action-return.png`
- Alternate plant focus: `D:/Code/habit-garden/docs/design-qa/plant-focus-journal.png`
- Full-view comparison: `D:/Code/habit-garden/docs/design-qa/plant-focus-source-vs-overview.jpg`
- Interaction comparison: `D:/Code/habit-garden/docs/design-qa/plant-focus-overview-vs-focus.jpg`
- Viewport: in-app Browser, 390 × 844 CSS pixels.
- State: authenticated user, two plants, no activity mutation submitted during QA.

## Full-view comparison

The overview keeps the selected Soft Isometric Sanctuary hierarchy: compact Journey/profile header, one progress ring, warm scenic field, isometric tile and connected three-action dock. The featured plant is no longer a fixed screen overlay; it is rendered from its real grid anchor with the shadow on the same tile plane. The focus state moves the garden camera instead of scaling a duplicate plant, preserving object continuity.

## Focused-region comparison

- Typography: display and UI fonts, weight hierarchy and Vietnamese wrapping remain consistent with the source direction. Focus copy stays within the panel at 390 px.
- Spacing/layout: plant remains clear above the compact bottom panel; all three care actions fit without scrolling; header remains visible.
- Colors/tokens: cream, sage and forest-green surfaces match the existing sanctuary palette; dimming retains enough garden context.
- Image quality: real plant PNG assets remain sharp through overview and 1.28× camera focus. No placeholder, CSS-drawn or emoji plant was introduced.
- Copy/content: `Đang đến thăm`, growth context and `Chăm cây / 2 phút / Nghỉ` support the visit-care-return story without XP or guilt messaging.

## Primary interactions tested

- Tap the featured cactus → camera focus and contextual panel.
- Tap the off-axis Journal plant → camera pans to its grid position and uses Journal data.
- Open `Chăm cây` → action dialog receives the focused plant; no save was submitted.
- Close action dialog → focus panel exits, then camera returns to overview.
- Enter/Space activates a plant tile; Escape closes focus.
- X closes focus; empty tile close is wired through the sanctuary tile handler.
- Runtime console: no new errors; historical dev-only LCP warnings were addressed by prioritizing the featured plant image.

## Findings and comparison history

1. P1 — The featured plant was removed from the grid and duplicated at a fixed screen coordinate. Fixed by rendering every plant from its anchor tile and removing the fixed hero copy.
2. P1 — `animate-pulse-glow` overrode the plant's inline scale transform. Fixed by moving pulse animation to the glow layer so growth, grid-size and camera scale compose correctly.
3. P1 — Transparent neighboring tile hit areas intercepted taps on a rear plant. Fixed by elevating plant-anchor hit targets while retaining row/column depth ordering.
4. P2 — A 1×1 plant appeared too small compared with a 2×2 plant in focus. Fixed by normalizing featured scale against `getPlantSizeScale()`.
5. P2 — Native keyboard activation did not consistently trigger the sanctuary focus handler. Fixed with explicit Enter/Space handling and verified with Browser DOM state.
6. P2 — Focus needed a predictable exit path. Added X, Escape, empty-tile exit and a staged panel-then-camera return.
7. P3 — The overview label overlaps the upper plant silhouette slightly, functioning as the speech-bubble connection shown in the visual target. Accepted as intentional.

No actionable P0, P1 or P2 issues remain.

final result: passed
