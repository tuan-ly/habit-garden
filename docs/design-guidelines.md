# Habit Garden — Design Guidelines

> **Purpose**: Visual and UX conventions for Habit Garden. Covers art style, component conventions, performance rules, and asset workflows.
> Reference sources: `docs/06 - ART-BIBLE.md`, `docs/07 - AI-ASSET-WORKFLOW.md`, `docs/09 - UI-COMPONENTS.md`, `docs/ASSET-SESSION-PLAYBOOK.md`

---

## 1. Design Philosophy

Habit Garden is a **calm, nature-inspired game UI** — not a productivity dashboard, not a social feed. Every visual decision should reinforce:

- **Growth over time** — subtle, beautiful, worth waiting for
- **Low guilt** — no red warnings, no punishing visuals for missed days
- **Delight** — the garden should be genuinely enjoyable to look at

### Tone & Mood

- Soft natural palettes (greens, earth tones, warm light)
- Game-style HUD elements feel playful, not corporate
- Celebrations (level up, achievements) are joyful and brief — not overwhelming

---

## 2. Performance Rules

> **Rule**: Canvas first. DOM animations are banned in the garden.

| Context | Approach |
|---------|---------|
| Garden tiles, plants, particles | **HTML5 Canvas** (`IsometricGarden`, `AmbientParticlesCanvas`, `WeatherEffects`) |
| Modals, sheets, transitions | Framer Motion (sparingly) |
| Garden tile/plant animations | Canvas only — no CSS transforms on many DOM nodes |
| Loading skeletons | CSS only (no JS animation libraries) |

**Why**: The isometric garden can have 20–50+ tiles rendering simultaneously. DOM-based animations cause frame drops. Canvas batches all draw calls in one frame.

---

## 3. Plant Asset Conventions

### File Path Structure

```
public/plants/[type-slug]/[stage].png
```

Stages (filename must match exactly):
```
seed.png
sprout.png
growing.png
mature.png
established.png     (future — Day 91+)
venerable.png       (future — Day 181+)
ancient.png         (future — Year 1+)
legendary.png       (future — Year 3+)
```

Examples:
```
public/plants/sunflower/seed.png
public/plants/sunflower/mature.png
public/plants/cherry-blossom/sprout.png
public/plants/generic/seed.png        ← fallback for all types
```

### Fallback Behavior

`PlantImage` component checks for type-specific image first, falls back to `public/plants/generic/[stage].png`. This ensures no broken UI even if a plant type lacks images.

### Asset Sizes

| Size prop | Pixel dimensions | Usage |
|-----------|-----------------|-------|
| `sm` | 32×32 | List thumbnails |
| `md` | 48×48 | Plant cards |
| `lg` | 64×64 | Detail sheet |
| `xl` | 96×96 | Focus view |
| `2xl` | 128×128 | Harvest/celebration |

### Art Style (from `06 - ART-BIBLE.md`)

- **Isometric pixel art** or **soft-rendered 2D** — consistent across all plant types
- Each plant type should be immediately recognizable at `md` (48px) size
- No photorealistic art — stylized/illustrative only
- Transparent background (PNG with alpha)
- Growth stages should show clear visual progression

---

## 4. Decoration Assets

```
public/decorations/[category]/[name].png
```

Categories: `workshop`, `nature`, `lighting`, `special`

Decorations render on isometric tiles — must fit the isometric perspective and tile scale.

---

## 5. AI Asset Workflow

See `docs/07 - AI-ASSET-WORKFLOW.md` and `docs/ASSET-SESSION-PLAYBOOK.md` for the full AI-assisted image generation workflow.

**Quick summary**:
1. Use the art bible as style reference prompt
2. Generate at 2× target size, downscale
3. Remove background (alpha channel)
4. Name files exactly per the convention above
5. Test in-app at all size props before committing

---

## 6. UI Component Conventions

See `docs/09 - UI-COMPONENTS.md` for full component documentation.

### shadcn/ui Base Layer

All base UI elements (Button, Dialog, Sheet, Tabs, Select, etc.) come from `src/components/ui/` — the shadcn/ui layer. Do not reinvent base components.

### Game-Style HUD

The HUD (`GameHud`) and navigation (`GameNav`) use a game aesthetic:
- Floating HUD overlay on the garden canvas
- Bottom navigation bar (5 tabs)
- Level/XP display in the HUD
- Upgrade badge on premium-gated nav items

### Tier Badges

`TierBadge` component displays plant tier (1–5) with color coding:
- Tier 1: green (beginner)
- Tier 2: blue
- Tier 3: purple
- Tier 4: orange
- Tier 5: red/gold (legendary)

### Modal/Sheet Hierarchy

| Component | Use case |
|-----------|---------|
| `Dialog` | Confirmations, short inputs (AddPlantDialog) |
| `Sheet` | Rich side panels (PlantDetailSheet, IdentityDetailSheet) |
| `Modal` (custom) | Full-screen celebrations (LevelUpModal, WelcomeBackModal) |

---

## 7. Accessibility

- All interactive elements must have accessible labels
- Color is never the sole indicator of state (always pair with icon or text)
- Touch targets minimum 44×44px (Capacitor mobile)
- Mood selector and XP bar have aria labels

---

## 8. Garden Visual States

| Plant State | Visual Cue |
|-------------|-----------|
| `growing` | Normal appearance |
| `thriving` | Subtle glow or particle |
| `mature` | Full size, no moisture decay |
| `dead` | Wilted, grayscale — moved to Cemetery |
| `dormant` | (Deprecated) treat as resting |
| Low moisture | Wilting animation / moisture bar warning color |
| Streak 7+ | Bonfire particle effect near plant |

Weather overlays (Canvas):
- Rainy: falling water drop particles
- Stormy: rain + lightning flash
- Rainbow: color arc overlay (rare, 5%)
- Sunny: warm light tint
- Cloudy: desaturated sky

---

## 9. Onboarding

5-step tutorial flow (`src/components/onboarding/`). Rules:
- Never skip steps programmatically without user action
- Each step introduces one concept (plant, watering, XP, mood, garden)
- Tone: warm, encouraging, never condescending
