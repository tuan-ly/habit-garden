import { describe, expect, it } from 'vitest'
import {
  habitToVirtualPlant,
  isVirtualPlant,
  mergeRealAndVirtualPlants,
} from '@/lib/habit-plant-mapping'
import type { PlantWithType } from '@/types/database'
import type { GrowthState, Habit } from '@/types/habits'

const habit: Habit = {
  id: 'habit-1',
  user_id: 'user-1',
  type: 'reading',
  name: 'Reading Garden',
  description: null,
  unit: 'pages',
  custom_unit: null,
  session_duration_minutes: 30,
  is_active: true,
  created_at: '2026-07-28T00:00:00.000Z',
  updated_at: '2026-07-29T00:00:00.000Z',
}

const growth: GrowthState = {
  id: 'growth-1',
  habit_id: habit.id,
  user_id: habit.user_id,
  current_target: 10,
  previous_target: 5,
  next_target: 15,
  review_period_started_on: '2026-07-28',
  next_review_on: '2026-08-04',
  last_reviewed_on: null,
  consistency_score: 0.82,
  current_streak: 2,
  best_streak: 4,
  last_completed_on: '2026-07-29',
  total_growth_points: 42,
  plant_stage: 'growing',
  history: [],
  created_at: '2026-07-28T00:00:00.000Z',
  updated_at: '2026-07-29T00:00:00.000Z',
}

const realPlant = {
  id: 'plant-1',
  name: 'Meditation',
  created_at: '2026-07-27T00:00:00.000Z',
} as PlantWithType

describe('habit plant mapping', () => {
  it('maps growth state into a discriminated virtual plant', () => {
    const plant = habitToVirtualPlant(habit, growth)

    expect(plant).toMatchObject({
      id: 'habit:habit-1',
      type: 'habit',
      habit_id: 'habit-1',
      habit_type: 'reading',
      plant_stage: 'growing',
      growth_percentage: 42,
      current_moisture: 82,
      status: 'growing',
    })
    expect(isVirtualPlant(plant)).toBe(true)
  })

  it('merges virtual and real plants newest first', () => {
    const virtualPlant = habitToVirtualPlant(habit, growth)
    const merged = mergeRealAndVirtualPlants([realPlant], [virtualPlant])

    expect(merged.map((plant) => plant.id)).toEqual(['habit:habit-1', 'plant-1'])
    expect(isVirtualPlant(merged[0])).toBe(true)
    expect(isVirtualPlant(merged[1])).toBe(false)
  })
})
