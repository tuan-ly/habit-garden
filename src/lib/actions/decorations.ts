'use server'

import { getAuthUser } from '@/lib/auth-cached'
import { createClient } from '@/lib/supabase/server'
import type {
  PlacedDecorationWithType,
  PlaceDecorationDto,
  MoveDecorationDto,
  PickUpDecorationDto,
  DecorationRotation,
  DecorationType,
  InventoryItemWithDetails,
} from '@/types/database'

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
 * Uses atomic inventory decrement to prevent double-placement race condition
 */
export async function placeDecoration(
  dto: PlaceDecorationDto
): Promise<{ success: true; decorationId: string } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  if (dto.grid_row < 0 || dto.grid_col < 0) return { error: 'Invalid grid position' }

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
  const { data: plants } = await supabase
    .from('plants')
    .select('id, grid_row, grid_col, grid_size, status')
    .eq('user_id', user.id)
    .neq('status', 'dead')

  const { data: existingDecos } = await supabase
    .from('placed_decorations')
    .select('id, grid_row, grid_col, grid_size')
    .eq('user_id', user.id)

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

  // quantity=1 cannot be updated to zero because the table enforces quantity > 0.
  // For stacks, reserve one item first. For the last item, insert first and then
  // delete the exact inventory row conditionally; a concurrent loser rolls back.
  const isLastInventoryItem = invItem.quantity === 1
  if (!isLastInventoryItem) {
    const { error: decrError } = await supabase.rpc('atomic_inventory_decrement', {
      p_inventory_id: invItem.id,
      p_user_id: user.id,
      p_amount: 1,
    })

    if (decrError) {
      console.error('Decoration inventory decrement failed', decrError)
      return { error: 'Failed to decrement inventory — item may already be placed' }
    }
  }

  // 5. Place the decoration
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

  if (placeError || !placed) {
    if (!isLastInventoryItem) {
      // Rollback the stack reservation.
      await supabase.rpc('atomic_inventory_increment', {
        p_user_id: user.id,
        p_item_type: 'decoration',
        p_decoration_type_id: invItem.decoration_type_id,
        p_amount: 1,
        p_acquired_via: 'craft',
      })
    }
    return { error: 'Failed to place decoration' }
  }

  if (isLastInventoryItem) {
    const { data: removedInventory, error: removeError } = await supabase
      .from('user_inventory')
      .delete()
      .eq('id', invItem.id)
      .eq('user_id', user.id)
      .eq('quantity', 1)
      .select('id')
      .maybeSingle()

    if (removeError || !removedInventory) {
      // Another request consumed the row, or deletion failed. Remove this
      // placement so one inventory item can never create two decorations.
      await supabase
        .from('placed_decorations')
        .delete()
        .eq('id', placed.id)
        .eq('user_id', user.id)
      return { error: 'Failed to decrement inventory — item may already be placed' }
    }
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

  if (dto.grid_row < 0 || dto.grid_col < 0) return { error: 'Invalid grid position' }

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
 * Pick up a placed decoration (return to inventory) — atomic DB function.
 */
export async function pickUpDecoration(
  dto: PickUpDecorationDto
): Promise<{ success: true; inventoryItem: InventoryItemWithDetails } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const { data: placed, error: placedError } = await supabase
    .from('placed_decorations')
    .select('id, user_id, decoration_type_id')
    .eq('id', dto.placed_decoration_id)
    .eq('user_id', user.id)
    .single()

  if (placedError || !placed) return { error: 'Decoration not found' }

  const { error } = await supabase.rpc('pickup_decoration', {
    p_user_id: user.id,
    p_placed_decoration_id: dto.placed_decoration_id,
  })

  if (error) {
    console.error('Decoration pickup failed', error)
    const msg = error.message.toLowerCase()
    if (msg.includes('decoration_not_found')) return { error: 'Decoration not found' }
    if (msg.includes('not_owner')) return { error: 'Not your decoration' }
    if (msg.includes('unauthorized')) return { error: 'Unauthorized' }
    return { error: error.message }
  }

  const { data: inventoryItem, error: inventoryError } = await supabase
    .from('user_inventory')
    .select(`
      id, user_id, item_type, material_id, decoration_type_id, quantity, acquired_via, created_at, updated_at,
      decoration_type:decoration_types(id, slug, name, description, icon, image_url, grid_size, category, rarity, unlock_level, coin_price, subscription_tier, is_craftable, created_at)
    `)
    .eq('user_id', user.id)
    .eq('item_type', 'decoration')
    .eq('decoration_type_id', placed.decoration_type_id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (inventoryError || !inventoryItem) {
    return { error: 'Decoration was stored but inventory could not be refreshed' }
  }

  return {
    success: true,
    inventoryItem: inventoryItem as unknown as InventoryItemWithDetails,
  }
}

/**
 * Purchase a decoration with coins — atomic DB function.
 * Spends coins + adds inventory in single transaction.
 */
export async function purchaseDecoration(
  decorationTypeId: string
): Promise<{ success: true; itemName: string } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('purchase_decoration', {
    p_user_id: user.id,
    p_decoration_type_id: decorationTypeId,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('decoration_not_found')) return { error: 'Decoration not found' }
    if (msg.includes('not_for_sale')) return { error: 'This decoration cannot be purchased with coins' }
    if (msg.includes('level_too_low')) return { error: 'Level too low to purchase this' }
    if (msg.includes('tier_required')) return { error: 'Higher subscription tier required' }
    if (msg.includes('insufficient_coins')) return { error: 'Not enough coins' }
    if (msg.includes('unauthorized')) return { error: 'Unauthorized' }
    return { error: error.message }
  }

  const result = data as { success: boolean; item_name: string }
  return { success: true, itemName: result.item_name }
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

/**
 * Get decoration types available for purchase with coins
 */
export async function getShopItems(): Promise<
  { items: DecorationType[] } | { error: string }
> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decoration_types')
    .select('id, slug, name, description, icon, image_url, grid_size, category, rarity, unlock_level, coin_price, subscription_tier, is_craftable, created_at')
    .not('coin_price', 'is', null)
    .order('coin_price', { ascending: true })

  if (error) return { error: error.message }
  return { items: (data ?? []) as DecorationType[] }
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
