/**
 * Crafting System - Pure Logic
 * No DB calls. Shared between server actions and client components.
 */

import type {
  RecipeWithDetails,
  InventoryItemWithDetails,
  Material,
  SubscriptionTier,
} from '@/types/database'

/**
 * Check if user has enough materials to craft a recipe
 */
export function canCraft(
  recipe: RecipeWithDetails,
  materials: InventoryItemWithDetails[]
): boolean {
  for (const ingredient of recipe.ingredients) {
    const owned = materials.find(
      (m) => m.item_type === 'material' && m.material_id === ingredient.material_id
    )
    if (!owned || owned.quantity < ingredient.quantity) {
      return false
    }
  }
  return true
}

/**
 * Get missing materials for a recipe
 */
export function getMissingMaterials(
  recipe: RecipeWithDetails,
  materials: InventoryItemWithDetails[]
): { material: Material; needed: number; owned: number }[] {
  const missing: { material: Material; needed: number; owned: number }[] = []

  for (const ingredient of recipe.ingredients) {
    const owned = materials.find(
      (m) => m.item_type === 'material' && m.material_id === ingredient.material_id
    )
    const ownedQty = owned?.quantity ?? 0
    if (ownedQty < ingredient.quantity) {
      missing.push({
        material: ingredient.material,
        needed: ingredient.quantity,
        owned: ownedQty,
      })
    }
  }

  return missing
}

/**
 * Filter recipes available at user's level and subscription tier
 */
export function getAvailableRecipes(
  recipes: RecipeWithDetails[],
  level: number,
  tier: SubscriptionTier
): RecipeWithDetails[] {
  const tierRank: Record<SubscriptionTier, number> = { free: 0, pro: 1, premium: 2 }
  const userTierRank = tierRank[tier]

  return recipes.filter((recipe) => {
    // Check level requirement
    if (recipe.unlock_level > level) return false

    // Check subscription tier requirement for the decoration
    const decoTierRank = tierRank[recipe.decoration_type.subscription_tier]
    if (decoTierRank > userTierRank) return false

    // Must be active
    if (!recipe.is_active) return false

    return true
  })
}

/**
 * Get material costs as a readable summary
 */
export function getRecipeCostSummary(
  recipe: RecipeWithDetails
): { name: string; icon: string; quantity: number }[] {
  return recipe.ingredients.map((ing) => ({
    name: ing.material.name,
    icon: ing.material.icon,
    quantity: ing.quantity,
  }))
}
