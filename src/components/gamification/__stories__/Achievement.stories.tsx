import type { Meta, StoryObj } from '@storybook/react'
import { AchievementPopup, AchievementToast, AchievementQueue } from '../achievement-popup'
import { AchievementsGrid } from '../achievements-grid'
import type { AchievementDefinition, AchievementProgress } from '@/lib/achievements'

// Mock achievement data
const createMockAchievement = (
  overrides: Partial<AchievementDefinition> = {}
): AchievementDefinition => ({
  id: 'mock-achievement',
  name: 'First Seed',
  nameVi: 'Hạt giống đầu tiên',
  description: 'Plant your first habit',
  descriptionVi: 'Trồng thói quen đầu tiên',
  icon: '🌱',
  requirementType: 'first_plant',
  requirementValue: 1,
  xpReward: 25,
  tier: 1,
  isHidden: false,
  ...overrides,
})

// Sample achievements for different tiers
const sampleAchievements: AchievementDefinition[] = [
  // Tier 1 (Bronze)
  createMockAchievement({
    id: 'first_plant',
    name: 'First Seed',
    description: 'Plant your first habit',
    icon: '🌱',
    tier: 1,
    xpReward: 25,
  }),
  createMockAchievement({
    id: 'first_watering',
    name: 'First Drop',
    description: 'Water a plant for the first time',
    icon: '💧',
    tier: 1,
    xpReward: 25,
  }),
  createMockAchievement({
    id: 'watering_10',
    name: 'Getting Started',
    description: 'Complete 10 waterings',
    icon: '🚿',
    tier: 1,
    xpReward: 25,
    requirementType: 'total_waterings',
    requirementValue: 10,
  }),
  // Tier 2 (Silver)
  createMockAchievement({
    id: 'first_mature',
    name: 'First Bloom',
    description: 'Grow your first plant to maturity',
    icon: '🌸',
    tier: 2,
    xpReward: 100,
  }),
  createMockAchievement({
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Achieve a 7-day watering streak',
    icon: '🔥',
    tier: 2,
    xpReward: 75,
    requirementType: 'streak_days',
    requirementValue: 7,
  }),
  // Tier 3 (Gold)
  createMockAchievement({
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Achieve a 30-day watering streak',
    icon: '⭐',
    tier: 3,
    xpReward: 200,
    requirementType: 'streak_days',
    requirementValue: 30,
  }),
  createMockAchievement({
    id: 'mature_5',
    name: 'Green Thumb',
    description: 'Grow 5 plants to maturity',
    icon: '👍',
    tier: 3,
    xpReward: 150,
    requirementType: 'mature_plants',
    requirementValue: 5,
  }),
  // Tier 4 (Legendary)
  createMockAchievement({
    id: 'streak_365',
    name: 'Year of Growth',
    description: 'Achieve a 365-day streak',
    icon: '🏆',
    tier: 4,
    xpReward: 1000,
    requirementType: 'streak_days',
    requirementValue: 365,
  }),
]

// Create mock progress
const createMockProgress = (
  achievement: AchievementDefinition,
  current: number,
  isComplete: boolean
): AchievementProgress => ({
  achievement,
  currentValue: current,
  isComplete,
  progress: isComplete ? 100 : (current / achievement.requirementValue) * 100,
})

// ============== AchievementPopup Stories ==============

const popupMeta: Meta<typeof AchievementPopup> = {
  title: 'Gamification/AchievementPopup',
  component: AchievementPopup,
  tags: ['autodocs'],
  argTypes: {
    show: {
      control: 'boolean',
      description: 'Whether the popup is visible',
    },
    onClose: { action: 'closed' },
  },
  parameters: {
    layout: 'fullscreen',
  },
}

export default popupMeta
type PopupStory = StoryObj<typeof AchievementPopup>

// Default popup
export const Popup: PopupStory = {
  args: {
    achievement: createMockAchievement(),
    show: true,
  },
}

// Bronze tier achievement
export const BronzeTier: PopupStory = {
  args: {
    achievement: createMockAchievement({
      name: 'Getting Started',
      description: 'Complete 10 waterings',
      icon: '🚿',
      tier: 1,
      xpReward: 25,
    }),
    show: true,
  },
}

// Silver tier achievement
export const SilverTier: PopupStory = {
  args: {
    achievement: createMockAchievement({
      name: 'First Bloom',
      description: 'Grow your first plant to maturity',
      icon: '🌸',
      tier: 2,
      xpReward: 100,
    }),
    show: true,
  },
}

// Gold tier achievement
export const GoldTier: PopupStory = {
  args: {
    achievement: createMockAchievement({
      name: 'Monthly Master',
      description: 'Achieve a 30-day watering streak',
      icon: '⭐',
      tier: 3,
      xpReward: 200,
    }),
    show: true,
  },
}

// Legendary tier achievement
export const LegendaryTier: PopupStory = {
  args: {
    achievement: createMockAchievement({
      name: 'Year of Growth',
      description: 'Achieve a 365-day watering streak',
      icon: '🏆',
      tier: 4,
      xpReward: 1000,
    }),
    show: true,
  },
}

// High XP reward
export const HighXpReward: PopupStory = {
  args: {
    achievement: createMockAchievement({
      name: 'Grand Master',
      description: 'Reach level 20',
      icon: '👑',
      tier: 4,
      xpReward: 500,
    }),
    show: true,
  },
}

// ============== AchievementToast Stories ==============

export const Toast: PopupStory = {
  render: () => (
    <div className="p-4 space-y-3 max-w-sm">
      <AchievementToast
        achievement={createMockAchievement({
          name: 'First Seed',
          description: 'Plant your first habit',
          icon: '🌱',
          tier: 1,
          xpReward: 25,
        })}
      />
      <AchievementToast
        achievement={createMockAchievement({
          name: 'Week Warrior',
          description: 'Achieve a 7-day watering streak',
          icon: '🔥',
          tier: 2,
          xpReward: 75,
        })}
      />
      <AchievementToast
        achievement={createMockAchievement({
          name: 'Monthly Master',
          description: 'Achieve a 30-day streak',
          icon: '⭐',
          tier: 3,
          xpReward: 200,
        })}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact toast notification style for achievements.',
      },
    },
  },
}

// ============== AchievementsGrid Stories ==============

export const Grid: PopupStory = {
  render: () => {
    // Create mock progress data
    const progress: AchievementProgress[] = sampleAchievements.map((achievement, i) => {
      // First 3 are complete, rest are in progress
      const isComplete = i < 3
      const current = isComplete
        ? achievement.requirementValue
        : Math.floor(achievement.requirementValue * (0.3 + Math.random() * 0.5))
      return createMockProgress(achievement, current, isComplete)
    })

    const unlockedIds = ['first_plant', 'first_watering', 'watering_10']

    return (
      <div className="p-4 max-w-2xl">
        <AchievementsGrid
          progress={progress}
          unlockedIds={unlockedIds}
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Full achievements grid showing unlocked and locked achievements by tier.',
      },
    },
  },
}

// All achievements unlocked
export const AllUnlocked: PopupStory = {
  render: () => {
    const progress: AchievementProgress[] = sampleAchievements.map((achievement) =>
      createMockProgress(achievement, achievement.requirementValue, true)
    )

    const unlockedIds = sampleAchievements.map((a) => a.id)

    return (
      <div className="p-4 max-w-2xl">
        <AchievementsGrid
          progress={progress}
          unlockedIds={unlockedIds}
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Grid showing a completionist with all achievements unlocked.',
      },
    },
  },
}

// No achievements unlocked (new user)
export const NewUser: PopupStory = {
  render: () => {
    const progress: AchievementProgress[] = sampleAchievements.map((achievement) =>
      createMockProgress(achievement, 0, false)
    )

    return (
      <div className="p-4 max-w-2xl">
        <AchievementsGrid
          progress={progress}
          unlockedIds={[]}
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Grid for a new user with no achievements yet.',
      },
    },
  },
}

// Achievement Queue (multiple)
export const Queue: PopupStory = {
  render: () => {
    const achievements = [
      createMockAchievement({
        id: '1',
        name: 'First Seed',
        icon: '🌱',
        tier: 1,
        xpReward: 25,
      }),
      createMockAchievement({
        id: '2',
        name: 'First Drop',
        icon: '💧',
        tier: 1,
        xpReward: 25,
      }),
    ]

    return (
      <AchievementQueue
        achievements={achievements}
        onComplete={() => console.log('Queue complete')}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Queue system for displaying multiple achievements in sequence.',
      },
    },
  },
}

// All tiers comparison
export const TierComparison: PopupStory = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4 max-w-2xl">
      {[1, 2, 3, 4].map((tier) => (
        <div key={tier} className="text-center">
          <p className="text-sm font-medium mb-2">
            Tier {tier} -{' '}
            {['Bronze', 'Silver', 'Gold', 'Legendary'][tier - 1]}
          </p>
          <AchievementToast
            achievement={createMockAchievement({
              name: `Tier ${tier} Achievement`,
              description: 'Sample achievement description',
              icon: ['🌱', '🌸', '⭐', '🏆'][tier - 1],
              tier: tier as 1 | 2 | 3 | 4,
              xpReward: [25, 75, 200, 500][tier - 1],
            })}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of all achievement tiers.',
      },
    },
  },
}
