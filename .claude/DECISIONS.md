# Architecture Decisions Log

> This file tracks important architectural decisions, trade-offs, and the reasoning behind them.

---

## Decision Format

```
## [DATE] Decision Title

**Status**: Accepted | Superseded | Deprecated
**Context**: Why this decision was needed
**Decision**: What was decided
**Consequences**: Trade-offs and implications
**Alternatives Considered**: Other options that were rejected
```

---

## 2026-01-14: Plant Image System over Emoji

**Status**: Accepted

**Context**:
Current plant display uses emoji (🌻, 🌸, etc.). User wants visuals similar to Forest app with distinct images for each growth stage.

Options considered:
1. Keep emoji with better animations
2. Static images (PNG) for each stage
3. SVG components with dynamic colors
4. Lottie animations for everything

**Decision**:
Use static images as primary (PNG/SVG), with Lottie only for transition animations. Create folder structure `public/plants/[type]/[stage].png`.

**Implementation**:
- `PlantImage` component renders appropriate image based on `plant.plant_type.name` and `growth_percentage`
- Fallback to `generic/` folder if specific plant type images not found
- 5 stages: seed, sprout, growing, blooming, mature
- Size options: sm, md, lg, xl, 2xl

**Consequences**:
- ✅ Much more visually appealing than emoji
- ✅ Each plant type can have unique visuals
- ✅ Growth stages clearly visible
- ✅ Fallback ensures no broken UI
- ❌ Requires creating/sourcing images for all plant types
- ❌ More storage/bandwidth for images

**Alternatives Considered**:
- **Emoji only**: Too simple, not engaging enough (Forest-like feel)
- **Lottie for everything**: Complex, heavy, overkill for static stages
- **CSS-only**: Limited visual customization per plant type

**Files Affected**:
- `src/components/plants/plant-image.tsx` - New component
- `src/components/plants/plant-visual.tsx` - Uses PlantImage
- `public/plants/` - Image folders

---

## 2024-01-14: CSS Animations over Lottie for Plant States

**Status**: Accepted

**Context**:
Need to animate plants through growth stages (seed → sprout → growing → blooming → mature → wilting → dead). Could use:
1. Lottie animations (JSON-based vector animations)
2. Pure CSS animations
3. Framer Motion / React Spring

**Decision**:
Use CSS animations as the primary animation system, with Lottie installed for future complex animations.

**Consequences**:
- ✅ No additional JS bundle size for basic animations
- ✅ Better performance (CSS animations are GPU-accelerated)
- ✅ Easier to customize with Tailwind classes
- ✅ Works without JavaScript
- ❌ Less complex animations possible
- ❌ Harder to create organic/natural movements

**Alternatives Considered**:
- **Lottie-only**: Would need to create/source animation files for each state
- **Framer Motion**: Adds bundle size, overkill for simple state animations

**Files Affected**:
- `src/app/globals.css` - All keyframe animations
- `src/components/plants/plant-visual.tsx` - Animation class assignment

---

## 2024-01-14: Deterministic Weather System

**Status**: Accepted

**Context**:
Weather affects plant growth and XP. Options:
1. Random weather each day (stored in DB)
2. Deterministic weather based on date (calculated)
3. API-based real weather

**Decision**:
Use deterministic pseudo-random weather based on date string hash. Same date always produces same weather.

**Consequences**:
- ✅ No database storage needed
- ✅ Consistent across all users
- ✅ Predictable for testing
- ✅ Can generate forecast without DB queries
- ❌ Less "real" randomness feel
- ❌ Can't have user-specific weather

**Implementation**:
```typescript
// Seed from date string, use sin() for pseudo-random
const seed = hashDateString(date)
const pseudoRandom = Math.abs(Math.sin(seed)) % 1
```

**Files Affected**:
- `src/lib/weather-system.ts` - `generateWeatherForDate()`

---

## 2024-01-14: Achievement Definitions in Code vs Database

**Status**: Accepted

**Context**:
Where to store achievement definitions:
1. Database table (achievements table)
2. Code constants
3. JSON file

**Decision**:
Store achievement definitions in TypeScript code (`src/lib/achievements.ts`), only track user unlocks in database.

**Consequences**:
- ✅ Type safety for achievement properties
- ✅ No DB query needed to display achievements
- ✅ Easy to version control changes
- ✅ Can reference in code without async
- ❌ Requires deploy to add new achievements
- ❌ Can't add achievements via admin UI

**Files Affected**:
- `src/lib/achievements.ts` - `ACHIEVEMENTS` array
- Database: `user_achievements` table (just user_id + achievement_id)

---

## 2024-01-14: XP Exponential Scaling

**Status**: Accepted

**Context**:
How to scale XP requirements per level:
1. Linear (100 XP per level)
2. Exponential (increasing per level)
3. Custom curve

**Decision**:
Exponential scaling with 1.5x multiplier per level.

**Formula**:
```
Level 2: 100 XP
Level 3: 150 XP (100 * 1.5)
Level 4: 225 XP (150 * 1.5)
...
```

**Consequences**:
- ✅ Early levels feel achievable
- ✅ Later levels require sustained engagement
- ✅ Prevents quick max-level
- ❌ May feel grindy at high levels

**Files Affected**:
- `src/lib/xp-system.ts` - `getXpToNextLevel()`

---

## 2024-01-14: Water Reserves as Streak Protection

**Status**: Accepted

**Context**:
Users may miss watering due to vacation, illness, etc. Need a forgiveness mechanism.

**Decision**:
Implement "Water Reserves" that automatically protect streak when user misses a day.

**Design**:
- Max reserves based on level (3 + level/2, capped at 10)
- Earned through leveling up and maturing plants
- Auto-consumed when streak would break
- 1 reserve = 1 day protection

**Consequences**:
- ✅ Reduces anxiety about missing days
- ✅ Rewards long-term engagement
- ✅ Gamifies the protection mechanism
- ❌ Needs careful balancing
- ❌ Could reduce urgency to water

**Files Affected**:
- `src/lib/water-reserves.ts`
- `src/types/database.ts` - Profile.water_reserves field

---

## 2024-01-14: Component Organization Pattern

**Status**: Accepted

**Context**:
How to organize components for a growing codebase.

**Decision**:
Feature-based folders with index exports:
```
components/
├── ui/           # Base shadcn components
├── plants/       # Plant-specific components
├── garden/       # Garden layout components
├── gamification/ # XP, achievements, weather
│   └── index.ts  # Barrel export
```

**Consequences**:
- ✅ Easy to find related components
- ✅ Clean imports via index files
- ✅ Scales well as app grows
- ❌ May have some cross-folder imports

**Files Affected**:
- `src/components/gamification/index.ts`

---

## 2024-01-14: Special Effects via Plant Type Name Matching

**Status**: Accepted

**Context**:
How to determine which special effect to show for a plant.

**Decision**:
Match by plant type name (lowercase) OR by special_effect.type from database.

```typescript
const plantName = plant.plant_type.name.toLowerCase()
if (plantName.includes('cherry') || effect.type === 'cycle') {
  // Show cherry blossom effect
}
```

**Consequences**:
- ✅ Works with existing plant_types data
- ✅ Flexible matching (name or effect type)
- ❌ String matching is fragile
- ❌ Needs consistency in naming

**Files Affected**:
- `src/components/plants/special-effects.tsx` - `PlantSpecialEffects`

---

## Template for Future Decisions

```
## [DATE] Decision Title

**Status**: Accepted | Superseded | Deprecated

**Context**:
[Why this decision was needed]

**Decision**:
[What was decided]

**Consequences**:
- ✅ [Positive]
- ❌ [Negative]

**Alternatives Considered**:
- [Option]: [Why rejected]

**Files Affected**:
- [file path]
```
