# AI Asset Workflow — Habit Garden

> Step-by-step pipeline to produce plant and decoration assets using AI generation.
> Read this AFTER `06 - ART-BIBLE.md`. This doc tells you *how*; art-bible tells you *what*.
> For session-level checklists and templates, see `ASSET-SESSION-PLAYBOOK.md`.

**Version**: 2.0
**Last updated**: 2026-04-20
**Pairs with**: `06 - ART-BIBLE.md` v2.0+

---

## 0. TL;DR Pipeline

```
 Pick subject from Subject Library (ASSET-SESSION-PLAYBOOK.md §Subject Library)
        │
        ▼
 Generate MATURE ANCHOR first (Template § A — new subject)
        │
        ▼
 Evaluate → iterate prompt until anchor LOCKED ✅
        │
        ▼
 Derive 3 stages from anchor:
   • Bloom  → /banana edit (additive: add petals/fruit)  ← usually PASS first try
   • Seedling → /banana edit (complete replacement: tiny sprout) ← usually PASS first try
   • Sapling → /banana generate fresh OR /banana edit with aggressive reframe ← hardest stage
        │
        ▼
 Post-process: watermark chop → bg remove → resize → optimize
        │
        ▼
 Save to public/plants/<type>/<stage>.png
```

**Target**: ~$0.55–$1.00 per plant (4 stages × ~$0.134/image + iteration). 11 plants ≈ **$6–11 total**.

---

## 1. Tool Stack

### Generator
| Tool | Role |
|---|---|
| **banana-claude** skill | Primary — Gemini Nano Banana 2 (`gemini-3.1-flash-image-preview`) |
| Model settings | 1:1 ratio, 2K imageSize |
| Env requirement | `GEMINI_API_KEY` set (get from https://aistudio.google.com/apikey) |

### Post-processing
| Tool | Command | Purpose |
|---|---|---|
| ImageMagick | `magick input.png -gravity SouthEast -chop 60x60 cleaned.png` | Watermark removal |
| ImageMagick | `magick cleaned.png -fuzz 8% -transparent "#FBF5E6" transparent.png` | Background removal |
| ImageMagick | `magick transparent.png -resize 512x512 final.png` | Resize for game |
| pngquant | `pngquant --quality=80-95 final.png --output optimized.png` | File size optimization |

### Fallback
If banana-claude unavailable: `python scripts/generate.py --prompt "..." --aspect-ratio "1:1"`

---

## 2. Strategy: Anchor-Driven Consistency

> **Core insight** (proven 2026-04-19): Batch generation (`/banana batch`) produces inconsistent results (1/3 match style). Instead, use **anchor-driven pipeline**:

### Why anchor-first
1. Generate ONE perfect mature image = the **anchor**
2. All other stages derive FROM this anchor
3. Consistency guaranteed because every stage references same visual DNA

### Which stages work with `/banana edit`
| Stage | Delta type | Works with edit? | Notes |
|---|---|---|---|
| Bloom (from mature) | Additive (add petals/fruit) | ✅ YES | Usually PASS first try |
| Seedling (from mature) | Complete replacement (tiny sprout) | ✅ YES | Reframe as entirely new tiny subject |
| Sapling (from mature) | **Subtractive** (shrink, sparse) | ⚠️ RISKY | Anchor Gravity resists reduction |

### Sapling strategy (the hard one)
Sapling is always the hardest stage because it requires **subtractive delta** from mature anchor.

**Option A — Aggressive edit reframe**:
1. "COMPLETELY REPLACE with brand new subject, NOT modifying existing tree"
2. Pin exact canvas %: "fills 35% of canvas height"
3. Pin exact counts: "exactly 3 foliage puffs, 2 accent dots"
4. Negative space anchor: "upper 65% must be empty cream space"

**Option B — Fresh generation** (Template § A with same style DNA):
Use `/banana generate` instead of `/banana edit`. Paste all Locked Style DNA from playbook. More reliable but may drift slightly from anchor's specific look.

---

## 3. Prompt Architecture

### Prompt structure (5 blocks)
Every generation prompt follows this structure:

```
Block 1: SUBJECT DESCRIPTION
  → What is the object? Life stage? Physical description?
  → Include trunk/stem + foliage/canopy + accent elements
  → Use hex codes inline for colors

Block 2: COMPOSITION
  → "floats centered on empty cream background #FBF5E6"
  → "NO ground tile" (tile is runtime)
  → Canvas height percentage
  → "3/4 isometric projection at 30-degree camera tilt"

Block 3: LIGHTING (Triple Anchoring)
  → Trunk: "light face on RIGHT side (#8B5A3C), shadow face on LEFT (#6B4423)"
  → Foliage: "light face on RIGHT side (#6B9B4F), shadow face on LEFT (#4A7C3A)"
  → Meta-rule: "every shape's light face must be on its right"

Block 4: SHADOW
  → "faint ambient occlusion hint in darker cream #D4C9B0 at 20% opacity"
  → "offset lower-left"
  → "NOT a solid shape, NOT a disc, NOT a plate, NOT a pool of paint"

Block 5: STYLE ANCHORS + NEGATIVES
  → "flat vector illustration in the style of Forest by Seekrtech and Plant Nanny"
  → "smooth bezier shapes, soft two-tone gradient shading"
  → "absolutely no outlines, no line art"
  → Negative list: "no painted brush strokes, no watercolor, no 3D, no anime, no Ghibli"
```

### Shape Disambiguation (when subject has flower + foliage)
Add between Block 1 and Block 2:
```
FOLIAGE is "smooth cloud-like puff" / "rounded cotton mass" / "dome canopy"
  → NOT "blob cluster" (triggers scalloped petal interpretation)
BLOSSOM is "TINY dots embedded IN foliage, max 3% of puff area"
  → "FOLIAGE MASSES, not blossoms"
NEGATIVES: "no flower-shaped clusters, no petal silhouettes, no scalloped edges"
```

---

## 4. Session Workflow

### Per-subject session (~30-60 min)

| Step | Time | Action |
|---|---|---|
| 1 | 5 min | Read playbook checklist, review Locked Style DNA + Lessons Learned |
| 2 | 10 min | Draft mature anchor prompt using Template § A |
| 3 | 5 min | Generate + evaluate. If FAIL → iterate prompt (usually 1-5 tries for anchor) |
| 4 | 5 min | Lock anchor. Generate bloom via `/banana edit` (additive) |
| 5 | 5 min | Generate seedling via `/banana edit` (complete replacement) |
| 6 | 10 min | Generate sapling (hardest — may need 2-3 tries) |
| 7 | 5 min | Post-process all 4 images (watermark, bg remove, resize) |
| 8 | 5 min | Save to `public/plants/<type>/`, update playbook Subject Library |

### Recommended subject order (by difficulty)
1. ✅ Cherry blossom (DONE — anchor for learning)
2. Sunflower (distinct shape, yellow accent)
3. Cactus (simple, no flower confusion)
4. Bonsai (classic tree shape)
5. Fern (green only, frond shapes)
6. Succulent (rosette form)
7. Rose bush (red accent, flower+foliage disambiguation needed)
8. Lavender (purple accent, thin stems)
9. Mushroom (unique shape — cap + stem)
10. Tomato plant (fruit accent)
11. Lemon tree (fruit accent)

---

## 5. Evaluation Criteria

When evaluating a generated image, check in order:

| # | Check | PASS | FAIL action |
|---|---|---|---|
| 1 | Style | Flat vector, Forest/Plant Nanny feel | Add more style anchors + negative styles |
| 2 | Palette | Matches hex codes from art bible §3 | Repeat hex codes in ALL CAPS, 2 places in prompt |
| 3 | Light direction | Light face RIGHT, shadow face LEFT | Add Triple Anchoring (3× light direction) |
| 4 | Shadow | Faint cream ellipse, NOT solid disc | Reframe as ambient occlusion + add disc/plate negatives |
| 5 | Composition | Centered, correct canvas %, no ground tile | Add "NO ground tile" + pin canvas % |
| 6 | No outlines | Smooth bezier edges only | Add "absolutely no outlines, no line art, no stroke" |
| 7 | Shape clarity | Foliage looks like canopy, not flowers | Apply Shape Disambiguation Rules |
| 8 | Subject identity | Recognizable as the intended plant species | Strengthen species-specific descriptors |

---

## 6. Known Failure Modes & Fixes

| Symptom | Problem name | Fix |
|---|---|---|
| Painted/watercolor look | **Style Drift** | Add "Forest by Seekrtech" reference + aggressive style negatives |
| 1/3 batch images match | **Batch Inconsistency** | STOP batch. Pick anchor → derive via `/banana edit` |
| Ground rendered as 3D slab | **Literal Tile Interpretation** | Remove tile entirely. Asset = object only |
| Shadow = solid brown disc | **Intent vs Element Confusion** | Reframe shadow as "ambient occlusion hint" + negatives |
| Light direction inconsistent | **Lighting Consistency Problem** | Triple Anchoring (3× direction in prompt) |
| Edit won't reduce size/density | **Anchor Gravity Problem** | Reframe as "COMPLETELY REPLACE" or use fresh generate |
| Foliage rendered as flowers | **Shape Semantic Collision** | Metaphor swap + role separation + size ratio cap + negatives |
| Colors don't match hex | **Palette Drift** | Repeat hex codes 2× in prompt, use ALL CAPS "MUST use exactly" |

---

## 7. Cost Model

| Item | Cost |
|---|---|
| Single image (Gemini NB2 @ 2K) | ~$0.134 |
| Mature anchor (avg 3-5 tries) | ~$0.40–$0.67 |
| 3 derived stages (avg 1-2 tries each) | ~$0.40–$0.80 |
| **Per plant total** | **~$0.80–$1.50** |
| **11 plants total** | **~$9–$16** |

### Completed
| Date | Subject | Images | Cost |
|---|---|---|---|
| 2026-04-19 | Cherry blossom (anchor R&D) | 5 | ~$0.67 |
| 2026-04-19 | Cherry blossom (3 stages) | 5 | ~$0.67 |
| **Total so far** | | **10** | **~$1.34** |

---

## 8. File Structure

### In-repo (committed)
```
public/plants/
├── cherry-blossom/
│   ├── seedling.png
│   ├── sapling.png
│   ├── mature.png      ← also serves as anchor reference
│   └── bloom.png
├── sunflower/
│   ├── seedling.png
│   ├── sapling.png
│   ├── mature.png
│   └── bloom.png
└── ... (11 plant types total)
```

### Working files (session-local, not committed)
- Anchor PNGs kept during iteration → cleaned up after stage completion
- Raw Gemini outputs → post-processed → final PNG committed

---

## 9. Document Hierarchy

```
06 - ART-BIBLE.md          ← WHAT: Visual style rules (this doc's pair)
07 - AI-ASSET-WORKFLOW.md   ← HOW: Pipeline, strategy, tooling (this doc)
ASSET-SESSION-PLAYBOOK.md   ← RUN: Session templates, prompts, lessons learned
```

- Art Bible = style rules (read once, reference as needed)
- This doc = workflow strategy (read once per project phase)
- Playbook = working doc opened every session (templates, subject library, lessons)

---

## 10. Change Log

| Date | Change | By |
|---|---|---|
| 2026-04-17 | v1.0 — initial workflow (Midjourney-based, speculative) | — |
| 2026-04-20 | **v2.0** — COMPLETE REWRITE based on proven cherry blossom workflow. Replaced Midjourney with banana-claude/Gemini. Replaced batch-by-stage with anchor-driven pipeline. Added prompt architecture (5-block structure). Added evaluation criteria and failure mode table. Updated cost model with real data. Changed from 5 stages to 4. Integrated all learned patterns (Triple Anchoring, Shape Semantic Collision, Anchor Gravity, Intent vs Element). | — |
