import type { Meta, StoryObj } from '@storybook/react'
import { TierBadge, TierStars } from '../tier-badge'
import type { PlantTier } from '@/types/database'

const meta: Meta<typeof TierBadge> = {
  title: 'UI/TierBadge',
  component: TierBadge,
  tags: ['autodocs'],
  argTypes: {
    tier: {
      control: { type: 'range', min: 1, max: 5 },
      description: 'The tier level (1-5 stars)',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the badge',
    },
    showLabel: {
      control: 'boolean',
      description: 'Whether to show the tier name label',
    },
    showTooltip: {
      control: 'boolean',
      description: 'Whether to show tooltip on hover',
    },
    locked: {
      control: 'boolean',
      description: 'Whether the tier is locked',
    },
  },
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof TierBadge>

// Default story
export const Default: Story = {
  args: {
    tier: 3 as PlantTier,
    size: 'md',
    showLabel: false,
    showTooltip: true,
    locked: false,
  },
}

// All tiers in a row
export const AllTiers: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {([1, 2, 3, 4, 5] as PlantTier[]).map((tier) => (
        <TierBadge key={tier} tier={tier} showLabel size="md" />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all 5 tiers with their names and star counts.',
      },
    },
  },
}

// Size comparison
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <TierBadge tier={3 as PlantTier} size="sm" showLabel />
        <p className="text-xs text-muted-foreground mt-2">Small</p>
      </div>
      <div className="text-center">
        <TierBadge tier={3 as PlantTier} size="md" showLabel />
        <p className="text-xs text-muted-foreground mt-2">Medium</p>
      </div>
      <div className="text-center">
        <TierBadge tier={3 as PlantTier} size="lg" showLabel />
        <p className="text-xs text-muted-foreground mt-2">Large</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different badge sizes.',
      },
    },
  },
}

// Locked state
export const Locked: Story = {
  args: {
    tier: 4 as PlantTier,
    locked: true,
    showLabel: true,
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'A locked tier badge - appears dimmed with a lock message in tooltip.',
      },
    },
  },
}

// Locked vs Unlocked comparison
export const LockedComparison: Story = {
  render: () => (
    <div className="flex gap-8">
      <div className="text-center">
        <TierBadge tier={4 as PlantTier} showLabel size="lg" />
        <p className="text-sm text-muted-foreground mt-2">Unlocked</p>
      </div>
      <div className="text-center">
        <TierBadge tier={4 as PlantTier} showLabel size="lg" locked />
        <p className="text-sm text-muted-foreground mt-2">Locked</p>
      </div>
    </div>
  ),
}

// Without tooltip
export const NoTooltip: Story = {
  args: {
    tier: 2 as PlantTier,
    showTooltip: false,
    showLabel: true,
    size: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Badge without hover tooltip - useful for inline display.',
      },
    },
  },
}

// TierStars component
export const StarsOnly: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {([1, 2, 3, 4, 5] as PlantTier[]).map((tier) => (
        <div key={tier} className="text-center">
          <TierStars tier={tier} size="md" />
          <p className="text-xs text-muted-foreground mt-1">T{tier}</p>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TierStars component - compact stars without label or tooltip.',
      },
    },
  },
}

// In context: Plant card simulation
export const InContext: Story = {
  render: () => (
    <div className="p-4 border rounded-lg bg-card w-64">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">Bonsai Tree</h3>
          <p className="text-sm text-muted-foreground">Expert care needed</p>
        </div>
        <TierBadge tier={5 as PlantTier} size="sm" />
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        Requires: Level 18, 7-day streak
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'How TierBadge looks in a plant card context.',
      },
    },
  },
}
