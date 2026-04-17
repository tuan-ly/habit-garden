# Art Bible — Habit Garden

> Single source of truth for visual style. Every plant, decoration, icon, and tile asset MUST follow this doc.
> If you want to deviate, update this doc first — never inline-special-case.

**Version**: 1.1
**Last updated**: 2026-04-17
**Style name**: **Paper-Cut Biophilic Isometric**

---

## 1. Design North Star

Habit Garden is a **calm, earthy, biophilic** habit tracker. The world should feel like a **handcrafted paper diorama** — warm, tactile, slightly imperfect — not a slick 3D game or a flat utility dashboard.

**Mood words**: calm, organic, warm paper, patient growth, morning light, sage
**Anti-mood words**: neon, chrome, glossy, hyperreal, aggressive, corporate

---

## 2. Projection & Camera

- **Projection**: Isometric **2:1** (dimetric, 30° angle)
- **Tile math**: 1 tile = 64×32 px logical (128×64 @2x)
- **Light direction**: **Top-right, 45°** — matches the in-world sun/moon position (top-right of the scene). Every asset's highlight is top-right, shadow is bottom-left. NEVER vary per asset.
- **Horizon**: Camera assumed slightly above — we see the top-face of ground tiles.

```
       light source (top-right) ☀ / ☾
                              /
          shadow falls    ↙  /
           bottom-left     /
      ■───────■
     ╱         ╲   ← 2:1 isometric tile
    ■           ■
     ╲         ╱
      ■───────■
```

---

## 3. Color Palette (LOCKED)

Pulled directly from `src/app/globals.css` — do not introduce new hex codes without updating this table.

### Core Sage (UI + Asset shared)
| Token | Hex | Use in assets |
|---|---|---|
| `canopy` | `#1F3A2E` | Outlines (at 60% opacity), deepest shadow |
| `leaf` | `#3B7A57` | Primary foliage base |
| `moss` | `#6BA57A` | Foliage highlight / mid-tone |
| `growth` | `#8DB982` | Fresh sprout, young leaves |
| `bloom` | `#E8B96A` | Warm accent, sunflowers, pollen, reward glow |
| `sky` | `#CFE6E3` | Sky blue tint (water, sky reflections) |
| `mist` | `#F7F4EC` | Paper base, soft highlight on leaves |
| `cloud` | `#FEFCF7` | Brightest highlight only |
| `ash` | `#A39B8A` | Dead plant, withered |
| `moisture-full` | `#4A9EDE` | Water droplets, irrigation |
| `moisture-low` | `#D97757` | Thirsty warning, dry soil |

### Per-plant accent (ONE extra color allowed)
| Plant | Accent | Hex |
|---|---|---|
| bamboo | moss base — no accent | — |
| sunflower | bloom | `#E8B96A` |
| cherry-blossom | soft pink | `#E8A4B5` |
| cactus | growth | `#8DB982` |
| lotus | lavender | `#B794D1` |
| rose | rose-red | `#D97A8E` |
| bonsai | leaf — no accent | — |
| money-tree | gold-green | `#C4B268` |

**Rule**: A single asset uses **max 5 colors** (base + 1 shadow + 1 highlight + outline + 1 accent). More than that = muddy.

---

## 4. Shading Rules

### Three-tone cel shading (NO gradients)

Every plant shape uses exactly 3 values of its base color:
1. **Shadow** — base × 0.7 lightness
2. **Base** — brand palette hex
3. **Highlight** — base + 15% lightness (or `mist` for top leaves)

### Outline
- Width: **1–1.5 px** at 1× export (2–3 px at @2x)
- Color: `canopy` (#1F3A2E) at **60% opacity** — never pure black
- Style: rounded line-caps and joins (no sharp miter)

### Shadow under base
- Single **ellipse**, not drop-shadow
- Color: `canopy` at 20% opacity, blur 4 px
- Size: ~60% of silhouette width, flat at plant base

---

## 5. Shape Language

- **Rounded everything**: leaves have rounded tips, not needles. Even cactus spines are stubby.
- **Curves > straight lines**: stems bend slightly. Symmetry is a tell for "robotic".
- **No sharp negative space**: gaps between leaves should be > 4 px.
- **Paper-cut feel**: imagine each layer is cut from construction paper — clear edges, overlapping layers, no airbrushing.
- **Slight imperfection allowed**: hand-drawn wobble on outlines welcome. Mathematical precision is off-brand.

### Don't
- No photorealism, no 3D bevels, no glossy highlights, no gradient fills
- No lens flare, no neon glow, no sparkle trails on base art (particles are UI layer only)
- No motion blur on static exports
- No backgrounds in PNG — always transparent

---

## 6. Growth Stages — Canonical 5

Every plant type exports exactly 5 stages at identical canvas size.

| # | Filename | % range | Narrative | Mandatory elements |
|---|---|---|---|---|
| 1 | `01-seed.png` | 0–10 | "Just planted" | Soil mound, 1 tiny sprout dot |
| 2 | `02-sprout.png` | 10–30 | "Coming up" | 2 cotyledon leaves, visible stem |
| 3 | `03-juvenile.png` | 30–60 | "Taking shape" | **Species-identifying feature** appears (bamboo nodes, cactus spines, lotus pad) |
| 4 | `04-mature.png` | 60–95 | "Grown" | Full silhouette, pre-bloom |
| 5 | `05-bloom.png` | 95–100 | "Reward!" | Flower/fruit — the dopamine moment |

**Stage 5 is the payoff.** Design it to be visibly more rewarding than stage 4 — add bloom color, add 1 particle (UI layer), add highlight.

---

## 7. Asset Spec

### Canvas
- **Size**: 256 × 256 PNG (retina: 512 × 512 at @2x)
- **Background**: transparent
- **Anchor**: plant base at `x=128, y=256` (centered horizontally, bottom of canvas)
- **Safe margin**: keep plant body within 224 × 224 inner box (16 px padding top/sides)

### File naming
```
public/plants/<type>/<stage>.png      # 1× for mobile
public/plants/<type>/<stage>@2x.png   # 2× for retina
```

`<type>` = lowercase kebab-case (`cherry-blossom`, `money-tree`)
`<stage>` = `01-seed`, `02-sprout`, `03-juvenile`, `04-mature`, `05-bloom`

### Optimization
```bash
npx @squoosh/cli --oxipng '{"level":3}' public/plants/**/*.png
```
Target: **<30 KB** per 1× file, **<80 KB** per @2x file.

---

## 8. Silhouette Test (MANDATORY)

Before shading any stage, do a **silhouette pass**:
1. Fill the plant shape in solid black on white
2. Export at 32 × 32 px
3. Line up all 8 plants at stage 4 — **every silhouette must be uniquely identifiable**

If two plants look alike at 32 px, redesign. Users see tiny icons in lists, widgets, notifications.

---

## 9. Workflow

### Phase A — One-time setup
1. Write `art-bible.md` ✓ (this file)
2. Create **golden reference** = bamboo, 5 stages. Use it as the benchmark.
3. Peer-review the golden reference against this doc before producing other plants.

### Phase B — Production (batch by stage, not by plant)
Always advance all 8 plants through one stage before moving to the next stage.

```
Week 1 → all 8 × 01-seed
Week 2 → all 8 × 02-sprout
Week 3 → all 8 × 03-juvenile
Week 4 → all 8 × 04-mature
Week 5 → all 8 × 05-bloom
```

**Why**: forces consistency. Produces a complete-but-shallow garden at every checkpoint.

### Phase C — In-context QA
For every new asset:
1. Drop into `public/plants/<type>/` at correct filename
2. Run `npm run dev`, open garden
3. Check at **zoom 50%, 100%, 200%**
4. Check in **light AND dark mode** (ensure outline still readable on `#0F1A14`)
5. Check notification/widget size (~32 px)

### Phase D — Export pipeline
- Source file: `art/source/<type>.fig` or `.psd` (kept out of repo, in Drive/Dropbox)
- Export via Figma slice / Photoshop action → `public/plants/<type>/`
- Run oxipng on every commit that touches assets

---

## 10. Tooling Options

| Path | Tool | When |
|---|---|---|
| A — Hand-draw | Procreate, Figma, Affinity Designer | You enjoy illustrating. Highest consistency. |
| B — AI + retouch | Midjourney `--sref` / Stable Diffusion img2img + Photoshop | Want speed but quality bar. Need one locked reference image. |
| C — Asset pack | kenney.nl, itch.io iso-plant packs + recolor to sage palette | Ship fast. Accept "off-brand but cohesive". |

### Midjourney prompt template (Path B)
```
isometric 2:1 projection, <plant-name> at <stage-description>,
paper-cut biophilic style, 3-tone cel shading,
light source from top-right (sun/moon), shadow falling bottom-left,
soft 1px dark green outline (#1F3A2E at 60%),
sage color palette (#3B7A57, #6BA57A, #8DB982, #E8B96A, #F7F4EC),
flat shapes, rounded tips, no gradient, no photorealism, no neon,
white background, centered composition --ar 1:1 --stylize 100
```

Replace `<plant-name>` and `<stage-description>` per row in §6.

---

## 11. Per-Asset Checklist (ship gate)

Copy this into every asset PR:

- [ ] Canvas 256×256 (and @2x 512×512), transparent BG
- [ ] Anchor point: x=128, y=256
- [ ] Light direction: top-right 45° (highlight top-right, shadow bottom-left)
- [ ] Outline: 1–1.5 px, canopy @ 60% opacity
- [ ] 3-tone cel shading, no gradient
- [ ] Single ellipse shadow under base
- [ ] Max 5 colors (from palette)
- [ ] Unique silhouette at 32 px
- [ ] File size < 30 KB (1×) / < 80 KB (@2x)
- [ ] Dark-mode visible on `#0F1A14`
- [ ] Naming matches convention exactly

---

## 12. Beyond Plants — Other Asset Categories

Same rules apply. Each category has its own growth/variant system:

| Category | Variants | Notes |
|---|---|---|
| Ground tiles | grass / dirt / water / stone / path | 64×32 diamond, seamless edges |
| Decorations | rock, log, mushroom, pond, fence | Smaller than plants, accent only |
| Weather overlays | sun / rain / snow / fog | Particle system (UI layer), not PNG |
| Mood emotes | 😀→🌱 variants | 64×64, floating above plant |
| Achievements | badges | 128×128, bloom accent, single-state |

Each new category needs its own §6-style spec. Add to this doc before producing.

---

## 13. Change Log

| Date | Change | By |
|---|---|---|
| 2026-04-17 | v1.0 — initial art bible | — |
| 2026-04-17 | v1.1 — light source moved top-right to match in-world sun/moon | — |

---

## Quick Reference Card

```
Projection:  isometric 2:1, light top-right 45° (sun/moon side)
Canvas:      256×256 PNG, transparent, anchor (128, 256)
Outline:     1–1.5 px, #1F3A2E @ 60%
Shading:     3-tone cel (shadow / base / highlight) — NO gradient
Shadow:      ellipse, #1F3A2E @ 20%, blur 4
Palette:     Sage — max 5 colors per asset
Stages:      01-seed · 02-sprout · 03-juvenile · 04-mature · 05-bloom
Silhouette:  must be unique at 32 px
File size:   <30 KB (1×), <80 KB (@2x)
```
