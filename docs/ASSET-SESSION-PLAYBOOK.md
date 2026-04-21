# Asset Generation Session Playbook

> **Mục đích**: Mở file này MỖI session tạo hình. Copy template, điền, chạy, ghi note.
> **Tool**: `banana-claude` skill (Gemini Nano Banana 2 — `gemini-3.1-flash-image-preview`)
> **Style direction**: Flat Vector (Forest app by Seekrtech) — pending architectural decision (xem AI-ASSET-WORKFLOW.md)

---

## 🚀 Session Start Checklist

Mở session mới → kiểm tra theo thứ tự:

- [ ] `GEMINI_API_KEY` đã set (`echo $GEMINI_API_KEY` không trả MISSING)
- [ ] Đọc lại **§ Locked Style DNA** bên dưới — không phá nguyên tắc đã chốt
- [ ] Đọc lại **§ Lessons Learned** — tránh lặp lỗi
- [ ] Quyết định: hôm nay làm **subject mới** hay **iterate subject cũ**?
  - Subject mới → dùng template § A
  - Iterate → dùng template § B (anchor image + edit)
- [ ] Output folder ready: `public/plants/[subject]/[stage].png`

---

## 🔒 Locked Style DNA (KHÔNG đổi giữa session)

> Bất kỳ ai sửa phần này phải ghi vào § Lessons Learned tại sao đổi.

### Palette (hex codes — paste nguyên văn vào prompt)
```
Background: solid flat cream ivory #FBF5E6
Ground strip (bottom 15%): sandy tan #C8A576
Trunk light face: warm brown #8B5A3C
Trunk shadow face: deep brown #6B4423
Foliage green light: #6B9B4F
Foliage green shadow: #4A7C3A
Accent pink (gentle): #F5B8C8
Accent pink (deep): #E88FA8
```

### Style Anchors (luôn xuất hiện trong prompt)
- "flat vector illustration"
- "in the style of mobile mindfulness games like Forest by Seekrtech and Plant Nanny"
- "smooth bezier shapes"
- "soft two-tone gradient shading split per shape (light face vs shadow face)"
- "no outlines, no line art"

### Composition Defaults
- Aspect ratio: `1:1`
- imageSize: `2K`
- Camera: **"3/4 isometric projection at 30-degree camera tilt"** (CHANGED 2026-04-19, was side-view orthographic — incompatible with `IsometricGarden` tile system)
- Subject placement: **"floats centered on empty cream background, NO ground tile"** (CHANGED 2026-04-19 — tile composited at runtime in React layer, not baked into asset)
- Lighting: **"soft diffuse ambient light from upper-RIGHT"** (CHANGED 2026-04-19, was upper-left — golden-hour mood preferred)
- Shadow: faint ambient occlusion ellipse in cream tone (~#D4C9B0, 20% opacity), offset lower-left, NEVER solid disc/plate
- Reference games for isometric: Monument Valley, Alto's Adventure (in addition to Forest, Plant Nanny for style)

### Banned Words (Gemini-banned, KHÔNG dùng)
~~8K, 4K, masterpiece, ultra-realistic, hyperrealistic, photorealistic, highly detailed, best quality, trending on artstation, award winning~~

### Semantic Negatives (rephrase, không dùng "no/not")
- ❌ "no clouds, no scenery"
- ✅ "background completely uncluttered, empty, no horizon"
- ❌ "not painted style"
- ✅ "flat vector, smooth bezier shapes, no painted brush strokes" (negative reframe OK khi liệt kê style exclusions cuối prompt)

### Shape Disambiguation Rules (cho plant/tree prompts có flower + foliage)
> Tránh **Shape Semantic Collision** — lesson 2026-04-19 sapling v2.
- Gọi foliage là: "smooth cloud-like puff", "rounded cotton mass", "dome canopy" (KHÔNG "blob cluster" vì dễ bị scallop)
- Gọi blossom là: "TINY dots embedded IN foliage", size ≤ 3% of puff area
- Explicit role label: "FOLIAGE MASSES, not blossoms" / "blossoms sitting on leaves, not flower centers"
- Negative list: "no flower-shaped clusters, no petal silhouettes, no scalloped edges"

---

## 📋 Template § A — New Subject Generation

Copy block này → điền `[BRACKETS]` → paste vào Claude:

```
/banana generate

A single [SUBJECT name + life-stage descriptor] as a stylized game asset,
[TRUNK/STEM description: shape + material + color light/shadow with hex],
[FOLIAGE/HEAD description: blob clusters / shape + 2-tone hex + accent dots],
NO individual leaves, NO black outlines.

The subject stands rooted at center frame on a thin sandy-tan ground strip
(#C8A576) covering the bottom 15% of canvas, with a subtle soft elliptical
drop shadow beneath the base. Background is solid flat cream ivory (#FBF5E6),
no horizon, no clouds, no additional scenery, completely uncluttered.

Composition is centered side-view elevation, the subject fills approximately
[HEIGHT %]% of canvas height, perfectly symmetrical staging, camera-eye-level
orthographic framing.

Rendered as flat vector illustration in the style of mobile mindfulness games
like Forest by Seekrtech and Plant Nanny: smooth bezier shapes, soft two-tone
gradient shading split per shape (light face vs shadow face), absolutely no
outlines, no line art, no painted brush strokes, no watercolor texture, no
3D rendering, no isometric projection, no photorealism, no anime, no Studio
Ghibli painted look. Soft diffuse ambient light from upper-left, gentle cozy
meditative mood, warm limited palette restricted to: cream ivory background,
sandy tan ground, [SUBJECT-SPECIFIC color families].
```

**Settings**: ratio `1:1`, imageSize `2K`, model `gemini-3.1-flash-image-preview`

---

## 📋 Template § B — Iterate from Anchor

Khi đã có 1 ảnh "đạt" và muốn tạo các stage/biến thể nhất quán:

```
/banana edit [path/to/anchor.png]

[Specific change instructions, ví dụ:
"Replace the dense pink canopy with a smaller sapling version: only 30%
canopy size, sparser blob clusters, 2-3 visible pink dots only. Keep
everything else identical: same trunk style, same palette, same composition,
same background color, same ground strip, same lighting direction."]
```

**Settings**: keep ratio + imageSize giống anchor.

---

## 📋 Template § C — Batch Variations (cùng subject, khác stage)

```
/banana batch [SUBJECT mô tả ngắn] 4
```

Sau đó cho Claude biết 5 stage variations:
- Stage 1 — Seedling: ~10% canvas, tiny sprout, 1-2 leaves + bud
- Stage 2 — Sapling: ~25% canvas, sparse foliage, 2-3 accent dots
- Stage 3 — Juvenile: ~45% canvas, mid-size, species feature clear, half-developed
- Stage 4 — Mature: ~65% canvas, full foliage Y-split branches
- Stage 5 — Bloom: ~75% canvas, dense foliage + extra accent dots + floating petals/fruit

---

## 🧪 Subject Library (đánh dấu khi đã chốt anchor)

| # | Subject | Anchor file | Status | Notes |
|---|---------|-------------|--------|-------|
| 1 | Cherry blossom | `public/plants/cherry-blossom/mature.png` | **4/5 ✅** (seedling ✅, sapling ✅, mature ✅, bloom ✅, juvenile ✅) | accent pink, prompt v5, isometric no-tile, light upper-right |
| 2 | Sunflower | `public/plants/sunflower/mature.png` | **COMPLETE ✅** (seedling ✅, sapling ✅, juvenile ✅, mature ✅, bloom ✅) | accent yellow #F5C842, first-try anchor |
| 3 | Cactus | `public/plants/cactus/04-blooming.png` | **COMPLETE ✅** (seedling ✅, sapling ✅, juvenile ✅, mature ✅, bloom ✅) | accent green only, pink flowers on bloom stage, first-try all 5 stages |
| 4 | Succulent | — | TODO | rosette form, accent muted |
| 5 | Bonsai | — | TODO | accent green dark #2D5016 |
| 6 | Rose bush | — | TODO | accent red #C84A4A |
| 7 | Lavender | — | TODO | accent purple #9B7BC4 |
| 8 | Mushroom | — | TODO | red cap with white dots |
| 9 | Fern | — | TODO | green only, frond shapes |
| 10 | Tomato plant | — | TODO | accent red fruit |
| 11 | Lemon tree | — | TODO | accent yellow #E8C547 fruit |

---

## 📓 Lessons Learned (cập nhật mỗi session)

> Format mỗi entry: **YYYY-MM-DD | Subject | Issue → Fix**

### 2026-04-19 | Setup | Skill bootstrap
- Plugin install path: `~/.claude/plugins/cache/banana-claude-marketplace/banana-claude/1.4.1/`
- Required: `GEMINI_API_KEY` env var (set via `setx` on Windows, **must restart Claude Code**)
- MCP fallback: `python scripts/generate.py --prompt "..." --aspect-ratio "1:1"`

### 2026-04-19 | Cherry blossom v1 (Gemini drift) | Painted style → Add aggressive style anchors
- **Issue**: Prompt v1 returned painted illustration thay vì flat vector
- **Fix**: Thêm explicit "Forest by Seekrtech and Plant Nanny" reference + liệt kê negative styles cuối prompt ("no painted brush strokes, no watercolor, no 3D, no isometric, no anime, no Studio Ghibli")

### 2026-04-19 | Cherry blossom v2 | Inconsistent batch (1/3 đúng) → Use anchor + edit pipeline
- **Issue**: `/banana batch 3` cho ra 1 ảnh đúng, 2 ảnh drift style
- **Fix**: Pick best image làm anchor → dùng `/banana edit` với "keep everything else identical" để gen các variation

### 2026-04-19 | Cherry blossom v2 isometric-with-tile | Gemini render tile as 3D extruded slab → Remove ground tile entirely
- **Issue**: Prompt v2 "rhombus-shaped isometric ground tile" → model interpret literally, render 3D slab có depth/thickness, clash flat vector DNA
- **Fix**: Bỏ tile geometry hoàn toàn. Asset chỉ có tree + faint shadow. Tile là runtime concern của `IsometricGarden` component, không bake vào sprite
- **Pattern learned**: **Separation of Concerns** — asset render object only, environment (tile/ground) composite ở React layer

### 2026-04-19 | Cherry blossom v3 → v4 | Lighting direction change (upper-left → upper-right)
- **Issue**: Light upper-left cho feel "morning fresh" — user prefer "golden hour cozy" cho app mood
- **Fix**: Flip light direction, cập nhật Locked Style DNA. Dùng **Triple Anchoring** technique — nhắc lại direction 3 lần (trunk block + canopy block + style block với meta-rule "every shape's light face must be on its right")
- **Pattern learned**: **Lighting Consistency problem** — Gemini drift ánh sáng khi prompt dài, mỗi shape tự suy diễn → conflicting shadows. Fix: reinforce direction ở nhiều context

### 2026-04-19 | Cherry blossom v4 | Drop shadow rendered as solid brown disc → Reframe as ambient occlusion
- **Issue**: "elliptical drop shadow ... dark-brown" → model render opaque brown ellipse như 1 đĩa đất, regression của v2 tile problem
- **Fix**: Rephrase shadow thành "faint ambient occlusion hint in darker cream tone #D4C9B0 at 20% opacity", thêm aggressive negatives: "NOT a solid shape, NOT a disc, NOT a plate, NOT a pool of paint"
- **Pattern learned**: **Intent vs Element confusion** — từ "shadow" + "dark color" dễ bị hiểu thành illustrated element thay vì rendering effect. Cần đặc tả như art-direction note chứ không phải object description
- **Prompt diff**: v4→v5 = replace shadow block + expand negative list với 3 shadow-specific negatives

### 2026-04-19 | Cherry blossom v5 | LOCKED ANCHOR ✅
- **Result**: Perfect flat vector, isometric 3/4, light upper-right consistent across trunk+canopy+shadow, faint cream shadow offset lower-left
- **Key techniques** hợp lại: Intent Priming ("composited onto separate tile later") + Triple Anchoring (lighting) + Ambient Occlusion reframe (shadow) + Aggressive Negatives (disc/plate/pool/tile)
- **Watermark cleanup**: `magick anchor.png -gravity SouthEast -chop 60x60 cleaned.png`
- **Next**: Derive sapling/seedling/bloom stages qua `/banana edit` from this anchor (NOT batch generation — anchor-driven strategy per Lessons 2026-04-19 v2 of session 1)

### 2026-04-19 | Cherry blossom seedling+bloom (edit from anchor) | PASS first try
- **Seedling**: tiny sprout 10% canvas, 2 leaves + 1 pink bud, light/shadow consistent với anchor → ✅ lock
- **Bloom**: same silhouette + 3-4 floating petals + extra deep-pink dots → ✅ lock
- **Pattern reinforced**: `/banana edit` rất ổn cho **additive deltas** (thêm chi tiết, intensify) và **complete replacements** (seedling = brand new tiny subject)

### 2026-04-19 | Cherry blossom sapling | Anchor Gravity drift → Reframe as new subject
- **Issue**: Prompt v1 mô tả "younger sapling version" → Gemini giữ canopy size + density gần như mature anchor, chỉ giảm nhẹ. User không phân biệt được sapling vs mature
- **Root cause**: **Anchor Gravity problem** — `/banana edit` resist khi delta là "giảm/shrink/sparse". Strong với "add/intensify", weak với "remove/reduce"
- **Fix v2**: 3 đòn cùng lúc:
  1. **Reframe**: "COMPLETELY REPLACE with brand new subject, NOT modifying existing tree"
  2. **Quantify aggressive**: pin đúng % canvas, đếm cluster (3), đếm dots (2)
  3. **Negative space anchor**: "upper 65% must be empty cream space" — buộc model leave whitespace
- **Pattern learned**: **Subtractive Edit Problem** — khi delta là giảm size/density, phải treat như fresh generation chứ không phải edit. Hoặc switch sang `/banana generate` template § A với cùng style anchors

### 2026-04-19 | Cherry blossom sapling v2 | Shape Semantic Collision → Disambiguate shape vs decoration
- **Issue v2**: Prompt v2 dùng "blob cluster" + "deep-pink accent dot" → model render 3 bông HOA ĐƠN LẺ (scallop edges = petals, center dot = nhụy). Mất feel "tán lá có blossom rải".
- **Root cause**: **Shape Semantic Collision** — khi "scalloped shape + centered dot" xuất hiện gần nhau trong prompt, Gemini default interpret = flower (trained bias). Shape vocabulary overloaded.
- **Fix v3** (3 đòn):
  1. **Metaphor swap**: "blob cluster" → "smooth cloud-like foliage puff" / "rounded cotton ball / small cloud" — ép continuous smooth shape, cấm scallop
  2. **Role separation**: explicit "FOLIAGE MASSES, not blossoms" + "blossom dots are TINY embedded IN foliage, NOT centers of flowers"
  3. **Size ratio lock**: "each dot max 3% of puff area" — quantify để dot không upscale thành nhụy
  4. **Negative list mở rộng**: "no flower-shaped clusters, no petal silhouettes, no scalloped edges"
- **Pattern learned**: **Shape Semantic Collision problem** — Khi 2+ visual element cùng shape (ví dụ: lá + cánh hoa đều "soft curved"), prompt phải force-disambiguate bằng: (a) contrasting metaphor, (b) explicit role label ("foliage mass" vs "blossom"), (c) size ratio hard-cap, (d) negative list specific to confused shape.

### 2026-04-20 | Sunflower | First-try anchor + all 5 stages PASS
- **Result**: Mature anchor PASS first try. Seedling, sapling, bloom all PASS first try. Juvenile PASS first try.
- **Pattern**: Sunflower's distinct shape (tall stem + round flower head) avoids Shape Semantic Collision — no ambiguity between flower and foliage.
- **Cost**: ~5 images × $0.134 = ~$0.67

### 2026-04-20 | 5-stage system | Added Juvenile stage between sapling and mature
- **Change**: Expanded from 4 stages (seedling→sapling→mature→bloom) to 5 stages (seedling→sapling→juvenile→mature→bloom)
- **Juvenile**: ~45% canvas, species feature clearly visible, half-developed form
- **Rationale**: Better growth progression — user sees more gradual development

### 2026-04-20 | Cherry blossom juvenile v1 | Style mismatch → Use edit from anchor
- **Issue**: `/banana generate` fresh cho cherry blossom juvenile → ra cây xanh generic, mất tông pink cherry blossom DNA
- **Root cause**: **Cross-Subject Style Drift** — fresh generation without anchor reference loses species-specific palette. Sunflower ok vì distinct shape, cherry blossom cần pink foliage tông which only anchor preserves.
- **Fix v2**: Switch to `/banana edit` from mature anchor. Explicitly reference "same pink foliage tone (#F5B8C8 light, #E88FA8 shadow)" in prompt.
- **Pattern learned**: **Anchor-Dependent Species** — plants with non-standard foliage color (pink cherry, purple lavender) MUST use edit-from-anchor for all stages to preserve palette. Green-foliage plants (sunflower, cactus) can use fresh generate safely.

### 2026-04-20 | Cherry blossom juvenile v2 | Anchor Gravity (again) → needs v3
- **Issue**: Edit from anchor produced correct pink tone but size ~65% (same as mature) — Anchor Gravity resists size reduction
- **Fix v3**: More aggressive "COMPLETELY REPLACE", "significantly smaller", "half the size of current canopy", reinforced empty space requirement

### 2026-04-21 | Cactus | All 5 stages PASS first try
- **Result**: All 5 stages generated successfully on first attempt. Mature anchor + bloom (edit from anchor) + seedling/sapling/juvenile (fresh generate).
- **Pattern**: Saguaro cactus has distinct silhouette (cylinder + arms) — no Shape Semantic Collision. Green-foliage = safe for fresh generate (no anchor-dependent palette issue).
- **Issue**: Stages 1-3 output ~16:9 ratio despite 1:1 setting — Gemini sometimes ignores ratio when subject is small relative to canvas. Need to crop to square in post-processing.
- **Lesson**: For future subjects, add explicit "SQUARE 1:1 canvas, equal width and height" in prompt text to reinforce the API ratio setting.
- **Cost**: ~5 images × $0.134 = ~$0.67

### [Template cho entry mới]
```
### YYYY-MM-DD | [Subject] | [Issue] → [Fix]
- **Issue**:
- **Fix**:
- **Prompt diff**:
```

---

## 💸 Cost Tracking

| Date | Subject | Stages | Images | Est. cost |
|------|---------|--------|--------|-----------|
| 2026-04-19 | Cherry blossom (anchor R&D) | mature only | 5 (v1→v5) | ~$0.67 |
| 2026-04-19 | Cherry blossom (3 stages from anchor) | seedling, sapling-v1, bloom | 3 | ~$0.40 |
| 2026-04-19 | Cherry blossom sapling iteration | sapling v2 (fail), v3 (pass) | 2 | ~$0.27 |
| 2026-04-20 | Sunflower (all 5 stages) | seedling, sapling, juvenile, mature, bloom | 5 | ~$0.67 |
| 2026-04-20 | Cherry blossom juvenile | v1 (fail), v2 (Anchor Gravity), v3 | 3 | ~$0.40 |
| 2026-04-21 | Cactus (all 5 stages) | seedling, sapling, juvenile, mature, bloom | 5 | ~$0.67 |

**Pricing reference**: NB2 @ 2K = ~$0.134/image. 11 plants × 5 stages = 55 images ≈ **$7.37**

---

## 🔧 Post-Processing Pipeline (sau khi gen xong)

Khi 1 subject đã có 5 stage đạt chuẩn:

```bash
# 1. Background remove (nếu cần transparent PNG cho game engine)
# Skill: media-processing → RMBG hoặc ImageMagick fuzz transparent

magick input.png -fuzz 8% -transparent "#FBF5E6" output-transparent.png

# 2. Resize cho game (vd 512x512 sprite)
magick output-transparent.png -resize 512x512 stages/[plant]/[stage].png

# 3. Optimize file size
pngquant --quality=80-95 stages/[plant]/[stage].png --output final/[plant]/[stage].png
```

---

## 🎯 Decision Tree — Khi gen ra ảnh không đạt

```
Ảnh sai gì?
│
├── Style sai (painted/3D/anime)
│   → Tăng cường § Locked Style DNA anchors, thêm "no [sai style]" cuối prompt
│   → Ghi vào § Lessons Learned
│
├── Palette sai (màu lệch hex)
│   → Lặp lại hex code ở 2 chỗ trong prompt (subject + style block)
│   → Dùng ALL CAPS "MUST use exactly these colors:"
│
├── Composition sai (lệch tâm / sai góc)
│   → Thêm "ALL CAPS" critical: "MUST be perfectly centered, side-view elevation"
│
├── Background sai (có cảnh / chi tiết thừa)
│   → Semantic reframe: "completely empty cream-colored canvas, no horizon, no clouds"
│
└── 1/3 ảnh đúng (batch inconsistency)
    → STOP batch. Pick anchor → dùng /banana edit cho variations
```

---

## 📚 References

- Master workflow doc: `docs/07 - AI-ASSET-WORKFLOW.md`
- Art bible: `docs/06 - ART-BIBLE.md`
- Skill source: `~/.claude/plugins/cache/banana-claude-marketplace/banana-claude/1.4.1/skills/banana/SKILL.md`
- Gemini model docs: `~/.claude/plugins/cache/banana-claude-marketplace/banana-claude/1.4.1/skills/banana/references/gemini-models.md`
- Prompt engineering: `~/.claude/plugins/cache/banana-claude-marketplace/banana-claude/1.4.1/skills/banana/references/prompt-engineering.md`
- API key: https://aistudio.google.com/apikey
