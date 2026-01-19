'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { IsometricTile } from './isometric-tile'
import { IsometricPlant } from './isometric-plant'
import { PlantInfoBar } from './plant-tooltip'
import { FloatingPlantCard } from './floating-plant-card'
import { GroundPlane, type MultiCellArea } from './ground-plane'
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import { QuickLogModal } from '@/components/plants/quick-log-modal'
import {
  showWaterToast,
  showAlreadyWateredToast,
  showWaterErrorToast,
  showGoalLogToast,
} from '@/components/plants/water-toast'
import { usePlants } from '@/lib/context'
import type { PlantWithType, PlantType, WeatherType } from '@/types/database'
import { defaultTheme } from './themes'
import {
  calculateRequiredGridSize,
  buildOccupiedCellsMap,
  isAnchorCell,
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

export function IsometricGarden({
  plantTypes,
  weather,
}: IsometricGardenProps) {
  // Get plants from context with optimistic updates
  const { plants, waterPlant, logGoal } = usePlants()

  const [hoveredTile, setHoveredTile] = useState<string | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // New state for enhanced interactions
  const [floatingCard, setFloatingCard] = useState<{
    plant: PlantWithType
    position: { x: number; y: number }
  } | null>(null)
  const [quickLogPlant, setQuickLogPlant] = useState<PlantWithType | null>(null)
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  // Long press tracking
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggered = useRef(false)
  const touchStartPos = useRef<{ x: number; y: number } | null>(null)

  // Use default tile size on server, actual size on client
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE)

  useEffect(() => {
    const handleResize = () => setTileSize(getClientTileSize())
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
        // Check if this cell is occupied by a multi-cell plant but is not the anchor
        const isOccupiedByMultiCell = plant !== undefined && !isAnchor && (plant.grid_size || 1) > 1
        result.push({ row, col, plant, isAnchor, isOccupiedByMultiCell })
      }
    }
    return result
  }, [gridSize, occupiedCells])

  // Calculate container dimensions
  const containerWidth = gridSize * tileSize
  const containerHeight = gridSize * (tileSize / 2) + tileSize * 0.3

  // Check if plant is watered today
  const isWateredToday = useCallback((plant: PlantWithType) => {
    return plant.last_watered_at
      ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
      : false
  }, [])

  // Handle quick water for simple (non-goal) plants
  const handleQuickWater = useCallback(
    async (plant: PlantWithType) => {
      if (isWateredToday(plant)) {
        showAlreadyWateredToast(plant.name)
        return
      }

      const result = await waterPlant(plant.id)

      if (result.success) {
        showWaterToast({
          plantName: plant.name,
          plantIcon: plant.plant_type.icon,
          xpEarned: result.xpEarned || 10,
          xpBreakdown: result.xpBreakdown,
          streakCount: plant.current_streak + 1,
          newAchievements: result.newAchievements,
        })
      } else {
        showWaterErrorToast(result.error || 'Unknown error')
      }
    },
    [waterPlant, isWateredToday]
  )

  // Handle tap/click on plant
  const handlePlantTap = useCallback(
    (plant: PlantWithType) => {
      // Check if plant has a goal
      if (plant.goal_mode) {
        // Open quick log modal for goal plants
        setQuickLogPlant(plant)
        setQuickLogOpen(true)
      } else {
        // Quick water for simple plants
        handleQuickWater(plant)
      }
    },
    [handleQuickWater]
  )

  // Handle right-click / long-press to show info card
  const handleShowInfo = useCallback(
    (plant: PlantWithType, position: { x: number; y: number }) => {
      setFloatingCard({ plant, position })
    },
    []
  )

  // Handle tile click
  const handleTileClick = useCallback(
    (plant?: PlantWithType) => {
      // If long press was triggered, don't handle click
      if (longPressTriggered.current) {
        longPressTriggered.current = false
        return
      }

      if (plant) {
        handlePlantTap(plant)
      } else {
        setAddDialogOpen(true)
      }
    },
    [handlePlantTap]
  )

  // Handle right-click (desktop)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, plant?: PlantWithType) => {
      e.preventDefault()
      if (plant) {
        handleShowInfo(plant, { x: e.clientX, y: e.clientY })
      }
    },
    [handleShowInfo]
  )

  // Handle touch start (mobile long-press)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, plant?: PlantWithType) => {
      if (!plant) return

      const touch = e.touches[0]
      touchStartPos.current = { x: touch.clientX, y: touch.clientY }
      longPressTriggered.current = false

      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
        handleShowInfo(plant, {
          x: touchStartPos.current?.x ?? touch.clientX,
          y: touchStartPos.current?.y ?? touch.clientY,
        })
      }, LONG_PRESS_THRESHOLD)
    },
    [handleShowInfo]
  )

  // Handle touch move (cancel long-press if moved)
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartPos.current) return

    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - touchStartPos.current.x)
    const dy = Math.abs(touch.clientY - touchStartPos.current.y)

    // Cancel if moved more than 10px
    if (dx > 10 || dy > 10) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }, [])

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    touchStartPos.current = null
  }, [])

  // Handle goal log
  const handleGoalLog = useCallback(
    async (value: number, notes?: string) => {
      if (!quickLogPlant) return

      const result = await logGoal(quickLogPlant.id, value, notes)

      if (result.success) {
        showGoalLogToast({
          plantName: quickLogPlant.name,
          plantIcon: quickLogPlant.plant_type.icon,
          value,
          unit: quickLogPlant.goal?.unit || '',
          xpEarned: result.xpEarned || 15,
          isPersonalRecord: result.isPersonalRecord,
          exceededTarget: result.exceededTarget,
        })
      } else {
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
    // Check if this tile belongs to a multi-cell plant
    const plant = occupiedCells.get(`${row}-${col}`)
    if (plant && (plant.grid_size || 1) > 1) {
      // Set hover to anchor cell to highlight all tiles of the multi-cell plant
      setHoveredTile(`${plant.grid_row || 0}-${plant.grid_col || 0}`)
    } else {
      setHoveredTile(`${row}-${col}`)
    }
  }

  const handleTileLeave = () => {
    setHoveredTile(null)
  }

  // Get hovered plant for info bar
  const hoveredPlant = hoveredTile ? occupiedCells.get(hoveredTile) ?? null : null

  // Get hovered multi-cell area (if hovering a multi-cell plant)
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

  return (
    <div className="relative w-full h-full flex flex-col justify-end items-center pb-16">
      {/* Empty state overlay for new users */}
      {isEmpty && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm mx-4 text-center shadow-2xl border border-white/20 dark:border-slate-700/50 pointer-events-auto animate-fade-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <span className="text-3xl sm:text-4xl">🌱</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Your Garden Awaits!</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-4">
              Tap any empty tile to plant your first habit and watch it grow as you build consistency.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
              <span className="animate-bounce">👆</span>
              <span>Tap a tile to start</span>
            </div>
          </div>
        </div>
      )}

      {/* Garden container */}
      <div className="flex justify-center px-4">
        <div
          className="relative"
          style={{
            width: containerWidth,
            height: containerHeight,
          }}
        >
          {/* Single unified ground plane */}
          <GroundPlane
            gridSize={gridSize}
            tileSize={tileSize}
            grassColor={defaultTheme.ground.primary}
            grassDarkColor={defaultTheme.ground.secondary}
            multiCellAreas={multiCellAreas}
            hoveredMultiCellArea={hoveredMultiCellArea}
          />

          {/* Interactive tile zones */}
          {tiles.map(({ row, col, plant, isAnchor, isOccupiedByMultiCell }) => {
            const tileKey = `${row}-${col}`
            const isHovered = hoveredTile === tileKey

            // For multi-cell occupied cells (not anchor), clicking should interact with the parent plant
            const clickPlant = isOccupiedByMultiCell ? plant : (isAnchor ? plant : undefined)

            // Check if this tile is part of a multi-cell plant (anchor or occupied)
            const isPartOfMultiCell = plant !== undefined && (plant.grid_size || 1) > 1

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
                onClick={() => handleTileClick(clickPlant)}
                onContextMenu={(e) => handleContextMenu(e, clickPlant)}
                onTouchStart={(e) => handleTouchStart(e, clickPlant)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseEnter={() => handleTileHover(row, col)}
                onMouseLeave={handleTileLeave}
                tileSize={tileSize}
              >
                {/* Only render plant at its anchor position */}
                {plant && isAnchor && (
                  <IsometricPlant
                    plant={plant}
                    weather={weather}
                    showBadge={true}
                    todayLogCount={plant.today_log_count}
                    todayValue={plant.today_value}
                  />
                )}
              </IsometricTile>
            )
          })}
        </div>
      </div>

      {/* Interaction hint - shown when not empty */}
      {!isEmpty && !hoveredPlant && (
        <div className="absolute left-1/2 -translate-x-1/2 top-16 z-20 pointer-events-none">
          <div className="px-4 py-2 bg-slate-900/70 backdrop-blur-md rounded-full text-xs text-slate-400 border border-slate-700/50 shadow-lg">
            <span className="flex items-center gap-2">
              <span>👆</span>
              <span>Tap to water</span>
              <span className="text-slate-600">•</span>
              <span>Hold for info</span>
            </span>
          </div>
        </div>
      )}

      {/* Fixed info bar at bottom - above nav bar */}
      <PlantInfoBar plant={hoveredPlant} />

      {/* Floating plant card (long-press / right-click) */}
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

      {/* Add plant dialog */}
      <AddPlantDialog
        plantTypes={plantTypes}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {/* Plant detail sheet */}
      <PlantDetailSheet
        plant={selectedPlant}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
