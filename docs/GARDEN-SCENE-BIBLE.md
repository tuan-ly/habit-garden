---
status: active
brand: Habien v3
style: Fun-First Cozy Diorama Garden
last_updated: 2026-05-18
---

# Habien v3 Garden Scene Bible

> This document is the scene-level partner to `06 - ART-BIBLE.md`. The Art Bible defines how individual assets look. This Scene Bible defines how the whole `/garden` screen feels.

## North Star

Habien v3 is a **fun-first cozy diorama garden**. The garden should feel collectible, alive, and worth opening even before the user thinks about productivity.

The screen fantasy is:

- A small personal garden that grows into a place.
- A soft game world, not a dashboard.
- Progress made visible as beauty, density, and long-term plant presence.
- Behavior science appears later as rewards, not lectures.

## Default Direction

Use **Cozy Diorama Garden** as the default art direction.

Do not use **Minimal Zen Garden** as the main style. Zen mode may exist as a separate focus state, but the everyday garden must feel warm, collectible, and visually rewarding.

## Camera & Composition

- Keep the island centered and readable as a diorama object.
- Low-level gardens should feel intimate, not empty. A 3x3 plot should look like a starter patch with intentional edges, props, and life.
- The eye should land on a focal cluster first: hero plant, newest plant, or center garden feature.
- Empty space is allowed only when it frames a focal point. Unclaimed blank grass is a defect.
- Prefer clusters over even scatter: plants, rocks, flowers, and paths should form small readable groups.

## Density Rules

Every garden should include three density layers:

1. **Hero Layer**: plants and user-placed decorations.
2. **Garden Texture Layer**: paths, soil patches, grass tufts, flowers, stones, clover, moss.
3. **Atmosphere Layer**: particles, soft weather, skyline, haze, distant silhouettes.

Starter gardens need more automatic texture because they have fewer user assets. Higher-level gardens can rely more on placed plants and decorations.

## Ground Plane

- The ground is not a blank board. It is a living surface.
- Add soft paths, patch variation, soil islands, and corner/edge detail.
- Keep grid lines almost invisible outside arrange mode.
- The island side faces should be warm earth, softly beveled, and never look like a hard plywood slab.

## UI Chrome

Garden UI must feel like it belongs near the diorama.

- Prefer cream glass, sage accents, honey rewards, and warm earth borders.
- Avoid dark slate pills on the garden unless a true night mode needs them.
- Controls should be compact, quiet, and visually secondary to the garden.
- Use Lucide icons for commands. Keep emoji only for plant/world flavor where it reads as art.
- Status markers should be in-world plaques, droplets, glow rings, or tiny markers, not neon app badges.

## Badge Rules

- Never use loud labels like `MATURE` as floating neon UI.
- Mature plants should communicate status through bloom glow, gold leaf, small plaque, or ambient effects.
- Goal progress tags may be small wooden/cream plaques at the plant base.
- Thirst indicators should be soft and helpful, not alarm-like.

## Palette Budget

Use the Habien v3 scene palette:

- Canopy: `#1F3A2E`
- Leaf: `#3B7A57`
- Moss: `#6BA57A`
- Bloom/Honey: `#E8B96A`
- Sky/Mist: `#CFE6E3`
- Cream Paper: `#F7F4EC`
- Cloud: `#FEFCF7`
- Warm Soil: `#A08060`
- Deep Soil: `#7C5E48`
- Water: `#4A9EDE`

The garden may use many details, but the color system must stay restrained. Do not add saturated blue, neon green, purple, or dark slate unless a feature explicitly requires it.

## Progression Fantasy

Growth is not just bigger numbers. Growth should be visible as:

- Plants becoming visually dominant over time.
- Mature and ancient plants affecting nearby tiles with shade, moss, butterflies, glow, or small ground changes.
- Garden expansions feeling like new places, not just more grid.
- Decorative density increasing with level.

## Ship Checklist

- [ ] Garden has a clear focal point.
- [ ] Starter garden does not look empty.
- [ ] UI chrome uses cream/sage, not dark dashboard pills.
- [ ] Mature/goal states feel in-world.
- [ ] Ground plane has texture, path, or patch variation.
- [ ] Visual density improves with level.
- [ ] Screenshot reads as a cozy game world before reading any text.
