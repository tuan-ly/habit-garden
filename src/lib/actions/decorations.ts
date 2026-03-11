'use server'

import { getAuthUser } from '@/lib/auth-cached'
import { createClient } from '@/lib/supabase/server'
import type {
  PlacedDecorationWithType,
  PlaceDecorationDto,
  MoveDecorationDto,
  PickUpDecorationDto,
  DecorationRotation,
} from '@/types/database'
import { spendCoins } from './coins'

/**
 * Get all placed decorations for user's garden
 */
export async function getPlacedDecorations(): Promise<
  { decorations: PlacedDecorationWithType[] } | { error: string }
> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('placed_decorations')
    .select(`
      id, user_id, decoration_type_id, grid_row, grid_col, grid_size, rotation, placed_at,
      decoration_type:decoration_types(id, slug, name, description, icon, image_url, grid_size, category, rarity, unlock_level, coin_price, subscription_tier, is_craftable, created_at)
    `)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { decorations: (data ?? []) as unknown as PlacedDecorationWithType[] }
}

/**
 * Place a decoration from inventory onto the garden grid
 */
export async function placeDecoration(
  dto: PlaceDecorationDto
): Promise<{ success: true; decorationId: string } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // 1. Verify inventory item exists and belongs to user
  const { data: invItem, error: invError } = await supabase
    .from('user_inventory')
    .select('id, user_id, item_type, decoration_type_id, quantity')
    .eq('id', dto.inventory_item_id)
    .eq('user_id', user.id)
    .eq('item_type', 'decoration')
    .single()

  if (invError || !invItem) return { error: 'Item not found in inventory' }
  if (invItem.quantity < 1) return { error: 'No items available' }

  // 2. Get decoration type to know grid_size
  const { data: decoType, error: decoTypeError } = await supabase
    .from('decoration_types')
    .select('id, grid_size')
    .eq('id', invItem.decoration_type_id)
    .single()

  if (decoTypeError || !decoType) return { error: 'Decoration type not found' }

  // 3. Check grid collision with existing plants and decorations
  // Get existing plants in the area
  const { data: plants } = await supabase
    .from('plants')
    .select('id, grid_row, grid_col, grid_size, status')
    .eq('user_id', user.id)
    .neq('status', 'dead')

  const { data: existingDecos } = await supabase
    .from('placed_decorations')
    .select('id, grid_row, grid_col, grid_size')
    .eq('user_id', user.id)

  // Simple collision check
  const newCells = getOccupiedCellsSimple(dto.grid_row, dto.grid_col, decoType.grid_size)
  const occupied = new Set<string>()

  for (const p of (plants ?? [])) {
    for (const cell of getOccupiedCellsSimple(p.grid_row, p.grid_col, p.grid_size || 1)) {
      occupied.add(cell)
    }
  }
  for (const d of (existingDecos ?? [])) {
    for (const cell of getOccupiedCellsSimple(d.grid_row, d.grid_col, d.grid_size)) {
      occupied.add(cell)
    }
  }

  for (const cell of newCells) {
    if (occupied.has(cell)) {
      return { error: 'Space is occupied' }
    }
  }

  // 4. Place the decoration
  const { data: placed, error: placeError } = await supabase
    .from('placed_decorations')
    .insert({
      user_id: user.id,
      decoration_type_id: invItem.decoration_type_id,
      grid_row: dto.grid_row,
      grid_col: dto.grid_col,
      grid_size: decoType.grid_size,
      rotation: dto.rotation ?? 0,
    })
    .select('id')
    .single()

  if (placeError || !placed) return { error: 'Failed to place decoration' }

  // 5. Decrease inventory quantity
  if (invItem.quantity <= 1) {
    await supabase.from('user_inventory').delete().eq('id', invItem.id)
  } else {
    await supabase
      .from('user_inventory')
      .update({ quantity: invItem.quantity - 1, updated_at: new Date().toISOString() })
      .eq('id', invItem.id)
  }

  return { success: true, decorationId: placed.id }
}

/**
 * Move a placed decoration to a new grid position
 */
export async function moveDecoration(
  dto: MoveDecorationDto
): Promise<{ success: true } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Verify ownership
  const { data: deco, error: decoError } = await supabase
    .from('placed_decorations')
    .select('id, user_id, grid_size')
    .eq('id', dto.placed_decoration_id)
    .single()

  if (decoError || !deco) return { error: 'Decoration not found' }
  if (deco.user_id !== user.id) return { error: 'Not your decoration' }

  // Check collision at new position (excluding self)
  const { data: plants } = await supabase
    .from('plants')
    .select('id, grid_row, grid_col, grid_size, status')
    .eq('user_id', user.id)
    .neq('status', 'dead')

  const { data: existingDecos } = await supabase
    .from('placed_decorations')
    .select('id, grid_row, grid_col, grid_size')
    .eq('user_id', user.id)
    .neq('id', dto.placed_decoration_id)

  const newCells = getOccupiedCellsSimple(dto.grid_row, dto.grid_col, deco.grid_size)
  const occupied = new Set<string>()

  for (const p of (plants ?? [])) {
    for (const cell of getOccupiedCellsSimple(p.grid_row, p.grid_col, p.grid_size || 1)) {
      occupied.add(cell)
    }
  }
  for (const d of (existingDecos ?? [])) {
    for (const cell of getOccupiedCellsSimple(d.grid_row, d.grid_col, d.grid_size)) {
      occupied.add(cell)
    }
  }

  for (const cell of newCells) {
    if (occupied.has(cell)) {
      return { error: 'Space is occupied' }
    }
  }

  // Update position
  const { error: updateError } = await supabase
    .from('placed_decorations')
    .update({ grid_row: dto.grid_row, grid_col: dto.grid_col })
    .eq('id', dto.placed_decoration_id)

  if (updateError) return { error: updateError.message }
  return { success: true }
}

/**
 * Pick up a placed decoration (return to inventory)
 */
export async function pickUpDecoration(
  dto: PickUpDecorationDto
): Promise<{ success: true } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Verify ownership
  const { data: deco, error: decoError } = await supabase
    .from('placed_decorations')
    .select('id, user_id, decoration_type_id')
    .eq('id', dto.placed_decoration_id)
    .single()

  if (decoError || !deco) return { error: 'Decoration not found' }
  if (deco.user_id !== user.id) return { error: 'Not your decoration' }

  // Return to inventory
  const { data: existing } = await supabase
    .from('user_inventory')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('item_type', 'decoration')
    .eq('decoration_type_id', deco.decoration_type_id)
    .single()

  if (existing) {
    await supabase
      .from('user_inventory')
      .update({ quantity: existing.quantity + 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('user_inventory')
      .insert({
        user_id: user.id,
        item_type: 'decoration',
        decoration_type_id: deco.decoration_type_id,
        quantity: 1,
        acquired_via: 'craft', // Keep original method
      })
  }

  // Remove from placed decorations
  const { error: deleteError } = await supabase
    .from('placed_decorations')
    .delete()
    .eq('id', dto.placed_decoration_id)

  if (deleteError) return { error: deleteError.message }
  return { success: true }
}

/**
 * Purchase a decoration with coins
 */
export async function purchaseDecoration(
  decorationTypeId: string
): Promise<{ success: true; itemName: string } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Get decoration type to check price
  const { data: decoType, error: decoError } = await supabase
    .from('decoration_types')
    .select('id, name, coin_price, unlock_level, subscription_tier')
    .eq('id', decorationTypeId)
    .single()

  if (decoError || !decoType) return { error: 'Decoration not found' }
  if (!decoType.coin_price) return { error: 'This decoration cannot be purchased with coins' }

  // Check level requirement
  const { data: profile } = await supabase
    .from('profiles')
    .select('level, subscription_tier')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }
  if (profile.level < decoType.unlock_level) {
    return { error: `Need level ${decoType.unlock_level} to purchase this` }
  }

  // Spend coins
  const spendResult = await spendCoins(
    decoType.coin_price,
    'purchase_decoration',
    decoType.id
  )
  if ('error' in spendResult) return { error: spendResult.error }

  // Add to inventory
  const { data: existing } = await supabase
    .from('user_inventory')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('item_type', 'decoration')
    .eq('decoration_type_id', decoType.id)
    .single()

  if (existing) {
    await supabase
      .from('user_inventory')
      .update({ quantity: existing.quantity + 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('user_inventory')
      .insert({
        user_id: user.id,
        item_type: 'decoration',
        decoration_type_id: decoType.id,
        quantity: 1,
        acquired_via: 'purchase',
      })
  }

  return { success: true, itemName: decoType.name }
}

/**
 * Rotate a placed decoration
 */
export async function rotateDecoration(
  placedDecorationId: string
): Promise<{ success: true; newRotation: DecorationRotation } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const { data: deco, error: decoError } = await supabase
    .from('placed_decorations')
    .select('id, user_id, rotation')
    .eq('id', placedDecorationId)
    .single()

  if (decoError || !deco) return { error: 'Decoration not found' }
  if (deco.user_id !== user.id) return { error: 'Not your decoration' }

  const rotations: DecorationRotation[] = [0, 90, 180, 270]
  const currentIndex = rotations.indexOf(deco.rotation as DecorationRotation)
  const newRotation = rotations[(currentIndex + 1) % rotations.length]

  const { error: updateError } = await supabase
    .from('placed_decorations')
    .update({ rotation: newRotation })
    .eq('id', placedDecorationId)

  if (updateError) return { error: updateError.message }
  return { success: true, newRotation }
}

// ============================================
// Utility
// ============================================

/**
 * Get all cells occupied by an item at (row, col) with given grid_size
 */
function getOccupiedCellsSimple(row: number, col: number, gridSize: number): string[] {
  const cells: string[] = []
  for (let r = row; r < row + gridSize; r++) {
    for (let c = col; c < col + gridSize; c++) {
      cells.push(`${r}-${c}`)
    }
  }
  return cells
}
