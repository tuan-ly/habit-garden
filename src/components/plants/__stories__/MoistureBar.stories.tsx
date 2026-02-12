import type { Meta, StoryObj } from '@storybook/react'
import { MoistureBar } from '../moisture-bar'

const meta: Meta<typeof MoistureBar> = {
  title: 'Plants/MoistureBar',
  component: MoistureBar,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100 },
      description: 'Moisture percentage (0-100)',
    },
    showLabel: {
      control: 'boolean',
      description: 'Show moisture label and value',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description: 'Size of the moisture bar',
    },
  },
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof MoistureBar>

// Default
export const Default: Story = {
  args: {
    value: 70,
    showLabel: true,
    size: 'sm',
  },
}

// All moisture states
export const AllStates: Story = {
  render: () => (
    <div className="space-y-6 w-64">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Thriving (90%)</p>
        <MoistureBar value={90} showLabel />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Good (70%)</p>
        <MoistureBar value={70} showLabel />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Normal (50%)</p>
        <MoistureBar value={50} showLabel />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Warning (35%)</p>
        <MoistureBar value={35} showLabel />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Low (20%)</p>
        <MoistureBar value={20} showLabel />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Critical (10%)</p>
        <MoistureBar value={10} showLabel />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All moisture states from thriving to critical. Colors change based on moisture level.',
      },
    },
  },
}

// High moisture (thriving) - Blue
export const Thriving: Story = {
  args: {
    value: 90,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'High moisture (70%+) shows blue gradient - plant is thriving.',
      },
    },
  },
}

// Medium moisture - Yellow
export const Normal: Story = {
  args: {
    value: 50,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Medium moisture (40-70%) shows yellow gradient - plant is okay.',
      },
    },
  },
}

// Low moisture - Orange
export const Low: Story = {
  args: {
    value: 25,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Low moisture (20-40%) shows orange gradient - plant needs water soon.',
      },
    },
  },
}

// Critical moisture - Red with pulse
export const Critical: Story = {
  args: {
    value: 10,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Critical moisture (<20%) shows red gradient with pulse animation - urgent!',
      },
    },
  },
}

// Without label
export const NoLabel: Story = {
  args: {
    value: 65,
    showLabel: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact version without the label, useful in tight spaces.',
      },
    },
  },
}

// Size comparison
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div>
        <p className="text-xs text-muted-foreground mb-2">Small (sm)</p>
        <MoistureBar value={70} showLabel size="sm" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">Medium (md)</p>
        <MoistureBar value={70} showLabel size="md" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different bar sizes.',
      },
    },
  },
}

// Edge cases
export const EdgeCases: Story = {
  render: () => (
    <div className="space-y-4 w-64">
      <div>
        <p className="text-xs text-muted-foreground mb-2">0% (Empty)</p>
        <MoistureBar value={0} showLabel />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-2">100% (Full)</p>
        <MoistureBar value={100} showLabel />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Edge cases: completely empty and completely full.',
      },
    },
  },
}

// In context: Card simulation
export const InContext: Story = {
  render: () => (
    <div className="p-4 bg-white/60 dark:bg-black/20 rounded-xl backdrop-blur-sm w-72 space-y-3">
      <MoistureBar value={45} showLabel />
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
          style={{ width: '65%' }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Growth: 65% complete
      </p>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'garden',
    },
    docs: {
      description: {
        story: 'How the moisture bar appears in a plant card context.',
      },
    },
  },
}
