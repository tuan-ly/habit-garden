# Habien 2.0 Phase 1: Foundation - Tier System & Slot Limits

> **Created**: 2026-02-06
> **Status**: In Progress
> **Branch**: feature/habien-2.0-phase-1

## Overview

Implement the foundation for progressive disclosure: tier system for plants and slot limits by user level.

## Phases

| Phase | Name | Status | Files |
|-------|------|--------|-------|
| 01 | Database Schema | Done | [phase-01](phase-01-database.md) |
| 02 | Utility Functions | Done | [phase-02](phase-02-utilities.md) |
| 03 | UI Components | Done | [phase-03](phase-03-ui.md) |
| 04 | Integration | Done | [phase-04](phase-04-integration.md) |

## Key Changes

1. **plant_types**: Add `tier` (1-5), `tier_unlock_level`
2. **profiles**: Add `max_plants`, `unlocked_tiers`, `phase`, `longest_streak`, `total_mature_plants`
3. **New utilities**: `getMaxPlants()`, `canPlantTier()`, `getTierRequirements()`
4. **UI**: TierBadge, SlotIndicator, filtered plant picker

## Success Criteria

- [x] Plant types have tier assignments
- [x] Profiles track slot limits and unlocked tiers
- [x] Plant picker filters by unlocked tiers
- [x] Slot limit enforced when creating plants
- [x] Tier badge displays on plants
- [x] Type checking passes

## Files Created/Modified

### New Files
- `src/lib/progression-system.ts` - Core tier/slot logic
- `src/components/ui/tier-badge.tsx` - TierBadge component
- `src/components/garden/slot-indicator.tsx` - SlotIndicator component
- `supabase/migrations/20260206_habien_2_0_phase_1.sql` - DB migration

### Modified Files
- `src/types/database.ts` - Added tier/phase types
- `src/components/plants/add-plant-dialog.tsx` - Tier filtering + slot check
- `src/lib/actions/plants.ts` - Tier/slot validation in createPlant
