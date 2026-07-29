import type { Habit, GrowthState, HabitPlantStage } from '@/types/habits'
import type { PlantWithType } from '@/types/database'

/**
 * Virtual Plant Pattern - represents a habit as a plant without data duplication.
 * Discriminated by `type: 'habit'` field.
 */
export interface VirtualPlant {
  id: string // format: "habit:{habit_id}"
  user_id: string
  name: string
  type: 'habit' // discriminator for type guard
  habit_id: string
  habit_type: string
  plant_stage: HabitPlantStage
  growth_percentage: number
  current_moisture: number // derived from consistency_score (0-100)
  status: 'growing' | 'thriving' | 'mature' // mapped from plant_stage
  created_at: string
  updated_at: string
  // Virtual plants don't support grid positioning or multi-cell layout
  grid_row: null
  grid_col: null
  grid_size: null
}

/**
 * Maps a habit and its growth state to a virtual plant representation.
 * Uses the "habit:{id}" prefix to distinguish from real plants.
 */
export function habitToVirtualPlant(habit: Habit, growth: GrowthState): VirtualPlant {
  return {
    id: `habit:${habit.id}`,
    user_id: habit.user_id,
    name: habit.name,
    type: 'habit',
    habit_id: habit.id,
    habit_type: habit.type,
    plant_stage: growth.plant_stage,
    growth_percentage: calculateGrowthPercentage(growth),
    current_moisture: Math.round(growth.consistency_score * 100),
    status: getVirtualPlantStatus(growth.plant_stage),
    created_at: habit.created_at,
    updated_at: growth.updated_at,
    grid_row: null,
    grid_col: null,
    grid_size: null,
  }
}

/**
 * Merges real plants and virtual plants into a unified array.
 * Sorted by created_at descending (newest first).
 */
export function mergeRealAndVirtualPlants(
  realPlants: PlantWithType[],
  virtualPlants: VirtualPlant[]
): (PlantWithType | VirtualPlant)[] {
  const merged: (PlantWithType | VirtualPlant)[] = [...realPlants, ...virtualPlants]

  // Sort by created_at descending (newest first)
  return merged.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return dateB - dateA
  })
}

/**
 * Type guard to check if a plant is a virtual plant (habit-based).
 */
export function isVirtualPlant(plant: PlantWithType | VirtualPlant): plant is VirtualPlant {
  return 'type' in plant && plant.type === 'habit'
}

/**
 * Maps habit plant stage to plant status for consistent UI rendering.
 */
export function getVirtualPlantStatus(stage: HabitPlantStage): 'growing' | 'thriving' | 'mature' {
  switch (stage) {
    case 'seed':
    case 'sprout':
    case 'growing':
      return 'growing'
    case 'blooming':
      return 'thriving'
    case 'mature':
      return 'mature'
  }
}

/**
 * Calculate growth percentage from current progress toward end target.
 * Internal helper for habitToVirtualPlant.
 */
function calculateGrowthPercentage(growth: GrowthState): number {
  // Growth percentage based on current target progression
  // If plant is at mature stage, return 100%
  if (growth.plant_stage === 'mature') {
    return 100
  }

  // Use total_growth_points as a proxy for overall progress
  // This is a simplified calculation - may need refinement based on plan data
  const progressPercentage = Math.min(100, (growth.total_growth_points / 100) * 100)
  return Math.round(progressPercentage)
}
