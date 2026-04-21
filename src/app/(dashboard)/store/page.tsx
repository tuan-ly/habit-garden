'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useInventory } from '@/lib/context/inventory-context'
import { getShopItems } from '@/lib/actions/decorations'
import { canCraft, getMissingMaterials, getRecipeCostSummary } from '@/lib/crafting-system'
import { CoinDisplay } from '@/components/shop/coin-display'
import { Hammer, Gem, ShoppingBag, Coins, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DecorationType, RecipeWithDetails, InventoryItemWithDetails } from '@/types/database'
import { motion, AnimatePresence } from 'framer-motion'

export default function StorePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <StorePageContent />
    </Suspense>
  )
}

function StorePageContent() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'shop' ? 'shop' : 'craft'

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold">Store</h1>
        <CoinDisplay />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col px-4">
        <TabsList className="w-full">
          <TabsTrigger value="craft" className="flex-1 gap-1.5">
            <Hammer className="h-3.5 w-3.5" />
            Craft
          </TabsTrigger>
          <TabsTrigger value="shop" className="flex-1 gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            Shop
          </TabsTrigger>
        </TabsList>

        <TabsContent value="craft" className="flex-1 mt-3">
          <CraftTabContent />
        </TabsContent>

        <TabsContent value="shop" className="flex-1 mt-3">
          <ShopTabContent />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================
// Craft Tab
// ============================================

function CraftTabContent() {
  const inventory = useInventory()
  const [craftingRecipeId, setCraftingRecipeId] = useState<string | null>(null)
  const [craftResult, setCraftResult] = useState<{ success: boolean; name?: string; error?: string } | null>(null)

  useEffect(() => {
    if (!inventory.recipesLoaded) {
      inventory.loadRecipes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory.recipesLoaded])

  const handleCraft = async (recipeId: string) => {
    setCraftingRecipeId(recipeId)
    setCraftResult(null)
    const result = await inventory.craftDecoration(recipeId)
    setCraftingRecipeId(null)
    if (result.success) {
      setCraftResult({ success: true, name: result.decorationName, error: undefined })
    } else {
      setCraftResult({ success: false, error: result.error })
    }
    setTimeout(() => setCraftResult(null), 3000)
  }

  return (
    <>
      <ResultToast result={craftResult} />

      {/* Sub-tabs: Recipes | Materials */}
      <Tabs defaultValue="recipes">
        <TabsList className="w-full mb-3">
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
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-3">
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
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-2">
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
                      x{item.quantity}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </>
  )
}

// ============================================
// Shop Tab
// ============================================

function ShopTabContent() {
  const inventory = useInventory()
  const [shopItems, setShopItems] = useState<DecorationType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [purchasingId, setPurchasingId] = useState<string | null>(null)
  const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; name?: string; error?: string } | null>(null)

  useEffect(() => {
    async function loadShop() {
      const result = await getShopItems()
      if ('items' in result) {
        setShopItems(result.items)
      }
      setIsLoading(false)
    }
    loadShop()
  }, [])

  const handlePurchase = async (item: DecorationType) => {
    if (!item.coin_price) return
    setPurchasingId(item.id)
    setPurchaseResult(null)

    const result = await inventory.purchaseDecoration(item.id)
    setPurchasingId(null)

    if (result.success) {
      setPurchaseResult({ success: true, name: item.name, error: undefined })
    } else {
      setPurchaseResult({ success: false, error: result.error })
    }
    setTimeout(() => setPurchaseResult(null), 3000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <ResultToast result={purchaseResult} />

      {/* Coin balance */}
      <div className="flex items-center justify-center gap-2 mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
        <Coins className="h-5 w-5 text-amber-500" />
        <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
          {inventory.coins}
        </span>
        <span className="text-sm text-amber-600 dark:text-amber-500">coins</span>
      </div>

      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="space-y-3">
          {shopItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items available in the shop yet.
            </div>
          ) : (
            shopItems.map((item) => {
              const canBuy = inventory.canAfford(item.coin_price!)
              return (
                <div key={item.id} className={cn(
                  'p-4 rounded-lg border transition-colors',
                  canBuy ? 'bg-card border-border' : 'bg-muted/30 border-border/50'
                )}>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <Badge variant="outline" className="text-[10px]">
                          {item.grid_size === 2 ? '2x2' : '1x1'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handlePurchase(item)}
                    disabled={!canBuy || purchasingId === item.id}
                    className="w-full mt-3 gap-1"
                  >
                    {purchasingId === item.id ? (
                      <><Loader2 className="h-3 w-3 animate-spin" />Purchasing...</>
                    ) : (
                      <><Coins className="h-3 w-3" />{item.coin_price} coins</>
                    )}
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </>
  )
}

// ============================================
// Shared Components
// ============================================

function ResultToast({ result }: { result: { success: boolean; name?: string; error?: string } | null }) {
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            'mb-3 p-3 rounded-lg flex items-center gap-2 text-sm',
            result.success
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {result.success ? (
            <><Check className="h-4 w-4" />{result.name ? `Got ${result.name}!` : 'Success!'}</>
          ) : (
            <><X className="h-4 w-4" />{result.error}</>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

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
      <div className="flex items-start gap-3">
        <span className="text-3xl">{deco.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{deco.name}</h4>
            <Badge variant="outline" className="text-[10px]">
              {deco.grid_size === 2 ? '2x2' : '1x1'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{deco.description}</p>
        </div>
      </div>

      <Separator className="my-2" />

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
              {cost.icon} {cost.quantity}x {cost.name}
            </span>
          )
        })}
      </div>

      <Button
        size="sm"
        onClick={onCraft}
        disabled={!craftable || isCrafting}
        className="w-full gap-1"
      >
        {isCrafting ? (
          <><Loader2 className="h-3 w-3 animate-spin" />Crafting...</>
        ) : (
          <><Hammer className="h-3 w-3" />{craftable ? 'Craft' : 'Missing materials'}</>
        )}
      </Button>
    </div>
  )
}
