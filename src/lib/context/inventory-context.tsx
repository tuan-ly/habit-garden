'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import type {
  InventoryItemWithDetails,
  PlacedDecorationWithType,
  RecipeWithDetails,
  DecorationRotation,
} from '@/types/database'

// ============================================
// Return types
// ============================================

interface CraftResult {
  success: boolean
  error?: string
  decorationName?: string
}

interface PurchaseResult {
  success: boolean
  error?: string
}

interface PlaceResult {
  success: boolean
  error?: string
  decorationId?: string
}

interface ActionResult {
  success: boolean
  error?: string
}

interface PickupResult extends ActionResult {
  inventoryItemId?: string
}

// ============================================
// Context type
// ============================================

interface InventoryContextType {
  // State
  materials: InventoryItemWithDetails[]
  decorations: InventoryItemWithDetails[]
  placedDecorations: PlacedDecorationWithType[]
  coins: number
  recipes: RecipeWithDetails[]
  isLoading: boolean
  isCrafting: boolean
  isPurchasing: boolean
  isPlacing: boolean
  recipesLoaded: boolean

  // Actions
  refreshInventory: () => Promise<void>
  loadRecipes: () => Promise<void>
  craftDecoration: (recipeId: string) => Promise<CraftResult>
  purchaseDecoration: (decoTypeId: string) => Promise<PurchaseResult>
  placeDecoration: (
    inventoryItemId: string,
    row: number,
    col: number,
    rotation?: DecorationRotation
  ) => Promise<PlaceResult>
  pickUpDecoration: (placedDecoId: string) => Promise<PickupResult>
  moveDecoration: (placedDecoId: string, row: number, col: number) => Promise<ActionResult>
  rotateDecoration: (placedDecoId: string) => Promise<ActionResult>
  hydratePlacedDecorations: (decorations: PlacedDecorationWithType[]) => void

  // Helpers
  getMaterialCount: (materialSlug: string) => number
  canAfford: (amount: number) => boolean
}

interface InventoryProviderProps {
  children: ReactNode
  initialCoins?: number
  initialPlacedDecorations?: PlacedDecorationWithType[]
}

// ============================================
// Context
// ============================================

const InventoryContext = createContext<InventoryContextType | null>(null)

// ============================================
// Hooks
// ============================================

export function useInventory(): InventoryContextType {
  const context = useContext(InventoryContext)
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider')
  }
  return context
}

/** Returns null if used outside the provider instead of throwing. */
export function useInventoryOptional(): InventoryContextType | null {
  return useContext(InventoryContext)
}

// ============================================
// Provider
// ============================================

export function InventoryProvider({
  children,
  initialCoins = 0,
  initialPlacedDecorations = [],
}: InventoryProviderProps) {
  const [materials, setMaterials] = useState<InventoryItemWithDetails[]>([])
  const [decorations, setDecorations] = useState<InventoryItemWithDetails[]>([])
  const [placedDecorations, setPlacedDecorations] = useState<PlacedDecorationWithType[]>(
    initialPlacedDecorations
  )
  const [coins, setCoins] = useState(initialCoins)
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([])
  const [loadingOps, setLoadingOps] = useState<Set<string>>(new Set())
  const [recipesLoaded, setRecipesLoaded] = useState(false)
  // De-dupe concurrent loadRecipes calls — single in-flight promise wins
  const recipesInFlight = useRef<Promise<void> | null>(null)
  const hydratePlacedDecorations = useCallback((next: PlacedDecorationWithType[]) => {
    setPlacedDecorations(next)
  }, [])

  // Per-operation loading helpers
  const startOp = useCallback((op: string) => {
    setLoadingOps((prev) => new Set(prev).add(op))
  }, [])
  const endOp = useCallback((op: string) => {
    setLoadingOps((prev) => {
      const next = new Set(prev)
      next.delete(op)
      return next
    })
  }, [])

  const isLoading = loadingOps.size > 0
  const isCrafting = loadingOps.has('craft')
  const isPurchasing = loadingOps.has('purchase')
  const isPlacing = loadingOps.has('place')

  // -----------------------------------------------
  // refreshInventory — refetch all inventory data
  // -----------------------------------------------
  const refreshInventory = useCallback(async () => {
    startOp('refresh')
    try {
      const [{ getUserInventory }, { getCoinBalance }, { getPlacedDecorations }] = await Promise.all([
        import('@/lib/actions/inventory'),
        import('@/lib/actions/coins'),
        import('@/lib/actions/decorations'),
      ])
      const [invResult, coinsResult, placedResult] = await Promise.all([
        getUserInventory(),
        getCoinBalance(),
        getPlacedDecorations(),
      ])

      if ('materials' in invResult) {
        setMaterials(invResult.materials)
        setDecorations(invResult.decorations)
      }

      if ('coins' in coinsResult) {
        setCoins(coinsResult.coins)
      }
      if ('decorations' in placedResult) {
        setPlacedDecorations(placedResult.decorations)
      }
    } finally {
      endOp('refresh')
    }
  }, [startOp, endOp])

  // -----------------------------------------------
  // loadRecipes — fetch recipes once, skip if already loaded
  // -----------------------------------------------
  const loadRecipes = useCallback(async () => {
    if (recipesLoaded) return
    if (recipesInFlight.current) return recipesInFlight.current

    startOp('recipes')
    const p = (async () => {
      try {
        const { getRecipes } = await import('@/lib/actions/crafting')
        const result = await getRecipes()
        if ('recipes' in result) {
          setRecipes(result.recipes)
          setRecipesLoaded(true)
        }
      } finally {
        endOp('recipes')
        recipesInFlight.current = null
      }
    })()
    recipesInFlight.current = p
    return p
  }, [recipesLoaded, startOp, endOp])

  // -----------------------------------------------
  // craftDecoration — consume materials, add to inventory
  // -----------------------------------------------
  const craftDecoration = useCallback(
    async (recipeId: string): Promise<CraftResult> => {
      startOp('craft')
      try {
        const [{ craftDecoration: craftDecorationAction }, { getUserInventory }] = await Promise.all([
          import('@/lib/actions/crafting'),
          import('@/lib/actions/inventory'),
        ])
        const result = await craftDecorationAction(recipeId)

        if (!('success' in result)) {
          return { success: false, error: (result as { error: string }).error }
        }

        // Refresh so materials are decremented and new decoration appears
        const invResult = await getUserInventory()
        if ('materials' in invResult) {
          setMaterials(invResult.materials)
          setDecorations(invResult.decorations)
        }

        return { success: true as boolean, decorationName: (result as { success: true; decorationName: string }).decorationName } as CraftResult
      } catch {
        return { success: false, error: 'Network error' }
      } finally {
        endOp('craft')
      }
    },
    [startOp, endOp]
  )

  // -----------------------------------------------
  // purchaseDecoration — spend coins, add to inventory
  // -----------------------------------------------
  const purchaseDecoration = useCallback(
    async (decoTypeId: string): Promise<PurchaseResult> => {
      startOp('purchase')
      try {
        const [
          { purchaseDecoration: purchaseDecorationAction },
          { getUserInventory },
          { getCoinBalance },
        ] = await Promise.all([
          import('@/lib/actions/decorations'),
          import('@/lib/actions/inventory'),
          import('@/lib/actions/coins'),
        ])
        const result = await purchaseDecorationAction(decoTypeId)

        if (!('success' in result)) {
          return { success: false, error: (result as { error: string }).error }
        }

        // Refresh inventory and coin balance
        const [invResult, coinsResult] = await Promise.all([
          getUserInventory(),
          getCoinBalance(),
        ])

        if ('decorations' in invResult) {
          setDecorations(invResult.decorations)
        }
        if ('coins' in coinsResult) {
          setCoins(coinsResult.coins)
        }

        return { success: true as boolean } as PurchaseResult
      } catch {
        return { success: false, error: 'Network error' }
      } finally {
        endOp('purchase')
      }
    },
    [startOp, endOp]
  )

  // -----------------------------------------------
  // placeDecoration — move from inventory to garden grid
  // -----------------------------------------------
  const placeDecoration = useCallback(
    async (
      inventoryItemId: string,
      row: number,
      col: number,
      rotation?: DecorationRotation
    ): Promise<PlaceResult> => {
      const inventoryItem = decorations.find((item) => item.id === inventoryItemId)
      const decorationType = inventoryItem?.decoration_type
      if (!inventoryItem || !decorationType) {
        return { success: false, error: 'Decoration not found in inventory' }
      }

      const optimisticId = `optimistic-${crypto.randomUUID()}`
      const optimisticDecoration: PlacedDecorationWithType = {
        id: optimisticId,
        user_id: inventoryItem.user_id,
        decoration_type_id: decorationType.id,
        grid_row: row,
        grid_col: col,
        grid_size: decorationType.grid_size,
        rotation: rotation ?? 0,
        placed_at: new Date().toISOString(),
        decoration_type: decorationType,
      }

      // Commit the user's intent to the UI before loading the server-action chunk
      // or waiting for Supabase. The temporary id is reconciled on success.
      setPlacedDecorations((prev) => [...prev, optimisticDecoration])
      setDecorations((prev) =>
        prev.flatMap((item) => {
          if (item.id !== inventoryItemId) return [item]
          return item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []
        })
      )
      startOp('place')
      try {
        const { placeDecoration: placeDecorationAction } = await import('@/lib/actions/decorations')
        const result = await placeDecorationAction({
          inventory_item_id: inventoryItemId,
          grid_row: row,
          grid_col: col,
          rotation: rotation ?? 0,
        })

        if (!('success' in result)) {
          setPlacedDecorations((prev) => prev.filter((item) => item.id !== optimisticId))
          setDecorations((prev) => {
            const withoutOptimisticQuantity = prev.filter((item) => item.id !== inventoryItemId)
            return [...withoutOptimisticQuantity, inventoryItem]
          })
          return { success: false, error: (result as { error: string }).error }
        }

        const decorationId = (result as { success: true; decorationId: string }).decorationId
        setPlacedDecorations((prev) =>
          prev.map((item) => item.id === optimisticId ? { ...item, id: decorationId } : item)
        )

        return { success: true as boolean, decorationId } as PlaceResult
      } catch {
        setPlacedDecorations((prev) => prev.filter((item) => item.id !== optimisticId))
        setDecorations((prev) => {
          const withoutOptimisticQuantity = prev.filter((item) => item.id !== inventoryItemId)
          return [...withoutOptimisticQuantity, inventoryItem]
        })
        return { success: false, error: 'Network error' }
      } finally {
        endOp('place')
      }
    },
    [decorations, startOp, endOp]
  )

  // -----------------------------------------------
  // pickUpDecoration — remove from grid, return to inventory
  // -----------------------------------------------
  const pickUpDecoration = useCallback(
    async (placedDecoId: string): Promise<PickupResult> => {
      const placedDecoration = placedDecorations.find((item) => item.id === placedDecoId)
      if (!placedDecoration) return { success: false, error: 'Decoration not found' }

      const previousIndex = placedDecorations.findIndex((item) => item.id === placedDecoId)
      const rollback = () => {
        setPlacedDecorations((prev) => {
          if (prev.some((item) => item.id === placedDecoId)) return prev
          const insertAt = Math.min(previousIndex, prev.length)
          return [
            ...prev.slice(0, insertAt),
            placedDecoration,
            ...prev.slice(insertAt),
          ]
        })
      }

      // Commit the pickup intent before loading the server-action chunk or
      // waiting for Supabase. Re-add the same entity if the mutation fails.
      setPlacedDecorations((prev) => prev.filter((item) => item.id !== placedDecoId))
      startOp('pickup')
      try {
        const { pickUpDecoration: pickUpDecorationAction } = await import('@/lib/actions/decorations')
        const result = await pickUpDecorationAction({
          placed_decoration_id: placedDecoId,
        })

        if (!('success' in result)) {
          rollback()
          return { success: false, error: (result as { error: string }).error }
        }

        const inventoryItem = result.inventoryItem
        setDecorations((prev) => {
          const existingIndex = prev.findIndex((item) => item.id === inventoryItem.id)
          if (existingIndex === -1) return [...prev, inventoryItem]
          return prev.map((item) => item.id === inventoryItem.id ? inventoryItem : item)
        })

        return {
          success: true as boolean,
          inventoryItemId: inventoryItem.id,
        } as PickupResult
      } catch {
        rollback()
        return { success: false, error: 'Network error' }
      } finally {
        endOp('pickup')
      }
    },
    [placedDecorations, startOp, endOp]
  )

  // -----------------------------------------------
  // moveDecoration — reposition on grid (optimistic)
  // -----------------------------------------------
  const moveDecoration = useCallback(
    async (placedDecoId: string, row: number, col: number): Promise<ActionResult> => {
      const previousDecoration = placedDecorations.find((decoration) => decoration.id === placedDecoId)
      if (!previousDecoration) return { success: false, error: 'Decoration not found' }

      const rollback = () => {
        setPlacedDecorations((prev) =>
          prev.map((decoration) =>
            decoration.id === placedDecoId ? previousDecoration : decoration
          )
        )
      }

      // Apply optimistic update immediately
      setPlacedDecorations((prev) =>
        prev.map((d) =>
          d.id === placedDecoId ? { ...d, grid_row: row, grid_col: col } : d
        )
      )

      try {
        const { moveDecoration: moveDecorationAction } = await import('@/lib/actions/decorations')
        const result = await moveDecorationAction({
          placed_decoration_id: placedDecoId,
          grid_row: row,
          grid_col: col,
        })

        if (!('success' in result)) {
          rollback()
          return { success: false, error: (result as { error: string }).error }
        }

        return { success: true as boolean } as ActionResult
      } catch {
        rollback()
        return { success: false, error: 'Network error' }
      }
    },
    [placedDecorations]
  )

  // -----------------------------------------------
  // rotateDecoration — cycle rotation 0→90→180→270 (optimistic)
  // -----------------------------------------------
  const rotateDecoration = useCallback(
    async (placedDecoId: string): Promise<ActionResult> => {
      const rotations: DecorationRotation[] = [0, 90, 180, 270]

      // Apply optimistic rotation
      setPlacedDecorations((prev) =>
        prev.map((d) => {
          if (d.id !== placedDecoId) return d
          const currentIndex = rotations.indexOf(d.rotation as DecorationRotation)
          const nextRotation = rotations[(currentIndex + 1) % rotations.length]
          return { ...d, rotation: nextRotation }
        })
      )

      try {
        const { rotateDecoration: rotateDecorationAction, getPlacedDecorations } = await import('@/lib/actions/decorations')
        const result = await rotateDecorationAction(placedDecoId)

        if (!('success' in result)) {
          // Revert by re-fetching authoritative server state
          const placedResult = await getPlacedDecorations()
          if ('decorations' in placedResult) {
            setPlacedDecorations(placedResult.decorations)
          }
          return { success: false, error: (result as { error: string }).error }
        }

        // Sync confirmed server rotation in case client drifted
        const confirmedRotation = (result as { success: true; newRotation: DecorationRotation }).newRotation
        setPlacedDecorations((prev) =>
          prev.map((d) =>
            d.id === placedDecoId ? { ...d, rotation: confirmedRotation } : d
          )
        )

        return { success: true as boolean } as ActionResult
      } catch {
        return { success: false, error: 'Network error' }
      }
    },
    []
  )

  // -----------------------------------------------
  // Helpers
  // -----------------------------------------------
  const getMaterialCount = useCallback(
    (materialSlug: string): number => {
      const item = materials.find(
        (m) => m.material && (m.material as { slug: string }).slug === materialSlug
      )
      return item?.quantity ?? 0
    },
    [materials]
  )

  const canAfford = useCallback(
    (amount: number): boolean => coins >= amount,
    [coins]
  )

  // -----------------------------------------------
  // Memoized context value
  // -----------------------------------------------
  const contextValue = useMemo<InventoryContextType>(
    () => ({
      materials,
      decorations,
      placedDecorations,
      coins,
      recipes,
      isLoading,
      isCrafting,
      isPurchasing,
      isPlacing,
      recipesLoaded,
      refreshInventory,
      loadRecipes,
      craftDecoration,
      purchaseDecoration,
      placeDecoration,
      pickUpDecoration,
      moveDecoration,
      rotateDecoration,
      hydratePlacedDecorations,
      getMaterialCount,
      canAfford,
    }),
    [
      materials,
      decorations,
      placedDecorations,
      coins,
      recipes,
      isLoading,
      isCrafting,
      isPurchasing,
      isPlacing,
      recipesLoaded,
      refreshInventory,
      loadRecipes,
      craftDecoration,
      purchaseDecoration,
      placeDecoration,
      pickUpDecoration,
      moveDecoration,
      rotateDecoration,
      hydratePlacedDecorations,
      getMaterialCount,
      canAfford,
    ]
  )

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  )
}
