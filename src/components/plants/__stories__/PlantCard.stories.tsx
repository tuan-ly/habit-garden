import type { Meta, StoryObj } from '@storybook/react'
import { PlantCard } from '../plant-card'
import type { PlantWithType, WeatherType } from '@/types/database'
import { PlantsProvider } from '@/lib/context'

// Mock plant data factory
const createMockPlant = (overrides: Partial<PlantWithType> = {}): PlantWithType => ({
  id: '1',
  user_id: 'user-1',
  plant_type_id: 'succulent',
  name: 'Morning Meditation',
  habit_description: 'Daily 10-minute meditation session',
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

// Mock context wrapper for stories
const MockPlantsProvider = ({ children, plants }: { children: React.ReactNode; plants: PlantWithType[] }) => {
  return (
    <PlantsProvider
      initialPlants={plants}
    >
      {children}
    </PlantsProvider>
  )
}

const meta: Meta<typeof PlantCard> = {
  title: 'Plants/PlantCard',
  component: PlantCard,
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const plant = context.args.plant || createMockPlant()
      return (
        <MockPlantsProvider plants={[plant]}>
          <div className="max-w-sm">
            <Story />
          </div>
        </MockPlantsProvider>
      )
    },
  ],
  argTypes: {
    weather: {
      control: 'select',
      options: [null, 'sunny', 'cloudy', 'rainy', 'stormy', 'rainbow'],
      description: 'Weather effect to display',
    },
    onClick: { action: 'clicked' },
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'garden',
    },
  },
}

export default meta
type Story = StoryObj<typeof PlantCard>

// Default story
export const Default: Story = {
  args: {
    plant: createMockPlant(),
  },
}

// Watered today - button disabled
export const WateredToday: Story = {
  args: {
    plant: createMockPlant({
      last_watered_at: new Date().toISOString(),
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'When plant is already watered today, the button shows a checkmark.',
      },
    },
  },
}

// Needs water - yesterday watered
export const NeedsWater: Story = {
  args: {
    plant: createMockPlant({
      last_watered_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      current_moisture: 45,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Plant needs watering - blue gradient button is active.',
      },
    },
  },
}

// Mature plant with golden border
export const MaturePlant: Story = {
  args: {
    plant: createMockPlant({
      growth_percentage: 100,
      status: 'mature',
      current_streak: 30,
      total_waterings: 90,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Mature plants have a golden border and ring effect.',
      },
    },
  },
}

// Dead plant
export const DeadPlant: Story = {
  args: {
    plant: createMockPlant({
      status: 'dead',
      current_moisture: 0,
      growth_percentage: 45,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dead plants are dimmed and grayscale.',
      },
    },
  },
}

// Low moisture warning
export const LowMoisture: Story = {
  args: {
    plant: createMockPlant({
      current_moisture: 15,
      last_watered_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Low moisture plants show urgent watering need.',
      },
    },
  },
}

// With streak fire
export const WithStreak: Story = {
  args: {
    plant: createMockPlant({
      current_streak: 7,
      longest_streak: 14,
    }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Plants with active streaks show a fire indicator.',
      },
    },
  },
}

// Different plant types
export const PlantTypes: Story = {
  render: () => {
    const plants: PlantWithType[] = [
      createMockPlant({
        id: '1',
        name: 'Morning Exercise',
        plant_type: {
          ...createMockPlant().plant_type,
          name: 'Sunflower',
          icon: '🌻',
        },
      }),
      createMockPlant({
        id: '2',
        name: 'Reading Time',
        plant_type: {
          ...createMockPlant().plant_type,
          name: 'Cherry Blossom',
          icon: '🌸',
        },
      }),
      createMockPlant({
        id: '3',
        name: 'Daily Writing',
        plant_type: {
          ...createMockPlant().plant_type,
          name: 'Bamboo',
          icon: '🎋',
        },
      }),
    ]

    return (
      <MockPlantsProvider plants={plants}>
        <div className="grid grid-cols-1 gap-4 max-w-sm">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      </MockPlantsProvider>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Each plant type has a unique gradient background based on its name.',
      },
    },
  },
}

// With weather effects
export const WithWeather: Story = {
  render: () => {
    const weathers: (WeatherType | null)[] = ['sunny', 'rainy', 'rainbow']
    const plant = createMockPlant()

    return (
      <MockPlantsProvider plants={[plant]}>
        <div className="grid grid-cols-1 gap-4 max-w-sm">
          {weathers.map((weather) => (
            <div key={weather || 'none'}>
              <p className="text-xs text-muted-foreground mb-2 capitalize">
                Weather: {weather || 'none'}
              </p>
              <PlantCard plant={plant} weather={weather} />
            </div>
          ))}
        </div>
      </MockPlantsProvider>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Weather effects can be applied to show different visual states.',
      },
    },
  },
}

// Growth progression
export const GrowthProgression: Story = {
  render: () => {
    const stages = [
      { growth: 0, label: 'Seed' },
      { growth: 25, label: 'Sprout' },
      { growth: 50, label: 'Growing' },
      { growth: 75, label: 'Blooming' },
      { growth: 100, label: 'Mature', status: 'mature' as const },
    ]

    return (
      <div className="grid grid-cols-1 gap-4 max-w-sm">
        {stages.map(({ growth, label, status }) => {
          const plant = createMockPlant({
            id: label,
            growth_percentage: growth,
            status: status || 'growing',
          })
          return (
            <MockPlantsProvider key={label} plants={[plant]}>
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  {label} ({growth}%)
                </p>
                <PlantCard plant={plant} />
              </div>
            </MockPlantsProvider>
          )
        })}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows plant cards at different growth stages.',
      },
    },
  },
}
