'use server'

import { getAuthUser } from '@/lib/auth-cached'
import { createClient } from '@/lib/supabase/server'
import type { RecipeWithDetails, InventoryItemWithDetails } from '@/types/database'

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
 * Consumes materials from inventory, creates decoration in inventory
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

  // 3. Check user has all required materials
  const ingredients = recipe.ingredients as Array<{ material_id: string; quantity: number }>
  for (const ingredient of ingredients) {
    const { data: inv } = await supabase
      .from('user_inventory')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('item_type', 'material')
      .eq('material_id', ingredient.material_id)
      .single()

    if (!inv || inv.quantity < ingredient.quantity) {
      return { error: 'Not enough materials' }
    }
  }

  // 4. Consume materials (deduct from inventory)
  for (const ingredient of ingredients) {
    const { data: inv } = await supabase
      .from('user_inventory')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('item_type', 'material')
      .eq('material_id', ingredient.material_id)
      .single()

    if (!inv) continue

    const newQty = inv.quantity - ingredient.quantity
    if (newQty <= 0) {
      // Remove entry entirely
      await supabase
        .from('user_inventory')
        .delete()
        .eq('id', inv.id)
    } else {
      // Decrease quantity
      await supabase
        .from('user_inventory')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', inv.id)
    }
  }

  // 5. Add crafted decoration to inventory
  const decorationType = recipe.decoration_type as unknown as { id: string; name: string }
  const { data: existingDeco } = await supabase
    .from('user_inventory')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('item_type', 'decoration')
    .eq('decoration_type_id', decorationType.id)
    .single()

  if (existingDeco) {
    await supabase
      .from('user_inventory')
      .update({
        quantity: existingDeco.quantity + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingDeco.id)
  } else {
    await supabase
      .from('user_inventory')
      .insert({
        user_id: user.id,
        item_type: 'decoration',
        decoration_type_id: decorationType.id,
        quantity: 1,
        acquired_via: 'craft',
      })
  }

  return { success: true, decorationName: decorationType.name }
}
