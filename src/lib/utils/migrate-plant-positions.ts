/**
 * Migration Utility: Convert old position field to grid_row/grid_col
 *
 * This script helps migrate existing plants from the old linear position
 * system to the new 2D grid positioning system.
 *
 * Run this once after adding grid_size, grid_row, grid_col fields to database.
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Calculate grid size based on plant count (matches old algorithm)
 */
function getGridSize(plantCount: number): number {
  const minSlots = plantCount + 1
  const gridSize = Math.ceil(Math.sqrt(minSlots))
  return Math.max(gridSize, 2)
}

/**
 * Convert linear position to 2D grid coordinates
 */
function positionToGridCoords(
  position: number,
  gridSize: number
): { row: number; col: number } {
  const row = Math.floor(position / gridSize)
  const col = position % gridSize
  return { row, col }
}

/**
 * Migrate all plants for a specific user
 */
export async function migratePlantsForUser(userId: string): Promise<void> {
  const supabase = await createClient()

  // Get all living plants for this user
  const { data: plants, error: fetchError } = await supabase
    .from('plants')
    .select('id, position')
    .eq('user_id', userId)
    .neq('status', 'dead')
    .order('position', { ascending: true })

  if (fetchError) {
    console.error('Error fetching plants:', fetchError)
    throw fetchError
  }

  if (!plants || plants.length === 0) {
    console.log(`No plants to migrate for user ${userId}`)
    return
  }

  // Calculate grid size using old algorithm
  const gridSize = getGridSize(plants.length)
  console.log(`Migrating ${plants.length} plants with grid size ${gridSize}`)

  // Update each plant
  for (const plant of plants) {
    const { row, col } = positionToGridCoords(plant.position, gridSize)

    const { error: updateError } = await supabase
      .from('plants')
      .update({
        grid_size: 1, // All existing plants are 1x1
        grid_row: row,
        grid_col: col,
      })
      .eq('id', plant.id)

    if (updateError) {
      console.error(`Error updating plant ${plant.id}:`, updateError)
      throw updateError
    } else {
      console.log(
        `Migrated plant ${plant.id}: position ${plant.position} → (${row}, ${col})`
      )
    }
  }

  console.log(`Successfully migrated ${plants.length} plants`)
}

/**
 * Migrate all users' plants (run in background or admin task)
 */
export async function migrateAllPlants(): Promise<void> {
  const supabase = await createClient()

  // Get all unique user IDs with plants
  const { data: users, error } = await supabase
    .from('plants')
    .select('user_id')
    .neq('status', 'dead')

  if (error) {
    console.error('Error fetching users:', error)
    throw error
  }

  if (!users) {
    console.log('No users to migrate')
    return
  }

  // Get unique user IDs
  const userIds = Array.from(new Set(users.map((u) => u.user_id)))
  console.log(`Migrating plants for ${userIds.length} users`)

  // Migrate each user's plants
  for (const userId of userIds) {
    try {
      await migratePlantsForUser(userId)
    } catch (err) {
      console.error(`Failed to migrate user ${userId}:`, err)
      // Continue with other users
    }
  }

  console.log('Migration complete!')
}
