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
- Camera: "side-view elevation, camera-eye-level orthographic framing"
- Subject placement: "rooted at center frame on ground strip, perfectly symmetrical staging"
- Lighting: "soft diffuse ambient light from upper-left"

### Banned Words (Gemini-banned, KHÔNG dùng)
~~8K, 4K, masterpiece, ultra-realistic, hyperrealistic, photorealistic, highly detailed, best quality, trending on artstation, award winning~~

### Semantic Negatives (rephrase, không dùng "no/not")
- ❌ "no clouds, no scenery"
- ✅ "background completely uncluttered, empty, no horizon"
- ❌ "not painted style"
- ✅ "flat vector, smooth bezier shapes, no painted brush strokes" (negative reframe OK khi liệt kê style exclusions cuối prompt)

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

Sau đó cho Claude biết 4 stage variations:
- Stage 1 — Seedling: ~10% canvas, no foliage, just sprout
- Stage 2 — Sapling: ~35% canvas, sparse foliage, 2-3 accent dots
- Stage 3 — Mature: ~65% canvas, full foliage Y-split branches
- Stage 4 — Bloom: ~75% canvas, dense foliage + extra accent dots

---

## 🧪 Subject Library (đánh dấu khi đã chốt anchor)

| # | Subject | Anchor file | Status | Notes |
|---|---------|-------------|--------|-------|
| 1 | Cherry blossom | — | TODO | accent pink |
| 2 | Sunflower | — | TODO | accent yellow #F5C842 |
| 3 | Cactus | — | TODO | accent green only, no flower |
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
| — | — | — | — | — |

**Pricing reference**: NB2 @ 2K = ~$0.134/image. 11 plants × 4 stages = 44 images ≈ **$5.90**

---

## 🔧 Post-Processing Pipeline (sau khi gen xong)

Khi 1 subject đã có 4 stage anchor đạt chuẩn:

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
