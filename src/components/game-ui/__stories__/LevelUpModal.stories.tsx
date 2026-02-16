import type { Meta, StoryObj } from '@storybook/react'
import { LevelUpModal } from '../level-up-modal'
import { SubscriptionProvider } from '@/lib/context/subscription-context'

// Mock subscription provider wrapper
const MockSubscriptionProvider = ({
  children,
  tier = 'free',
}: {
  children: React.ReactNode
  tier?: 'free' | 'pro' | 'premium'
}) => {
  return (
    <SubscriptionProvider initialTier={tier}>
      {children}
    </SubscriptionProvider>
  )
}

const meta: Meta<typeof LevelUpModal> = {
  title: 'Game UI/LevelUpModal',
  component: LevelUpModal,
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const tier = context.parameters?.tier || 'free'
      return (
        <MockSubscriptionProvider tier={tier}>
          <Story />
        </MockSubscriptionProvider>
      )
    },
  ],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    newLevel: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'The new level reached',
    },
    oldLevel: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'The previous level',
    },
    onOpenChange: { action: 'onOpenChange' },
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
}

export default meta
type Story = StoryObj<typeof LevelUpModal>

// Default level up (1 to 2)
export const Default: Story = {
  args: {
    open: true,
    newLevel: 2,
    oldLevel: 1,
  },
}

// Level 4 - Unlocks 2nd plant slot
export const SecondSlotUnlock: Story = {
  args: {
    open: true,
    newLevel: 4,
    oldLevel: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Level 4 unlocks the 2nd plant slot.',
      },
    },
  },
}

// Level 6 - Phase change to Gardener + Goals unlock prompt
export const GardenerPhase: Story = {
  args: {
    open: true,
    newLevel: 6,
    oldLevel: 5,
  },
  parameters: {
    tier: 'free',
    docs: {
      description: {
        story: 'Level 6 triggers phase change to Gardener and shows Goals unlock prompt for FREE users.',
      },
    },
  },
}

// Level 6 for PRO users (no upgrade prompt)
export const GardenerPhasePro: Story = {
  args: {
    open: true,
    newLevel: 6,
    oldLevel: 5,
  },
  parameters: {
    tier: 'pro',
    docs: {
      description: {
        story: 'PRO users see level 6 without the upgrade prompt.',
      },
    },
  },
}

// Level 7 - Unlocks Tier 2 plants
export const Tier2Unlock: Story = {
  args: {
    open: true,
    newLevel: 7,
    oldLevel: 6,
  },
  parameters: {
    docs: {
      description: {
        story: 'Level 7 unlocks Tier 2 plants.',
      },
    },
  },
}

// Level 9 - 7x7 Garden
export const LargeGarden: Story = {
  args: {
    open: true,
    newLevel: 9,
    oldLevel: 8,
  },
  parameters: {
    docs: {
      description: {
        story: 'Level 9 expands the garden to 7x7.',
      },
    },
  },
}

// Level 12 - Unlimited garden + decorations
export const UnlimitedGarden: Story = {
  args: {
    open: true,
    newLevel: 12,
    oldLevel: 11,
  },
  parameters: {
    docs: {
      description: {
        story: 'Level 12 unlocks unlimited garden size and water features.',
      },
    },
  },
}

// Level 13 - Sage phase + Identity unlock
export const SagePhase: Story = {
  args: {
    open: true,
    newLevel: 13,
    oldLevel: 12,
  },
  parameters: {
    tier: 'free',
    docs: {
      description: {
        story: 'Level 13 triggers phase change to Garden Sage and shows Identity unlock prompt.',
      },
    },
  },
}

// Level 15 - Master Gardener + Unlimited slots
export const MasterGardener: Story = {
  args: {
    open: true,
    newLevel: 15,
    oldLevel: 14,
  },
  parameters: {
    docs: {
      description: {
        story: 'Level 15 grants Master Gardener title and unlimited plant slots.',
      },
    },
  },
}

// Level 18 - Tier 5 plants + Grand Master
export const GrandMaster: Story = {
  args: {
    open: true,
    newLevel: 18,
    oldLevel: 17,
  },
  parameters: {
    docs: {
      description: {
        story: 'Level 18 unlocks Tier 5 legendary plants and Grand Master title.',
      },
    },
  },
}

// Level 20 - Max level
export const MaxLevel: Story = {
  args: {
    open: true,
    newLevel: 20,
    oldLevel: 19,
  },
  parameters: {
    docs: {
      description: {
        story: 'Maximum level achievable in the game.',
      },
    },
  },
}

// Multiple level jump (rare)
export const MultiLevelJump: Story = {
  args: {
    open: true,
    newLevel: 10,
    oldLevel: 7,
  },
  parameters: {
    docs: {
      description: {
        story: 'When gaining multiple levels at once (e.g., from achievements).',
      },
    },
  },
}

// All key milestone levels
export const AllMilestones: Story = {
  render: () => {
    const milestones = [
      { level: 4, label: '2nd Slot' },
      { level: 6, label: 'Gardener Phase' },
      { level: 7, label: 'Tier 2' },
      { level: 9, label: '7x7 Garden' },
      { level: 12, label: 'Unlimited Garden' },
      { level: 13, label: 'Sage Phase' },
      { level: 15, label: 'Master' },
      { level: 18, label: 'Tier 5' },
    ]

    return (
      <div className="grid grid-cols-2 gap-4 p-4">
        {milestones.map(({ level, label }) => (
          <div
            key={level}
            className="text-center p-4 bg-slate-800 rounded-lg"
          >
            <p className="text-sm text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-amber-400">Level {level}</p>
          </div>
        ))}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Reference showing all key milestone levels and what they unlock.',
      },
    },
  },
}
