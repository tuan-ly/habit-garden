# Habit Garden Testing Strategy

> **Created**: 2026-02-11
> **Status**: Planning
> **Scope**: Comprehensive testing infrastructure from scratch

---

## Executive Summary

This document outlines a 4-layer testing approach for Habit Garden:

1. **Dev Debug Panel** - Rapid manual testing in dev mode
2. **Unit Tests** - Automated logic verification with Vitest
3. **Storybook** - Visual component documentation/testing
4. **E2E Tests** (optional) - Critical flow verification with Playwright

---

## 1. Technology Choices

### Unit Testing: Vitest over Jest

| Criteria | Vitest | Jest |
|----------|--------|------|
| ESM Support | Native | Requires config |
| Speed | Faster (Vite-powered) | Slower cold starts |
| Next.js 16 | Better integration | Config issues |
| TypeScript | Native | Needs ts-jest |
| Syntax | Jest-compatible | N/A |

**Decision**: Vitest - native ESM, faster, modern stack alignment.

### E2E Testing: Playwright over Cypress

| Criteria | Playwright | Cypress |
|----------|------------|---------|
| Multi-browser | Chrome, Firefox, Safari | Chrome-centric |
| Speed | Parallel by default | Sequential |
| Mobile Testing | Built-in emulation | Limited |
| Network Mocking | Powerful | Good |
| Bundle Size | Smaller | Larger |

**Decision**: Playwright - better cross-browser, faster, lighter.

### Visual Testing: Storybook 8

Storybook 8 with React 19 support. Benefits:
- Component isolation
- Visual regression testing (optional Chromatic)
- Documentation auto-generation
- Interaction testing

---

## 2. File Structure

```
habit-garden/
├── src/
│   ├── components/
│   │   └── __stories__/           # Storybook stories co-located
│   │       ├── TierBadge.stories.tsx
│   │       ├── PlantVisual.stories.tsx
│   │       └── ...
│   ├── lib/
│   │   └── __tests__/             # Unit tests co-located
│   │       ├── progression-system.test.ts
│   │       ├── xp-system.test.ts
│   │       └── ...
│   └── ...
├── e2e/                           # Playwright E2E tests
│   ├── onboarding.spec.ts
│   ├── add-plant.spec.ts
│   └── watering.spec.ts
├── .storybook/                    # Storybook config
│   ├── main.ts
│   └── preview.ts
├── vitest.config.ts
├── playwright.config.ts
└── src/components/dev/            # Dev Debug Panel
    └── DevDebugPanel.tsx
```

---

## 3. Dev Debug Panel (Phase 1)

### Purpose
Quick manual testing without database changes. Available only in `NODE_ENV=development`.

### Features

```typescript
interface DevDebugPanelState {
  // Profile Overrides
  level: number           // 1-20
  xp: number             // Manual XP
  subscription: 'FREE' | 'PRO' | 'PREMIUM'

  // Progression Overrides
  unlockedTiers: PlantTier[]   // [1,2,3,4,5]
  maxPlants: number            // 1-999
  gardenSize: 3 | 5 | 7 | 0    // 0 = unlimited

  // Quick Actions
  actions: {
    levelUp: () => void
    unlockAllTiers: () => void
    addRandomPlant: () => void
    triggerAchievement: (id: string) => void
    resetToDefault: () => void
  }

  // State Inspector
  currentState: {
    profile: Profile
    plants: Plant[]
    achievements: string[]
  }
}
```

### UI Design

```
+------------------------------------------+
| DEV PANEL                           [X]  |
+------------------------------------------+
| PROFILE OVERRIDES                        |
| Level: [---o--------] 5                  |
| XP:    [1250________] Apply              |
| Tier:  [FREE ▼]                          |
+------------------------------------------+
| QUICK ACTIONS                            |
| [Level Up] [All Tiers] [+Plant] [Reset]  |
+------------------------------------------+
| CURRENT STATE                            |
| Plants: 3/5  |  Tier: 1,2  |  L5         |
| Garden: 5x5  |  XP: 1250   |  Seedling   |
+------------------------------------------+
```

### Implementation File

```typescript
// src/components/dev/DevDebugPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { createContext, useContext } from 'react'

// Only render in development
const isDev = process.env.NODE_ENV === 'development'

export interface DevOverrides {
  level?: number
  xp?: number
  subscription?: 'FREE' | 'PRO' | 'PREMIUM'
  unlockedTiers?: number[]
  maxPlants?: number
  gardenSize?: number
}

const DevContext = createContext<{
  overrides: DevOverrides
  setOverrides: (o: DevOverrides) => void
} | null>(null)

export function DevDebugProvider({ children }) {
  const [overrides, setOverrides] = useState<DevOverrides>({})

  if (!isDev) return children

  return (
    <DevContext.Provider value={{ overrides, setOverrides }}>
      {children}
      <DevDebugPanel />
    </DevContext.Provider>
  )
}

export function useDevOverrides() {
  const ctx = useContext(DevContext)
  return ctx?.overrides ?? {}
}
```

### Activation
- Keyboard shortcut: `Ctrl+Shift+D`
- Floating button in bottom-left corner (dev only)
- Persists overrides in localStorage

### Effort Estimate
- **Time**: 4-6 hours
- **Files**: 2 new files
- **Priority**: HIGH (immediate manual testing value)

---

## 4. Unit Tests (Phase 2)

### Setup

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

```typescript
// vitest.setup.ts
import '@testing-library/jest-dom'
```

### Test Files Priority

#### 4.1 progression-system.test.ts (Critical)

```typescript
// src/lib/__tests__/progression-system.test.ts
import { describe, it, expect } from 'vitest'
import {
  getMaxPlants,
  getUserPhase,
  getBasicUnlockedTiers,
  checkSlotAvailability,
  canPlantTier,
  getGardenSize,
  getUnlockedDecorations,
  getLevelUnlocks,
  calculateProgressionFields,
} from '../progression-system'

describe('Slot Limits', () => {
  it('returns 1 plant for levels 1-3', () => {
    expect(getMaxPlants(1)).toBe(1)
    expect(getMaxPlants(2)).toBe(1)
    expect(getMaxPlants(3)).toBe(1)
  })

  it('returns 2 plants for levels 4-5', () => {
    expect(getMaxPlants(4)).toBe(2)
    expect(getMaxPlants(5)).toBe(2)
  })

  it('returns 3 plants for levels 6-8', () => {
    expect(getMaxPlants(6)).toBe(3)
    expect(getMaxPlants(7)).toBe(3)
    expect(getMaxPlants(8)).toBe(3)
  })

  it('returns unlimited at level 15+', () => {
    expect(getMaxPlants(15)).toBe(Infinity)
    expect(getMaxPlants(20)).toBe(Infinity)
  })
})

describe('User Phases', () => {
  it('seedling phase for levels 1-5', () => {
    expect(getUserPhase(1)).toBe('seedling')
    expect(getUserPhase(5)).toBe('seedling')
  })

  it('gardener phase for levels 6-12', () => {
    expect(getUserPhase(6)).toBe('gardener')
    expect(getUserPhase(12)).toBe('gardener')
  })

  it('sage phase for levels 13+', () => {
    expect(getUserPhase(13)).toBe('sage')
    expect(getUserPhase(20)).toBe('sage')
  })
})

describe('Tier Unlocks', () => {
  it('only tier 1 unlocked at level 1', () => {
    expect(getBasicUnlockedTiers(1)).toEqual([1])
  })

  it('tier 2 unlocks at level 7', () => {
    expect(getBasicUnlockedTiers(7)).toContain(2)
    expect(getBasicUnlockedTiers(6)).not.toContain(2)
  })

  it('tier 3 unlocks at level 10', () => {
    expect(getBasicUnlockedTiers(10)).toContain(3)
  })

  it('tier 4 unlocks at level 14', () => {
    expect(getBasicUnlockedTiers(14)).toContain(4)
  })

  it('tier 5 unlocks at level 18', () => {
    expect(getBasicUnlockedTiers(18)).toContain(5)
  })
})

describe('Garden Size', () => {
  it('3x3 for levels 1-5', () => {
    expect(getGardenSize(1)).toBe(3)
    expect(getGardenSize(5)).toBe(3)
  })

  it('5x5 for levels 6-8', () => {
    expect(getGardenSize(6)).toBe(5)
    expect(getGardenSize(8)).toBe(5)
  })

  it('7x7 for levels 9-11', () => {
    expect(getGardenSize(9)).toBe(7)
    expect(getGardenSize(11)).toBe(7)
  })

  it('unlimited (0) for level 12+', () => {
    expect(getGardenSize(12)).toBe(0)
    expect(getGardenSize(20)).toBe(0)
  })
})

describe('Decoration Unlocks', () => {
  it('basic decorations at level 1', () => {
    const decos = getUnlockedDecorations(1)
    expect(decos).toContain('bush')
    expect(decos).toContain('rock')
  })

  it('mushrooms and flowers at level 5', () => {
    const decos = getUnlockedDecorations(5)
    expect(decos).toContain('mushroom')
    expect(decos).toContain('flower-patch')
  })

  it('lanterns at level 8', () => {
    expect(getUnlockedDecorations(8)).toContain('lantern')
  })

  it('fences at level 10', () => {
    const decos = getUnlockedDecorations(10)
    expect(decos).toContain('fence-post')
    expect(decos).toContain('fence-corner')
  })

  it('water features at level 12', () => {
    const decos = getUnlockedDecorations(12)
    expect(decos).toContain('pond')
    expect(decos).toContain('fountain')
  })
})

describe('Level Unlocks', () => {
  it('2nd slot at level 4', () => {
    const unlocks = getLevelUnlocks(4)
    expect(unlocks.some(u => u.name === '2nd Plant Slot')).toBe(true)
  })

  it('5x5 garden at level 6', () => {
    const unlocks = getLevelUnlocks(6)
    expect(unlocks.some(u => u.name === '5x5 Garden')).toBe(true)
  })

  it('tier 2 at level 7', () => {
    const unlocks = getLevelUnlocks(7)
    expect(unlocks.some(u => u.name === 'Tier 2 Plants')).toBe(true)
  })
})

describe('Slot Availability Check', () => {
  it('allows planting when under limit', () => {
    const profile = { level: 5, max_plants: 2 } as any
    const result = checkSlotAvailability(profile, 1)
    expect(result.hasSlot).toBe(true)
    expect(result.currentCount).toBe(1)
    expect(result.maxSlots).toBe(2)
  })

  it('blocks planting when at limit', () => {
    const profile = { level: 3, max_plants: 1 } as any
    const result = checkSlotAvailability(profile, 1)
    expect(result.hasSlot).toBe(false)
    expect(result.message).toBeDefined()
  })
})

describe('Tier Check', () => {
  it('allows tier 1 for any user', () => {
    const profile = { level: 1, total_mature_plants: 0, longest_streak: 0 } as any
    const result = canPlantTier(profile, 1)
    expect(result.allowed).toBe(true)
  })

  it('blocks tier 2 for low level user', () => {
    const profile = { level: 5, total_mature_plants: 0, longest_streak: 0 } as any
    const result = canPlantTier(profile, 2)
    expect(result.allowed).toBe(false)
    expect(result.missingRequirements).toContain('Level 7 required (current: 5)')
  })

  it('allows tier 2 when requirements met', () => {
    const profile = { level: 7, total_mature_plants: 1, longest_streak: 7 } as any
    const result = canPlantTier(profile, 2)
    expect(result.allowed).toBe(true)
  })
})

describe('Progression Fields Calculation', () => {
  it('calculates fields for seedling user', () => {
    const fields = calculateProgressionFields(3, 0, 3)
    expect(fields.max_plants).toBe(1)
    expect(fields.unlocked_tiers).toEqual([1])
    expect(fields.phase).toBe('seedling')
  })

  it('calculates fields for advanced user', () => {
    const fields = calculateProgressionFields(15, 10, 100)
    expect(fields.max_plants).toBe(999)
    expect(fields.unlocked_tiers).toContain(5)
    expect(fields.phase).toBe('sage')
  })
})
```

#### 4.2 xp-system.test.ts

```typescript
// src/lib/__tests__/xp-system.test.ts
import { describe, it, expect } from 'vitest'
import {
  getXpForLevel,
  getXpToNextLevel,
  getLevelFromXp,
  getLevelProgress,
  getLevelInfo,
  calculateWateringXp,
  calculateNoteBonus,
  checkLevelUp,
} from '../xp-system'

describe('Level Thresholds', () => {
  it('level 1 requires 0 XP', () => {
    expect(getXpForLevel(1)).toBe(0)
  })

  it('XP requirements increase exponentially', () => {
    const lvl2 = getXpForLevel(2)
    const lvl3 = getXpForLevel(3)
    const lvl4 = getXpForLevel(4)

    expect(lvl3 - lvl2).toBeGreaterThan(lvl2)
    expect(lvl4 - lvl3).toBeGreaterThan(lvl3 - lvl2)
  })
})

describe('Level Calculation from XP', () => {
  it('0 XP = level 1', () => {
    expect(getLevelFromXp(0)).toBe(1)
  })

  it('100 XP = level 2', () => {
    expect(getLevelFromXp(100)).toBe(2)
  })

  it('calculates progress percentage correctly', () => {
    const progress = getLevelProgress(50) // 50 XP into level 1
    expect(progress).toBe(50) // 50% to level 2
  })
})

describe('Watering XP Calculation', () => {
  it('base watering gives 10 XP', () => {
    const result = calculateWateringXp({ streak: 0, isMorning: false })
    expect(result.breakdown.base).toBe(10)
  })

  it('morning bonus adds 5 XP', () => {
    const result = calculateWateringXp({ streak: 0, isMorning: true })
    expect(result.breakdown.morningBonus).toBe(5)
    expect(result.total).toBe(15)
  })

  it('3-day streak adds 5 XP', () => {
    const result = calculateWateringXp({ streak: 3, isMorning: false })
    expect(result.breakdown.streakBonus).toBe(5)
  })

  it('7-day streak adds 15 XP', () => {
    const result = calculateWateringXp({ streak: 7, isMorning: false })
    expect(result.breakdown.streakBonus).toBe(15)
  })

  it('30-day streak adds 50 XP', () => {
    const result = calculateWateringXp({ streak: 30, isMorning: false })
    expect(result.breakdown.streakBonus).toBe(50)
  })

  it('hard difficulty adds 10 XP', () => {
    const result = calculateWateringXp({ streak: 0, isMorning: false, difficulty: 'hard' })
    expect(result.breakdown.difficultyBonus).toBe(10)
  })

  it('rainbow day adds 20 XP', () => {
    const result = calculateWateringXp({ streak: 0, isMorning: false, isRainbowDay: true })
    expect(result.breakdown.weatherBonus).toBe(20)
  })

  it('stacks all bonuses correctly', () => {
    const result = calculateWateringXp({
      streak: 7,
      isMorning: true,
      difficulty: 'hard',
      isRainbowDay: true,
    })
    expect(result.total).toBe(10 + 5 + 15 + 10 + 20) // 60 XP
  })
})

describe('Note Bonus Calculation', () => {
  it('any note adds 3 XP base', () => {
    const result = calculateNoteBonus({ noteLength: 10, journalStreak: 0 })
    expect(result.breakdown.noteBase).toBe(3)
  })

  it('notes > 50 chars add thoughtful bonus', () => {
    const result = calculateNoteBonus({ noteLength: 60, journalStreak: 0 })
    expect(result.breakdown.thoughtfulNote).toBe(2)
  })

  it('notes > 100 chars add detailed bonus', () => {
    const result = calculateNoteBonus({ noteLength: 120, journalStreak: 0 })
    expect(result.breakdown.detailedNote).toBe(2)
    expect(result.total).toBe(7)
  })

  it('journal streak adds bonus', () => {
    const result = calculateNoteBonus({ noteLength: 10, journalStreak: 7 })
    expect(result.breakdown.journalStreakBonus).toBe(5)
  })
})

describe('Level Up Detection', () => {
  it('detects level up from 1 to 2', () => {
    const result = checkLevelUp(0, 100)
    expect(result.leveledUp).toBe(true)
    expect(result.newLevel).toBe(2)
  })

  it('no level up when under threshold', () => {
    const result = checkLevelUp(0, 50)
    expect(result.leveledUp).toBe(false)
    expect(result.newLevel).toBe(1)
  })
})
```

#### 4.3 Additional Test Files

| File | Tests | Priority |
|------|-------|----------|
| `weather-system.test.ts` | Weather XP bonuses, daily weather generation | Medium |
| `mood-system.test.ts` | Mood XP bonuses, mood weather mapping | Medium |
| `grid-positioning.test.ts` | Collision detection, position finding | High |
| `achievements.test.ts` | Achievement unlock conditions | Medium |

### Effort Estimate
- **Time**: 8-12 hours
- **Files**: 6-8 test files
- **Priority**: HIGH (core logic verification)

---

## 5. Storybook (Phase 3)

### Setup

```bash
npx storybook@latest init --type nextjs
```

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
}
export default config
```

```typescript
// .storybook/preview.ts
import '../src/app/globals.css'
import type { Preview } from '@storybook/react'

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'garden', value: '#f0f9e8' },
      ],
    },
  },
}
export default preview
```

### Story Files Priority

#### 5.1 TierBadge.stories.tsx

```typescript
// src/components/ui/__stories__/TierBadge.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { TierBadge, TierStars } from '../tier-badge'

const meta: Meta<typeof TierBadge> = {
  title: 'UI/TierBadge',
  component: TierBadge,
  tags: ['autodocs'],
  argTypes: {
    tier: { control: { type: 'range', min: 1, max: 5 } },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    showLabel: { control: 'boolean' },
    showTooltip: { control: 'boolean' },
    locked: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof TierBadge>

export const AllTiers: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4, 5].map(tier => (
        <TierBadge key={tier} tier={tier as any} showLabel size="md" />
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <TierBadge tier={3} size="sm" />
      <TierBadge tier={3} size="md" />
      <TierBadge tier={3} size="lg" />
    </div>
  ),
}

export const Locked: Story = {
  args: { tier: 4, locked: true, showLabel: true },
}

export const StarsOnly: Story = {
  render: () => (
    <div className="flex gap-4">
      {[1, 2, 3, 4, 5].map(tier => (
        <TierStars key={tier} tier={tier as any} size="md" />
      ))}
    </div>
  ),
}
```

#### 5.2 PlantVisual.stories.tsx

```typescript
// src/components/plants/__stories__/PlantVisual.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { PlantVisual } from '../plant-visual'
import type { PlantWithType } from '@/types/database'

const mockPlant = (overrides: Partial<PlantWithType> = {}): PlantWithType => ({
  id: '1',
  name: 'Test Plant',
  user_id: 'user-1',
  plant_type_id: 'succulent',
  growth_percentage: 50,
  current_moisture: 70,
  status: 'growing',
  current_streak: 5,
  longest_streak: 10,
  total_waterings: 30,
  position: 0,
  grid_row: 0,
  grid_col: 0,
  grid_size: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  plant_type: {
    id: 'succulent',
    name: 'Succulent',
    icon: '🌵',
    maturity_days: 30,
    moisture_drain: 5,
    moisture_boost: 30,
    difficulty: 'easy',
    tier: 1,
    description: 'A hardy little friend',
    care_tips: 'Water weekly',
    created_at: new Date().toISOString(),
  },
  ...overrides,
})

const meta: Meta<typeof PlantVisual> = {
  title: 'Plants/PlantVisual',
  component: PlantVisual,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl', '2xl'] },
    weather: { control: 'select', options: [null, 'sunny', 'cloudy', 'rainy', 'stormy', 'rainbow'] },
    showWateringEffect: { control: 'boolean' },
    isWateredToday: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PlantVisual>

export const GrowthStages: Story = {
  render: () => (
    <div className="flex items-end gap-8 p-4 bg-green-50">
      <div className="text-center">
        <PlantVisual plant={mockPlant({ growth_percentage: 0 })} size="lg" isWateredToday />
        <p className="text-sm mt-2">Seed (0%)</p>
      </div>
      <div className="text-center">
        <PlantVisual plant={mockPlant({ growth_percentage: 25 })} size="lg" isWateredToday />
        <p className="text-sm mt-2">Sprout (25%)</p>
      </div>
      <div className="text-center">
        <PlantVisual plant={mockPlant({ growth_percentage: 50 })} size="lg" isWateredToday />
        <p className="text-sm mt-2">Growing (50%)</p>
      </div>
      <div className="text-center">
        <PlantVisual plant={mockPlant({ growth_percentage: 75 })} size="lg" isWateredToday />
        <p className="text-sm mt-2">Blooming (75%)</p>
      </div>
      <div className="text-center">
        <PlantVisual plant={mockPlant({ growth_percentage: 100, status: 'mature' })} size="lg" isWateredToday />
        <p className="text-sm mt-2">Mature (100%)</p>
      </div>
    </div>
  ),
}

export const MoistureStates: Story = {
  render: () => (
    <div className="flex items-center gap-8 p-4">
      <div className="text-center">
        <PlantVisual plant={mockPlant({ current_moisture: 90 })} size="lg" isWateredToday />
        <p className="text-sm mt-2">Thriving (90%)</p>
      </div>
      <div className="text-center">
        <PlantVisual plant={mockPlant({ current_moisture: 50 })} size="lg" isWateredToday />
        <p className="text-sm mt-2">Normal (50%)</p>
      </div>
      <div className="text-center">
        <PlantVisual plant={mockPlant({ current_moisture: 20 })} size="lg" isWateredToday />
        <p className="text-sm mt-2">Wilting (20%)</p>
      </div>
    </div>
  ),
}

export const NeedsWater: Story = {
  args: {
    plant: mockPlant(),
    size: 'lg',
    isWateredToday: false,
  },
}

export const WateredToday: Story = {
  args: {
    plant: mockPlant(),
    size: 'lg',
    isWateredToday: true,
  },
}

export const Dead: Story = {
  args: {
    plant: mockPlant({ status: 'dead', current_moisture: 0 }),
    size: 'lg',
  },
}

export const WeatherEffects: Story = {
  render: () => (
    <div className="flex gap-8 p-4">
      {(['sunny', 'cloudy', 'rainy', 'stormy', 'rainbow'] as const).map(weather => (
        <div key={weather} className="text-center">
          <PlantVisual plant={mockPlant()} size="lg" weather={weather} isWateredToday />
          <p className="text-sm mt-2 capitalize">{weather}</p>
        </div>
      ))}
    </div>
  ),
}
```

#### 5.3 Additional Stories

| Component | Story File | Priority |
|-----------|------------|----------|
| `SlotIndicator` | `SlotIndicator.stories.tsx` | High |
| `PlantCard` | `PlantCard.stories.tsx` | High |
| `GardenGrid` | `GardenGrid.stories.tsx` | Medium |
| `LevelUpModal` | `LevelUpModal.stories.tsx` | Medium |
| `MoistureBadge` | `MoistureBadge.stories.tsx` | Low |
| `AchievementCard` | `AchievementCard.stories.tsx` | Low |

### Effort Estimate
- **Time**: 8-12 hours
- **Files**: 8-12 story files
- **Priority**: MEDIUM (documentation, visual regression)

---

## 6. E2E Tests (Phase 4 - Optional)

### Setup

```bash
npm install -D @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Critical User Flows

#### 6.1 Onboarding Flow

```typescript
// e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Onboarding', () => {
  test('new user sees welcome screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Welcome to Habit Garden')).toBeVisible()
  })

  test('can create first plant', async ({ page }) => {
    await page.goto('/garden')
    await page.getByRole('button', { name: /add.*plant/i }).click()
    await page.getByLabel('Plant name').fill('Morning Exercise')
    await page.getByLabel('Habit').fill('30 minutes of exercise')
    await page.getByRole('button', { name: /create/i }).click()

    await expect(page.getByText('Morning Exercise')).toBeVisible()
  })
})
```

#### 6.2 Watering Flow

```typescript
// e2e/watering.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Watering', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login and have at least one plant
  })

  test('can water a plant', async ({ page }) => {
    await page.goto('/garden')
    await page.getByTestId('plant-card').first().click()
    await page.getByRole('button', { name: /water/i }).click()

    await expect(page.getByText(/\+\d+ XP/)).toBeVisible()
  })

  test('shows watered state after watering', async ({ page }) => {
    await page.goto('/garden')
    await page.getByTestId('plant-card').first().click()

    // After watering, water button should be disabled
    await expect(page.getByRole('button', { name: /water/i })).toBeDisabled()
  })
})
```

### Effort Estimate
- **Time**: 6-10 hours
- **Files**: 3-5 spec files
- **Priority**: LOW (optional, nice-to-have)

---

## 7. Implementation Roadmap

### Phase 1: Dev Debug Panel (Week 1)
**Time: 4-6 hours**

1. Create `src/components/dev/DevDebugPanel.tsx`
2. Create `src/components/dev/DevDebugProvider.tsx`
3. Add context for profile/progression overrides
4. Integrate into app layout (dev only)
5. Add keyboard shortcut activation

### Phase 2: Unit Tests (Week 1-2)
**Time: 8-12 hours**

1. Setup Vitest configuration
2. Write `progression-system.test.ts` (3h)
3. Write `xp-system.test.ts` (2h)
4. Write `grid-positioning.test.ts` (2h)
5. Write remaining tests (3h)
6. Add npm scripts and CI integration

### Phase 3: Storybook (Week 2-3)
**Time: 8-12 hours**

1. Initialize Storybook
2. Write `TierBadge.stories.tsx` (1h)
3. Write `PlantVisual.stories.tsx` (2h)
4. Write `SlotIndicator.stories.tsx` (1h)
5. Write remaining stories (4h)
6. Setup static export for docs

### Phase 4: E2E Tests (Week 3+, Optional)
**Time: 6-10 hours**

1. Setup Playwright
2. Write `onboarding.spec.ts`
3. Write `watering.spec.ts`
4. Write `add-plant.spec.ts`
5. Add to CI pipeline

---

## 8. NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

---

## 9. CI Integration

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage

  storybook:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build-storybook
```

---

## 10. Summary

| Phase | Scope | Time | Priority |
|-------|-------|------|----------|
| 1. Dev Debug Panel | Manual testing tool | 4-6h | HIGH |
| 2. Unit Tests | Core logic (6-8 files) | 8-12h | HIGH |
| 3. Storybook | Visual components (8-12 files) | 8-12h | MEDIUM |
| 4. E2E Tests | Critical flows (3-5 files) | 6-10h | LOW |

**Total Estimated Effort**: 26-40 hours

**Recommended Order**: 1 -> 2 -> 3 -> 4

---

## Open Questions

1. **Supabase Mocking**: For unit tests involving server actions, should we:
   - Mock Supabase client directly?
   - Use Supabase local dev with test database?
   - Extract pure logic functions for testing?

2. **Visual Regression**: Should we add Chromatic for visual regression testing, or is manual Storybook review sufficient?

3. **Test Database**: For E2E tests, should we:
   - Use Supabase test project?
   - Mock auth entirely?
   - Use local Supabase instance?

4. **Coverage Targets**: What coverage percentage should we aim for?
   - Suggestion: 80% for `src/lib/`, 60% overall

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Storybook for Next.js](https://storybook.js.org/docs/get-started/frameworks/nextjs)
- [Testing Library](https://testing-library.com/)
