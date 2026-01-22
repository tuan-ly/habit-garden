'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { IsometricTile } from './isometric-tile'
import { IsometricPlant } from './isometric-plant'
import { PlantInfoBar } from './plant-tooltip'
import { FloatingPlantCard } from './floating-plant-card'
import { GroundPlane, type MultiCellArea } from './ground-plane'
import { GardenDecorations } from './garden-decorations'
import { AmbientParticles } from './ambient-particles'
import { ZoomControls } from './zoom-controls'
import { WateringCelebration } from './watering-celebration'
import { GestureHint } from './gesture-hint'
import { getTimeOfDay, type TimeOfDay } from './themes'
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import { QuickLogModal } from '@/components/plants/quick-log-modal'
import {
  showAlreadyWateredToast,
  showWaterErrorToast,
} from '@/components/plants/water-toast'
import { usePlants } from '@/lib/context'
import { useGardenZoom } from '@/lib/hooks'
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

// Long press threshold in milliseconds
const LONG_PRESS_THRESHOLD = 500

// Double tap threshold in milliseconds
const DOUBLE_TAP_THRESHOLD = 300

export function IsometricGarden({
  plantTypes,
  weather,
}: IsometricGardenProps) {
  // Get plants from context with optimistic updates
  const { plants, waterPlant, logGoal, movePlant } = usePlants()

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

  const [hoveredTile, setHoveredTile] = useState<string | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogPosition, setAddDialogPosition] = useState<{ row: number; col: number } | null>(null)

  // New state for enhanced interactions
  const [floatingCard, setFloatingCard] = useState<{
    plant: PlantWithType
    position: { x: number; y: number }
  } | null>(null)
  const [quickLogPlant, setQuickLogPlant] = useState<PlantWithType | null>(null)
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  // Watering celebration state
  const [celebration, setCelebration] = useState<{
    active: boolean
    position: { x: number; y: number }
    xpEarned: number
    plantName: string
    plantIcon: string
    streakCount: number
  } | null>(null)

  // Long press tracking
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggered = useRef<boolean>(false)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)

  // Drag state for moving plants (only in edit mode)
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    draggedPlant: PlantWithType | null
    targetCell: { row: number; col: number } | null
    isValidTarget: boolean
    dragPosition: { x: number; y: number } | null
  }>({
    isDragging: false,
    draggedPlant: null,
    targetCell: null,
    isValidTarget: false,
    dragPosition: null,
  })
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)

  // Use default tile size on server, actual size on client
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE)

  useEffect(() => {
    const handleResize = () => setTileSize(getClientTileSize())
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent browser zoom on Ctrl+scroll globally
  useEffect(() => {
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
      }
    }

    // Use passive: false to allow preventDefault
    document.addEventListener('wheel', preventBrowserZoom, { passive: false })

    return () => {
      document.removeEventListener('wheel', preventBrowserZoom)
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

  // Ref for the garden container (used for drag position calculations)
  const gardenContainerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Convert screen coordinates to grid cell
  const screenToGridCell = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const container = gardenContainerRef.current
      if (!container) return null

      const rect = container.getBoundingClientRect()
      const relX = clientX - rect.left
      const relY = clientY - rect.top

      const zoomedTileSize = tileSize * zoom
      const centerX = (containerWidth * zoom) / 2

      const dx = relX - centerX
      const dy = relY

      const colMinusRow = (dx * 2) / zoomedTileSize
      const colPlusRow = (dy * 4) / zoomedTileSize

      const col = Math.floor((colPlusRow + colMinusRow) / 2)
      const row = Math.floor((colPlusRow - colMinusRow) / 2)

      return { row, col }
    },
    [tileSize, zoom, containerWidth]
  )

  // Start drag mode for a plant (triggered by long-press + move)
  const startPlantDrag = useCallback(
    (plant: PlantWithType, startPosition: { x: number; y: number }) => {
      setFloatingCard(null)
      setHoveredTile(null)

      setDragState({
        isDragging: true,
        draggedPlant: plant,
        targetCell: { row: plant.grid_row, col: plant.grid_col },
        isValidTarget: true,
        dragPosition: startPosition,
      })
    },
    []
  )

  // Handle drag move
  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragState.isDragging || !dragState.draggedPlant) return

      const cell = screenToGridCell(clientX, clientY)
      if (!cell) return

      const validation = validatePlantMove(
        dragState.draggedPlant.id,
        cell.row,
        cell.col,
        livingPlants
      )

      setDragState((prev) => ({
        ...prev,
        targetCell: cell,
        isValidTarget: validation.valid,
        dragPosition: { x: clientX, y: clientY },
      }))
    },
    [dragState.isDragging, dragState.draggedPlant, screenToGridCell, livingPlants]
  )

  // End drag and drop plant
  const endPlantDrag = useCallback(async () => {
    if (!dragState.isDragging || !dragState.draggedPlant || !dragState.targetCell) {
      setDragState({
        isDragging: false,
        draggedPlant: null,
        targetCell: null,
        isValidTarget: false,
        dragPosition: null,
      })
      return
    }

    const { row, col } = dragState.targetCell
    const plant = dragState.draggedPlant

    setDragState({
      isDragging: false,
      draggedPlant: null,
      targetCell: null,
      isValidTarget: false,
      dragPosition: null,
    })

    if (dragState.isValidTarget && (row !== plant.grid_row || col !== plant.grid_col)) {
      await movePlant(plant.id, row, col)
    }
  }, [dragState, movePlant])

  // Check if plant is watered today
  const isWateredToday = useCallback((plant: PlantWithType) => {
    return plant.last_watered_at
      ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
      : false
  }, [])

  // Handle quick water for simple (non-goal) plants
  const handleQuickWater = useCallback(
    async (plant: PlantWithType, tapPosition?: { x: number; y: number }) => {
      if (isWateredToday(plant)) {
        showAlreadyWateredToast(plant.name)
        return
      }

      const estimatedXp = 10
      const estimatedStreak = plant.current_streak + 1
      const celebrationPosition = tapPosition || {
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300
      }

      setCelebration({
        active: true,
        position: celebrationPosition,
        xpEarned: estimatedXp,
        plantName: plant.name,
        plantIcon: plant.plant_type.icon,
        streakCount: estimatedStreak,
      })

      const result = await waterPlant(plant.id)

      if (!result.success) {
        showWaterErrorToast(result.error || 'Unknown error')
      }
    },
    [waterPlant, isWateredToday]
  )

  // Track last tap time for double-tap detection
  const lastTapTime = useRef<number>(0)
  const lastTapPlantId = useRef<string | null>(null)

  // Handle tap/click on plant - gesture-based (no modes)
  // Single tap = water/log, Double tap = open detail sheet
  const handlePlantTap = useCallback(
    (plant: PlantWithType, tapPosition?: { x: number; y: number }) => {
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

      // Single tap - water or log goal
      if (plant.goal_mode) {
        setQuickLogPlant(plant)
        setQuickLogOpen(true)
      } else {
        handleQuickWater(plant, tapPosition)
      }
    },
    [handleQuickWater]
  )

  // Handle right-click / long-press to show info card (all modes)
  const handleShowInfo = useCallback(
    (plant: PlantWithType, position: { x: number; y: number }) => {
      setFloatingCard({ plant, position })
    },
    []
  )

  // Track last empty tile tap for double-tap to add plant
  const lastEmptyTapTime = useRef<number>(0)
  const lastEmptyTapCell = useRef<string | null>(null)

  // Handle tile click
  const handleTileClick = useCallback(
    (row: number, col: number, plant?: PlantWithType, event?: React.MouseEvent | React.TouchEvent) => {
      // If long press was triggered, don't handle click
      if (longPressTriggered.current) {
        longPressTriggered.current = false
        // eslint-disable-next-line react-hooks/immutability
        longPressingPlant.current = null
        return
      }

      // If user panned/dragged, don't handle click
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

      if (plant) {
        handlePlantTap(plant, tapPosition)
      } else {
        // Empty tile - double tap to add plant
        const now = Date.now()
        const cellKey = `${row}-${col}`
        const timeSinceLastTap = now - lastEmptyTapTime.current
        const sameCell = lastEmptyTapCell.current === cellKey

        if (sameCell && timeSinceLastTap < DOUBLE_TAP_THRESHOLD) {
          // Double tap on empty tile - open add plant dialog
          lastEmptyTapTime.current = 0
          lastEmptyTapCell.current = null
          setAddDialogPosition({ row, col })
          setAddDialogOpen(true)
        } else {
          // Single tap - just record for double-tap detection
          lastEmptyTapTime.current = now
          lastEmptyTapCell.current = cellKey
        }
      }
    },
    [handlePlantTap, didPan, resetDidPan]
  )

  // Handle right-click (desktop)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, plant?: PlantWithType) => {
      e.preventDefault()
      // Disable info card on mobile/touch devices to avoid conflict with dragging
      if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) {
        return
      }
      if (plant) {
        handleShowInfo(plant, { x: e.clientX, y: e.clientY })
      }
    },
    [handleShowInfo]
  )

  // Track plant for potential drag
  const longPressingPlant = useRef<PlantWithType | null>(null)

  // Handle touch start (mobile long-press)
  // Long press on plant = show info card initially, then drag if moved
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, plant?: PlantWithType) => {
      const touch = e.touches[0]
      const startPos = { x: touch.clientX, y: touch.clientY }
      touchStartPos.current = startPos
      dragStartPos.current = startPos
      longPressTriggered.current = false
      // eslint-disable-next-line react-hooks/immutability
      longPressingPlant.current = plant ?? null

      if (plant) {
        // Long press on plant triggers drag mode after threshold
        // We moved handleShowInfo to only ContextMenu (right click) to avoid conflict with moving
        longPressTimer.current = setTimeout(() => {
          longPressTriggered.current = true
          // Haptic feedback to indicate long-press triggered
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }
        }, LONG_PRESS_THRESHOLD)
      }
    },
    []
  )

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]

    // If dragging, update drag position
    if (dragState.isDragging) {
      handleDragMove(touch.clientX, touch.clientY)
      return
    }

    // If not dragging yet, check if we should cancel long-press or start drag
    if (!touchStartPos.current) return

    const dx = Math.abs(touch.clientX - touchStartPos.current.x)
    const dy = Math.abs(touch.clientY - touchStartPos.current.y)

    // If moved more than 10px
    if (dx > 10 || dy > 10) {
      // Cancel the long-press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }

      // If long-press was already triggered and we have a plant, start dragging
      if (longPressTriggered.current && longPressingPlant.current) {
        setFloatingCard(null) // Close info card if open
        startPlantDrag(longPressingPlant.current, { x: touch.clientX, y: touch.clientY })
        // eslint-disable-next-line react-hooks/immutability
        longPressingPlant.current = null
      }
    }
  }, [dragState.isDragging, handleDragMove, startPlantDrag])

  // Native touch event listener to prevent scrolling during drag
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const preventScroll = (e: TouchEvent) => {
      if (dragState.isDragging) {
        e.preventDefault()
      }
    }

    container.addEventListener('touchmove', preventScroll, { passive: false })

    return () => {
      container.removeEventListener('touchmove', preventScroll)
    }
  }, [dragState.isDragging])

  // Global mouse event listeners for drag (when mouse moves outside tiles)
  useEffect(() => {
    if (!dragState.isDragging) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY)
    }

    const handleGlobalMouseUp = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      dragStartPos.current = null
      endPlantDrag()
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [dragState.isDragging, handleDragMove, endPlantDrag])

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
    dragStartPos.current = null

    if (dragState.isDragging) {
      endPlantDrag()
    }
  }, [dragState.isDragging, endPlantDrag])

  // Handle mouse down for drag (long-press to drag)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, plant?: PlantWithType) => {
      const startPos = { x: e.clientX, y: e.clientY }
      dragStartPos.current = startPos
      longPressTriggered.current = false
      // eslint-disable-next-line react-hooks/immutability
      longPressingPlant.current = plant ?? null

      if (plant) {
        // Start long press timer - will allow dragging if moved
        longPressTimer.current = setTimeout(() => {
          longPressTriggered.current = true
          // Haptic feedback for desktop (if supported/wanted)
          if (navigator.vibrate) {
            navigator.vibrate(50)
          }
        }, LONG_PRESS_THRESHOLD)
      }
    },
    []
  )

  // Handle mouse move for drag
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // If dragging, update drag position
    if (dragState.isDragging) {
      handleDragMove(e.clientX, e.clientY)
      return
    }

    // If not dragging yet, check if we should cancel long-press or start drag
    if (!dragStartPos.current) return

    const dx = Math.abs(e.clientX - dragStartPos.current.x)
    const dy = Math.abs(e.clientY - dragStartPos.current.y)

    // If moved more than 10px
    if (dx > 10 || dy > 10) {
      // Cancel the long-press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }

      // If long-press was already triggered and we have a plant, start dragging
      if (longPressTriggered.current && longPressingPlant.current) {
        setFloatingCard(null) // Close info card if open
        startPlantDrag(longPressingPlant.current, { x: e.clientX, y: e.clientY })
        // eslint-disable-next-line react-hooks/immutability
        longPressingPlant.current = null
      }
    }
  }, [dragState.isDragging, handleDragMove, startPlantDrag])

  // Handle mouse up to end drag
  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    dragStartPos.current = null

    if (dragState.isDragging) {
      endPlantDrag()
    }
  }, [dragState.isDragging, endPlantDrag])

  // Handle goal log
  const handleGoalLog = useCallback(
    async (value: number, notes?: string) => {
      if (!quickLogPlant) return

      const plant = quickLogPlant
      const estimatedXp = 15
      const isFirstLogToday = (plant.today_log_count || 0) === 0
      const estimatedStreak = isFirstLogToday ? plant.current_streak + 1 : plant.current_streak

      setCelebration({
        active: true,
        position: {
          x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
          y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
        },
        xpEarned: estimatedXp,
        plantName: plant.name,
        plantIcon: plant.plant_type.icon,
        streakCount: estimatedStreak,
      })

      const result = await logGoal(plant.id, value, notes)

      if (!result.success) {
        showWaterErrorToast(result.error || 'Failed to log')
      }
    },
    [quickLogPlant, logGoal]
  )

  // Close floating card
  const handleCloseFloatingCard = useCallback(() => {
    setFloatingCard(null)
  }, [])

  // Open details from floating card
  const handleOpenDetails = useCallback(() => {
    if (floatingCard) {
      setSelectedPlant(floatingCard.plant)
      setSheetOpen(true)
      setFloatingCard(null)
    }
  }, [floatingCard])

  // Log from floating card
  const handleLogFromCard = useCallback(() => {
    if (floatingCard) {
      if (floatingCard.plant.goal_mode) {
        setQuickLogPlant(floatingCard.plant)
        setQuickLogOpen(true)
      } else {
        handleQuickWater(floatingCard.plant)
      }
      setFloatingCard(null)
    }
  }, [floatingCard, handleQuickWater])

  const handleTileHover = (row: number, col: number) => {
    if (dragState.isDragging) return

    const plant = occupiedCells.get(`${row}-${col}`)
    if (plant && (plant.grid_size || 1) > 1) {
      setHoveredTile(`${plant.grid_row || 0}-${plant.grid_col || 0}`)
    } else {
      setHoveredTile(`${row}-${col}`)
    }
  }

  const handleTileLeave = () => {
    if (dragState.isDragging) return
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
    <div className="relative w-full h-full flex flex-col">
      {/* Gesture hints - shown once for new users */}
      <GestureHint />

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
              Double-tap any empty tile to plant your first habit and watch it grow as you build consistency.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
              <span className="animate-bounce">👆👆</span>
              <span>Double-tap a tile to start</span>
            </div>
          </div>
        </div>
      )}

      {/* Garden container with zoom and pan gesture support - pan always enabled */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-hidden"
        style={{
          touchAction: dragState.isDragging ? 'none' : 'manipulation',
          cursor: isPanning ? 'grabbing' : 'default',
        }}
        onWheel={bindGestures.onWheel}
        {...(!dragState.isDragging ? {
          onTouchStart: bindGestures.onTouchStart,
          onTouchMove: bindGestures.onTouchMove,
          onTouchEnd: bindGestures.onTouchEnd,
          onMouseDown: bindGestures.onMouseDown,
          onMouseMove: bindGestures.onMouseMove,
          onMouseUp: bindGestures.onMouseUp,
          onMouseLeave: bindGestures.onMouseLeave,
        } : {})}
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
            <GardenDecorations
              gridSize={gridSize}
              tileSize={tileSize}
              timeOfDay={currentTimeOfDay}
            />

            {/* Single unified ground plane */}
            <GroundPlane
              gridSize={gridSize}
              tileSize={tileSize}
              grassColor={defaultTheme.ground.primary}
              grassDarkColor={defaultTheme.ground.secondary}
              multiCellAreas={multiCellAreas}
              hoveredMultiCellArea={hoveredMultiCellArea}
              dragTargetCell={dragState.isDragging ? dragState.targetCell : null}
              isDragTargetValid={dragState.isValidTarget}
            />

            {/* Ambient particles */}
            <AmbientParticles
              weather={weather}
              timeOfDay={currentTimeOfDay}
            />

            {/* Interactive tile zones */}
            {tiles.map(({ row, col, plant, isAnchor, isOccupiedByMultiCell }) => {
              const tileKey = `${row}-${col}`
              const isHovered = hoveredTile === tileKey

              const clickPlant = isOccupiedByMultiCell ? plant : (isAnchor ? plant : undefined)
              const isPartOfMultiCell = plant !== undefined && (plant.grid_size || 1) > 1

              return (
                <IsometricTile
                  key={tileKey}
                  row={row}
                  col={col}
                  gridSize={gridSize}
                  isEmpty={!plant && !isOccupiedByMultiCell}
                  isHovered={isHovered && !dragState.isDragging}
                  isOccupiedByMultiCell={isOccupiedByMultiCell}
                  isPartOfMultiCell={isPartOfMultiCell}
                  plantGridSize={plant?.grid_size || 1}
                  onClick={(e) => handleTileClick(row, col, clickPlant, e)}
                  onContextMenu={(e) => handleContextMenu(e, clickPlant)}
                  onTouchStart={(e) => handleTouchStart(e, clickPlant)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={(e) => handleMouseDown(e, clickPlant)}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseEnter={() => handleTileHover(row, col)}
                  onMouseLeave={handleTileLeave}
                  tileSize={tileSize}
                  plant={isAnchor && !dragState.isDragging ? plant : null}
                  hideBadge={dragState.isDragging}
                >
                  {plant && isAnchor && !(dragState.isDragging && dragState.draggedPlant?.id === plant.id) && (
                    <IsometricPlant
                      plant={plant}
                      weather={weather}
                    />
                  )}
                </IsometricTile>
              )
            })}
          </div>
        </div>
      </div>

      {/* Drag mode indicator */}
      {dragState.isDragging && dragState.draggedPlant && (
        <div className="absolute left-1/2 -translate-x-1/2 top-20 z-30 pointer-events-none">
          <div className="px-4 py-2 bg-emerald-600/90 backdrop-blur-md rounded-full text-xs text-white border border-emerald-400/50 shadow-lg animate-pulse">
            <span className="flex items-center gap-2">
              <span>🌱</span>
              <span>Moving {dragState.draggedPlant.name}</span>
              <span className="text-emerald-200">•</span>
              <span>Release to place</span>
            </span>
          </div>
        </div>
      )}

      {/* Dragged plant ghost */}
      {dragState.isDragging && dragState.draggedPlant && dragState.dragPosition && (
        <div
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: dragState.dragPosition.x,
            top: dragState.dragPosition.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="opacity-80 scale-110 drop-shadow-2xl">
            <IsometricPlant
              plant={dragState.draggedPlant}
              weather={weather}
            />
          </div>
        </div>
      )}

      {/* Fixed info bar at bottom - hide when dragging */}
      {!dragState.isDragging && <PlantInfoBar plant={hoveredPlant} />}

      {/* Floating plant card */}
      {floatingCard && !dragState.isDragging && (
        <FloatingPlantCard
          plant={floatingCard.plant}
          position={floatingCard.position}
          todayLogs={(floatingCard.plant.today_logs || []).map(log => ({
            time: new Date(log.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            value: log.value,
            notes: log.notes || undefined,
          }))}
          todayValue={floatingCard.plant.today_value}
          onClose={handleCloseFloatingCard}
          onLog={handleLogFromCard}
          onDetails={handleOpenDetails}
        />
      )}

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
      <WateringCelebration
        isActive={celebration?.active ?? false}
        position={celebration?.position}
        xpEarned={celebration?.xpEarned}
        plantName={celebration?.plantName}
        plantIcon={celebration?.plantIcon}
        streakCount={celebration?.streakCount}
        onComplete={() => setCelebration(null)}
      />
    </div>
  )
}
