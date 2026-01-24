'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { IsometricTile } from './isometric-tile'
import { IsometricPlant } from './isometric-plant'
import { PlantInfoBar } from './plant-tooltip'
import { FloatingPlantCard } from './floating-plant-card'
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
import { QuickLogModal } from '@/components/plants/quick-log-modal'
import { WateringModal } from '@/components/plants/watering-modal'
import {
  showAlreadyWateredToast,
  showWaterErrorToast,
} from '@/components/plants/water-toast'
import { usePlants, useGardenSettingsOptional } from '@/lib/context'
import { useGardenZoom, useVisibleTiles } from '@/lib/hooks'
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
}: IsometricGardenProps) {
  // Get plants from context with optimistic updates
  const { plants, waterPlant, logGoal, movePlant } = usePlants()

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

  // Garden mode state
  const [mode, setModeInternal] = useState<GardenMode>('view')

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

  // New state for enhanced interactions
  const [floatingCard, setFloatingCard] = useState<{
    plant: PlantWithType
    position: { x: number; y: number }
  } | null>(null)
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
    setFloatingCard(null)
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
      // Check if already watered
      if (isWateredToday(plant)) {
        showAlreadyWateredToast(plant.name)
        return
      }

      setWateringPlant(plant)
      setWateringModalOpen(true)
    },
    [isWateredToday]
  )

  // Actual watering action (called from modal)
  const handleWaterConfirm = useCallback(
    async (notes?: string) => {
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

      try {
        // Call server FIRST, then show celebration with actual values
        const result = await waterPlant(plant.id, { notes })

        if (result.success) {
          // Only show celebration on success with actual XP from server
          if (gardenSettings.showCelebrations) {
            setCelebration({
              active: true,
              position: celebrationPosition,
              xpEarned: result.xpEarned || 10,
              plantName: plant.name,
              plantIcon: plant.plant_type.icon,
              streakCount: plant.current_streak + 1,
            })
          }
        } else {
          // Show appropriate error
          if (result.error === 'Already watered today') {
            showAlreadyWateredToast(plant.name)
          } else {
            showWaterErrorToast(result.error || 'Unknown error')
          }
        }
      } catch (error) {
        showWaterErrorToast('Failed to water plant')
      } finally {
        // Remove from cooldown after 3 seconds (celebration duration)
        setTimeout(() => {
          actionCooldown.current.delete(plant.id)
        }, 3000)
      }
    },
    [wateringPlant, waterPlant, gardenSettings.showCelebrations]
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
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024 // Considering tablet as mobile touch target for behavior

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

      // Mobile behavior: Tap opens card first (unless it's a goal log which might be direct? No, stay consistent)
      if (isMobile) {
        setFloatingCard({
          plant,
          position: tapPosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
        })
        return
      }

      // Desktop behavior: Click directly opens action
      if (plant.goal_mode) {
        setQuickLogPlant(plant)
        setQuickLogOpen(true)
      } else {
        handleQuickWaterRequest(plant)
      }
    },
    [handleQuickWaterRequest]
  )

  // Handle right-click / long-press to show info card (all modes)
  const handleShowInfo = useCallback(
    (plant: PlantWithType, position: { x: number; y: number }) => {
      setFloatingCard({ plant, position })
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
        case 'view':
          // View mode: tap plant to water/log, tap empty does nothing
          if (plant) {
            handlePlantTap(plant, tapPosition)
          }
          break

        case 'drag':
          // Move mode: click-to-select, click-to-place
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
          }
          break

        case 'add':
          // Add mode: tap empty to add plant, tap plant to edit goal/details
          if (plant) {
            setSelectedPlant(plant)
            setSheetOpen(true)
          } else {
            setAddDialogPosition({ row, col })
            setAddDialogOpen(true)
          }
          break
      }
    },
    [mode, handlePlantTap, didPan, resetDidPan, moveState.selectedPlant, selectPlantForMove, cancelMoveSelection, confirmMove]
  )

  // Handle right-click (desktop) - show info card
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, plant?: PlantWithType) => {
      e.preventDefault()
      if (plant) {
        handleShowInfo(plant, { x: e.clientX, y: e.clientY })
      }
    },
    [handleShowInfo]
  )

  // Handle goal log
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

      const isFirstLogToday = (plant.today_log_count || 0) === 0

      try {
        // Call server FIRST, then show celebration with actual values
        const result = await logGoal(plant.id, value, notes)

        if (result.success) {
          // Only show celebration on success with actual XP from server
          if (gardenSettings.showCelebrations) {
            setCelebration({
              active: true,
              position: {
                x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
                y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
              },
              xpEarned: result.xpEarned || 15,
              plantName: plant.name,
              plantIcon: plant.plant_type.icon,
              streakCount: isFirstLogToday ? plant.current_streak + 1 : plant.current_streak,
            })
          }
        } else {
          showWaterErrorToast(result.error || 'Failed to log')
        }
      } catch (error) {
        showWaterErrorToast('Failed to log progress')
      } finally {
        // Remove from cooldown after 3 seconds (celebration duration)
        setTimeout(() => {
          actionCooldown.current.delete(plant.id)
        }, 3000)
      }
    },
    [quickLogPlant, logGoal, gardenSettings.showCelebrations]
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
        handleQuickWaterRequest(floatingCard.plant)
      }
      setFloatingCard(null)
    }
  }, [floatingCard, handleQuickWaterRequest])

  const handleTileHover = (row: number, col: number) => {
    const plant = occupiedCells.get(`${row}-${col}`)
    if (plant && (plant.grid_size || 1) > 1) {
      setHoveredTile(`${plant.grid_row || 0}-${plant.grid_col || 0}`)
    } else {
      setHoveredTile(`${row}-${col}`)
    }

    // Update move preview when in move mode with selected plant
    if (mode === 'drag' && moveState.selectedPlant) {
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
      {/* Mode toolbar - fixed position on left side */}
      <ModeToolbar
        mode={mode}
        onModeChange={setMode}
        className="fixed left-3 top-1/2 -translate-y-1/2 z-30"
      />

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
            : mode === 'drag'
              ? (moveState.selectedPlant ? 'crosshair' : 'grab')
              : mode === 'add'
                ? 'cell'
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
                  showAddHint={mode === 'add'}
                  isSelectedForMove={isSelectedForMove}
                  previewPlant={isPreviewTile && moveState.selectedPlant && moveState.isValidPreview ? moveState.selectedPlant : undefined}
                >
                  {plant && isAnchor && (
                    <div className={isSelectedForMove ? 'opacity-40 scale-95 transition-all' : ''}>
                      <IsometricPlant
                        plant={plant}
                        weather={weather}
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

      {/* Floating plant card */}
      {floatingCard && (
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

      {/* Watering modal for standard plants */}
      <WateringModal
        plant={wateringPlant}
        open={wateringModalOpen}
        onOpenChange={setWateringModalOpen}
        onWater={handleWaterConfirm}
        estimatedXp={(() => {
          // Calculate better estimate based on streak
          const streak = (wateringPlant?.current_streak || 0) + 1
          let xp = 10 // Base
          if (streak >= 30) xp += 50
          else if (streak >= 14) xp += 30
          else if (streak >= 7) xp += 15
          else if (streak >= 3) xp += 5
          return xp
        })()}
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
