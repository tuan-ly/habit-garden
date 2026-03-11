'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useInventory } from '@/lib/context'
import { canCraft, getMissingMaterials, getRecipeCostSummary } from '@/lib/crafting-system'
import { Hammer, Gem, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecipeWithDetails, InventoryItemWithDetails } from '@/types/database'
import { motion, AnimatePresence } from 'motion/react'

interface CraftingWorkshopProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CraftingWorkshop({ open, onOpenChange }: CraftingWorkshopProps) {
  const inventory = useInventory()
  const [craftingRecipeId, setCraftingRecipeId] = useState<string | null>(null)
  const [craftResult, setCraftResult] = useState<{ success: boolean; name?: string; error?: string } | null>(null)

  // Load recipes when opened
  useEffect(() => {
    if (open && !inventory.recipesLoaded) {
      inventory.loadRecipes()
    }
  }, [open, inventory])

  const handleCraft = async (recipeId: string) => {
    setCraftingRecipeId(recipeId)
    setCraftResult(null)
    const result = await inventory.craftDecoration(recipeId)
    setCraftingRecipeId(null)
    if (result.success) {
      setCraftResult({ success: true, name: result.decorationName })
      setTimeout(() => setCraftResult(null), 3000)
    } else {
      setCraftResult({ success: false, error: result.error })
      setTimeout(() => setCraftResult(null), 3000)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Hammer className="h-5 w-5" />
            Workshop
          </SheetTitle>
        </SheetHeader>

        {/* Success/Error toast */}
        <AnimatePresence>
          {craftResult && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                'mx-4 mt-2 p-3 rounded-lg flex items-center gap-2 text-sm',
                craftResult.success
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {craftResult.success ? (
                <>
                  <Check className="h-4 w-4" />
                  Crafted {craftResult.name}!
                </>
              ) : (
                <>
                  <X className="h-4 w-4" />
                  {craftResult.error}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs defaultValue="recipes" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="recipes" className="flex-1 gap-1">
              <Hammer className="h-3 w-3" />
              Recipes
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex-1 gap-1">
              <Gem className="h-3 w-3" />
              Materials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recipes">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3 p-1">
                {inventory.recipes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {inventory.recipesLoaded ? 'No recipes available' : 'Loading recipes...'}
                  </div>
                ) : (
                  inventory.recipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      materials={inventory.materials}
                      isCrafting={craftingRecipeId === recipe.id}
                      onCraft={() => handleCraft(recipe.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="materials">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2 p-1">
                {inventory.materials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No materials yet. Water your plants until they mature!
                  </div>
                ) : (
                  inventory.materials.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="text-2xl">{item.material?.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.material?.name}</div>
                        <div className="text-xs text-muted-foreground">{item.material?.description}</div>
                      </div>
                      <Badge variant="secondary" className="text-sm">
                        ×{item.quantity}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

// Recipe card sub-component
function RecipeCard({
  recipe,
  materials,
  isCrafting,
  onCraft,
}: {
  recipe: RecipeWithDetails
  materials: InventoryItemWithDetails[]
  isCrafting: boolean
  onCraft: () => void
}) {
  const craftable = canCraft(recipe, materials)
  const costs = getRecipeCostSummary(recipe)
  const missing = getMissingMaterials(recipe, materials)
  const deco = recipe.decoration_type

  return (
    <div className={cn(
      'p-4 rounded-lg border transition-colors',
      craftable ? 'bg-card border-border' : 'bg-muted/30 border-border/50'
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-3xl">{deco.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{deco.name}</h4>
            <Badge variant="outline" className="text-[10px]">
              {deco.grid_size === 2 ? '2×2' : '1×1'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{deco.description}</p>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Ingredients */}
      <div className="flex flex-wrap gap-2 mb-3">
        {costs.map((cost, i) => {
          const isMissing = missing.some(m => m.material.name === cost.name)
          return (
            <span
              key={i}
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                isMissing
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              )}
            >
              {cost.icon} {cost.quantity}× {cost.name}
            </span>
          )
        })}
      </div>

      {/* Craft button */}
      <Button
        size="sm"
        onClick={onCraft}
        disabled={!craftable || isCrafting}
        className="w-full gap-1"
      >
        {isCrafting ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Crafting...
          </>
        ) : (
          <>
            <Hammer className="h-3 w-3" />
            {craftable ? 'Craft' : 'Missing materials'}
          </>
        )}
      </Button>
    </div>
  )
}
