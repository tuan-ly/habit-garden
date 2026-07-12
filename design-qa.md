# Design QA — Cinematic Sanctuary Garden

- Source visual truth: `D:\Code\habit-garden\.codex\design-qa\source-sanctuary-cinematic.png`
- Implementation: `http://localhost:3000/garden`
- Implementation screenshot: `.codex/design-qa/27-desktop-lighting-final.png`
- Viewport: 1082 × 853 desktop; 390 × 844 mobile resilience check
- State: authenticated Garden-first idle and focused `Chạy bộ` states

## Full-view comparison evidence

- Same-viewport side-by-side comparison: `.codex/design-qa/28-full-comparison-final.png`.
- Mobile implementation capture: `.codex/design-qa/29-mobile-final.png`.
- The source and desktop implementation were compared at 1082 × 853 in the same composite. The final pass preserves the source's sage–cream palette, isometric camera, softened land silhouette, cinematic depth and clustered micro-scenes.

## Focused-region evidence

- Desktop hero cactus bounds: `x=471, y=220, w=140, h=140` at 1082 × 853.
- Desktop generated rock/lantern cluster: `x=328, y=431, w=147, h=147`.
- Desktop generated pond cluster: `x=589, y=562, w=185, h=185`.
- Mobile generated clusters remain fully within the 390 × 844 viewport.
- Focus interaction opens the correct `Chạy bộ` dialog; dialog close control and action buttons remain present.
- Browser console: no warnings or errors.

## Findings

- No remaining P0, P1 or P2 visual defects.
- [P3] The reference uses a denser baked painterly texture and a single-plant art-direction composition. The production implementation keeps dynamic multiple plants and its editing controls, so exact object density intentionally varies with user data.

## Comparison history

1. Initial DOM inspection found the garden hero too close to the header and the active-plant chip intercepting cactus clicks.
2. Fixed by introducing a responsive sanctuary camera offset and hiding the redundant desktop chip.
3. Post-fix DOM evidence places the cactus at the target visual band and verifies clicking it opens `Chạy bộ`, not `Journal`.
4. Mobile inspection found both ambience sprites clipped by the viewport.
5. Fixed with compact scene anchors and responsive sprite sizing; both sprites now fit within 390 × 844.
6. Replaced rigid straight tile edges with an organic rounded diamond path while keeping the logical isometric grid unchanged.
7. Added generated grass texture, dirt-face gradients, edge fringe and rear tufts to remove the flat slab appearance.
8. Moved the pond inward, localized particles around focal points and refined contact shadow/rim light balance.

## Required fidelity surfaces

- Fonts and typography: existing production HUD and Vietnamese copy preserved and visually checked.
- Spacing and layout: desktop and mobile bounds verified; hero, clusters and controls remain uncropped.
- Colors and tokens: existing sage/cream tokens preserved with cinematic ground lighting and three readable depth layers.
- Image quality: custom raster pond and rock/lantern assets and generated grass texture were inspected in context with clean transparent edges.
- Copy and content: existing Vietnamese copy preserved.

## Primary interactions tested

- Garden route loads authenticated data.
- Clicking `Đến thăm Chạy bộ` opens dialog `Chạy bộ`.
- Responsive controls remain inside the mobile viewport.
- No browser console warnings or errors.

## Implementation checklist

- [x] Cinematic ground zoning and focal earth.
- [x] Directional plant shadows and warm rim light.
- [x] Localized daytime fireflies.
- [x] Raster ambience micro-scenes.
- [x] Responsive scene placement.
- [x] Approved in-app Browser screenshot capture.
- [x] Side-by-side visual comparison and final P1/P2 polish pass.

final result: passed
