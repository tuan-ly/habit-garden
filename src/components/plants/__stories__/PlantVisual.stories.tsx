import type { Meta, StoryObj } from '@storybook/react'
import { PlantVisual, XpPopup, StreakFire } from '../plant-visual'
import type { PlantWithType, WeatherType, PlantStatus } from '@/types/database'

// Mock plant data factory
const createMockPlant = (overrides: Partial<PlantWithType> = {}): PlantWithType => ({
  id: '1',
  user_id: 'user-1',
  plant_type_id: 'succulent',
  name: 'My Succulent',
  habit_description: 'Daily meditation',
  started_at: new Date().toISOString(),
  current_moisture: 70,
  growth_percentage: 50,
  total_waterings: 30,
  current_streak: 5,
  longest_streak: 10,
  last_watered_at: new Date().toISOString(),
  status: 'growing',
  matured_at: null,
  died_at: null,
  death_reason: null,
  goal_mode: null,
  reminder_time: null,
  reminder_enabled: false,
  adaptive_mode: 'off',
  position: 0,
  grid_size: 1,
  grid_row: 0,
  grid_col: 0,
  weed_count: 0,
  last_weed_added: null,
  weeds_cleared_total: 0,
  why_i_started: null,
  maturity_level: 5,
  visual_stage: 'growing',
  rest_days_allowed: 1,
  grace_period_days: 3,
  days_this_week: 4,
  days_this_month: 15,
  consistency_percentage: 85,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  plant_type: {
    id: 'succulent',
    name: 'Succulent',
    name_vi: 'Sen đá',
    icon: '🌵',
    description: 'A hardy little friend',
    description_vi: 'Một người bạn nhỏ bền bỉ',
    maturity_days: 30,
    frequency_type: 'daily',
    frequency_target: 1,
    moisture_decay_rate: 5,
    moisture_boost: 30,
    special_effect: null,
    category: 'succulent',
    difficulty: 'easy',
    is_premium: false,
    tier: 1,
    tier_unlock_level: 1,
    created_at: new Date().toISOString(),
  },
  ...overrides,
})

const meta: Meta<typeof PlantVisual> = {
  title: 'Plants/PlantVisual',
  component: PlantVisual,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Size of the plant visual',
    },
    weather: {
      control: 'select',
      options: [null, 'sunny', 'cloudy', 'rainy', 'stormy', 'rainbow'],
      description: 'Weather effect to display',
    },
    showWateringEffect: {
      control: 'boolean',
      description: 'Show watering animation',
    },
    isWateredToday: {
      control: 'boolean',
      description: 'Whether plant is watered today',
    },
    alignBottom: {
      control: 'boolean',
      description: 'Align plant to bottom (for isometric garden)',
    },
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'garden',
    },
  },
}

export default meta
type Story = StoryObj<typeof PlantVisual>

// Default story
export const Default: Story = {
  args: {
    plant: createMockPlant(),
    size: 'lg',
    isWateredToday: true,
  },
}

// Growth stages progression
export const GrowthStages: Story = {
  render: () => (
    <div className="flex items-end gap-8 p-4 bg-green-50 rounded-lg">
      <div className="text-center">
        <PlantVisual
          plant={createMockPlant({ growth_percentage: 0, status: 'growing' })}
          size="lg"
          isWateredToday
        />
        <p className="text-sm mt-2 font-medium">Seed (0%)</p>
      </div>
      <div className="text-center">
        <PlantVisual
          plant={createMockPlant({ growth_percentage: 25, status: 'growing' })}
          size="lg"
          isWateredToday
        />
        <p className="text-sm mt-2 font-medium">Sprout (25%)</p>
      </div>
      <div className="text-center">
        <PlantVisual
          plant={createMockPlant({ growth_percentage: 50, status: 'growing' })}
          size="lg"
          isWateredToday
        />
        <p className="text-sm mt-2 font-medium">Growing (50%)</p>
      </div>
      <div className="text-center">
        <PlantVisual
          plant={createMockPlant({ growth_percentage: 75, status: 'growing' })}
          size="lg"
          isWateredToday
        />
        <p className="text-sm mt-2 font-medium">Blooming (75%)</p>
      </div>
      <div className="text-center">
        <PlantVisual
          plant={createMockPlant({ growth_percentage: 100, status: 'mature' })}
          size="lg"
          isWateredToday
        />
        <p className="text-sm mt-2 font-medium">Mature (100%)</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows the plant progression through all growth stages.',
      },
    },
  },
}

// Moisture states
export const MoistureStates: Story = {
  render: () => (
    <div className="flex items-center gap-8 p-4">
      <div className="text-center">
        <PlantVisual
          plant={createMockPlant({ current_moisture: 90 })}
          size="lg"
          isWateredToday
        />
        <p className="text-sm mt-2 text-green-600 font-medium">Thriving (90%)</p>
      </div>
      <div className="text-center">
        <PlantVisual
          plant={createMockPlant({ current_moisture: 50 })}
          size="lg"
          isWateredToday
        />
        <p className="text-sm mt-2 font-medium">Normal (50%)</p>
      </div>
      <div className="text-center">
        <PlantVisual
          plant={createMockPlant({ current_moisture: 20 })}
          size="lg"
          isWateredToday
        />
        <p className="text-sm mt-2 text-amber-600 font-medium">Wilting (20%)</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different moisture levels affect plant appearance.',
      },
    },
  },
}

// Needs water indicator
export const NeedsWater: Story = {
  args: {
    plant: createMockPlant({ last_watered_at: null }),
    size: 'lg',
    isWateredToday: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the "needs water" indicator when plant hasnt been watered today.',
      },
    },
  },
}

// Watered today
export const WateredToday: Story = {
  args: {
    plant: createMockPlant(),
    size: 'lg',
    isWateredToday: true,
  },
}

// Dead plant
export const Dead: Story = {
  args: {
    plant: createMockPlant({ status: 'dead', current_moisture: 0 }),
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: 'A dead plant - dimmed appearance.',
      },
    },
  },
}

// Different sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6 p-4">
      {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
        <div key={size} className="text-center">
          <PlantVisual plant={createMockPlant()} size={size} isWateredToday />
          <p className="text-xs text-muted-foreground mt-2">{size}</p>
        </div>
      ))}
    </div>
  ),
}

// Weather effects
export const WeatherEffects: Story = {
  render: () => (
    <div className="flex gap-8 p-4">
      {(['sunny', 'cloudy', 'rainy', 'stormy', 'rainbow'] as WeatherType[]).map(
        (weather) => (
          <div key={weather} className="text-center">
            <PlantVisual
              plant={createMockPlant()}
              size="lg"
              weather={weather}
              isWateredToday
            />
            <p className="text-sm mt-2 capitalize">{weather}</p>
          </div>
        )
      )}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Weather effects applied to the plant visual.',
      },
    },
  },
}

// Watering animation
export const WateringAnimation: Story = {
  args: {
    plant: createMockPlant(),
    size: 'xl',
    showWateringEffect: true,
    isWateredToday: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the watering animation effect.',
      },
    },
  },
}

// XP Popup component
export const XpPopupStory: Story = {
  render: () => (
    <div className="flex items-center gap-8 p-4">
      <div className="relative">
        <PlantVisual plant={createMockPlant()} size="lg" isWateredToday />
        <XpPopup amount={15} show={true} />
      </div>
      <div className="relative">
        <PlantVisual plant={createMockPlant()} size="lg" isWateredToday />
        <XpPopup amount={50} show={true} />
      </div>
    </div>
  ),
  name: 'XP Popup',
  parameters: {
    docs: {
      description: {
        story: 'XP popup that appears after watering.',
      },
    },
  },
}

// Streak Fire component
export const StreakFireStory: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4">
      <div className="flex items-center gap-2">
        <StreakFire streak={3} show={true} />
        <span className="text-sm text-muted-foreground">3-day streak</span>
      </div>
      <div className="flex items-center gap-2">
        <StreakFire streak={7} show={true} />
        <span className="text-sm text-muted-foreground">7-day streak (animated)</span>
      </div>
      <div className="flex items-center gap-2">
        <StreakFire streak={30} show={true} />
        <span className="text-sm text-muted-foreground">30-day streak</span>
      </div>
    </div>
  ),
  name: 'Streak Fire',
  parameters: {
    docs: {
      description: {
        story: 'Streak fire indicator with different streak lengths.',
      },
    },
  },
}

// In context: Garden view simulation
export const InGardenContext: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-b from-green-100 to-green-200 rounded-lg w-80">
      <div className="aspect-square bg-green-300/50 rounded flex items-end justify-center p-1">
        <PlantVisual
          plant={createMockPlant({ growth_percentage: 100, status: 'mature' })}
          size="md"
          isWateredToday
          alignBottom
        />
      </div>
      <div className="aspect-square bg-green-300/50 rounded flex items-end justify-center p-1">
        <PlantVisual
          plant={createMockPlant({ growth_percentage: 50 })}
          size="md"
          isWateredToday={false}
          alignBottom
        />
      </div>
      <div className="aspect-square bg-green-300/50 rounded flex items-end justify-center p-1">
        <PlantVisual
          plant={createMockPlant({
            growth_percentage: 25,
            plant_type: {
              ...createMockPlant().plant_type,
              name: 'Sunflower',
              icon: '🌻',
            },
          })}
          size="md"
          isWateredToday
          alignBottom
        />
      </div>
      <div className="aspect-square bg-green-300/30 rounded flex items-center justify-center">
        <span className="text-2xl opacity-30">+</span>
      </div>
      <div className="aspect-square bg-green-300/50 rounded flex items-end justify-center p-1">
        <PlantVisual
          plant={createMockPlant({ current_moisture: 20 })}
          size="md"
          isWateredToday={false}
          alignBottom
        />
      </div>
      <div className="aspect-square bg-green-300/30 rounded flex items-center justify-center">
        <span className="text-2xl opacity-30">+</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'How plants appear in the garden grid view.',
      },
    },
  },
}
