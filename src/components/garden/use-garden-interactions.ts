'use client'

import { useState, useCallback, useRef } from 'react'
import { ACHIEVEMENTS, type AchievementDefinition } from '@/lib/achievements'
import {
  showWaterErrorToast,
  showGoalLogToast,
  showWaterToast,
} from '@/components/plants/water-toast'
import { isToday } from '@/lib/utils'
import type { LogActivityDto, LogActivityResult } from '@/lib/actions/activity'
import { validatePlantMove } from '@/lib/utils/grid-positioning'
import { applyGoalLogToPeriod } from '@/lib/goal-progress'
import type { PlantWithType, InventoryItemWithDetails, DecorationRotation } from '@/types/database'
import type { GardenMode } from './mode-toolbar'
import type { WateringActionMode } from '@/components/plants/gentle-watering-modal'

// Double tap threshold for opening detail sheet
const DOUBLE_TAP_THRESHOLD = 300

export interface CelebrationState {
  active: boolean
  position: { x: number; y: number }
  xpEarned: number
  plantName: string
  plantIcon: string
  streakCount: number
}

export interface MoveState {
  selectedPlant: PlantWithType | null
  previewCell: { row: number; col: number } | null
  isValidPreview: boolean
}

interface UseGardenInteractionsOpts {
  movePlant: (id: string, row: number, col: number) => Promise<{ success: boolean }>
  recordActivity: (
    dto: Omit<LogActivityDto, 'mutationId'>,
    optimisticUpdates: Partial<PlantWithType>
  ) => Promise<LogActivityResult>
  welcomeBackPending: boolean
  onWelcomeBackUsed?: () => void
  mode: GardenMode
  didPan: boolean
  resetDidPan: () => void
  livingPlants: PlantWithType[]
  // Decoration placement
  editSelectedItem: InventoryItemWithDetails | null
  editGhostRotation: DecorationRotation
  onPlaceDecoration?: (inventoryItemId: string, row: number, col: number, rotation?: DecorationRotation) => Promise<{ success: boolean; decorationId?: string; error?: string }>
  onEditPushUndo?: (action: { type: 'place'; placedDecoId: string; inventoryItemId: string; row: number; col: number }) => void
  onEditDeselectItem?: () => void
  onEditPlacementError?: (error: string) => void
  onEditPlacementSuccess?: () => void
  editPlacementPending?: boolean
  calmFeedback?: boolean
}

export function useGardenInteractions(opts: UseGardenInteractionsOpts) {
  const {
    movePlant, recordActivity, welcomeBackPending, onWelcomeBackUsed,
    mode, didPan, resetDidPan, livingPlants,
    editSelectedItem, editGhostRotation, onPlaceDecoration, onEditPushUndo, onEditDeselectItem,
    onEditPlacementError, onEditPlacementSuccess, editPlacementPending = false,
    calmFeedback = false,
  } = opts

  // Modal state
  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogPosition, setAddDialogPosition] = useState<{ row: number; col: number } | null>(null)

  // Watering modal state
  const [wateringPlant, setWateringPlant] = useState<PlantWithType | null>(null)
  const [wateringModalOpen, setWateringModalOpen] = useState(false)
  const [wateringInitialMode, setWateringInitialMode] = useState<WateringActionMode>('choose')

  // Celebration state
  const [celebration, setCelebration] = useState<CelebrationState | null>(null)

  // Move state
  const [moveState, setMoveState] = useState<MoveState>({
    selectedPlant: null,
    previewCell: null,
    isValidPreview: false,
  })

  // Level up + achievements + harvest
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number; oldLevel: number } | null>(null)
  const [pendingAchievements, setPendingAchievements] = useState<AchievementDefinition[]>([])
  const [harvestData, setHarvestData] = useState<{ plantName: string; material: { name: string; icon: string } } | null>(null)

  // Cooldown tracking
  const actionCooldown = useRef<Set<string>>(new Set())

  // Double-tap tracking
  const lastTapTime = useRef<number>(0)
  const lastTapPlantId = useRef<string | null>(null)

  // Check if plant is watered today
  const isWateredToday = useCallback((plant: PlantWithType) => {
    return isToday(plant.last_watered_at)
  }, [])

  // Helper: handle server result (level up, achievements, harvest)
  const handleServerResult = useCallback((result: {
    leveledUp?: boolean
    newLevel?: number
    oldLevel?: number
    newAchievementIds?: string[]
    harvestedMaterial?: { name: string; icon: string }
  }, plantName?: string) => {
    if (result.leveledUp && result.newLevel) {
      setLevelUpData({ newLevel: result.newLevel, oldLevel: result.oldLevel ?? result.newLevel - 1 })
    }
    if (result.newAchievementIds && result.newAchievementIds.length > 0) {
      const defs = result.newAchievementIds
        .map(id => ACHIEVEMENTS.find(a => a.id === id))
        .filter(Boolean) as AchievementDefinition[]
      if (defs.length > 0) {
        setPendingAchievements(prev => [...prev, ...defs])
      }
    }
    if (result.harvestedMaterial && plantName) {
      setHarvestData({ plantName, material: result.harvestedMaterial })
    }
  }, [])

  // Open watering modal
  const handleQuickWaterRequest = useCallback((plant: PlantWithType, initialMode: WateringActionMode = 'choose') => {
    setWateringPlant(plant)
    setWateringInitialMode(initialMode)
    setWateringModalOpen(true)
  }, [])

  // Watering confirm (from modal)
  const handleWaterConfirm = useCallback(
    async (notes: string | undefined, estimatedXp: number) => {
      if (!wateringPlant) return
      const plant = wateringPlant

      if (actionCooldown.current.has(plant.id)) return
      actionCooldown.current.add(plant.id)

      const celebrationPosition = {
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
      }
      const newStreak = plant.current_streak + 1

      setCelebration({
        active: true,
        position: celebrationPosition,
        xpEarned: estimatedXp,
        plantName: plant.name,
        plantIcon: plant.plant_type.icon,
        streakCount: newStreak,
      })

      const moistureBoost = plant.plant_type?.moisture_boost || 20
      const newMoisture = Math.min(100, plant.current_moisture + moistureBoost)
      const baseGrowth = 100 / (plant.plant_type?.maturity_days || 30)
      const newGrowth = Math.min(100, plant.growth_percentage + baseGrowth)

      const optimisticUpdates = {
        current_moisture: newMoisture,
        growth_percentage: newGrowth,
        current_streak: newStreak,
        longest_streak: Math.max(plant.longest_streak, newStreak),
        total_waterings: plant.total_waterings + 1,
        last_watered_at: new Date().toISOString(),
        status: newGrowth >= 100 ? 'mature' : plant.status,
      }

      try {
        const result = await recordActivity({
          plant_id: plant.id,
          activity_type: 'watering',
          notes,
          is_welcome_back: welcomeBackPending,
        }, optimisticUpdates)

        if (!result.success) {
          setCelebration(null)
          showWaterErrorToast(result.error || 'Unknown error')
        } else {
          if (welcomeBackPending) onWelcomeBackUsed?.()
          if (!calmFeedback) {
            showWaterToast({
              plantName: plant.name,
              plantIcon: plant.plant_type.icon,
              xpEarned: result.xpEarned || 0,
              streakCount: newStreak,
            })
          }
          handleServerResult(result, plant.name)
        }
      } catch {
        setCelebration(null)
        showWaterErrorToast('Failed to water plant')
      } finally {
        // Short cooldown to prevent double-clicks; optimistic last_watered_at prevents logical dupes
        setTimeout(() => actionCooldown.current.delete(plant.id), 500)
      }
    },
    [wateringPlant, recordActivity, welcomeBackPending, onWelcomeBackUsed, handleServerResult, calmFeedback]
  )

  // Log + water confirm (from modal "I did it" action)
  const handleLogAndWaterConfirm = useCallback(
    async (value: number | undefined, notes: string | undefined, estimatedXp: number) => {
      if (!wateringPlant) return
      const plant = wateringPlant

      if (actionCooldown.current.has(plant.id)) return
      actionCooldown.current.add(plant.id)

      const celebrationPosition = {
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
      }

      const hasGoal = !!plant.goal_mode
      const isFirstActivityToday = !isWateredToday(plant)
      const newStreak = isFirstActivityToday ? plant.current_streak + 1 : plant.current_streak

      setCelebration({
        active: true,
        position: celebrationPosition,
        xpEarned: estimatedXp,
        plantName: plant.name,
        plantIcon: plant.plant_type.icon,
        streakCount: newStreak,
      })

      const moistureBoost = plant.plant_type?.moisture_boost || 20
      const newMoisture = Math.min(100, plant.current_moisture + moistureBoost)
      const baseGrowth = 100 / (plant.plant_type?.maturity_days || 30)
      const newGrowth = Math.min(100, plant.growth_percentage + baseGrowth)

      const optimisticUpdates: Partial<typeof plant> = {
        current_moisture: newMoisture,
        growth_percentage: newGrowth,
        current_streak: newStreak,
        longest_streak: Math.max(plant.longest_streak, newStreak),
        total_waterings: plant.total_waterings + 1,
        last_watered_at: new Date().toISOString(),
        status: newGrowth >= 100 ? 'mature' : plant.status,
      }

      if (hasGoal && value !== undefined && plant.goal) {
        const newCurrentValue = plant.goal.goal_mode === 'total_progress'
          ? plant.goal.current_value + value
          : Math.max(plant.goal.current_value, value)
        optimisticUpdates.goal = {
          ...plant.goal,
          current_value: newCurrentValue,
          period_progress: applyGoalLogToPeriod(
            plant.goal.goal_mode,
            plant.goal.period_progress,
            value
          ),
        }
        optimisticUpdates.today_value = (plant.today_value || 0) + value
        optimisticUpdates.today_log_count = (plant.today_log_count || 0) + 1
      }

      try {
        const result = await recordActivity({
          plant_id: plant.id,
          activity_type: hasGoal && value !== undefined ? 'progress' : 'completed',
          value: hasGoal ? value : undefined,
          notes,
          is_welcome_back: welcomeBackPending,
        }, optimisticUpdates)

        if (!result.success) {
          setCelebration(null)
          showWaterErrorToast(result.error || 'Failed to log')
        } else {
          if (welcomeBackPending) onWelcomeBackUsed?.()
          if (!calmFeedback && hasGoal && value !== undefined) {
            const nextPeriodProgress = plant.goal
              ? applyGoalLogToPeriod(
                  plant.goal.goal_mode,
                  plant.goal.period_progress,
                  value
                )
              : undefined

            showGoalLogToast({
              plantName: plant.name,
              plantIcon: plant.plant_type.icon,
              value,
              unit: plant.goal?.unit || '',
              xpEarned: result.xpEarned || 0,
              isPersonalRecord: result.isPersonalRecord,
              periodProgress: nextPeriodProgress,
              periodTarget: plant.goal?.current_period_target,
              periodLabel: plant.goal?.period_label,
              consistencyDayAdded: isFirstActivityToday,
            })
          } else if (!calmFeedback) {
            showWaterToast({
              plantName: plant.name,
              plantIcon: plant.plant_type.icon,
              xpEarned: result.xpEarned || 0,
              streakCount: newStreak,
            })
          }
          handleServerResult(result, plant.name)
        }
      } catch {
        setCelebration(null)
        showWaterErrorToast('Failed to log progress')
      } finally {
        // Short cooldown to prevent double-clicks; optimistic last_watered_at prevents logical dupes
        setTimeout(() => actionCooldown.current.delete(plant.id), 500)
      }
    },
    [wateringPlant, isWateredToday, recordActivity, welcomeBackPending, onWelcomeBackUsed, handleServerResult, calmFeedback]
  )

  // Plant tap (single = water modal, double = detail sheet)
  const handlePlantTap = useCallback(
    (plant: PlantWithType) => {
      const now = Date.now()
      const timeSinceLastTap = now - lastTapTime.current
      const sameTarget = lastTapPlantId.current === plant.id

      if (sameTarget && timeSinceLastTap < DOUBLE_TAP_THRESHOLD) {
        lastTapTime.current = 0
        lastTapPlantId.current = null
        setSelectedPlant(plant)
        setSheetOpen(true)
        return
      }

      lastTapTime.current = now
      lastTapPlantId.current = plant.id
      handleQuickWaterRequest(plant)
    },
    [handleQuickWaterRequest]
  )

  // Show detail sheet
  const handleShowInfo = useCallback((plant: PlantWithType) => {
    setSelectedPlant(plant)
    setSheetOpen(true)
  }, [])

  // Open details from watering modal
  const handleOpenDetails = useCallback(() => {
    if (wateringPlant) {
      setWateringModalOpen(false)
      setSelectedPlant(wateringPlant)
      setSheetOpen(true)
    }
  }, [wateringPlant])

  // Move operations
  const selectPlantForMove = useCallback((plant: PlantWithType) => {
    if (navigator.vibrate) navigator.vibrate(30)
    setMoveState({ selectedPlant: plant, previewCell: null, isValidPreview: false })
  }, [])

  const cancelMoveSelection = useCallback(() => {
    setMoveState({ selectedPlant: null, previewCell: null, isValidPreview: false })
  }, [])

  const resetMoveState = useCallback(() => {
    setMoveState({ selectedPlant: null, previewCell: null, isValidPreview: false })
  }, [])

  const updateMovePreview = useCallback((row: number, col: number) => {
    if (!moveState.selectedPlant) return
    const validation = validatePlantMove(moveState.selectedPlant.id, row, col, livingPlants)
    setMoveState(prev => ({ ...prev, previewCell: { row, col }, isValidPreview: validation.valid }))
  }, [moveState.selectedPlant, livingPlants])

  const clearMovePreview = useCallback(() => {
    setMoveState(prev =>
      prev.previewCell === null && prev.isValidPreview === false
        ? prev
        : { ...prev, previewCell: null, isValidPreview: false }
    )
  }, [])

  const confirmMove = useCallback(async (row: number, col: number) => {
    if (!moveState.selectedPlant) return
    const plant = moveState.selectedPlant
    const validation = validatePlantMove(plant.id, row, col, livingPlants)
    setMoveState({ selectedPlant: null, previewCell: null, isValidPreview: false })
    if (validation.valid && (row !== plant.grid_row || col !== plant.grid_col)) {
      await movePlant(plant.id, row, col)
    }
  }, [moveState.selectedPlant, livingPlants, movePlant])

  // Place decoration on tile
  const handlePlaceDecoration = useCallback(
    async (row: number, col: number) => {
      if (!editSelectedItem || !onPlaceDecoration || editPlacementPending) return
      const inventoryItemId = editSelectedItem.id
      const result = await onPlaceDecoration(inventoryItemId, row, col, editGhostRotation)
      if (result.success && result.decorationId) {
        onEditPushUndo?.({ type: 'place', placedDecoId: result.decorationId, inventoryItemId, row, col })
        onEditDeselectItem?.()
        onEditPlacementSuccess?.()
        return
      }
      onEditPlacementError?.(result.error || 'Không thể đặt vật trang trí')
    },
    [
      editSelectedItem, editGhostRotation, onPlaceDecoration, onEditPushUndo,
      onEditDeselectItem, onEditPlacementError, onEditPlacementSuccess, editPlacementPending,
    ]
  )

  // Tile click — mode-based
  const handleTileClick = useCallback(
    (row: number, col: number, plant?: PlantWithType) => {
      if (didPan) { resetDidPan(); return }

      switch (mode) {
        case 'interact':
          if (plant) handlePlantTap(plant)
          break
        case 'arrange':
          // Decoration placement takes priority when an inventory item is selected
          if (editSelectedItem && !plant) {
            handlePlaceDecoration(row, col)
          } else if (moveState.selectedPlant) {
            if (moveState.selectedPlant.id === plant?.id) {
              cancelMoveSelection()
            } else {
              confirmMove(row, col)
            }
          } else if (plant) {
            selectPlantForMove(plant)
          } else {
            setAddDialogPosition({ row, col })
            setAddDialogOpen(true)
          }
          break
      }
    },
    [mode, handlePlantTap, didPan, resetDidPan, moveState.selectedPlant, selectPlantForMove, cancelMoveSelection, confirmMove, editSelectedItem, handlePlaceDecoration]
  )

  // Context menu (right-click)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, plant?: PlantWithType) => {
      e.preventDefault()
      if (plant) handleShowInfo(plant)
    },
    [handleShowInfo]
  )

  return {
    // Modal state
    selectedPlant, sheetOpen, setSheetOpen,
    addDialogOpen, setAddDialogOpen, addDialogPosition, setAddDialogPosition,
    wateringPlant, wateringModalOpen, setWateringModalOpen, wateringInitialMode,
    // Celebration state
    celebration, setCelebration,
    levelUpData, setLevelUpData,
    pendingAchievements, setPendingAchievements,
    harvestData, setHarvestData,
    // Move state
    moveState, resetMoveState,
    updateMovePreview, clearMovePreview,
    // Handlers
    handleTileClick, handleContextMenu, handleWaterConfirm,
    handleLogAndWaterConfirm, handleOpenDetails, handleQuickWaterRequest, handleShowInfo,
    isWateredToday,
  }
}
