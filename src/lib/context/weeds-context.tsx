'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { clearWeed as clearWeedAction, clearAllWeeds as clearAllWeedsAction } from '@/lib/actions/weeds'
import { toast } from 'sonner'

interface WeedsState {
  [plantId: string]: number
}

interface WeedsContextValue {
  weeds: WeedsState
  setPlantWeeds: (plantId: string, count: number) => void
  clearWeed: (plantId: string) => Promise<{ success: boolean; xpEarned?: number }>
  clearAllWeeds: (plantId: string) => Promise<{ success: boolean; xpEarned?: number }>
  getTotalWeeds: () => number
}

const WeedsContext = createContext<WeedsContextValue | null>(null)

export function WeedsProvider({
  children,
  initialWeeds = {},
}: {
  children: ReactNode
  initialWeeds?: WeedsState
}) {
  const [weeds, setWeeds] = useState<WeedsState>(initialWeeds)

  const setPlantWeeds = useCallback((plantId: string, count: number) => {
    setWeeds((prev) => ({
      ...prev,
      [plantId]: count,
    }))
  }, [])

  const clearWeed = useCallback(async (plantId: string) => {
    const currentCount = weeds[plantId] || 0
    if (currentCount <= 0) {
      return { success: false }
    }

    // Optimistic update
    setWeeds((prev) => ({
      ...prev,
      [plantId]: Math.max(0, (prev[plantId] || 0) - 1),
    }))

    const result = await clearWeedAction(plantId)

    if (result.success) {
      toast.success(`+${result.xpEarned} XP`, {
        description: 'Weed cleared!',
        duration: 1500,
      })
      return { success: true, xpEarned: result.xpEarned }
    } else {
      // Revert on error
      setWeeds((prev) => ({
        ...prev,
        [plantId]: currentCount,
      }))
      toast.error('Failed to clear weed')
      return { success: false }
    }
  }, [weeds])

  const clearAllWeeds = useCallback(async (plantId: string) => {
    const currentCount = weeds[plantId] || 0
    if (currentCount <= 0) {
      return { success: false }
    }

    // Optimistic update
    setWeeds((prev) => ({
      ...prev,
      [plantId]: 0,
    }))

    const result = await clearAllWeedsAction(plantId)

    if (result.success) {
      toast.success(`+${result.xpEarned} XP`, {
        description: `${result.weedsCleared} weeds cleared!`,
        duration: 2000,
      })
      return { success: true, xpEarned: result.xpEarned }
    } else {
      // Revert on error
      setWeeds((prev) => ({
        ...prev,
        [plantId]: currentCount,
      }))
      toast.error('Failed to clear weeds')
      return { success: false }
    }
  }, [weeds])

  const getTotalWeeds = useCallback(() => {
    return Object.values(weeds).reduce((sum, count) => sum + count, 0)
  }, [weeds])

  return (
    <WeedsContext.Provider
      value={{
        weeds,
        setPlantWeeds,
        clearWeed,
        clearAllWeeds,
        getTotalWeeds,
      }}
    >
      {children}
    </WeedsContext.Provider>
  )
}

export function useWeeds() {
  const context = useContext(WeedsContext)
  if (!context) {
    throw new Error('useWeeds must be used within a WeedsProvider')
  }
  return context
}

export function useWeedsOptional() {
  return useContext(WeedsContext)
}

// Hook for a specific plant's weeds
export function usePlantWeeds(plantId: string) {
  const context = useContext(WeedsContext)
  if (!context) return { weedCount: 0, clearWeed: async () => ({ success: false } as { success: boolean; xpEarned?: number }), clearAllWeeds: async () => ({ success: false } as { success: boolean; xpEarned?: number }) }

  return {
    weedCount: context.weeds[plantId] || 0,
    clearWeed: () => context.clearWeed(plantId),
    clearAllWeeds: () => context.clearAllWeeds(plantId),
  }
}
