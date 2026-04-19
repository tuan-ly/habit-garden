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
 * Craft a decoration from a recipe — atomic DB function.
 * Deducts materials + awards decoration in single transaction.
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

  // Pre-check: level gate (fast fail, better UX than DB-level failure)
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id, unlock_level, is_active')
    .eq('id', recipeId)
    .single()

  if (recipeError || !recipe) return { error: 'Recipe not found' }
  if (!recipe.is_active) return { error: 'Recipe is not available' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', user.id)
    .single()
  if (profile && profile.level < recipe.unlock_level) {
    return { error: `Need level ${recipe.unlock_level} to craft this` }
  }

  const { data, error } = await supabase.rpc('craft_decoration', {
    p_user_id: user.id,
    p_recipe_id: recipeId,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('insufficient_materials')) return { error: 'Not enough materials' }
    if (msg.includes('recipe_not_found')) return { error: 'Recipe not found' }
    if (msg.includes('recipe_inactive')) return { error: 'Recipe is not available' }
    if (msg.includes('unauthorized')) return { error: 'Unauthorized' }
    return { error: error.message }
  }

  const result = data as { success: boolean; decoration_name: string }
  return { success: true, decorationName: result.decoration_name }
}
