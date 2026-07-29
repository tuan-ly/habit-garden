import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HabitPlantTile } from '@/components/garden/HabitPlantTile'
import type { VirtualPlant } from '@/lib/habit-plant-mapping'

const virtualPlant: VirtualPlant = {
  id: 'habit:habit-1',
  user_id: 'user-1',
  name: 'Reading Garden',
  type: 'habit',
  habit_id: 'habit-1',
  habit_type: 'reading',
  plant_stage: 'blooming',
  growth_percentage: 72,
  current_moisture: 84,
  status: 'thriving',
  created_at: '2026-07-28T00:00:00.000Z',
  updated_at: '2026-07-29T00:00:00.000Z',
  grid_row: null,
  grid_col: null,
  grid_size: null,
}

describe('HabitPlantTile', () => {
  it('renders the habit name and growth state', () => {
    render(<HabitPlantTile plant={virtualPlant} />)

    expect(screen.getByText('Reading Garden')).toBeInTheDocument()
    expect(screen.getByLabelText('72% growth')).toBeInTheDocument()
    expect(screen.queryByText('Reading session active')).not.toBeInTheDocument()
  })

  it('shows an active-session indicator for the matching habit', () => {
    render(<HabitPlantTile plant={virtualPlant} isActive />)

    expect(screen.getByText('Reading session active')).toBeInTheDocument()
  })
})
