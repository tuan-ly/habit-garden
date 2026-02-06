# Habien 2.0 Implementation Plan

> **Status**: In Progress
> **Created**: 2026-02-06
> **Design Doc**: [HABIEN_2.0_DESIGN.md](./HABIEN_2.0_DESIGN.md)

---

## Overview

Progressive disclosure system: complexity is EARNED through consistency.

```
Day 1:   One plant. One tap. That's it.
Day 50:  Goals unlock. Metrics optional.
Day 150: Identity emerges. Legacy begins.
```

---

## Phases

| Phase | Name | Status | Details |
|-------|------|--------|---------|
| 1 | Tier System & Slot Limits | DONE | Core progression utilities |
| 2 | Garden Expansion System | PLANNED | [phase-02-garden-expansion.md](./phase-02-garden-expansion.md) |
| 3 | Celebration & Feedback | PLANNED | Level-up modals, unlock toasts |
| 4 | Goal Restructure | PLANNED | Separate Goals from Plants (1:N) |
| 5 | Identity System | PLANNED | Identity layer (Level 13+) |
| 6 | Guardrails | PLANNED | Cooldowns, warnings, overwhelm detection |

---

## Phase 1: Tier System & Slot Limits (DONE)

**Implemented**:
- `progression-system.ts` - Core utility (getMaxPlants, canPlantTier, checkSlotAvailability)
- `tier-badge.tsx` - TierBadge component (1-5 stars)
- `slot-indicator.tsx` - SlotIndicator (default/compact/progress variants)
- Tier filtering in AddPlantDialog
- Slot validation on plant creation
- Migration applied to Supabase

---

## Phase 2: Garden Expansion System (NEXT)

**Goal**: Garden grows visually as user levels up.

Features:
1. Garden size by level (3x3 -> 5x5 -> 7x7 -> dynamic)
2. Decoration unlocks (bushes -> mushrooms -> lanterns -> ponds)
3. Level-up modal with unlock preview
4. Garden expansion animation

See: [phase-02-garden-expansion.md](./phase-02-garden-expansion.md)

---

## Phase 3-6: Future

Detailed plans created when Phase 2 complete.

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/progression-system.ts` | Core progression logic |
| `src/lib/utils/grid-positioning.ts` | Grid calculations |
| `src/components/garden/isometric-garden.tsx` | Main garden view |
| `src/components/garden/garden-decorations.tsx` | SVG decorations |
| `src/types/database.ts` | Type definitions |

---

## Related Docs

- [Plant Catalog](./plant-designs/PLANT_CATALOG.md)
- [Scout Report: Phase 2 Files](./scout/scout-01-phase2-files.md)
- [Research: Garden Expansion UX](./research/researcher-260206-garden-expansion-ux.md)
- [Research: Decoration Systems](./research/researcher-260206-decoration-systems.md)
