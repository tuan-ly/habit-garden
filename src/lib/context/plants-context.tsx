'use client'

import {
  createContext,
  useContext,
  useOptimistic,
  useCallback,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import type { PlantWithType } from '@/types/database'
import { waterPlant as waterPlantAction } from '@/lib/actions/plants'
import { toast } from 'sonner'

// Types for optimistic updates
type OptimisticAction =
  | { type: 'WATER_PLANT'; plantId: string; xpEarned: number }
  | { type: 'UPDATE_PLANT'; plant: PlantWithType }
  | { type: 'REMOVE_PLANT'; plantId: string }
  | { type: 'ADD_PLANT'; plant: PlantWithType }

interface WaterResult {
  success: boolean
  xpEarned?: number
  xpBreakdown?: Record<string, number>
  weatherType?: string
  newAchievements?: string[]
  error?: string
}

interface PlantsContextType {
  plants: PlantWithType[]
  isPending: boolean
  isSyncing: boolean
  waterPlant: (
    plantId: string,
    options?: { notes?: string; difficulty?: 'easy' | 'medium' | 'hard' }
  ) => Promise<WaterResult>
  addPlant: (plant: PlantWithType) => void
  removePlant: (plantId: string) => void
  refreshPlants: (newPlants: PlantWithType[]) => void
  getPlant: (plantId: string) => PlantWithType | undefined
}

const PlantsContext = createContext<PlantsContextType | null>(null)

// Reducer for optimistic updates
function plantsReducer(
  state: PlantWithType[],
  action: OptimisticAction
): PlantWithType[] {
  switch (action.type) {
    case 'WATER_PLANT': {
      return state.map((plant) => {
        if (plant.id !== action.plantId) return plant
        
        // Optimistically update plant state
        const newMoisture = Math.min(100, plant.current_moisture + (plant.plant_type?.moisture_boost || 20))
        const baseGrowth = 100 / (plant.plant_type?.maturity_days || 30)
        const newGrowth = Math.min(100, plant.growth_percentage + baseGrowth)
        const newStreak = plant.current_streak + 1
        
        return {
          ...plant,
          current_moisture: newMoisture,
          growth_percentage: newGrowth,
          current_streak: newStreak,
          longest_streak: Math.max(plant.longest_streak, newStreak),
          total_waterings: plant.total_waterings + 1,
          last_watered_at: new Date().toISOString(),
          status: newGrowth >= 100 ? 'mature' : plant.status,
        } as PlantWithType
      })
    }
    
    case 'UPDATE_PLANT': {
      return state.map((plant) =>
        plant.id === action.plant.id ? action.plant : plant
      )
    }
    
    case 'REMOVE_PLANT': {
      return state.filter((plant) => plant.id !== action.plantId)
    }
    
    case 'ADD_PLANT': {
      return [...state, action.plant]
    }
    
    default:
      return state
  }
}

interface PlantsProviderProps {
  children: ReactNode
  initialPlants: PlantWithType[]
}

export function PlantsProvider({
  children,
  initialPlants,
}: PlantsProviderProps) {
  const [serverPlants, setServerPlants] = useState(initialPlants)
  const [isPending, startTransition] = useTransition()
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Optimistic state management
  const [optimisticPlants, addOptimisticUpdate] = useOptimistic(
    serverPlants,
    plantsReducer
  )

  // Water a plant with optimistic update
  const waterPlant = useCallback(
    async (
      plantId: string,
      options?: { notes?: string; difficulty?: 'easy' | 'medium' | 'hard' }
    ): Promise<WaterResult> => {
      const plant = optimisticPlants.find((p) => p.id === plantId)
      if (!plant) {
        return { success: false, error: 'Plant not found' }
      }

      // Check if already watered today
      const isWateredToday = plant.last_watered_at
        ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
        : false

      if (isWateredToday) {
        return { success: false, error: 'Already watered today' }
      }

      // Estimate XP for optimistic update
      const estimatedXp = 10 + (plant.current_streak > 0 ? Math.min(plant.current_streak * 2, 20) : 0)

      // Apply optimistic update IMMEDIATELY
      startTransition(() => {
        addOptimisticUpdate({ type: 'WATER_PLANT', plantId, xpEarned: estimatedXp })
      })

      // Sync with server in background (no toast until response)
      setIsSyncing(true)
      try {
        const result = await waterPlantAction(plantId, options)
        
        if (result.success) {
          // Server confirmed - update serverPlants to persist the change
          setServerPlants((prev) =>
            prev.map((p) => {
              if (p.id !== plantId) return p
              const newMoisture = Math.min(100, p.current_moisture + (p.plant_type?.moisture_boost || 20))
              const baseGrowth = 100 / (p.plant_type?.maturity_days || 30)
              const newGrowth = Math.min(100, p.growth_percentage + baseGrowth)
              const newStreak = p.current_streak + 1
              return {
                ...p,
                current_moisture: newMoisture,
                growth_percentage: newGrowth,
                current_streak: newStreak,
                longest_streak: Math.max(p.longest_streak, newStreak),
                total_waterings: p.total_waterings + 1,
                last_watered_at: new Date().toISOString(),
                status: newGrowth >= 100 ? 'mature' : p.status,
              } as PlantWithType
            })
          )
          
          // Show XP earned
          toast.success(`+${result.xpEarned} XP earned!`, {
            description: result.newAchievements?.length 
              ? `🏆 New achievement: ${result.newAchievements[0]}`
              : `Watered ${plant.name}`,
            duration: 2500,
          })
          
          return result
        } else {
          // Server rejected - revert by refreshing serverPlants
          toast.error('Failed to water', {
            description: result.error,
          })
          return result
        }
      } catch {
        toast.error('Network error', {
          description: 'Changes will sync when connection is restored',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setIsSyncing(false)
      }
    },
    [optimisticPlants, startTransition, addOptimisticUpdate]
  )

  // Add a new plant immediately to state
  const addPlant = useCallback((plant: PlantWithType) => {
    setServerPlants((prev) => [...prev, plant])
  }, [])

  // Remove a plant immediately from state
  const removePlant = useCallback((plantId: string) => {
    setServerPlants((prev) => prev.filter((p) => p.id !== plantId))
  }, [])

  // Refresh plants from server
  const refreshPlants = useCallback((newPlants: PlantWithType[]) => {
    setServerPlants(newPlants)
  }, [])

  // Get a single plant
  const getPlant = useCallback(
    (plantId: string) => optimisticPlants.find((p) => p.id === plantId),
    [optimisticPlants]
  )

  return (
    <PlantsContext.Provider
      value={{
        plants: optimisticPlants,
        isPending,
        isSyncing,
        waterPlant,
        addPlant,
        removePlant,
        refreshPlants,
        getPlant,
      }}
    >
      {children}
    </PlantsContext.Provider>
  )
}

export function usePlants() {
  const context = useContext(PlantsContext)
  if (!context) {
    throw new Error('usePlants must be used within a PlantsProvider')
  }
  return context
}

// Hook for a single plant with optimistic updates
export function usePlant(plantId: string) {
  const { plants, waterPlant, isPending, isSyncing } = usePlants()
  const plant = plants.find((p) => p.id === plantId)
  
  return {
    plant,
    waterPlant: (options?: { notes?: string; difficulty?: 'easy' | 'medium' | 'hard' }) =>
      waterPlant(plantId, options),
    isPending,
    isSyncing,
  }
}
