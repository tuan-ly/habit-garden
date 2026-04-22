'use client'

import {
  createContext,
  useContext,
  useEffect,
  useOptimistic,
  useCallback,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import type { PlantWithType, TodayGoalLog } from '@/types/database'
import { waterPlant as waterPlantAction, updatePlantPosition as updatePlantPositionAction } from '@/lib/actions/plants'
import { logGoalValue as logGoalValueAction } from '@/lib/actions/goals'
import { validatePlantMove } from '@/lib/utils/grid-positioning'
import { toast } from 'sonner'

// Types for optimistic updates
type OptimisticAction =
  | { type: 'WATER_PLANT'; plantId: string; xpEarned: number }
  | { type: 'UPDATE_PLANT'; plant: PlantWithType }
  | { type: 'REMOVE_PLANT'; plantId: string }
  | { type: 'ADD_PLANT'; plant: PlantWithType }
  | { type: 'LOG_GOAL'; plantId: string; value: number; notes?: string }
  | { type: 'MOVE_PLANT'; plantId: string; gridRow: number; gridCol: number }

interface WaterResult {
  success: boolean
  xpEarned?: number
  xpBreakdown?: Record<string, number>
  weatherType?: string
  newAchievements?: string[]
  error?: string
}

interface GoalLogResult {
  success: boolean
  xpEarned?: number
  isPersonalRecord?: boolean
  exceededTarget?: boolean
  newValue?: number
  error?: string
}

interface MoveResult {
  success: boolean
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
  logGoal: (
    plantId: string,
    value: number,
    notes?: string
  ) => Promise<GoalLogResult>
  movePlant: (
    plantId: string,
    gridRow: number,
    gridCol: number
  ) => Promise<MoveResult>
  addPlant: (plant: PlantWithType) => void
  removePlant: (plantId: string) => void
  updatePlant: (plantId: string, updates: Partial<PlantWithType>) => void
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
          status:
            newGrowth >= 100 && plant.status !== 'dead' && plant.status !== 'dormant'
              ? 'mature'
              : plant.status,
        } as PlantWithType
      })
    }

    case 'LOG_GOAL': {
      return state.map((plant) => {
        if (plant.id !== action.plantId) return plant

        // Create optimistic log entry
        const newLog: TodayGoalLog = {
          id: `temp-${Date.now()}`,
          value: action.value,
          notes: action.notes || null,
          logged_at: new Date().toISOString(),
        }

        // Update today's logs and computed values
        const existingLogs = plant.today_logs || []
        const newLogs = [newLog, ...existingLogs]
        const newLogCount = newLogs.length
        const newTotalValue = newLogs.reduce((sum, log) => sum + log.value, 0)

        // Also update plant state (watering effect)
        const newMoisture = Math.min(100, plant.current_moisture + (plant.plant_type?.moisture_boost || 20))
        const baseGrowth = 100 / (plant.plant_type?.maturity_days || 30)
        const newGrowth = Math.min(100, plant.growth_percentage + baseGrowth)
        const newStreak = plant.current_streak + 1

        // Update goal current_value if present
        let updatedGoal = plant.goal
        if (updatedGoal) {
          const newCurrentValue = updatedGoal.goal_mode === 'total_progress'
            ? updatedGoal.current_value + action.value
            : Math.max(updatedGoal.current_value, action.value)
          updatedGoal = { ...updatedGoal, current_value: newCurrentValue }
        }

        return {
          ...plant,
          today_logs: newLogs,
          today_log_count: newLogCount,
          today_value: newTotalValue,
          goal: updatedGoal,
          current_moisture: newMoisture,
          growth_percentage: newGrowth,
          current_streak: newStreak,
          longest_streak: Math.max(plant.longest_streak, newStreak),
          total_waterings: plant.total_waterings + 1,
          last_watered_at: new Date().toISOString(),
          status:
            plant.status === 'dead' || plant.status === 'dormant'
              ? plant.status
              : newGrowth >= 100
                ? 'mature'
                : 'thriving',
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

    case 'MOVE_PLANT': {
      return state.map((plant) =>
        plant.id === action.plantId
          ? { ...plant, grid_row: action.gridRow, grid_col: action.gridCol }
          : plant
      )
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

  // Sync when RSC refetches new initialPlants (e.g. after dev panel edits)
  useEffect(() => {
    setServerPlants(initialPlants)
  }, [initialPlants])

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
                status:
                  p.status === 'dead' || p.status === 'dormant'
                    ? p.status
                    : newGrowth >= 100
                      ? 'mature'
                      : p.status,
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

  // Log goal value with optimistic update
  const logGoal = useCallback(
    async (
      plantId: string,
      value: number,
      notes?: string
    ): Promise<GoalLogResult> => {
      const plant = optimisticPlants.find((p) => p.id === plantId)
      if (!plant) {
        return { success: false, error: 'Plant not found' }
      }

      if (!plant.goal) {
        return { success: false, error: 'Plant has no goal' }
      }

      // Apply optimistic update IMMEDIATELY
      startTransition(() => {
        addOptimisticUpdate({ type: 'LOG_GOAL', plantId, value, notes })
      })

      // Sync with server in background
      setIsSyncing(true)
      try {
        const result = await logGoalValueAction({
          goal_id: plant.goal.id,
          value,
          notes,
        })

        if (result.success) {
          // Server confirmed - update serverPlants to persist the change
          setServerPlants((prev) =>
            prev.map((p) => {
              if (p.id !== plantId) return p

              // Create new log entry
              const newLog: TodayGoalLog = {
                id: `log-${Date.now()}`,
                value,
                notes: notes || null,
                logged_at: new Date().toISOString(),
              }

              const existingLogs = p.today_logs || []
              const newLogs = [newLog, ...existingLogs]
              const newLogCount = newLogs.length
              const newTotalValue = newLogs.reduce((sum, log) => sum + log.value, 0)

              // Update plant state
              const newMoisture = Math.min(100, p.current_moisture + (p.plant_type?.moisture_boost || 20))
              const baseGrowth = 100 / (p.plant_type?.maturity_days || 30)
              const newGrowth = Math.min(100, p.growth_percentage + baseGrowth)
              const newStreak = p.current_streak + 1

              // Update goal
              let updatedGoal = p.goal
              if (updatedGoal && result.newValue !== undefined) {
                updatedGoal = { ...updatedGoal, current_value: result.newValue }
              }

              return {
                ...p,
                today_logs: newLogs,
                today_log_count: newLogCount,
                today_value: newTotalValue,
                goal: updatedGoal,
                current_moisture: newMoisture,
                growth_percentage: newGrowth,
                current_streak: newStreak,
                longest_streak: Math.max(p.longest_streak, newStreak),
                total_waterings: p.total_waterings + 1,
                last_watered_at: new Date().toISOString(),
                status:
                  p.status === 'dead' || p.status === 'dormant'
                    ? p.status
                    : newGrowth >= 100
                      ? 'mature'
                      : 'thriving',
              } as PlantWithType
            })
          )

          return result
        } else {
          // Server rejected
          toast.error('Failed to log', {
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

  // Move a plant to a new position with optimistic update
  const movePlant = useCallback(
    async (
      plantId: string,
      gridRow: number,
      gridCol: number
    ): Promise<MoveResult> => {
      // Filter out dead plants for validation (consistent with isometric-garden)
      const livingPlants = optimisticPlants.filter(p => p.status !== 'dead')

      // Validate move locally first
      const validation = validatePlantMove(plantId, gridRow, gridCol, livingPlants)
      if (!validation.valid) {
        toast.error('Cannot move plant', {
          description: validation.reason,
        })
        return { success: false, error: validation.reason }
      }

      // Apply optimistic update
      startTransition(() => {
        addOptimisticUpdate({ type: 'MOVE_PLANT', plantId, gridRow, gridCol })
      })

      // Sync with server
      setIsSyncing(true)
      try {
        const result = await updatePlantPositionAction(plantId, gridRow, gridCol)

        if (result.success) {
          // Update serverPlants to persist
          setServerPlants((prev) =>
            prev.map((p) =>
              p.id === plantId
                ? { ...p, grid_row: gridRow, grid_col: gridCol }
                : p
            )
          )
          return { success: true }
        } else {
          toast.error('Failed to move plant', {
            description: result.error,
          })
          return { success: false, error: result.error }
        }
      } catch {
        toast.error('Network error', {
          description: 'Failed to save position',
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

  // Update a plant's properties (for goal creation, etc.)
  const updatePlant = useCallback((plantId: string, updates: Partial<PlantWithType>) => {
    setServerPlants((prev) =>
      prev.map((p) => p.id === plantId ? { ...p, ...updates } : p)
    )
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

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const contextValue = useMemo(
    () => ({
      plants: optimisticPlants,
      isPending,
      isSyncing,
      waterPlant,
      logGoal,
      movePlant,
      addPlant,
      removePlant,
      updatePlant,
      refreshPlants,
      getPlant,
    }),
    [optimisticPlants, isPending, isSyncing, waterPlant, logGoal, movePlant, addPlant, removePlant, updatePlant, refreshPlants, getPlant]
  )

  return (
    <PlantsContext.Provider value={contextValue}>
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
