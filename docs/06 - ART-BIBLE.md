# Art Bible — Habit Garden

> Single source of truth for visual style. Every plant, decoration, and tile asset MUST follow this doc.
> If you want to deviate, update this doc first — never inline-special-case.

**Version**: 2.0
**Last updated**: 2026-04-20
**Style name**: **Flat Vector Biophilic Isometric**

---

## 1. Design North Star

Habit Garden is a **calm, cozy, biophilic** habit tracker. The world should feel like a **stylized mobile game** — warm, smooth, meditative — inspired by **Forest by Seekrtech**, **Plant Nanny**, **Monument Valley**, and **Alto's Adventure**.

**Mood words**: calm, cozy, warm, meditative, golden-hour, gentle growth
**Anti-mood words**: neon, chrome, glossy, hyperreal, aggressive, corporate, painted, watercolor

---

## 2. Projection & Camera

- **Projection**: **3/4 isometric at 30° camera tilt**
- **Tile math**: 1 tile = 64×32 px logical (128×64 @2x) — tiles composited at runtime in React `IsometricGarden` component
- **Light direction**: **Soft diffuse ambient light from upper-RIGHT** — golden-hour mood. Every asset's light face is on the RIGHT, shadow face on the LEFT. NEVER vary per asset.
- **Shadow**: Faint ambient occlusion ellipse in cream tone (~#D4C9B0, 20% opacity), offset lower-left. **NOT a solid disc/plate/pool** — it's a rendering hint, not an illustrated element.

### Critical: Separation of Concerns
- **Asset = object only** (tree/plant/decoration + faint shadow)
- **NO ground tile baked into asset** — tile is runtime concern of `IsometricGarden` React component
- **NO background scenery** — asset floats on empty cream canvas, composited onto tile at runtime

```
       light source (upper-right) ☀
                              ╲
          shadow falls    ╱    ╲
           lower-left    ╱      ╲
                        [plant asset]
                     ···shadow ellipse···
```

---

## 3. Color Palette (LOCKED)

### Core Asset Palette (hex codes — paste verbatim into prompts)
| Token | Hex | Use |
|---|---|---|
| Background | `#FBF5E6` | Solid flat cream ivory canvas |
| Shadow | `#D4C9B0` | Ambient occlusion ellipse (20% opacity) |
| Trunk light | `#8B5A3C` | Warm brown, light face |
| Trunk shadow | `#6B4423` | Deep brown, shadow face |
| Foliage light | `#6B9B4F` | Green, light face |
| Foliage shadow | `#4A7C3A` | Green, shadow face |
| Accent pink gentle | `#F5B8C8` | Blossom dots, subtle |
| Accent pink deep | `#E88FA8` | Blossom highlight |

### Per-plant accent (ONE accent family allowed)
| Plant | Accent Family | Hex |
|---|---|---|
| Cherry blossom | pink | `#F5B8C8` / `#E88FA8` |
| Sunflower | yellow | `#F5C842` |
| Cactus | green only | (no extra accent) |
| Succulent | muted green | (no extra accent) |
| Bonsai | dark green | `#2D5016` |
| Rose bush | red | `#C84A4A` |
| Lavender | purple | `#9B7BC4` |
| Mushroom | red cap | `#C84A4A` + white dots |
| Fern | green only | (no extra accent) |
| Tomato plant | red fruit | `#C84A4A` |
| Lemon tree | yellow fruit | `#E8C547` |

**Rule**: Limited warm palette per asset. Two-tone shading per shape (light face vs shadow face). No more than 2 accent colors beyond the base trunk+foliage palette.

---

## 4. Shading Rules

### Two-tone gradient shading (per shape)

Every shape uses exactly **2 tones** split by light direction:
1. **Light face** (right side) — lighter hex
2. **Shadow face** (left side) — darker hex

This is a **soft gradient split**, NOT cel-shading with hard edges, and NOT flat single-color fills.

### NO outlines, NO line art
- **Zero outlines** — shapes are defined by color contrast and smooth bezier edges only
- No black outlines, no dark green outlines, no stroke of any kind
- This is a flat vector style, not paper-cut illustration

### Shadow under base
- Faint **ambient occlusion hint** in darker cream tone `#D4C9B0` at ~20% opacity
- Offset lower-left (consistent with upper-right light)
- **NOT a solid shape, NOT a disc, NOT a plate, NOT a pool of paint**
- Think of it as a subtle rendering effect, not an illustrated element

---

## 5. Shape Language

- **Smooth bezier curves**: all shapes are smooth, continuous curves — no jagged edges
- **Rounded everything**: leaves have soft rounded tips, canopy is dome/cloud-like
- **No sharp negative space**: gaps between shapes should be soft and organic
- **Flat vector feel**: imagine each shape is a smooth vector path with gradient fill — clean, digital, minimal

### Shape Disambiguation Rules (for plant prompts with flower + foliage)
> Prevents **Shape Semantic Collision** — when 2 visual elements share shape vocabulary.

- Call foliage: "smooth cloud-like puff", "rounded cotton mass", "dome canopy"
- **NEVER** call foliage: "blob cluster" (triggers scalloped petal interpretation)
- Call blossoms: "TINY dots embedded IN foliage", size ≤ 3% of puff area
- Explicit role label: "FOLIAGE MASSES, not blossoms" / "blossoms sitting on leaves, not flower centers"
- Negative list: "no flower-shaped clusters, no petal silhouettes, no scalloped edges"

### Don't
- No photorealism, no 3D rendering, no glossy highlights, no gradient mesh
- No painted brush strokes, no watercolor texture
- No anime style, no Studio Ghibli painted look
- No isometric ground tile baked into asset
- No backgrounds in PNG — cream canvas only (bg removed in post-processing for transparent)

---

## 6. Growth Stages — Canonical 5

Every plant type exports exactly **5 stages** at identical canvas size.

| # | Filename | % range | Narrative | Size (% of canvas height) |
|---|---|---|---|---|
| 1 | `seedling.png` | 0–15 | "Just sprouted" | ~10% — tiny sprout, 1-2 leaves, maybe 1 bud |
| 2 | `sapling.png` | 15–35 | "Taking root" | ~25% — sparse foliage, species hint visible |
| 3 | `juvenile.png` | 35–60 | "Growing strong" | ~45% — mid-size, species feature clear, half-developed |
| 4 | `mature.png` | 60–90 | "Fully grown" | ~65% — full silhouette, dense foliage |
| 5 | `bloom.png` | 90–100 | "Reward!" | ~75% — same silhouette + extra accent (petals, fruit, flowers) |

**Stage 4 is the payoff.** Design it to be visibly more rewarding than stage 3 — add bloom color, floating petals, extra accent dots.

### Stage generation strategy
- **Mature (stage 4) is always generated FIRST** as the anchor
- Other stages derived from anchor via `/banana edit` or fresh generation with same style DNA
- **Additive deltas** (seedling→sapling, mature→bloom): `/banana edit` works well
- **Subtractive deltas** (mature→sapling, mature→juvenile): reframe as fresh generation, NOT edit (see Anchor Gravity Problem)
- **Anchor-Dependent Species** (non-green foliage like cherry blossom pink, lavender purple): MUST use edit-from-anchor to preserve palette. Green-foliage plants can use fresh generate.

---

## 7. Asset Spec

### Canvas
- **Generated size**: 2K (via banana-claude / Gemini)
- **Aspect ratio**: 1:1
- **Background**: solid cream `#FBF5E6` during generation → removed in post-processing for transparent PNG
- **Subject placement**: centered, floating on empty cream background, NO ground tile

### File naming
```
public/plants/<type>/seedling.png
public/plants/<type>/sapling.png
public/plants/<type>/juvenile.png
public/plants/<type>/mature.png
public/plants/<type>/bloom.png
```

`<type>` = lowercase kebab-case (`cherry-blossom`, `money-tree`, `lemon-tree`)

### Post-processing pipeline
```bash
# 1. Watermark removal (Gemini adds watermark bottom-right)
magick input.png -gravity SouthEast -chop 60x60 cleaned.png

# 2. Background removal for transparent PNG
magick cleaned.png -fuzz 8% -transparent "#FBF5E6" transparent.png

# 3. Resize for game sprite (512x512)
magick transparent.png -resize 512x512 final.png

# 4. Optimize file size
pngquant --quality=80-95 final.png --output optimized.png
```

---

## 8. Style Anchors (MUST appear in every prompt)

These phrases are non-negotiable in every generation prompt:

1. `"flat vector illustration"`
2. `"in the style of mobile mindfulness games like Forest by Seekrtech and Plant Nanny"`
3. `"smooth bezier shapes"`
4. `"soft two-tone gradient shading split per shape (light face vs shadow face)"`
5. `"no outlines, no line art"`

### Additional references for isometric feel
- Monument Valley (isometric projection)
- Alto's Adventure (warm minimal aesthetic)

### Banned words (Gemini rejects these)
~~8K, 4K, masterpiece, ultra-realistic, hyperrealistic, photorealistic, highly detailed, best quality, trending on artstation, award winning~~

### Semantic negatives (rephrase positively, then add explicit exclusions at end)
- ❌ "no clouds, no scenery" → ✅ "background completely uncluttered, empty, no horizon"
- ❌ "not painted style" → ✅ "flat vector, smooth bezier shapes, no painted brush strokes"
- Negative reframe OK when listing style exclusions at end of prompt

---

## 9. Proven Prompt Patterns

Lessons learned from cherry blossom production (2026-04-19):

### Triple Anchoring (lighting consistency)
Reinforce light direction **3 times** in prompt — once per major element:
1. Trunk block: "light face on RIGHT side"
2. Canopy/foliage block: "light face on RIGHT side"
3. Style block: "every shape's light face must be on its right"

Prevents **Lighting Consistency Problem** — Gemini drifts light direction in long prompts.

### Intent vs Element Confusion (shadows)
Never describe shadow as an object. Describe as rendering effect:
- ❌ "dark brown elliptical drop shadow"
- ✅ "faint ambient occlusion hint in darker cream tone #D4C9B0 at 20% opacity"
- Add negatives: "NOT a solid shape, NOT a disc, NOT a plate"

### Anchor Gravity Problem (subtractive edits)
`/banana edit` resists "reduce/shrink/sparse" deltas. The anchor image's visual weight persists.
- Fix: reframe as "COMPLETELY REPLACE with brand new subject, NOT modifying existing"
- Or: use fresh `/banana generate` with same style DNA instead of edit

### Shape Semantic Collision (flower vs foliage)
When prompt has foliage + blossom elements sharing shape vocabulary:
- Use contrasting metaphors ("cloud puff" for foliage, "tiny dots" for blossoms)
- Explicit role labels ("FOLIAGE MASSES, not blossoms")
- Size ratio cap ("dots max 3% of puff area")
- Specific negatives ("no flower-shaped clusters, no petal silhouettes, no scalloped edges")

---

## 10. Beyond Plants — Other Asset Categories

Same style rules apply. Each category follows flat vector + two-tone shading + no outlines.

| Category | Variants | Notes |
|---|---|---|
| Ground tiles | grass / dirt / water / stone / path | 64×32 diamond, seamless edges, runtime composited |
| Decorations | rock, log, mushroom, pond, fence | Smaller than plants, accent only |
| Weather overlays | sun / rain / snow / fog | Particle system (UI layer), not PNG |
| Mood emotes | variants per mood | 64×64, floating above plant |
| Achievement badges | ~20 | 128×128, bloom accent, single-state |

---

## 11. Per-Asset Checklist (ship gate)

- [ ] Generated at 2K, 1:1 ratio
- [ ] Watermark removed (bottom-right chop)
- [ ] Background removed (transparent PNG)
- [ ] Light direction: upper-RIGHT (light face right, shadow face left)
- [ ] No outlines, no line art — smooth bezier shapes only
- [ ] Two-tone gradient shading per shape
- [ ] Shadow: faint ambient occlusion ellipse, NOT solid disc
- [ ] No ground tile baked in (composited at runtime)
- [ ] Palette matches §3 hex codes
- [ ] Style matches Forest/Plant Nanny reference
- [ ] Naming matches convention exactly

---

## 12. Change Log

| Date | Change | By |
|---|---|---|
| 2026-04-17 | v1.0 — initial art bible (paper-cut style, speculative) | — |
| 2026-04-17 | v1.1 — light source moved top-right | — |
| 2026-04-20 | **v2.0** — COMPLETE REWRITE based on proven cherry blossom workflow. Changed style from "Paper-Cut Biophilic" to "Flat Vector Biophilic". Removed outlines. Changed from 5 stages to 4. Updated palette to match Gemini-proven hex codes. Added prompt patterns (Triple Anchoring, Shape Semantic Collision, Anchor Gravity, Intent vs Element). Updated tooling from Midjourney to banana-claude/Gemini. | — |

---

## Quick Reference Card

```
Style:       Flat Vector Biophilic Isometric (Forest/Plant Nanny style)
Projection:  3/4 isometric, 30° camera tilt
Light:       Upper-RIGHT, soft diffuse ambient (golden-hour)
Shading:     Two-tone gradient per shape (light face / shadow face)
Outline:     NONE — smooth bezier shapes only
Shadow:      Ambient occlusion ellipse, #D4C9B0 @ 20%, offset lower-left
Canvas:      1:1, 2K, cream #FBF5E6 background (removed in post)
Stages:      seedling · sapling · juvenile · mature · bloom (5 stages)
Palette:     Warm limited — cream, brown, green + 1 accent family
Tool:        banana-claude skill → Gemini (gemini-3.1-flash-image-preview)
Pipeline:    Mature anchor first → derive stages via edit/generate
```
