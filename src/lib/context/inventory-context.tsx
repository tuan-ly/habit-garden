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
import { getUserInventory } from '@/lib/actions/inventory'
import { getRecipes, craftDecoration as craftDecorationAction } from '@/lib/actions/crafting'
import {
  getPlacedDecorations,
  placeDecoration as placeDecorationAction,
  pickUpDecoration as pickUpDecorationAction,
  moveDecoration as moveDecorationAction,
  rotateDecoration as rotateDecorationAction,
  purchaseDecoration as purchaseDecorationAction,
} from '@/lib/actions/decorations'
import { getCoinBalance } from '@/lib/actions/coins'

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
  pickUpDecoration: (placedDecoId: string) => Promise<ActionResult>
  moveDecoration: (placedDecoId: string, row: number, col: number) => Promise<ActionResult>
  rotateDecoration: (placedDecoId: string) => Promise<ActionResult>

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
      const [invResult, coinsResult] = await Promise.all([
        getUserInventory(),
        getCoinBalance(),
      ])

      if ('materials' in invResult) {
        setMaterials(invResult.materials)
        setDecorations(invResult.decorations)
      }

      if ('coins' in coinsResult) {
        setCoins(coinsResult.coins)
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
      startOp('place')
      try {
        const result = await placeDecorationAction({
          inventory_item_id: inventoryItemId,
          grid_row: row,
          grid_col: col,
          rotation: rotation ?? 0,
        })

        if (!('success' in result)) {
          return { success: false, error: (result as { error: string }).error }
        }

        const decorationId = (result as { success: true; decorationId: string }).decorationId

        // Refresh inventory (quantity decremented) and placed decorations list
        const [invResult, placedResult] = await Promise.all([
          getUserInventory(),
          getPlacedDecorations(),
        ])

        if ('decorations' in invResult) {
          setDecorations(invResult.decorations)
        }
        if ('decorations' in placedResult) {
          setPlacedDecorations(placedResult.decorations)
        }

        return { success: true as boolean, decorationId } as PlaceResult
      } catch {
        return { success: false, error: 'Network error' }
      } finally {
        endOp('place')
      }
    },
    [startOp, endOp]
  )

  // -----------------------------------------------
  // pickUpDecoration — remove from grid, return to inventory
  // -----------------------------------------------
  const pickUpDecoration = useCallback(
    async (placedDecoId: string): Promise<ActionResult> => {
      startOp('pickup')
      try {
        const result = await pickUpDecorationAction({
          placed_decoration_id: placedDecoId,
        })

        if (!('success' in result)) {
          return { success: false, error: (result as { error: string }).error }
        }

        // Optimistically remove from placed list; refresh inventory
        setPlacedDecorations((prev) => prev.filter((d) => d.id !== placedDecoId))

        const invResult = await getUserInventory()
        if ('decorations' in invResult) {
          setDecorations(invResult.decorations)
        }

        return { success: true as boolean } as ActionResult
      } catch {
        return { success: false, error: 'Network error' }
      } finally {
        endOp('pickup')
      }
    },
    [startOp, endOp]
  )

  // -----------------------------------------------
  // moveDecoration — reposition on grid (optimistic)
  // -----------------------------------------------
  const moveDecoration = useCallback(
    async (placedDecoId: string, row: number, col: number): Promise<ActionResult> => {
      // Apply optimistic update immediately
      setPlacedDecorations((prev) =>
        prev.map((d) =>
          d.id === placedDecoId ? { ...d, grid_row: row, grid_col: col } : d
        )
      )

      try {
        const result = await moveDecorationAction({
          placed_decoration_id: placedDecoId,
          grid_row: row,
          grid_col: col,
        })

        if (!('success' in result)) {
          // Revert by re-fetching authoritative server state
          const placedResult = await getPlacedDecorations()
          if ('decorations' in placedResult) {
            setPlacedDecorations(placedResult.decorations)
          }
          return { success: false, error: (result as { error: string }).error }
        }

        return { success: true as boolean } as ActionResult
      } catch {
        return { success: false, error: 'Network error' }
      }
    },
    []
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
