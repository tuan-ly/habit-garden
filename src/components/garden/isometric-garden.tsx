'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { type FocusState } from './isometric-plant'
import { PlantInfoBar } from './plant-tooltip'
import { GroundPlaneCanvas, type MultiCellArea } from './ground-plane-canvas'
import { GardenDecorations } from './garden-decorations'
import { AmbientParticlesCanvas } from './ambient-particles-canvas'
import { ZoomControls } from './zoom-controls'
import { ModeToolbar, type GardenMode } from './mode-toolbar'
import { EditModeOverlay } from './edit-mode/edit-mode-overlay'
import { useEditMode } from './edit-mode/use-edit-mode'
import { getTimeOfDay, type TimeOfDay, defaultTheme } from './themes'
import { GardenTileGrid } from './garden-tile-grid'
import { GardenModals } from './garden-modals'
import { GardenCelebrationLayer } from './garden-celebration-layer'
import { useGardenInteractions } from './use-garden-interactions'
import { usePlants } from '@/lib/context/plants-context'
import { useGardenSettingsOptional } from '@/lib/context/garden-settings-context'
import { useInventoryOptional } from '@/lib/context/inventory-context'
import { useGardenZoom, useVisibleTiles } from '@/lib/hooks'
import type { PlantWithType, PlantType, WeatherType } from '@/types/database'
import {
  calculateRequiredGridSize,
  buildOccupiedCellsMap,
  isAnchorCell,
  decorationsAsGridItems,
} from '@/lib/utils/grid-positioning'
import {
  getGardenSize,
  getUnlockedDecorations,
} from '@/lib/progression-system'

interface IsometricGardenProps {
  plantTypes: PlantType[]
  weather?: WeatherType | null
  journalStreak?: number
  userLevel?: number
  focusMode?: boolean
  focusStates?: Map<string, FocusState>
  welcomeBackPending?: boolean
  onWelcomeBackUsed?: () => void
}

const DEFAULT_TILE_SIZE = 140

function getClientTileSize(): number {
  if (typeof window === 'undefined') return DEFAULT_TILE_SIZE
  const width = window.innerWidth
  if (width < 640) return 100
  if (width < 1024) return 120
  return 140
}

export function IsometricGarden({
  plantTypes,
  weather,
  journalStreak = 0,
  userLevel = 1,
  focusMode = false,
  focusStates,
  welcomeBackPending = false,
  onWelcomeBackUsed,
}: IsometricGardenProps) {
  const { plants, movePlant, updatePlant } = usePlants()
  const gardenSettings = useGardenSettingsOptional()
  const inventory = useInventoryOptional()
  const editMode = useEditMode()
  const placedDecorations = inventory?.placedDecorations ?? []

  // Zoom and pan
  const {
    zoom, minZoom, maxZoom, zoomIn, zoomOut, resetZoom,
    isPanning, didPan, panOffset, bindGestures, resetPan, resetDidPan,
  } = useGardenZoom()

  // Garden mode
  const [mode, setModeInternal] = useState<GardenMode>('interact')

  // Viewport/device state
  const [hoveredTile, setHoveredTile] = useState<string | null>(null)
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE)
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 })
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>('day')

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const gardenContainerRef = useRef<HTMLDivElement>(null)

  // Device info + resize
  useEffect(() => {
    const updateDeviceInfo = () => {
      setTileSize(getClientTileSize())
      setViewportSize({ width: window.innerWidth, height: window.innerHeight })
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
    }
    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    return () => window.removeEventListener('resize', updateDeviceInfo)
  }, [])

  // Prevent browser zoom within garden container
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault()
    }
    const preventTouchZoom = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.preventDefault()
    }

    container.addEventListener('wheel', preventBrowserZoom, { passive: false })
    container.addEventListener('touchmove', preventTouchZoom, { passive: false })
    container.addEventListener('touchstart', preventTouchZoom, { passive: false })

    return () => {
      container.removeEventListener('wheel', preventBrowserZoom)
      container.removeEventListener('touchmove', preventTouchZoom)
      container.removeEventListener('touchstart', preventTouchZoom)
    }
  }, [])

  // Time of day
  useEffect(() => {
    setCurrentTimeOfDay(getTimeOfDay())
    const interval = setInterval(() => setCurrentTimeOfDay(getTimeOfDay()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Grid computation
  const livingPlants = useMemo(() => plants.filter((p) => p.status !== 'dead'), [plants])
  const minimumGridSize = useMemo(() => getGardenSize(userLevel), [userLevel])
  const unlockedDecorations = useMemo(() => getUnlockedDecorations(userLevel), [userLevel])
  // Include decorations in grid size calculation so placed decos don't get cut off
  const allGridItems = useMemo(
    () => [...livingPlants, ...decorationsAsGridItems(placedDecorations)],
    [livingPlants, placedDecorations]
  )
  const gridSize = useMemo(() => calculateRequiredGridSize(allGridItems, minimumGridSize), [allGridItems, minimumGridSize])
  const occupiedCells = useMemo(() => buildOccupiedCellsMap(livingPlants), [livingPlants])
  const occupiedCellsSet = useMemo(() => new Set(occupiedCells.keys()), [occupiedCells])

  const multiCellAreas: MultiCellArea[] = useMemo(() => {
    return livingPlants
      .filter((p) => (p.grid_size || 1) > 1)
      .map((p) => ({ row: p.grid_row || 0, col: p.grid_col || 0, size: p.grid_size || 1 }))
  }, [livingPlants])

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

  const containerWidth = gridSize * tileSize
  const containerHeight = gridSize * (tileSize / 2) + tileSize * 0.3

  const visibleTileKeys = useVisibleTiles({
    gridSize, tileSize, zoom, panOffset,
    viewportWidth: viewportSize.width,
    viewportHeight: viewportSize.height,
    buffer: 2,
  })

  // Interactions hook
  const interactions = useGardenInteractions({
    movePlant, updatePlant, welcomeBackPending, onWelcomeBackUsed,
    mode, didPan, resetDidPan, occupiedCells, livingPlants,
    editSelectedItem: editMode.selectedItem,
    editGhostRotation: editMode.ghostRotation,
    onPlaceDecoration: inventory?.placeDecoration,
    onEditPushUndo: editMode.pushUndo,
    onEditDeselectItem: editMode.deselectItem,
  })

  // Fix setMode to use interactions ref
  const setModeWithReset = useCallback((newMode: GardenMode) => {
    setModeInternal(newMode)
    interactions.resetMoveState()
  }, [interactions])

  // Tile hover (manages hoveredTile state here in orchestrator)
  const handleTileHover = useCallback((row: number, col: number) => {
    const plant = occupiedCells.get(`${row}-${col}`)
    if (plant && (plant.grid_size || 1) > 1) {
      setHoveredTile(`${plant.grid_row || 0}-${plant.grid_col || 0}`)
    } else {
      setHoveredTile(`${row}-${col}`)
    }
    // Also drive the move-preview (ghost plant + green/red diamond) when
    // a plant is selected in arrange mode. The hook guards on selectedPlant.
    interactions.updateMovePreview(row, col)
  }, [occupiedCells, interactions])

  const handleTileLeave = useCallback(() => {
    setHoveredTile(null)
    interactions.clearMovePreview()
  }, [interactions])

  // Hovered data
  const hoveredPlant = hoveredTile ? occupiedCells.get(hoveredTile) ?? null : null
  const hoveredMultiCellArea = useMemo(() => {
    if (!hoveredTile) return null
    const plant = occupiedCells.get(hoveredTile)
    if (!plant || (plant.grid_size || 1) <= 1) return null
    return { row: plant.grid_row || 0, col: plant.grid_col || 0, size: plant.grid_size || 1 }
  }, [hoveredTile, occupiedCells])

  const isEmpty = livingPlants.length === 0

  // Stable callbacks for modals
  const handleAddDialogPositionClear = useCallback(() => {
    interactions.setAddDialogPosition(null)
  }, [interactions])

  const handleCelebrationComplete = useCallback(() => {
    interactions.setCelebration(null)
  }, [interactions])

  const handleLevelUpClose = useCallback(() => {
    interactions.setLevelUpData(null)
  }, [interactions])

  const handleAchievementsComplete = useCallback(() => {
    interactions.setPendingAchievements([])
  }, [interactions])

  return (
    <div className="relative w-full h-full flex flex-col select-none">
      {/* Mode toolbar */}
      {!focusMode && (
        <ModeToolbar
          mode={mode}
          onModeChange={setModeWithReset}
          className="fixed left-3 top-1/2 -translate-y-1/2 z-30"
        />
      )}

      {/* Zoom Controls */}
      <ZoomControls
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={() => { resetZoom(); resetPan() }}
        className="fixed right-3 top-1/2 -translate-y-1/2 z-30"
      />

      {/* Empty state */}
      {isEmpty && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-sm mx-4 text-center shadow-2xl border border-white/20 dark:border-slate-700/50 pointer-events-auto animate-fade-in">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <span className="text-3xl sm:text-4xl">🌱</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Your Garden Awaits!</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mb-4">
              Switch to <span className="font-semibold text-emerald-600">Arrange mode</span> using the toolbar on the left, then tap any tile to plant your first habit!
            </p>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
              <span className="animate-bounce">👈</span>
              <span>Use the Arrange button to start</span>
            </div>
          </div>
        </div>
      )}

      {/* Garden container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-hidden"
        role="application"
        aria-label="Isometric garden view. Use mouse or touch to pan, scroll to zoom."
        style={{
          touchAction: 'manipulation',
          cursor: isPanning ? 'grabbing' : mode === 'arrange' ? (interactions.moveState.selectedPlant ? 'crosshair' : 'grab') : 'default',
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
        <div className="flex justify-center items-end w-full h-full" style={{ paddingBottom: '16px' }}>
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
            {/* Decorations */}
            {gardenSettings.showDecorations && (
              <GardenDecorations
                gridSize={gridSize}
                tileSize={tileSize}
                timeOfDay={currentTimeOfDay}
                unlockedTypes={unlockedDecorations}
                occupiedCells={occupiedCellsSet}
              />
            )}

            {/* Ground plane (canvas renderer) */}
            <GroundPlaneCanvas
              gridSize={gridSize}
              tileSize={tileSize}
              grassColor={defaultTheme.ground.primary}
              grassDarkColor={defaultTheme.ground.secondary}
              multiCellAreas={multiCellAreas}
              hoveredMultiCellArea={hoveredMultiCellArea}
              dragTargetCell={interactions.moveState.selectedPlant ? interactions.moveState.previewCell : null}
              dragPlantSize={interactions.moveState.selectedPlant?.grid_size || 1}
              isDragTargetValid={interactions.moveState.isValidPreview}
              weather={gardenSettings.showWeatherEffects ? weather : null}
              timeOfDay={currentTimeOfDay}
            />

            {/* Ambient particles (canvas renderer) */}
            {gardenSettings.showParticles && (
              <AmbientParticlesCanvas
                weather={gardenSettings.showWeatherEffects ? weather : null}
                timeOfDay={currentTimeOfDay}
                width={containerWidth}
                height={containerHeight}
              />
            )}

            {/* Tile grid */}
            <GardenTileGrid
              tiles={tiles}
              gridSize={gridSize}
              tileSize={tileSize}
              visibleTileKeys={visibleTileKeys}
              hoveredTile={hoveredTile}
              mode={mode}
              moveState={interactions.moveState}
              focusStates={focusStates}
              weather={weather}
              placedDecorations={placedDecorations}
              onTileClick={interactions.handleTileClick}
              onTileHover={handleTileHover}
              onTileLeave={handleTileLeave}
              onContextMenu={interactions.handleContextMenu}
            />

          </div>
        </div>
      </div>

      {/* Move mode indicator */}
      {interactions.moveState.selectedPlant && (
        <div className="absolute left-1/2 -translate-x-1/2 top-20 z-30 pointer-events-none">
          <div className="px-4 py-2 bg-emerald-600/90 backdrop-blur-md rounded-full text-xs text-white border border-emerald-400/50 shadow-lg">
            <span className="flex items-center gap-2">
              <span>🌱</span>
              <span>Moving {interactions.moveState.selectedPlant.name}</span>
              <span className="text-emerald-200">•</span>
              <span>Select a spot to place</span>
            </span>
          </div>
        </div>
      )}

      {/* Decoration placement indicator */}
      {mode === 'arrange' && editMode.selectedItem && !interactions.moveState.selectedPlant && (
        <div className="absolute left-1/2 -translate-x-1/2 top-20 z-30 pointer-events-none">
          <div className="px-4 py-2 bg-blue-600/90 backdrop-blur-md rounded-full text-xs text-white border border-blue-400/50 shadow-lg">
            <span className="flex items-center gap-2">
              <span>{editMode.selectedItem.decoration_type?.icon || '🎀'}</span>
              <span>Placing {editMode.selectedItem.decoration_type?.name || 'decoration'}</span>
              <span className="text-blue-200">•</span>
              <span>Tap an empty tile</span>
            </span>
          </div>
        </div>
      )}

      {/* Info bar */}
      {!isTouchDevice && <PlantInfoBar plant={hoveredPlant} />}

      {/* Screen-reader plant list (a11y for non-visual users) */}
      <ul className="sr-only" aria-label="Plants in your garden">
        {livingPlants.map((p) => (
          <li key={p.id}>
            {p.name} — {p.status}, growth {Math.round(p.growth_percentage)}%
          </li>
        ))}
      </ul>

      {/* Modals */}
      <GardenModals
        wateringPlant={interactions.wateringPlant}
        wateringModalOpen={interactions.wateringModalOpen}
        onWateringOpenChange={interactions.setWateringModalOpen}
        onWater={interactions.handleWaterConfirm}
        onLogAndWater={interactions.handleLogAndWaterConfirm}
        onDetails={interactions.handleOpenDetails}
        plantTypes={plantTypes}
        addDialogOpen={interactions.addDialogOpen}
        onAddDialogOpenChange={interactions.setAddDialogOpen}
        gridPosition={interactions.addDialogPosition}
        onGridPositionClear={handleAddDialogPositionClear}
        selectedPlant={interactions.selectedPlant}
        sheetOpen={interactions.sheetOpen}
        onSheetOpenChange={interactions.setSheetOpen}
        journalStreak={journalStreak}
        isWateredToday={interactions.isWateredToday}
      />

      {/* Decoration edit overlay (visible in arrange mode) */}
      {inventory && (
        <EditModeOverlay
          isActive={mode === 'arrange'}
          gridSize={gridSize}
          occupiedCells={occupiedCellsSet}
          onDone={() => setModeWithReset('interact')}
          editMode={editMode}
        />
      )}

      {/* Celebrations */}
      <GardenCelebrationLayer
        celebration={interactions.celebration}
        onCelebrationComplete={handleCelebrationComplete}
        levelUpData={interactions.levelUpData}
        onLevelUpClose={handleLevelUpClose}
        pendingAchievements={interactions.pendingAchievements}
        onAchievementsComplete={handleAchievementsComplete}
        showCelebrations={gardenSettings.showCelebrations}
      />
    </div>
  )
}
