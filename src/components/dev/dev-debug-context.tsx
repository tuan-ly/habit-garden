'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { PlantTier, UserPhase } from '@/types/database'

/**
 * Dev Debug Context
 *
 * Allows overriding profile values in development mode
 * for testing features without database changes.
 */

export type SubscriptionTier = 'FREE' | 'PRO' | 'PREMIUM'

export interface DevOverrides {
  // Profile overrides
  level?: number
  xp?: number
  subscriptionTier?: SubscriptionTier

  // Progression overrides
  maxPlants?: number
  unlockedTiers?: PlantTier[]
  gardenSize?: number // 3, 5, 7, or 0 for unlimited
  phase?: UserPhase

  // Feature flags
  bypassSlotLimit?: boolean
  bypassTierLimit?: boolean
  bypassPlantRestrictions?: boolean
}

interface DevDebugContextType {
  isDevMode: boolean
  isPanelOpen: boolean
  overrides: DevOverrides
  setOverrides: (updates: Partial<DevOverrides>) => void
  resetOverrides: () => void
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void

  // Helper to get overridden value or fallback
  getOverride: <K extends keyof DevOverrides>(
    key: K,
    fallback: DevOverrides[K]
  ) => DevOverrides[K]
}

const DevDebugContext = createContext<DevDebugContextType | null>(null)

const STORAGE_KEY = 'habien-dev-overrides'
const PANEL_STATE_KEY = 'habien-dev-panel-open'

// Check if running in development
const isDev = process.env.NODE_ENV === 'development'

function loadStoredOverrides(): DevOverrides {
  if (typeof window === 'undefined' || !isDev) return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function loadPanelState(): boolean {
  if (typeof window === 'undefined' || !isDev) return false
  try {
    return localStorage.getItem(PANEL_STATE_KEY) === 'true'
  } catch {
    return false
  }
}

export function DevDebugProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverridesState] = useState<DevOverrides>({})
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate state from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setOverridesState(loadStoredOverrides())
    setIsPanelOpen(loadPanelState())
    setIsHydrated(true)
  }, [])

  const setOverrides = useCallback((updates: Partial<DevOverrides>) => {
    setOverridesState((prev) => {
      const newOverrides = { ...prev, ...updates }
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newOverrides))
      }
      return newOverrides
    })
  }, [])

  const resetOverrides = useCallback(() => {
    setOverridesState({})
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => {
      const newState = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem(PANEL_STATE_KEY, String(newState))
      }
      return newState
    })
  }, [])

  const openPanel = useCallback(() => {
    setIsPanelOpen(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(PANEL_STATE_KEY, 'true')
    }
  }, [])

  const closePanel = useCallback(() => {
    setIsPanelOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(PANEL_STATE_KEY, 'false')
    }
  }, [])

  const getOverride = useCallback(
    <K extends keyof DevOverrides>(key: K, fallback: DevOverrides[K]): DevOverrides[K] => {
      return overrides[key] !== undefined ? overrides[key] : fallback
    },
    [overrides]
  )

  // Don't render the context in production
  if (!isDev) {
    return <>{children}</>
  }

  return (
    <DevDebugContext.Provider
      value={{
        isDevMode: isDev,
        isPanelOpen,
        overrides,
        setOverrides,
        resetOverrides,
        togglePanel,
        openPanel,
        closePanel,
        getOverride,
      }}
    >
      {children}
    </DevDebugContext.Provider>
  )
}

export function useDevDebug() {
  const context = useContext(DevDebugContext)

  // Return no-op defaults in production
  if (!context) {
    return {
      isDevMode: false,
      isPanelOpen: false,
      overrides: {} as DevOverrides,
      setOverrides: () => {},
      resetOverrides: () => {},
      togglePanel: () => {},
      openPanel: () => {},
      closePanel: () => {},
      getOverride: <K extends keyof DevOverrides>(_key: K, fallback: DevOverrides[K]) => fallback,
    }
  }

  return context
}

/**
 * Hook to use dev override or real value
 *
 * @example
 * const level = useDevOverride('level', profile.level)
 */
export function useDevOverride<K extends keyof DevOverrides>(
  key: K,
  realValue: DevOverrides[K]
): DevOverrides[K] {
  const { getOverride, isDevMode } = useDevDebug()

  if (!isDevMode) return realValue
  return getOverride(key, realValue)
}
