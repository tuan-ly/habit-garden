'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { IsometricTile } from './isometric-tile'
import { IsometricPlant, type FocusState } from './isometric-plant'
import { PlantInfoBar } from './plant-tooltip'
import { GroundPlane, type MultiCellArea } from './ground-plane'
import { GroundPlaneCanvas } from './ground-plane-canvas'
import { GardenDecorations } from './garden-decorations'
import { AmbientParticles } from './ambient-particles'
import { AmbientParticlesCanvas } from './ambient-particles-canvas'
import { ZoomControls } from './zoom-controls'
import { WateringCelebration } from './watering-celebration'
import { ModeToolbar, type GardenMode } from './mode-toolbar'
import { getTimeOfDay, type TimeOfDay } from './themes'
// GestureHint removed - now using mode-based UI
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import { QuickLogModal } from '@/components/plants/quick-log-modal (archieved)'
import { GentleWateringModal } from '@/components/plants/gentle-watering-modal'
import {
  showAlreadyWateredToast,
  showWaterErrorToast,
  showGoalLogToast,
  showWaterToast,
} from '@/components/plants/water-toast'
import { usePlants, useGardenSettingsOptional } from '@/lib/context'
import { useGardenZoom, useVisibleTiles } from '@/lib/hooks'
import { logActivity } from '@/lib/actions/activity'
import type { PlantWithType, PlantType, WeatherType } from '@/types/database'
import { defaultTheme } from './themes'
import {
  calculateRequiredGridSize,
  buildOccupiedCellsMap,
  isAnchorCell,
  validatePlantMove,
} from '@/lib/utils/grid-positioning'

interface IsometricGardenProps {
  plantTypes: PlantType[]
  weather?: WeatherType | null
  journalStreak?: number
  /** Enable focus mode - hides ModeToolbar, changes click behavior */
  focusMode?: boolean
  /** Map of plant ID to focus state for visual treatment */
  focusStates?: Map<string, FocusState>
}

// Get responsive tile size - returns default for SSR, actual for client
const DEFAULT_TILE_SIZE = 140

function getClientTileSize(): number {
  if (typeof window === 'undefined') return DEFAULT_TILE_SIZE
  const width = window.innerWidth
  if (width < 640) return 100 // Mobile
  if (width < 1024) return 120 // Tablet
  return 140 // Desktop
}

// Double tap threshold for opening detail sheet (still useful in view mode)
const DOUBLE_TAP_THRESHOLD = 300

export function IsometricGarden({
  plantTypes,
  weather,
  journalStreak = 0,
  focusMode = false,
  focusStates,
}: IsometricGardenProps) {
  // Get plants from context with optimistic updates
  const { plants, movePlant, updatePlant } = usePlants()

  // Get garden settings for performance optimization
  const gardenSettings = useGardenSettingsOptional()

  // Zoom and pan state management
  const {
    zoom,
    minZoom,
    maxZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    isPanning,
    didPan,
    panOffset,
    bindGestures,
    resetPan,
    resetDidPan,
  } = useGardenZoom()

  // Garden mode state: 'interact' (default) or 'move'
  const [mode, setModeInternal] = useState<GardenMode>('interact')

  // Wrap setMode to cancel move selection when changing modes
  const setMode = useCallback((newMode: GardenMode) => {
    setModeInternal(newMode)
    // Reset move state when changing modes
    setMoveState({
      selectedPlant: null,
      previewCell: null,
      isValidPreview: false,
    })
  }, [])

  const [hoveredTile, setHoveredTile] = useState<string | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogPosition, setAddDialogPosition] = useState<{ row: number; col: number } | null>(null)

  // Quick log state (for archived QuickLogModal, now unused)
  const [quickLogPlant, setQuickLogPlant] = useState<PlantWithType | null>(null)
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  // Watering modal state
  const [wateringPlant, setWateringPlant] = useState<PlantWithType | null>(null)
  const [wateringModalOpen, setWateringModalOpen] = useState(false)

  // Watering celebration state
  const [celebration, setCelebration] = useState<{
    active: boolean
    position: { x: number; y: number }
    xpEarned: number
    plantName: string
    plantIcon: string
    streakCount: number
  } | null>(null)

  // Click-to-move state: click to select plant, then click to place
  const [moveState, setMoveState] = useState<{
    selectedPlant: PlantWithType | null
    previewCell: { row: number; col: number } | null
    isValidPreview: boolean
  }>({
    selectedPlant: null,
    previewCell: null,
    isValidPreview: false,
  })

  // Cooldown tracking to prevent multiple rapid watering/logging clicks
  const actionCooldown = useRef<Set<string>>(new Set())

  // Use default tile size on server, actual size on client
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE)

  // Track viewport dimensions for tile virtualization
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 })

  // Track if device is touch-only (for disabling hover info bar)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    const updateDeviceInfo = () => {
      setTileSize(getClientTileSize())
      setViewportSize({ width: window.innerWidth, height: window.innerHeight })

      // Detect touch device: check if primary pointer is coarse (touch, not mouse)
      // This is more accurate than screen width - tablets with mouse/trackpad will still show hover
      const isTouchPrimary = window.matchMedia('(pointer: coarse)').matches
      setIsTouchDevice(isTouchPrimary)
    }
    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    return () => window.removeEventListener('resize', updateDeviceInfo)
  }, [])

  // Prevent browser zoom on Ctrl+scroll and pinch-to-zoom globally
  useEffect(() => {
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
      }
    }

    // Prevent browser pinch-to-zoom on touch devices
    const preventTouchZoom = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault()
      }
    }

    // Use passive: false to allow preventDefault
    document.addEventListener('wheel', preventBrowserZoom, { passive: false })
    document.addEventListener('touchmove', preventTouchZoom, { passive: false })
    document.addEventListener('touchstart', preventTouchZoom, { passive: false })

    return () => {
      document.removeEventListener('wheel', preventBrowserZoom)
      document.removeEventListener('touchmove', preventTouchZoom)
      document.removeEventListener('touchstart', preventTouchZoom)
    }
  }, [])

  // Filter out dead plants for the garden view
  const livingPlants = plants.filter((p) => p.status !== 'dead')

  // Calculate grid size based on multi-cell plants
  const gridSize = useMemo(() => {
    return calculateRequiredGridSize(livingPlants)
  }, [livingPlants])

  // Build map of occupied cells
  const occupiedCells = useMemo(() => {
    return buildOccupiedCellsMap(livingPlants)
  }, [livingPlants])

  // Get multi-cell areas for hiding grid lines
  const multiCellAreas: MultiCellArea[] = useMemo(() => {
    return livingPlants
      .filter((p) => (p.grid_size || 1) > 1)
      .map((p) => ({
        row: p.grid_row || 0,
        col: p.grid_col || 0,
        size: p.grid_size || 1,
      }))
  }, [livingPlants])

  // Generate grid tiles
  const tiles = useMemo(() => {
    const result: { row: number; col: number; plant?: PlantWithType; isAnchor: boolean; isOccupiedByMultiCell: boolean }[] = []
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const plant = occupiedCells.get(`${row}-${col}`)
        const isAnchor = plant ? isAnchorCell(plant, row, col) : false
        const isOccupiedByMultiCell = plant !== undefined && !isAnchor && (plant.grid_size || 1) > 1
        result.push({ row, col, plant, isAnchor, isOccupiedByMultiCell })
      }
    }
    return result
  }, [gridSize, occupiedCells])

  // Calculate container dimensions
  const containerWidth = gridSize * tileSize
  const containerHeight = gridSize * (tileSize / 2) + tileSize * 0.3

  // Calculate visible tiles for virtualization (large grids only)
  const visibleTileKeys = useVisibleTiles({
    gridSize,
    tileSize,
    zoom,
    panOffset,
    viewportWidth: viewportSize.width,
    viewportHeight: viewportSize.height,
    buffer: 2,
  })

  // Ref for the garden container
  const gardenContainerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Select a plant to move (click-to-select)
  const selectPlantForMove = useCallback((plant: PlantWithType) => {
    setHoveredTile(null)
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30)
    setMoveState({
      selectedPlant: plant,
      previewCell: null,
      isValidPreview: false,
    })
  }, [])

  // Cancel move selection
  const cancelMoveSelection = useCallback(() => {
    setMoveState({
      selectedPlant: null,
      previewCell: null,
      isValidPreview: false,
    })
  }, [])

  // Update preview cell when hovering
  const updateMovePreview = useCallback((row: number, col: number) => {
    if (!moveState.selectedPlant) return

    const validation = validatePlantMove(
      moveState.selectedPlant.id,
      row,
      col,
      livingPlants
    )

    setMoveState((prev) => ({
      ...prev,
      previewCell: { row, col },
      isValidPreview: validation.valid,
    }))
  }, [moveState.selectedPlant, livingPlants])

  // Confirm move to selected cell
  const confirmMove = useCallback(async (row: number, col: number) => {
    if (!moveState.selectedPlant) return

    const plant = moveState.selectedPlant
    const validation = validatePlantMove(plant.id, row, col, livingPlants)

    // Reset state first
    setMoveState({
      selectedPlant: null,
      previewCell: null,
      isValidPreview: false,
    })

    if (validation.valid && (row !== plant.grid_row || col !== plant.grid_col)) {
      await movePlant(plant.id, row, col)
    }
  }, [moveState.selectedPlant, livingPlants, movePlant])

  // Check if plant is watered today
  const isWateredToday = useCallback((plant: PlantWithType) => {
    return plant.last_watered_at
      ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
      : false
  }, [])

  // Handle quick water request - opens modal instead of immediate action
  const handleQuickWaterRequest = useCallback(
    (plant: PlantWithType) => {
      // Always open modal - it will handle watered state via isWateredToday prop
      // (hides "Just checking in" button when already watered)
      setWateringPlant(plant)
      setWateringModalOpen(true)
    },
    []
  )

  // Actual watering action (called from modal)
  // Receives notes and estimatedXp calculated by modal
  const handleWaterConfirm = useCallback(
    async (notes: string | undefined, estimatedXp: number) => {
      if (!wateringPlant) return

      const plant = wateringPlant

      // Check cooldown to prevent rapid clicking
      if (actionCooldown.current.has(plant.id)) {
        return
      }

      // Add to cooldown immediately
      actionCooldown.current.add(plant.id)

      const celebrationPosition = {
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300
      }

      // Use estimatedXp from modal directly - single source of truth
      const newStreak = plant.current_streak + 1

      // Show celebration IMMEDIATELY (optimistic) with XP from modal
      setCelebration({
        active: true,
        position: celebrationPosition,
        xpEarned: estimatedXp,
        plantName: plant.name,
        plantIcon: plant.plant_type.icon,
        streakCount: newStreak,
      })

      // Optimistic update: Update plant state immediately
      const moistureBoost = plant.plant_type?.moisture_boost || 20
      const newMoisture = Math.min(100, plant.current_moisture + moistureBoost)
      const baseGrowth = 100 / (plant.plant_type?.maturity_days || 30)
      const newGrowth = Math.min(100, plant.growth_percentage + baseGrowth)

      updatePlant(plant.id, {
        current_moisture: newMoisture,
        growth_percentage: newGrowth,
        current_streak: newStreak,
        longest_streak: Math.max(plant.longest_streak, newStreak),
        total_waterings: plant.total_waterings + 1,
        last_watered_at: new Date().toISOString(),
        status: newGrowth >= 100 ? 'mature' : plant.status,
      })

      try {
        // Call unified logActivity with 'watering' type
        const result = await logActivity({
          plant_id: plant.id,
          activity_type: 'watering',
          notes,
        })

        if (!result.success) {
          // Cancel celebration on error
          setCelebration(null)
          showWaterErrorToast(result.error || 'Unknown error')
        } else {
          // Show toast with actual XP from server
          showWaterToast({
            plantName: plant.name,
            plantIcon: plant.plant_type.icon,
            xpEarned: result.xpEarned || 0,
            streakCount: newStreak,
          })
        }
      } catch (error) {
        // Cancel celebration on error
        setCelebration(null)
        showWaterErrorToast('Failed to water plant')
      } finally {
        // Remove from cooldown after 3 seconds (celebration duration)
        setTimeout(() => {
          actionCooldown.current.delete(plant.id)
        }, 3000)
      }
    },
    [wateringPlant, updatePlant]
  )

  // Handle "I did it" action from gentle watering modal (log progress + water)
  // Receives value, notes and estimatedXp calculated by modal - single source of truth
  const handleLogAndWaterConfirm = useCallback(
    async (value: number | undefined, notes: string | undefined, estimatedXp: number) => {
      if (!wateringPlant) return

      const plant = wateringPlant

      // Check cooldown to prevent rapid clicking
      if (actionCooldown.current.has(plant.id)) {
        return
      }

      // Add to cooldown immediately
      actionCooldown.current.add(plant.id)

      const celebrationPosition = {
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
      }

      const hasGoal = !!plant.goal_mode
      const isFirstActivityToday = !isWateredToday(plant)
      const newStreak = isFirstActivityToday ? plant.current_streak + 1 : plant.current_streak

      // Show celebration IMMEDIATELY using XP from modal (single source of truth)
      setCelebration({
        active: true,
        position: celebrationPosition,
        xpEarned: estimatedXp,
        plantName: plant.name,
        plantIcon: plant.plant_type.icon,
        streakCount: newStreak,
      })

      // Optimistic update: Update plant state immediately
      const moistureBoost = plant.plant_type?.moisture_boost || 20
      const newMoisture = Math.min(100, plant.current_moisture + moistureBoost)
      const baseGrowth = 100 / (plant.plant_type?.maturity_days || 30)
      const newGrowth = Math.min(100, plant.growth_percentage + baseGrowth)

      // Build optimistic updates
      const optimisticUpdates: Partial<typeof plant> = {
        current_moisture: newMoisture,
        growth_percentage: newGrowth,
        current_streak: newStreak,
        longest_streak: Math.max(plant.longest_streak, newStreak),
        total_waterings: plant.total_waterings + 1,
        last_watered_at: new Date().toISOString(),
        status: newGrowth >= 100 ? 'mature' : plant.status,
      }

      // Update goal progress optimistically if applicable
      if (hasGoal && value !== undefined && plant.goal) {
        const newCurrentValue = plant.goal.goal_mode === 'total_progress'
          ? plant.goal.current_value + value
          : Math.max(plant.goal.current_value, value)
        optimisticUpdates.goal = { ...plant.goal, current_value: newCurrentValue }
        optimisticUpdates.today_value = (plant.today_value || 0) + value
        optimisticUpdates.today_log_count = (plant.today_log_count || 0) + 1
      }

      updatePlant(plant.id, optimisticUpdates)

      try {
        // Use unified logActivity with appropriate type:
        // - 'progress' for plants with goals (includes value)
        // - 'completed' for plants without goals
        const result = await logActivity({
          plant_id: plant.id,
          activity_type: hasGoal && value !== undefined ? 'progress' : 'completed',
          value: hasGoal ? value : undefined,
          notes,
        })

        if (!result.success) {
          setCelebration(null)
          showWaterErrorToast(result.error || 'Failed to log')
        } else {
          // Show appropriate toast
          if (hasGoal && value !== undefined) {
            showGoalLogToast({
              plantName: plant.name,
              plantIcon: plant.plant_type.icon,
              value,
              unit: plant.goal?.unit || '',
              xpEarned: result.xpEarned || 0,
              isPersonalRecord: result.isPersonalRecord,
              exceededTarget: false, // Server calculates this
            })
          } else {
            showWaterToast({
              plantName: plant.name,
              plantIcon: plant.plant_type.icon,
              xpEarned: result.xpEarned || 0,
              streakCount: newStreak,
            })
          }
        }
      } catch (error) {
        setCelebration(null)
        showWaterErrorToast('Failed to log progress')
      } finally {
        // Remove from cooldown after 3 seconds (celebration duration)
        setTimeout(() => {
          actionCooldown.current.delete(plant.id)
        }, 3000)
      }
    },
    [wateringPlant, isWateredToday, updatePlant]
  )

  // Track last tap time for double-tap detection
  const lastTapTime = useRef<number>(0)
  const lastTapPlantId = useRef<string | null>(null)

  // Handle tap/click on plant - unified for mobile and desktop
  // Single tap = open watering modal, Double tap = open detail sheet
  const handlePlantTap = useCallback(
    (plant: PlantWithType) => {
      const now = Date.now()
      const timeSinceLastTap = now - lastTapTime.current
      const sameTarget = lastTapPlantId.current === plant.id

      // Double-tap detection
      if (sameTarget && timeSinceLastTap < DOUBLE_TAP_THRESHOLD) {
        // Double tap - open detail sheet
        lastTapTime.current = 0
        lastTapPlantId.current = null
        setSelectedPlant(plant)
        setSheetOpen(true)
        return
      }

      // Record this tap for double-tap detection
      lastTapTime.current = now
      lastTapPlantId.current = plant.id

      // Unified behavior: Always open gentle watering modal (both mobile and desktop)
      handleQuickWaterRequest(plant)
    },
    [handleQuickWaterRequest]
  )

  // Handle right-click / long-press - open detail sheet
  const handleShowInfo = useCallback(
    (plant: PlantWithType) => {
      setSelectedPlant(plant)
      setSheetOpen(true)
    },
    []
  )

  // Handle tile click - behavior depends on current mode
  const handleTileClick = useCallback(
    (row: number, col: number, plant?: PlantWithType, event?: React.MouseEvent | React.TouchEvent) => {
      // If user panned, don't handle click
      if (didPan) {
        resetDidPan()
        return
      }

      // Get tap position for celebration animation
      let tapPosition: { x: number; y: number } | undefined
      if (event) {
        if ('clientX' in event) {
          tapPosition = { x: event.clientX, y: event.clientY }
        } else if ('touches' in event && event.touches.length > 0) {
          tapPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY }
        }
      }

      // Mode-based interaction logic
      switch (mode) {
        case 'interact':
          // Interact mode: tap plant → watering modal, empty tiles do nothing
          if (plant) {
            handlePlantTap(plant)
          }
          // Empty tiles: no action in interact mode (use move mode to add)
          break

        case 'edit':
          // Edit mode: click-to-select, click-to-place, or add plant
          if (moveState.selectedPlant) {
            // A plant is already selected - try to place it here
            if (moveState.selectedPlant.id === plant?.id) {
              // Clicked same plant - deselect
              cancelMoveSelection()
            } else {
              // Try to place at this location
              confirmMove(row, col)
            }
          } else if (plant) {
            // No plant selected - select this one
            selectPlantForMove(plant)
          } else {
            // Empty tile with no plant selected - open add plant dialog
            setAddDialogPosition({ row, col })
            setAddDialogOpen(true)
          }
          break
      }
    },
    [mode, handlePlantTap, didPan, resetDidPan, moveState.selectedPlant, selectPlantForMove, cancelMoveSelection, confirmMove]
  )

  // Handle right-click (desktop) - open detail sheet
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, plant?: PlantWithType) => {
      e.preventDefault()
      if (plant) {
        handleShowInfo(plant)
      }
    },
    [handleShowInfo]
  )

  // Handle goal log (for archived QuickLogModal - uses new unified logActivity)
  const handleGoalLog = useCallback(
    async (value: number, notes?: string) => {
      if (!quickLogPlant) return

      const plant = quickLogPlant

      // Check cooldown to prevent rapid clicking
      if (actionCooldown.current.has(plant.id)) {
        return
      }

      // Add to cooldown immediately
      actionCooldown.current.add(plant.id)

      // Close modal FIRST so celebration is visible
      setQuickLogOpen(false)

      const isFirstActivityToday = !isWateredToday(plant)
      const newStreak = isFirstActivityToday ? plant.current_streak + 1 : plant.current_streak

      // Simple XP estimate: base watering (10) + morning (3) if applicable
      const isMorning = new Date().getHours() >= 5 && new Date().getHours() < 9
      let estimatedXp = isFirstActivityToday ? 10 + (isMorning ? 3 : 0) : 0

      // Note bonus estimate
      if (notes?.trim()) {
        const len = notes.trim().length
        estimatedXp += 3 + (len > 50 ? 2 : 0) + (len > 100 ? 2 : 0)
      }

      const celebrationPosition = {
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
      }

      // Show celebration IMMEDIATELY (optimistic)
      setCelebration({
        active: true,
        position: celebrationPosition,
        xpEarned: estimatedXp,
        plantName: plant.name,
        plantIcon: plant.plant_type.icon,
        streakCount: newStreak,
      })

      try {
        // Use unified logActivity
        const result = await logActivity({
          plant_id: plant.id,
          activity_type: 'progress',
          value,
          notes,
        })

        if (!result.success) {
          // Cancel celebration on error
          setCelebration(null)
          showWaterErrorToast(result.error || 'Failed to log')
        } else {
          // Show toast with actual XP from server (if XP earned)
          if (result.xpEarned && result.xpEarned > 0) {
            showGoalLogToast({
              plantName: plant.name,
              plantIcon: plant.plant_type.icon,
              value,
              unit: plant.goal?.unit || '',
              xpEarned: result.xpEarned,
              isPersonalRecord: result.isPersonalRecord,
              exceededTarget: false,
            })
          }
        }
      } catch (error) {
        // Cancel celebration on error
        setCelebration(null)
        showWaterErrorToast('Failed to log progress')
      } finally {
        // Remove from cooldown after 3 seconds (celebration duration)
        setTimeout(() => {
          actionCooldown.current.delete(plant.id)
        }, 3000)
      }
    },
    [quickLogPlant, isWateredToday]
  )

  // Open details from watering modal
  const handleOpenDetails = useCallback(() => {
    if (wateringPlant) {
      setWateringModalOpen(false)
      setSelectedPlant(wateringPlant)
      setSheetOpen(true)
    }
  }, [wateringPlant])

  const handleTileHover = (row: number, col: number) => {
    const plant = occupiedCells.get(`${row}-${col}`)
    if (plant && (plant.grid_size || 1) > 1) {
      setHoveredTile(`${plant.grid_row || 0}-${plant.grid_col || 0}`)
    } else {
      setHoveredTile(`${row}-${col}`)
    }

    // Update move preview when in edit mode with selected plant
    if (mode === 'edit' && moveState.selectedPlant) {
      updateMovePreview(row, col)
    }
  }

  const handleTileLeave = () => {
    setHoveredTile(null)
  }

  // Get hovered plant for info bar
  const hoveredPlant = hoveredTile ? occupiedCells.get(hoveredTile) ?? null : null

  // Get hovered multi-cell area
  const hoveredMultiCellArea = useMemo(() => {
    if (!hoveredTile) return null
    const plant = occupiedCells.get(hoveredTile)
    if (!plant || (plant.grid_size || 1) <= 1) return null
    return {
      row: plant.grid_row || 0,
      col: plant.grid_col || 0,
      size: plant.grid_size || 1,
    }
  }, [hoveredTile, occupiedCells])

  // Check if garden is empty
  const isEmpty = livingPlants.length === 0

  // Track time of day
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>('day')

  useEffect(() => {
    setCurrentTimeOfDay(getTimeOfDay())
    const interval = setInterval(() => setCurrentTimeOfDay(getTimeOfDay()), 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-full flex flex-col select-none">
      {/* Mode toolbar - fixed position on left side (hidden in focus mode) */}
      {!focusMode && (
        <ModeToolbar
          mode={mode}
          onModeChange={setMode}
          className="fixed left-3 top-1/2 -translate-y-1/2 z-30"
        />
      )}

      {/* Zoom Controls - fixed position on right side */}
      <ZoomControls
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={() => {
          resetZoom()
          resetPan()
        }}
        className="fixed right-3 top-1/2 -translate-y-1/2 z-30"
      />

      {/* Empty state overlay for new users */}
      {isEmpty && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm mx-4 text-center shadow-2xl border border-white/20 dark:border-slate-700/50 pointer-events-auto animate-fade-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <span className="text-3xl sm:text-4xl">🌱</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Your Garden Awaits!</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-4">
              Switch to <span className="font-semibold text-emerald-600">Add mode</span> using the toolbar on the left, then tap any tile to plant your first habit!
            </p>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
              <span className="animate-bounce">👈</span>
              <span>Use the ➕ button to start</span>
            </div>
          </div>
        </div>
      )}

      {/* Garden container with zoom and pan gesture support */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-hidden"
        style={{
          touchAction: 'manipulation',
          cursor: isPanning
            ? 'grabbing'
            : mode === 'edit'
              ? (moveState.selectedPlant ? 'crosshair' : 'grab')
              : 'default',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
        onWheel={bindGestures.onWheel}
        onTouchStart={bindGestures.onTouchStart}
        onTouchMove={bindGestures.onTouchMove}
        onTouchEnd={bindGestures.onTouchEnd}
        onMouseDown={bindGestures.onMouseDown}
        onMouseMove={bindGestures.onMouseMove}
        onMouseUp={bindGestures.onMouseUp}
        onMouseLeave={bindGestures.onMouseLeave}
      >
        <div
          className="flex justify-center items-end w-full h-full"
          style={{
            paddingBottom: '16px',
          }}
        >
          <div
            ref={gardenContainerRef}
            className="relative flex-shrink-0"
            style={{
              width: containerWidth,
              height: containerHeight,
              transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          >
            {/* Garden decorations */}
            {gardenSettings.showDecorations && (
              <GardenDecorations
                gridSize={gridSize}
                tileSize={tileSize}
                timeOfDay={currentTimeOfDay}
              />
            )}

            {/* Single unified ground plane - Canvas or SVG based on settings */}
            {gardenSettings.useCanvasRenderer ? (
              <GroundPlaneCanvas
                gridSize={gridSize}
                tileSize={tileSize}
                grassColor={defaultTheme.ground.primary}
                grassDarkColor={defaultTheme.ground.secondary}
                multiCellAreas={multiCellAreas}
                hoveredMultiCellArea={hoveredMultiCellArea}
                dragTargetCell={moveState.selectedPlant ? moveState.previewCell : null}
                dragPlantSize={moveState.selectedPlant?.grid_size || 1}
                isDragTargetValid={moveState.isValidPreview}
              />
            ) : (
              <GroundPlane
                gridSize={gridSize}
                tileSize={tileSize}
                grassColor={defaultTheme.ground.primary}
                grassDarkColor={defaultTheme.ground.secondary}
                multiCellAreas={multiCellAreas}
                hoveredMultiCellArea={hoveredMultiCellArea}
                dragTargetCell={moveState.selectedPlant ? moveState.previewCell : null}
                dragPlantSize={moveState.selectedPlant?.grid_size || 1}
                isDragTargetValid={moveState.isValidPreview}
              />
            )}

            {/* Ambient particles - Canvas or CSS based on settings */}
            {gardenSettings.showParticles && (
              gardenSettings.useCanvasRenderer ? (
                <AmbientParticlesCanvas
                  weather={gardenSettings.showWeatherEffects ? weather : null}
                  timeOfDay={currentTimeOfDay}
                  width={containerWidth}
                  height={containerHeight}
                />
              ) : (
                <AmbientParticles
                  weather={gardenSettings.showWeatherEffects ? weather : null}
                  timeOfDay={currentTimeOfDay}
                />
              )
            )}

            {/* Interactive tile zones - filtered by visibility for performance */}
            {tiles.map(({ row, col, plant, isAnchor, isOccupiedByMultiCell }) => {
              const tileKey = `${row}-${col}`

              // Skip rendering tiles outside visible area (for large grids)
              if (!visibleTileKeys.has(tileKey)) return null

              const isHovered = hoveredTile === tileKey
              const clickPlant = isOccupiedByMultiCell ? plant : (isAnchor ? plant : undefined)
              const isPartOfMultiCell = plant !== undefined && (plant.grid_size || 1) > 1

              // Check if this plant is selected for moving
              const isSelectedForMove = moveState.selectedPlant?.id === plant?.id
              // Check if this tile is the preview destination
              const isPreviewTile = moveState.previewCell?.row === row && moveState.previewCell?.col === col

              return (
                <IsometricTile
                  key={tileKey}
                  row={row}
                  col={col}
                  gridSize={gridSize}
                  isEmpty={!plant && !isOccupiedByMultiCell}
                  isHovered={isHovered}
                  isOccupiedByMultiCell={isOccupiedByMultiCell}
                  isPartOfMultiCell={isPartOfMultiCell}
                  plantGridSize={plant?.grid_size || 1}
                  onClick={(e) => handleTileClick(row, col, clickPlant, e)}
                  onContextMenu={(e) => handleContextMenu(e, clickPlant)}
                  onMouseEnter={() => handleTileHover(row, col)}
                  onMouseLeave={handleTileLeave}
                  tileSize={tileSize}
                  plant={isAnchor ? plant : null}
                  hideBadge={isSelectedForMove}
                  showAddHint={mode === 'edit' && !moveState.selectedPlant}
                  isSelectedForMove={isSelectedForMove}
                  previewPlant={isPreviewTile && moveState.selectedPlant && moveState.isValidPreview ? moveState.selectedPlant : undefined}
                >
                  {plant && isAnchor && (
                    <div className={isSelectedForMove ? 'opacity-40 scale-95 transition-all' : ''}>
                      <IsometricPlant
                        plant={plant}
                        weather={weather}
                        focusState={focusStates?.get(plant.id)}
                      />
                    </div>
                  )}
                </IsometricTile>
              )
            })}
          </div>
        </div>
      </div>

      {/* Move mode indicator */}
      {moveState.selectedPlant && (
        <div className="absolute left-1/2 -translate-x-1/2 top-20 z-30 pointer-events-none">
          <div className="px-4 py-2 bg-emerald-600/90 backdrop-blur-md rounded-full text-xs text-white border border-emerald-400/50 shadow-lg">
            <span className="flex items-center gap-2">
              <span>🌱</span>
              <span>Moving {moveState.selectedPlant.name}</span>
              <span className="text-emerald-200">•</span>
              <span>Select a spot to place</span>
            </span>
          </div>
        </div>
      )}

      {/* Fixed info bar at bottom - disabled on touch devices since hover requires a mouse */}
      {!isTouchDevice && <PlantInfoBar plant={hoveredPlant} />}

      {/* Quick log modal for goal plants */}
      <QuickLogModal
        plant={quickLogPlant}
        open={quickLogOpen}
        onOpenChange={setQuickLogOpen}
        onLog={handleGoalLog}
        todayLogCount={quickLogPlant?.today_log_count || 0}
        todayValue={quickLogPlant?.today_value}
        unit={quickLogPlant?.goal?.unit || ''}
        estimatedXp={15}
        journalStreak={journalStreak}
      />

      {/* Gentle watering modal - new 2-option flow (I did it / Just checking in) */}
      <GentleWateringModal
        plant={wateringPlant}
        open={wateringModalOpen}
        onOpenChange={setWateringModalOpen}
        onWater={handleWaterConfirm}
        onLogAndWater={handleLogAndWaterConfirm}
        onDetails={handleOpenDetails}
        hasGoal={!!wateringPlant?.goal_mode}
        goalUnit={wateringPlant?.goal?.unit}
        goalMode={wateringPlant?.goal_mode || undefined}
        isWateredToday={wateringPlant ? isWateredToday(wateringPlant) : false}
        journalStreak={journalStreak}
      />

      {/* Add plant dialog */}
      <AddPlantDialog
        plantTypes={plantTypes}
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) {
            setAddDialogPosition(null)
          }
        }}
        gridPosition={addDialogPosition}
      />

      {/* Plant detail sheet */}
      <PlantDetailSheet
        plant={selectedPlant}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Watering celebration effect */}
      {gardenSettings.showCelebrations && (
        <WateringCelebration
          isActive={celebration?.active ?? false}
          position={celebration?.position}
          xpEarned={celebration?.xpEarned}
          plantName={celebration?.plantName}
          plantIcon={celebration?.plantIcon}
          streakCount={celebration?.streakCount}
          onComplete={() => setCelebration(null)}
        />
      )}
    </div>
  )
}
