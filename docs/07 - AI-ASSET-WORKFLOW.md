# AI Asset Workflow — Habit Garden

> Concrete, step-by-step pipeline to produce plant and decoration assets using AI generation + minimal retouch.
> Read this AFTER `06 - ART-BIBLE.md`. This doc tells you *how*; art-bible tells you *what*.

**Version**: 1.0
**Last updated**: 2026-04-17
**Pairs with**: `06 - ART-BIBLE.md` v1.1+

---

## 0. TL;DR Pipeline

```
 Locked Golden Reference (bamboo stage 4)
        │
        ▼
 Style Reference Image  ◄── used in EVERY subsequent prompt
        │
        ▼
 Batch Generation (by stage, all 8 plants)
        │
        ▼
 Cull → pick best 1 of 4 variants
        │
        ▼
 Retouch in Photoshop / Figma (bg removal, re-palette, anchor)
        │
        ▼
 QA in-app (zoom 50/100/200%, light+dark)
        │
        ▼
 Optimize (oxipng)  →  commit to public/plants/<type>/
```

**Target cadence**: 1 stage × 8 plants per 2-hour session. Full garden (40 assets) = 5 sessions ≈ 10–12 h total.

---

## 1. Tool Stack (pick one generator + one editor)

### Generator — pick ONE and stick with it
| Tool | Pros | Cons | Verdict |
|---|---|---|---|
| **Midjourney v7** (`--sref`, `--cref`) | Best style consistency via sref, excellent for "paper-cut" vibe | Paid, Discord-based, no local control | **Recommended** for this project |
| **Stable Diffusion XL** (ComfyUI + IP-Adapter) | Free, full control, batch scripting, LoRA training possible | Setup time, needs GPU | Best if producing 100+ assets or training LoRA |
| DALL·E 3 | Easy, follows prompts literally | Weaker style consistency, no sref | Skip for this project |
| Leonardo.ai (style preset + Image Guidance) | Cheap, style presets good | Less control than MJ sref | Fallback |

### Editor — for retouch + export
- **Photoshop** (preferred) — precise re-palette via Gradient Map adjustment layer
- **Figma** — OK for bg removal + anchor, weaker for color ops
- **Affinity Photo** — one-time purchase alternative to Photoshop

### CLI utilities
```bash
# Install once
npm i -g @squoosh/cli         # PNG compression
npm i -g sharp-cli            # resize / format convert
pip install rembg             # ML background remover fallback
```

---

## 2. Phase A — Establish the Golden Reference (ONE TIME)

Everything downstream depends on this. Do not skip.

### A.1 Draft text description
Write ONE paragraph describing bamboo stage 4 (mature) using art-bible vocabulary:

> *"An isometric 2:1 mature bamboo plant, 4 segmented stalks of varying heights, arching narrow leaves at the top in cel-shaded sage green. Paper-cut biophilic style with soft 1px dark green outline at 60% opacity. Three-tone flat cel shading, no gradients. Sage palette: #3B7A57 base, #6BA57A mid, #8DB982 highlight, #F7F4EC paper highlight. Light from top-right, shadow bottom-left, single elliptical ground shadow #1F3A2E 20% blur 4. Transparent background, centered on 256×256 canvas, plant anchored at bottom-center."*

### A.2 Generate 12–16 variants
Use the prompt above in Midjourney. Generate at least 3–4 rounds (12–16 images). Judge against art-bible §5 (shape language) and §8 (silhouette test).

### A.3 Pick and LOCK
Pick the single best result. This becomes:
- `art/golden-reference/bamboo-04-mature.png` (source PSD)
- `art/golden-reference/bamboo-04-mature.url` (Midjourney job URL — needed for `--sref`)
- The `--sref` seed code from Midjourney (copy from `/describe` or job info)

**Store the sref code** (e.g. `--sref 1234567890`) in `art/golden-reference/STYLE_REF.md`. Every future generation uses this code.

### A.4 Complete bamboo (5 stages) manually guided
Generate bamboo stage 1→5 with `--sref <code>`. Retouch, anchor, export. You now have:
```
public/plants/bamboo/01-seed.png
public/plants/bamboo/02-sprout.png
public/plants/bamboo/03-juvenile.png
public/plants/bamboo/04-mature.png
public/plants/bamboo/05-bloom.png
```
Plus @2x versions. This is the benchmark — 7 plants must match this style.

---

## 3. Phase B — Prompt Library (fill in BEFORE generating)

Build a spreadsheet (Notion table / CSV / Google Sheet) with 40 rows:

| type | stage | species features | bloom element | accent hex | final prompt |
|---|---|---|---|---|---|
| bamboo | 01-seed | — | — | — | [template] |
| bamboo | 02-sprout | pale curled leaf | — | — | [template] |
| bamboo | 03-juvenile | first visible node | — | — | [template] |
| bamboo | 04-mature | 4 segmented stalks, narrow arching leaves | — | — | [template] |
| bamboo | 05-bloom | rare small grass flower | small cream cluster | `#F7F4EC` | [template] |
| sunflower | 01-seed | — | — | — | [template] |
| … | … | … | … | … | … |

### Prompt template (parameterized)
```
isometric 2:1 projection, <species features> — growth stage: <stage narrative>,
paper-cut biophilic style, three-tone cel shading,
light source from top-right, shadow falling bottom-left, single elliptical ground shadow,
soft 1px dark green outline #1F3A2E at 60% opacity,
sage palette #3B7A57 #6BA57A #8DB982 #E8B96A #F7F4EC<, accent <accent hex>>,
flat shapes, rounded leaf tips, no gradient, no photorealism, no neon, no background,
centered on white background, 1:1 aspect
--sref <LOCKED_CODE> --ar 1:1 --stylize 150 --s 150
```

**Stage narrative snippets** (reuse across species):
- `01-seed` → "just-planted soil mound with a single tiny green sprout dot"
- `02-sprout` → "two cotyledon leaves emerging above soil, visible slender stem"
- `03-juvenile` → "young plant with first species-identifying feature visible"
- `04-mature` → "fully grown silhouette, pre-flowering, strong form"
- `05-bloom` → "reward moment with <bloom element> blooming prominently"

### Why a table first
- Prevents ad-hoc prompting → style drift
- Lets you QA the *prompts* before spending gen credits
- Makes regeneration reproducible (if you lose an asset, prompt is in the sheet)

---

## 4. Phase C — Batch Generation (by STAGE, not by plant)

> Art-bible §9 rule. Generate all 8 plants × stage N before moving to stage N+1.

### Session structure (2 h session, ~1 stage)
| Min | Activity |
|---|---|
| 0–15 | Review last session's output, fix any drift |
| 15–75 | Submit 8 prompts (stage N for all plants), 4 variants each = 32 images |
| 75–105 | Cull: pick best 1 variant per plant. Regenerate rejects with nudged prompt. |
| 105–120 | Move winners into `art/raw/<plant>/<stage>.png` |

Retouch phase is separate (see §5).

### Cull criteria (deterministic — follow in order)
1. **Silhouette match** at 32 px (§8 of art-bible)
2. **Palette match** — no stray hex outside allowed list
3. **Outline consistency** — all other plants have matching outline weight/opacity
4. **Light direction correct** — highlight top-right
5. **Species feature present** — per prompt spec
6. **Composition** — anchor position roughly at bottom-center

If no variant passes all 6, nudge prompt (see §7) and regenerate — don't settle.

---

## 5. Phase D — Retouch (Photoshop recipe)

Every AI output needs this pass. Script it as a Photoshop Action.

### Action steps
1. **Open** `art/raw/<plant>/<stage>.png`
2. **Remove background** → use `Select Subject` → refine with `Select and Mask` → add layer mask
   - Fallback: `rembg i input.png output.png` CLI
3. **Re-palette** (CRITICAL) — ensures 100% sage palette:
   - `Layer → New Adjustment Layer → Selective Color` OR
   - `Layer → New Adjustment Layer → Gradient Map` with locked sage ramp
   - Eyedrop any non-palette color → replace
4. **Anchor check** — canvas size 256×256, plant base at pixel (128, 256)
   - `Image → Canvas Size` if needed, anchor to bottom-center
5. **Shadow layer** — bottom-most layer, elliptical shape
   - Fill `#1F3A2E` at 20%, Gaussian Blur 4 px
6. **Outline cleanup** — if AI outline is broken or missing, add:
   - Duplicate plant layer → `Layer Style → Stroke` 1 px `#1F3A2E` at 60% opacity, Outside, rounded
7. **Silhouette test** — temporarily fill black, export 32×32, eyeball vs other plants
8. **Export** via `File → Export → Quick Export as PNG`
9. **Export @2x** — same layers, canvas 512×512, anchor (256, 512)

### Photoshop Action script (manual setup once)
- Record above steps in `Window → Actions`
- Save as `habit-garden-asset.atn`
- Apply to batch via `File → Automate → Batch`

---

## 6. Phase E — QA in-app

Copy exports into `public/plants/<type>/`. Run:
```bash
npm run dev
```

Open the garden page. For each new asset:

### QA matrix (check all cells)
| Zoom | Light mode | Dark mode |
|---|---|---|
| 50% (overview) | readable? silhouette clear? | outline visible on #0F1A14? |
| 100% (garden default) | cohesive with neighbors? | — |
| 200% (zoomed in) | anti-aliasing clean? no JPG artifacts? | — |

### Additional checks
- Open in **notification preview** (~32 px thumbnail) — silhouette test in the wild
- Open in **plant detail sheet** (large render) — ensure no low-res blur
- Compare side-by-side with bamboo (golden reference) — style drift check

If any fail → back to Phase D retouch OR Phase C regenerate.

---

## 7. Troubleshooting — When AI Outputs Drift

| Symptom | Root cause | Fix in prompt |
|---|---|---|
| Too photorealistic | `--stylize` too low | Raise `--s 200–300`, add "flat shapes, no texture" |
| Color off (too saturated) | No palette anchor | Repeat exact hex codes, add "muted earthy palette" |
| Outline inconsistent | `--sref` weight low | Add `--sw 100` (style weight max) |
| Light from wrong side | Ambiguous phrasing | "light source from TOP-RIGHT, shadow BOTTOM-LEFT" in caps |
| 3D / glossy | Tool default | Add "--no 3d, gloss, bevel, gradient, blur" |
| Plant off-center | Composition | "centered composition, plant anchored bottom-center of frame" |
| Silhouette too similar to another plant | Species feature missing | Name the feature explicitly ("with distinctive heart-shaped leaves") |

### Global nudges (add to EVERY prompt)
```
--no realistic, photograph, 3d render, gradient, neon, glow, blur, text, watermark
--stylize 150
--sw 100       (style weight, Midjourney)
```

---

## 8. Phase F — Optimize & Commit

### Optimize
```bash
# From repo root
npx @squoosh/cli \
  --oxipng '{"level":6,"interlace":false}' \
  -d public/plants \
  public/plants/**/*.png
```

### Budget audit
```bash
find public/plants -name "*.png" -exec ls -la {} \; | awk '{ total += $5; print $5, $9 } END { print "TOTAL:", total }'
```
- 1× files target: < 30 KB each
- @2x files target: < 80 KB each
- Full garden target: < 2 MB total

### Commit convention (one commit per plant type, 5 stages together)
```
feat(assets): add bamboo plant art (5 stages)

- 01-seed through 05-bloom at 1× and @2x
- sage palette, paper-cut biophilic style per art-bible v1.1
- total size 168 KB (10 files)
```

---

## 9. Decoration & Tile Assets (same pipeline, different spec)

After 40 plant assets done, use SAME pipeline for:

| Batch | Count | Canvas | Notes |
|---|---|---|---|
| Ground tiles | 5 (grass/dirt/water/stone/path) | 128×64 diamond | Must tile seamlessly — test in `art/tile-tester.html` |
| Rocks | 4 size variants | 128×128 | One style, different scales |
| Logs / fallen branches | 2 | 192×96 | Horizontal orientation |
| Pond | 1 | 256×128 | Includes water ripple highlight |
| Fence | 3 (straight / corner-L / corner-R) | 128×96 | Must connect correctly |
| Weather particles | 4 (sun-ray, rain-drop, snow-flake, fog-wisp) | 32×32 | Single frame, UI layer animates them |
| Mood emotes | 6 | 64×64 | Floating above plant, brief fade |
| Achievement badges | ~20 | 128×128 | Bloom accent, single-state |

Each new batch: extend the prompt-library spreadsheet, follow the same Phase A→F loop.

---

## 10. Version Control & Storage

### In-repo (committed)
```
public/plants/<type>/<stage>.png
public/plants/<type>/<stage>@2x.png
public/tiles/<name>.png
public/decorations/<name>.png
```

### Out-of-repo (Google Drive / Dropbox, `.gitignore`d)
```
art/
├── source/              # .psd / .fig source files (large)
├── raw/                 # AI generator outputs pre-retouch
├── golden-reference/    # STYLE_REF.md, sref codes, lock files
├── prompts.csv          # full prompt library
└── actions/
    └── habit-garden-asset.atn   # Photoshop action
```

Why split: source files are 10–50 MB each, bloat repo. PNGs in `public/` are the only artifacts the app needs.

---

## 11. First Session Checklist — Start Here

Before running any generation:

- [ ] Read art-bible §1–§8
- [ ] Midjourney subscription active (or SDXL ComfyUI workflow ready)
- [ ] Photoshop (or Figma) installed with action template
- [ ] Create `art/` directory (git-ignored) with subfolders per §10
- [ ] Copy sage hex codes into a clipboard snippet
- [ ] Create `art/prompts.csv` with 40 rows (8 plants × 5 stages) ready

Then:
1. **Session 1**: Phase A — bamboo golden reference (2–3 h)
2. **Session 2**: Phase C — stage 01-seed for all 8 plants
3. **Session 3**: Phase C — stage 02-sprout for all 8 plants
4. **Session 4**: Phase C — stage 03-juvenile for all 8 plants
5. **Session 5**: Phase C — stage 04-mature for all 8 plants
6. **Session 6**: Phase C — stage 05-bloom for all 8 plants
7. **Session 7**: Phase D/E — retouch + QA marathon, commit

Total: **~14–16 h across 7 sessions** for full plant set.

---

## 12. Failure Modes — Don't Waste Credits On These

- ❌ Generating all 5 stages of plant A before plant B — style drifts between plant A stage 5 and plant B stage 1
- ❌ Skipping the golden reference — every batch will drift differently
- ❌ Not saving `--sref` code — next session won't match
- ❌ Retouching one asset in isolation — always retouch in batch so you compare side-by-side
- ❌ Accepting "good enough" on outline — inconsistent outlines break the paper-cut illusion
- ❌ Shipping without the 32 px silhouette test — users WILL see tiny icons

---

## 13. Change Log

| Date | Change | By |
|---|---|---|
| 2026-04-17 | v1.0 — initial AI asset workflow | — |
