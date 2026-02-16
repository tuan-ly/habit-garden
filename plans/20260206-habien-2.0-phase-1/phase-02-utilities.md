# Phase 02: Utility Functions

## Overview
Create utility functions for tier checking and slot limits.

## New File: `src/lib/progression-system.ts`

### Functions

```typescript
// Get max plants allowed for a level
export function getMaxPlants(level: number): number

// Get tier requirements
export function getTierRequirements(tier: number): TierRequirement

// Check if user can plant a specific tier
export function canPlantTier(profile: Profile, tier: number): { allowed: boolean; reason?: string }

// Check if user has available plant slots
export function hasAvailableSlot(profile: Profile, currentPlantCount: number): boolean

// Get user's current phase
export function getUserPhase(level: number): 'seedling' | 'gardener' | 'sage'

// Get unlocked tiers for a level
export function getUnlockedTiers(level: number): number[]
```

## Implementation Steps

1. Create `src/lib/progression-system.ts`
2. Export types for tier requirements
3. Add constants for tier/slot mappings

## Files to Create
- `src/lib/progression-system.ts`

## Files to Modify
- `src/lib/actions/plants.ts` - Use slot checking in createPlant
- `src/lib/actions/profile.ts` - Update phase/stats on level up
