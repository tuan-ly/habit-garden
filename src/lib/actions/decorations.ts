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
 * Uses atomic inventory decrement to prevent double-placement race condition
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

  // 4. Atomically decrement inventory FIRST (prevents double-place race)
  const { error: decrError } = await supabase.rpc('atomic_inventory_decrement', {
    p_inventory_id: invItem.id,
    p_user_id: user.id,
    p_amount: 1,
  })

  if (decrError) return { error: 'Failed to decrement inventory — item may already be placed' }

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
    // Rollback: re-add to inventory
    await supabase.rpc('atomic_inventory_increment', {
      p_user_id: user.id,
      p_item_type: 'decoration',
      p_decoration_type_id: invItem.decoration_type_id,
      p_amount: 1,
      p_acquired_via: 'craft',
    })
    return { error: 'Failed to place decoration' }
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
 * Order: DELETE from placed first, THEN increment inventory
 * This prevents the duplication bug where inventory is incremented but delete fails
 */
export async function pickUpDecoration(
  dto: PickUpDecorationDto
): Promise<{ success: true } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Verify ownership and get decoration_type_id
  const { data: deco, error: decoError } = await supabase
    .from('placed_decorations')
    .select('id, user_id, decoration_type_id')
    .eq('id', dto.placed_decoration_id)
    .single()

  if (decoError || !deco) return { error: 'Decoration not found' }
  if (deco.user_id !== user.id) return { error: 'Not your decoration' }

  // DELETE from placed decorations FIRST
  const { error: deleteError } = await supabase
    .from('placed_decorations')
    .delete()
    .eq('id', dto.placed_decoration_id)

  if (deleteError) return { error: deleteError.message }

  // THEN atomically increment inventory
  const { error: incrError } = await supabase.rpc('atomic_inventory_increment', {
    p_user_id: user.id,
    p_item_type: 'decoration',
    p_decoration_type_id: deco.decoration_type_id,
    p_amount: 1,
    p_acquired_via: 'pickup',
  })

  if (incrError) {
    // Critical: decoration was removed but inventory not updated
    // Re-place it to avoid data loss
    console.error('Failed to increment inventory after pickup, re-placing decoration:', incrError)
    await supabase.from('placed_decorations').insert({
      id: dto.placed_decoration_id,
      user_id: user.id,
      decoration_type_id: deco.decoration_type_id,
      grid_row: 0,
      grid_col: 0,
      grid_size: 1,
      rotation: 0,
    })
    return { error: 'Failed to return decoration to inventory' }
  }

  return { success: true }
}

/**
 * Subscription tier hierarchy for validation
 */
const TIER_LEVELS: Record<string, number> = {
  free: 0,
  pro: 1,
  premium: 2,
}

/**
 * Purchase a decoration with coins
 * Validates subscription tier requirement before purchase
 */
export async function purchaseDecoration(
  decorationTypeId: string
): Promise<{ success: true; itemName: string } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Get decoration type to check price and tier
  const { data: decoType, error: decoError } = await supabase
    .from('decoration_types')
    .select('id, name, coin_price, unlock_level, subscription_tier')
    .eq('id', decorationTypeId)
    .single()

  if (decoError || !decoType) return { error: 'Decoration not found' }
  if (!decoType.coin_price) return { error: 'This decoration cannot be purchased with coins' }

  // Check level and subscription tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('level, subscription_tier')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }
  if (profile.level < decoType.unlock_level) {
    return { error: `Need level ${decoType.unlock_level} to purchase this` }
  }

  // Validate subscription tier
  const userTierLevel = TIER_LEVELS[profile.subscription_tier ?? 'free'] ?? 0
  const requiredTierLevel = TIER_LEVELS[decoType.subscription_tier] ?? 0
  if (userTierLevel < requiredTierLevel) {
    return { error: `Requires ${decoType.subscription_tier} subscription` }
  }

  // Spend coins atomically
  const spendResult = await spendCoins(
    decoType.coin_price,
    'purchase_decoration',
    decoType.id
  )
  if ('error' in spendResult) return { error: String(spendResult.error) }

  // Add to inventory atomically
  const { error: addError } = await supabase.rpc('atomic_inventory_increment', {
    p_user_id: user.id,
    p_item_type: 'decoration',
    p_decoration_type_id: decoType.id,
    p_amount: 1,
    p_acquired_via: 'purchase',
  })

  if (addError) {
    // Coins spent but inventory failed — critical error, log it
    console.error('CRITICAL: Coins spent but decoration not added to inventory:', addError)
    // Attempt to refund coins
    const { awardCoins } = await import('./coins')
    await awardCoins(decoType.coin_price, 'refund_failed_purchase', decoType.id)
    return { error: 'Purchase failed — coins have been refunded' }
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
