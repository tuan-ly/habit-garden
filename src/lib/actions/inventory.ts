'use server'

import { getAuthUser } from '@/lib/auth-cached'
import { createClient } from '@/lib/supabase/server'
import type { InventoryItemWithDetails, Material } from '@/types/database'

/**
 * Get user's full inventory (materials + stored decorations)
 */
export async function getUserInventory(): Promise<
  { materials: InventoryItemWithDetails[]; decorations: InventoryItemWithDetails[] }
  | { error: string }
> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Fetch materials in inventory
  const { data: materialItems, error: matError } = await supabase
    .from('user_inventory')
    .select(`
      id, user_id, item_type, material_id, decoration_type_id, quantity, acquired_via, created_at, updated_at,
      material:materials(id, slug, name, description, icon, image_url, rarity, plant_type_id, created_at)
    `)
    .eq('user_id', user.id)
    .eq('item_type', 'material')

  if (matError) return { error: matError.message }

  // Fetch decorations in inventory (not placed on grid)
  const { data: decoItems, error: decoError } = await supabase
    .from('user_inventory')
    .select(`
      id, user_id, item_type, material_id, decoration_type_id, quantity, acquired_via, created_at, updated_at,
      decoration_type:decoration_types(id, slug, name, description, icon, image_url, grid_size, category, rarity, unlock_level, coin_price, subscription_tier, is_craftable, created_at)
    `)
    .eq('user_id', user.id)
    .eq('item_type', 'decoration')

  if (decoError) return { error: decoError.message }

  return {
    materials: (materialItems ?? []) as unknown as InventoryItemWithDetails[],
    decorations: (decoItems ?? []) as unknown as InventoryItemWithDetails[],
  }
}

/**
 * Harvest material from a matured plant
 * Called when a plant reaches mature status
 * @param plantId - The plant that just matured
 */
export async function harvestMaterial(
  plantId: string
): Promise<{ material: Material; quantity: number } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Get plant with type info - verify ownership
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select('id, user_id, plant_type_id, status')
    .eq('id', plantId)
    .single()

  if (plantError || !plant) return { error: 'Plant not found' }
  if (plant.user_id !== user.id) return { error: 'Not your plant' }

  // Find the material for this plant type
  const { data: material, error: matError } = await supabase
    .from('materials')
    .select('id, slug, name, description, icon, image_url, rarity, plant_type_id, created_at')
    .eq('plant_type_id', plant.plant_type_id)
    .single()

  if (matError || !material) {
    // Fallback to garden-essence if no specific material found
    const { data: fallback, error: fallbackError } = await supabase
      .from('materials')
      .select('id, slug, name, description, icon, image_url, rarity, plant_type_id, created_at')
      .eq('slug', 'garden-essence')
      .single()

    if (fallbackError || !fallback) return { error: 'No material available' }

    await upsertInventoryMaterial(supabase, user.id, fallback.id)
    return { material: fallback as Material, quantity: 1 }
  }

  await upsertInventoryMaterial(supabase, user.id, material.id)
  return { material: material as Material, quantity: 1 }
}

/**
 * Helper: Add or increment material in inventory — atomic via RPC
 */
async function upsertInventoryMaterial(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  materialId: string
): Promise<void> {
  const { error } = await supabase.rpc('atomic_inventory_increment', {
    p_user_id: userId,
    p_item_type: 'material',
    p_material_id: materialId,
    p_decoration_type_id: null,
    p_amount: 1,
    p_acquired_via: 'harvest',
  })

  if (error) {
    console.error('Failed to upsert inventory material:', error)
  }
}

/**
 * Get count of a specific material in user's inventory
 */
export async function getMaterialCount(
  materialSlug: string
): Promise<{ count: number } | { error: string }> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_inventory')
    .select('quantity, material:materials!inner(slug)')
    .eq('user_id', user.id)
    .eq('item_type', 'material')
    .eq('material.slug', materialSlug)
    .single()

  if (error) return { count: 0 } // No entry = 0
  return { count: data?.quantity ?? 0 }
}
