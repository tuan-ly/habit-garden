import type { Meta, StoryObj } from '@storybook/react'
import { SlotIndicator } from '../slot-indicator'

const meta: Meta<typeof SlotIndicator> = {
  title: 'Garden/SlotIndicator',
  component: SlotIndicator,
  tags: ['autodocs'],
  argTypes: {
    currentCount: {
      control: { type: 'number', min: 0, max: 20 },
      description: 'Number of plants currently in the garden',
    },
    maxSlots: {
      control: { type: 'number', min: 1, max: 999 },
      description: 'Maximum plant slots (-1 or 999 for unlimited)',
    },
    showIcon: {
      control: 'boolean',
      description: 'Whether to show the sprout icon',
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'progress'],
      description: 'Visual variant of the indicator',
    },
  },
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof SlotIndicator>

// Default story
export const Default: Story = {
  args: {
    currentCount: 2,
    maxSlots: 5,
    showIcon: true,
    variant: 'default',
  },
}

// Different fill states
export const FillStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <SlotIndicator currentCount={1} maxSlots={5} />
        <span className="text-sm text-muted-foreground">Available</span>
      </div>
      <div className="flex items-center gap-3">
        <SlotIndicator currentCount={4} maxSlots={5} />
        <span className="text-sm text-amber-600">Near Full</span>
      </div>
      <div className="flex items-center gap-3">
        <SlotIndicator currentCount={5} maxSlots={5} />
        <span className="text-sm text-red-600">Full</span>
      </div>
      <div className="flex items-center gap-3">
        <SlotIndicator currentCount={8} maxSlots={999} />
        <span className="text-sm text-muted-foreground">Unlimited</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different fill states: available, near full, full, and unlimited.',
      },
    },
  },
}

// Compact variant
export const Compact: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <SlotIndicator currentCount={2} maxSlots={5} variant="compact" />
      <SlotIndicator currentCount={4} maxSlots={5} variant="compact" />
      <SlotIndicator currentCount={5} maxSlots={5} variant="compact" />
      <SlotIndicator currentCount={8} maxSlots={999} variant="compact" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact variant - ideal for tight spaces like headers.',
      },
    },
  },
}

// Progress variant
export const Progress: Story = {
  render: () => (
    <div className="w-48 space-y-4">
      <SlotIndicator currentCount={2} maxSlots={5} variant="progress" />
      <SlotIndicator currentCount={4} maxSlots={5} variant="progress" />
      <SlotIndicator currentCount={5} maxSlots={5} variant="progress" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Progress bar variant - good for sidebars or detail panels.',
      },
    },
  },
}

// Without icon
export const NoIcon: Story = {
  args: {
    currentCount: 3,
    maxSlots: 8,
    showIcon: false,
    variant: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Indicator without the sprout icon.',
      },
    },
  },
}

// Progression through levels
export const LevelProgression: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="w-20 text-sm">Level 1-3:</span>
        <SlotIndicator currentCount={1} maxSlots={1} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-20 text-sm">Level 4-5:</span>
        <SlotIndicator currentCount={1} maxSlots={2} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-20 text-sm">Level 6-8:</span>
        <SlotIndicator currentCount={2} maxSlots={3} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-20 text-sm">Level 9-11:</span>
        <SlotIndicator currentCount={3} maxSlots={5} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-20 text-sm">Level 12-14:</span>
        <SlotIndicator currentCount={4} maxSlots={8} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-20 text-sm">Level 15+:</span>
        <SlotIndicator currentCount={10} maxSlots={999} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Slot limits progression as user levels up.',
      },
    },
  },
}

// In context: HUD display
export const InHudContext: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-3 bg-card border rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-lg">🌱</span>
        <span className="font-semibold">Level 7</span>
      </div>
      <div className="h-6 w-px bg-border" />
      <SlotIndicator currentCount={2} maxSlots={3} variant="compact" />
      <div className="h-6 w-px bg-border" />
      <span className="text-sm text-muted-foreground">245 XP</span>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'How SlotIndicator appears in a HUD-style display.',
      },
    },
  },
}
