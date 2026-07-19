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

---

# Design QA — First Seed Sanctuary terrain

- Source visual truth: `C:\Users\TUAN LY\.codex\generated_images\019f5e41-9d5a-7ec0-a728-338b6493cbd6\exec-0b48e336-ec48-4e85-b9ff-64ccb204863e.png`
- Implementation screenshot: `D:\Code\habit-garden\tmpclaude-design-qa\final.png`
- Full-view comparison: `D:\Code\habit-garden\tmpclaude-design-qa\comparison.png`
- Focused comparison: `D:\Code\habit-garden\tmpclaude-design-qa\focused-comparison.png`
- Responsive evidence: `D:\Code\habit-garden\tmpclaude-design-qa\mobile.png`
- Viewport: desktop 1280×720; mobile 390×844
- State: Storybook `Garden/Living Embankment`, sunny day, cinematic terrain; desktop grid 7 at zoom 0.85, mobile grid 3 at zoom 0.82

## Findings

- No actionable P0/P1/P2 findings remain.
- The front soil mass uses continuous texture and smooth directional lighting; no hard vertical center seam is visible.
- The curved worn path enters off-center and remains lower contrast than the plantable surface.
- The earth bank is visibly thinner while the floating-island silhouette remains legible.
- Left/right edge accents are intentionally sparse and do not read as inventory decorations.

## Required fidelity surfaces

- Fonts and typography: not applicable; the target and terrain story contain no text.
- Spacing and layout rhythm: passed. Island scale, diamond footprint, horizon and negative-space balance remain stable. Mobile has no clipping or horizontal overflow.
- Colors and visual tokens: passed. Warm sage/golden-hour hierarchy is preserved; production terrain remains slightly calmer than the concept so dynamic plants retain priority.
- Image quality and asset fidelity: passed. Existing decoded grass, soil-face, soil-edge and background assets are retained; no placeholder or code-drawn substitute replaces a required raster asset. Procedural path and edge flora extend the existing Canvas-First terrain system.
- Copy and content: not applicable. The concept seedling is deliberately not baked into terrain because production plants remain data-driven grid entities.

## Comparison history

### Iteration 1

- Finding [P1]: the old front-seam blend painted a dark strip on the exact center axis.
- Finding [P2]: the `0.56/0.82` soil depth competed with the garden surface.
- Finding [P2]: the first path pass stayed too close to the center axis and was too bright.
- Fixes: replaced per-face texture samples with one continuous earth-mass sample; removed `drawLivingFrontSeamBlend`; changed depth ratios to `0.42/0.60`; moved the path entry to the lower-right edge and softened its strokes.

### Iteration 2

- Evidence: `iteration-2.png` after decoded materials loaded.
- Finding [P2]: surface remained darker than the selected direction and the two corner accents were too small at the full viewport.
- Fixes: brightened cinematic grass stops, reduced texture multiply opacity from 0.42 to 0.32 and enlarged the two deterministic edge clusters.

### Final pass

- Evidence: `final.png`, `comparison.png` and `focused-comparison.png`.
- Center face is continuous, path is off-axis, soil depth is subordinate and terrain remains open for data-driven plants/decorations.
- Mobile 390×844 renders the complete island without clipping.
- Browser console warnings/errors: none.
- Primary interactions: none in this canvas-only Storybook fixture; placement/focus behavior was not changed.

## Follow-up polish

- [P3] Revisit path contrast only after observing a populated production garden; the current value intentionally avoids competing with plants.

final result: passed

---

# Design QA — Living Embankment edge junction correction (2026-07-14)

- Source visual truth: `C:/Users/TUAN LY/AppData/Local/Packages/MicrosoftWindows.Client.Core_cw5n1h2txyewy/TempState/ScreenClip/{6AAEC752-3921-479A-BB83-8F6B3FC1C2D9}.png`
- Implementation screenshot: unavailable; the Codex in-app Browser runtime failed to initialize.
- Intended viewport/state: terrain-only sunny sanctuary crop, centered front cap.

## Evidence and findings

- Source evidence shows a P1 doubled soil-edge sprite at the front cap and a P2 two-lobed bottom contour where separately rendered faces meet.
- Fix applied: the soil mass now uses one closed silhouette, its bottom outline uses one continuous rounded path, and both edge-texture halves sample the same curve with matched center pixels and correct downward normals.
- Full-view comparison: blocked because no browser-rendered implementation screenshot could be captured.
- Focused-region comparison: blocked for the same reason; this task specifically requires a close crop of the center cap.
- Fonts, typography and copy: not applicable to this terrain-only change.
- Spacing/layout, colors/tokens and source raster assets: intentionally unchanged.
- Automated evidence: 24 geometry tests, file-scoped ESLint and TypeScript `--noEmit` pass.

## Comparison history

1. Source inspection identified independent face paths and per-side sprite strips crossing at the center junction.
2. The renderer was changed to a continuous mass/bottom contour and tangent-aligned texture sampling.
3. Post-fix browser comparison remains blocked by the unavailable in-app Browser runtime.
4. User follow-up source: `C:/Users/TUAN LY/AppData/Local/Packages/MicrosoftWindows.Client.Core_cw5n1h2txyewy/TempState/ScreenClip/{4E4ABA76-611D-442E-A6FD-D9D9FE26FC1A}.png` showed the continuous junction, but exposed a P2 oversized earth mass and insufficient face separation.
5. Refinement: reduced side/front depth from `0.42/0.60` to `0.32/0.46 × tileSize`, reduced depth wobble for monotonic contour flow, and added broad asymmetric intersection shading instead of a hard seam.
6. Automated post-fix evidence: all 24 geometry tests, ESLint and TypeScript `--noEmit` pass. Browser-rendered comparison remains unavailable.
7. User feedback: broad shading still did not make the center read as a physical junction between two soil planes.
8. Refinement: the bottom contour now resolves both face curves at the exact shared `frontBottom` cusp. A slightly bowed, feathered occlusion crease connects `frontTop` to that cusp, with a restrained warm bevel on the lit side.
9. Post-fix automated evidence: all 24 geometry tests, file-scoped ESLint and TypeScript `--noEmit` pass. Visual comparison remains blocked because the in-app Browser runtime cannot initialize.

final result: blocked

---

# Design QA — Footprint-aware Calibration Studio (2026-07-15)

- Source visual truth: `C:/Users/TUAN LY/AppData/Local/Packages/MicrosoftWindows.Client.Core_cw5n1h2txyewy/TempState/ScreenClip/{3CE50B91-13D8-4471-AB4B-1BC1EB07A2CE}.png`.
- Implementation: `http://localhost:3000/dev/asset-studio`.
- Desktop evidence: `artifacts/design-qa/asset-studio-desktop.png` and `artifacts/design-qa/asset-studio-sandbox-edge.png` at 1440×900.
- Responsive evidence: `artifacts/design-qa/asset-studio-mobile.png` at 390×844.
- Same-input comparison: `artifacts/design-qa/source-vs-implementation.png`.
- Reviewed states: plant stages, 3×3 footprint, Sandbox expanded, Edge shortcut and mobile stacked panels.

## Comparison result

- The large decorative background in the source is intentionally replaced by the compact Calibration Bench requested in the approved plan. The production garden background remains available below in the collapsible Sandbox.
- Bench cells, sprite, contact point, shadow and overlays share one zoom transform, so visual scale remains stable relative to production tiles.
- The Sandbox uses the production ground plane and renderer. Edge placement remains within the visible safe frame at the desktop viewport.
- Existing sage, cream and dark-green product tokens, typography, radii and controls are preserved; no placeholder art replaces production assets.

## Comparison history

1. Pass 1 found a P2 responsive issue: the 172-item asset list expanded the page to 13,152 px and pushed the Bench far below the mobile viewport.
2. The asset picker was capped to a 22 rem scroll region on mobile while retaining the full-height desktop sidebar.
3. Pass 2 measured a 2,612 px mobile document, Bench start at 988 px and no horizontal overflow (`scrollWidth 375` within a 390 px viewport).
4. Desktop inspection confirmed nine occupied cells for 3×3, real garden rendering, Center/Edge/Corner controls and neighbor reference.
5. No actionable P0, P1 or P2 visual defect remains.

## Required fidelity surfaces

- Layout: passed for 390×844, 768×1024 and 1440×900 logical viewport support; mobile asset navigation no longer dominates the page.
- Sprite/tile ratio: passed through shared production render metrics and automated parity coverage; editor zoom scales the whole scene.
- Image quality: passed with canonical plant/decoration PNGs, production background and production ground plane.
- Copy and controls: passed for footprint selection, stage strip, inspector, overlay toggles, Save/Reset and Sandbox shortcuts.
- Core interactions: passed via component tests and Chromium E2E for selection, footprint cells, draft validation, Sandbox expansion and Center/Edge/Corner states.

final result: passed

---

# Design QA — Uniform center soil depth (2026-07-16)

- Source visual truth: `C:/Users/TUAN LY/AppData/Local/Packages/MicrosoftWindows.Client.Core_cw5n1h2txyewy/TempState/ScreenClip/{4E4ABA76-611D-442E-A6FD-D9D9FE26FC1A}.png`, refined by the user requirement that center depth match both side edges and attract less attention.
- Implementation screenshot: unavailable; the in-app Browser blocked navigation to the local Storybook fixture.
- Intended viewport/state: sunny Living Embankment fixture, centered front junction.

## Findings and implementation

- [P2] The previous `0.32/0.46 × tileSize` side/front profile made the center soil mass 44% deeper than the side edges and emphasized the junction.
- Fix: side and front depths now both use `0.32 × tileSize`; deterministic wobble stays within a `0.013 × tileSize` band.
- Fix: crease shadow alpha/width and warm bevel alpha/width were reduced so the junction remains legible without becoming a focal point.
- Full-view and focused-region comparisons: blocked because no browser-rendered implementation screenshot could be captured.
- Fonts, typography and copy: not applicable to this terrain-only change.
- Colors, source raster materials and garden layout: unchanged.
- Automated evidence: all 24 geometry tests, file-scoped ESLint, TypeScript `--noEmit` and `git diff --check` pass.

final result: blocked
