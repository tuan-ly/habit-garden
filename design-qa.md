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

---

# Living Embankment — Design QA

## Scope

- Source: `C:/Users/TUAN LY/.codex/generated_images/019f5ddd-3d91-7f32-a9f3-04a1da4a0774/exec-c8f77853-9dcf-4c9b-b492-64ac7966b85e.png`
- Implementation: `D:/Code/habit-garden/.codex/qa/living-embankment-desktop-pass3.png`
- Primary viewport/state: 1405×424, 7×7 grid, sunny day.
- Responsive viewport/state: 390×844, 3×3 grid, sunny day.
- Additional states: 5×5 focus/pan, cloudy day, and night.

## Comparison evidence

- Full-view combined comparison: `.codex/qa/living-embankment-comparison-pass3.png`
- Focused soil/material comparison: `.codex/qa/living-embankment-focused-soil-pass3.png`
- Responsive: `.codex/qa/living-embankment-mobile-pass3.png`
- Weather/time: `.codex/qa/living-embankment-cloudy-pass3.png`, `.codex/qa/living-embankment-night-pass3.png`
- Focus/pan: `.codex/qa/living-embankment-focus-pass3.png`

## QA history

1. Pass 1 — P1: soil read as a thin straight board and the desktop crop undersold the intended depth. Increased sanctuary framing and soil depth.
2. Pass 2 — P1: the mobile 3×3 island exposed a rigid V-shaped underside. Replaced straight bottom segments with quadratic midpoint guides, rounded the outer ends, and blended the shared front seam.
3. Pass 3 — post-fix: the embankment reads as one continuous organic mass at desktop and mobile sizes. No P0/P1/P2 mismatch remains.

## Final review

- Layout and crop: passed at 1405×424 and 390×844. The thicker soil and shadow stay inside the shared geometry-derived container.
- Material fidelity: passed. Earth strata, stones, roots, moss, and the grass fringe stay sharp and are clipped cleanly to both faces.
- Lighting: passed. The right face receives a warm runtime highlight; the left face remains cooler/darker; cloudy and night overlays preserve material detail.
- Responsiveness: passed for 3×3, 5×5, 7×7 and an 11×11 dynamic geometry case. The two faces share the exact front endpoint.
- Interaction integrity: passed for the Storybook pan/zoom/focus fixture. Zoom and pan transform the parent and do not invalidate the static ground canvas.
- Typography, copy, and icons: not applicable; this is a terrain-only visual fixture and the source contains no required UI text or icons.
- Console: no errors in the reviewed Storybook states.
- P3 differences accepted: the existing sanctuary grass plane remains intentionally flatter and less densely textured than the concept; the implementation targets the selected soil mass while preserving the current garden surface and anchors.

## Result

passed

### Edge-cap correction — 2026-07-14

- Source visual truth: `C:/Users/TUAN LY/AppData/Local/Packages/MicrosoftWindows.Client.Core_cw5n1h2txyewy/TempState/ScreenClip/{ABD3E4C9-F45F-45EB-B70A-701F096C64D5}.png`
- Implementation screenshot: `.codex/qa/living-embankment-edgecaps-pass4.png`
- Viewport/state: 1000×616, sunny day, 5×5 terrain-only Storybook fixture. The source includes production plants; the comparison target is limited to the two outer terrain caps.
- Responsive evidence: `.codex/qa/living-embankment-edgecaps-mobile-pass4.png` at 390×844, 3×3.
- Full-view comparison: `.codex/qa/living-embankment-edgecaps-comparison-pass4.png`.
- Focused cap comparison: `.codex/qa/living-embankment-edgecaps-focused-pass4.png`; source corners are on the top row and corrected implementation corners are on the bottom row.

**Findings**

- Earlier P2: both rounded grass caps extended beyond the first soil-face sample, leaving an unsupported turf lip at the left and right extremes.
- Fix: the soil geometry now starts at the true quadratic-cap extreme, transitions through the rounded shoulder, and then rejoins the existing nine-point face path.
- Post-fix: both outer caps are supported by the soil face with no visible gap or protruding ear at 5×5 desktop and 3×3 mobile sizes.
- Fonts/copy/icons: not applicable to this terrain-only correction.
- Colors and image quality: unchanged; the existing grass, soil, moss, root, and stone materials retain their previous crop and lighting.
- Console: no errors observed in the reviewed Storybook desktop state.

final result: passed

### Center-seam correction — 2026-07-14

- Source visual truth: `C:/Users/TUAN LY/AppData/Local/Packages/MicrosoftWindows.Client.Core_cw5n1h2txyewy/TempState/ScreenClip/{E9487B38-9FF2-409B-883F-190BA427F8A8}.png`.
- Implementation screenshot: `.codex/qa/living-embankment-center-seam-pass7.png` at 1280×720, sunny day, 5×5 terrain-only Storybook fixture.
- Full-view comparison: `.codex/qa/living-embankment-center-seam-comparison-pass7.png`.
- Focused implementation evidence: `.codex/qa/living-embankment-center-seam-focus-pass7.png`.
- Responsive coverage: the front-cap invariant passes for 3×3, 5×5, 7×7, and dynamic geometry; the preceding 390×844 fixture remains valid because the correction is expressed entirely as `tileSize` ratios.

**Findings**

- Earlier P1: the soil faces ended at the quadratic curve's control point instead of its rendered front extreme, exposing a white triangular wedge directly below the grass corner.
- Fix: both faces now approach dedicated front shoulders and meet at the actual rounded cap point with a horizontal tangent. The two texture halves share the source midpoint, the fringe segments overlap at the miter, and a soft center bridge feathers the face-lighting transition.
- Post-fix: the grass, edge fringe, and soil silhouette converge at one continuous point. No background leak, doubled fringe, or unsupported top lip remains.
- Material fidelity: passed; rock, root, moss, and stratum detail continue across the corner without a new animated or per-pixel rendering pass.
- Fonts/copy/icons: not applicable to this terrain-only correction.
- Console: no runtime error surface appeared in the reviewed Storybook state.

final result: passed
