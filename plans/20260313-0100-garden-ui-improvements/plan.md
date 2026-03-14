# Garden UI Improvements Plan

> **Created**: 2026-03-13
> **Status**: Planning
> **Branch**: `feature/decoration-plant-crafting`

## Summary

3 tasks to polish the garden UI after the decoration system (Phase 7) completion:
1. Fix shadow rendering bug on decoration tiles
2. Restructure bottom nav (8 → 5 items) + create `/store` page
3. Merge Edit + Decorate into single "Arrange" mode

## Phases

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 01 | [Shadow Bug Fix](phase-01-shadow-fix.md) | Pending | 15 min |
| 02 | [Nav Restructure + Store Page](phase-02-nav-store.md) | Pending | 3-4 hrs |
| 03 | [Arrange Mode Merge](phase-03-arrange-mode.md) | Pending | 2-3 hrs |

## Dependencies

- Phase 1: Independent
- Phase 2: Independent
- Phase 3: Depends on Phase 2 (nav changes affect mode toolbar positioning)

## Key Files

| File | Phases |
|------|--------|
| `src/components/garden/isometric-tile.tsx` | 1 |
| `src/components/garden/garden-tile-grid.tsx` | 1, 3 |
| `src/components/game-ui/game-nav.tsx` | 2 |
| `src/app/(dashboard)/store/page.tsx` | 2 (new) |
| `src/components/garden/mode-toolbar.tsx` | 3 |
| `src/components/garden/isometric-garden.tsx` | 3 |
| `src/hooks/use-garden-interactions.ts` | 3 |
| `src/components/garden/edit-mode/edit-mode-overlay.tsx` | 3 |

## Context

- InventoryProvider already in dashboard providers chain
- CraftingWorkshop + ShopSheet are Sheet modals — content extractable for inline page use
- Workshop/Shop routes don't exist yet (would 404)
- `GardenMode = 'interact' | 'edit' | 'decorate'` with separate edit-mode overlay system
