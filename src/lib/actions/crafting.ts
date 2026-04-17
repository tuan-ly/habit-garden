'use server'

import { getAuthUser } from '@/lib/auth-cached'
import { createClient } from '@/lib/supabase/server'
import type { RecipeWithDetails } from '@/types/database'

/**
 * Get all recipes with their ingredients and decoration type info
 */
export async function getRecipes(): Promise<
  { recipes: RecipeWithDetails[] } | { error: string }
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recipes')
    .select(`
      id, decoration_type_id, name, unlock_level, craft_time_minutes, is_active, created_at,
      decoration_type:decoration_types(id, slug, name, description, icon, image_url, grid_size, category, rarity, unlock_level, coin_price, subscription_tier, is_craftable, created_at),
      ingredients:recipe_ingredients(
        id, recipe_id, material_id, quantity,
        material:materials(id, slug, name, description, icon, image_url, rarity, plant_type_id, created_at)
      )
    `)
    .eq('is_active', true)
    .order('unlock_level', { ascending: true })

  if (error) return { error: error.message }

  // Transform the data - Supabase returns decoration_type as object (single), ingredients as array
  const recipes = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    decoration_type: r.decoration_type as RecipeWithDetails['decoration_type'],
    ingredients: (r.ingredients as Array<Record<string, unknown>>)?.map((ing) => ({
      ...ing,
      material: ing.material as RecipeWithDetails['ingredients'][0]['material'],
    })) ?? [],
  })) as RecipeWithDetails[]

  return { recipes }
}

/**
 * Craft a decoration from a recipe
 * Uses atomic inventory operations to prevent race conditions:
 * - Decrements each material atomically (fails if insufficient)
 * - Increments decoration atomically via upsert
 */
export async function craftDecoration(
  recipeId: string
): Promise<
  { success: true; decorationName: string }
  | { error: string }
> {
  const user = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // 1. Get recipe with ingredients
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select(`
      id, decoration_type_id, name, unlock_level, is_active,
      decoration_type:decoration_types(id, slug, name, rarity, subscription_tier),
      ingredients:recipe_ingredients(
        id, recipe_id, material_id, quantity
      )
    `)
    .eq('id', recipeId)
    .single()

  if (recipeError || !recipe) return { error: 'Recipe not found' }
  if (!recipe.is_active) return { error: 'Recipe is not available' }

  // 2. Get user's level to check unlock requirement
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('level, subscription_tier')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { error: 'Profile not found' }
  if (profile.level < recipe.unlock_level) {
    return { error: `Need level ${recipe.unlock_level} to craft this` }
  }

  // 3. Atomically deduct each material
  // If any fails (insufficient quantity), the individual RPC raises an exception
  // We track consumed materials to roll back on partial failure
  const ingredients = recipe.ingredients as Array<{ material_id: string; quantity: number }>
  const consumedMaterials: Array<{ materialId: string; quantity: number }> = []

  for (const ingredient of ingredients) {
    // First get the inventory item ID for this material
    const { data: inv } = await supabase
      .from('user_inventory')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', 'material')
      .eq('material_id', ingredient.material_id)
      .single()

    if (!inv) {
      // Roll back consumed materials
      await rollbackConsumedMaterials(supabase, user.id, consumedMaterials)
      return { error: 'Not enough materials' }
    }

    const { error: deductError } = await supabase.rpc('atomic_inventory_decrement', {
      p_inventory_id: inv.id,
      p_user_id: user.id,
      p_amount: ingredient.quantity,
    })

    if (deductError) {
      // Roll back consumed materials
      await rollbackConsumedMaterials(supabase, user.id, consumedMaterials)
      return { error: 'Not enough materials' }
    }

    consumedMaterials.push({ materialId: ingredient.material_id, quantity: ingredient.quantity })
  }

  // 4. Add crafted decoration to inventory atomically
  const decorationType = recipe.decoration_type as unknown as { id: string; name: string }

  const { error: addError } = await supabase.rpc('atomic_inventory_increment', {
    p_user_id: user.id,
    p_item_type: 'decoration',
    p_material_id: null,
    p_decoration_type_id: decorationType.id,
    p_amount: 1,
    p_acquired_via: 'craft',
  })

  if (addError) {
    // Roll back consumed materials
    await rollbackConsumedMaterials(supabase, user.id, consumedMaterials)
    return { error: 'Failed to add decoration to inventory' }
  }

  return { success: true, decorationName: decorationType.name }
}

/**
 * Roll back consumed materials on partial craft failure
 */
async function rollbackConsumedMaterials(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  consumed: Array<{ materialId: string; quantity: number }>
): Promise<void> {
  for (const item of consumed) {
    const { error: rollbackError } = await supabase.rpc('atomic_inventory_increment', {
      p_user_id: userId,
      p_item_type: 'material',
      p_material_id: item.materialId,
      p_decoration_type_id: null,
      p_amount: item.quantity,
      p_acquired_via: 'harvest',
    })

    if (rollbackError) {
      console.error('Failed to rollback material:', rollbackError)
    }
  }
}
