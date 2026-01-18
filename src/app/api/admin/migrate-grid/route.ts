/**
 * Migration API: Convert old position field to grid_row/grid_col
 *
 * Run this endpoint ONCE after deploying the database schema changes
 * to migrate existing plants to the new grid positioning system.
 *
 * Usage:
 *   POST /api/admin/migrate-grid
 *   Body: { dryRun: true }  // Preview changes
 *   Body: { dryRun: false } // Apply migration
 */

import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const dryRun = body.dryRun !== false // Default to dry run

    const supabase = await createClient()

    // Get current user (admin check)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get all living plants for this user
    const { data: plants, error: fetchError } = await supabase
      .from('plants')
      .select('id, position, grid_size, grid_row, grid_col')
      .eq('user_id', user.id)
      .neq('status', 'dead')
      .order('position', { ascending: true })

    if (fetchError) {
      console.error('Error fetching plants:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!plants || plants.length === 0) {
      return NextResponse.json({
        message: 'No plants to migrate',
        migratedCount: 0,
      })
    }

    // Check if migration is needed
    const needsMigration = plants.some(
      (p) => p.grid_row === null || p.grid_col === null || p.grid_size === null
    )

    if (!needsMigration) {
      return NextResponse.json({
        message: 'All plants already have grid positions',
        migratedCount: 0,
      })
    }

    // Calculate grid size using old algorithm
    const gridSize = getGridSize(plants.length)

    const updates: Array<{
      id: string
      oldPosition: number
      newRow: number
      newCol: number
    }> = []

    // Calculate new positions for each plant
    for (const plant of plants) {
      const { row, col } = positionToGridCoords(plant.position, gridSize)
      updates.push({
        id: plant.id,
        oldPosition: plant.position,
        newRow: row,
        newCol: col,
      })
    }

    if (dryRun) {
      // Preview mode - don't actually update
      return NextResponse.json({
        dryRun: true,
        message: 'Migration preview (no changes made)',
        gridSize,
        totalPlants: plants.length,
        updates: updates.map((u) => ({
          plantId: u.id,
          oldPosition: u.oldPosition,
          newPosition: `(${u.newRow}, ${u.newCol})`,
        })),
      })
    }

    // Apply migration
    const results = []
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('plants')
        .update({
          grid_size: 1, // All existing plants are 1x1
          grid_row: update.newRow,
          grid_col: update.newCol,
        })
        .eq('id', update.id)

      if (updateError) {
        console.error(`Error updating plant ${update.id}:`, updateError)
        results.push({
          plantId: update.id,
          success: false,
          error: updateError.message,
        })
      } else {
        results.push({
          plantId: update.id,
          success: true,
          oldPosition: update.oldPosition,
          newPosition: `(${update.newRow}, ${update.newCol})`,
        })
      }
    }

    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      message: `Migration complete: ${successCount}/${plants.length} plants updated`,
      gridSize,
      results,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
