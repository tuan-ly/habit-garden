'use client'

import { useState, useMemo, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { type FocusState } from './isometric-plant'
import { PlantInfoBar } from './plant-tooltip'
import { getPlantFocusCameraScale, getPlantFocusTargetY } from './plant-focus-frame'
import { GroundPlaneCanvas, type MultiCellArea } from './ground-plane-canvas'
import { getGroundPlaneHeight } from './ground-plane-geometry'
import { ZoomControls } from './zoom-controls'
import { ModeToolbar, type GardenMode } from './mode-toolbar'
import { useEditMode } from './edit-mode/use-edit-mode'
import { getTimeOfDay, type TimeOfDay, defaultTheme } from './themes'
import { GardenTileGrid } from './garden-tile-grid'
import { DecorationPlacementGhostLayer } from './edit-mode/decoration-placement-ghost-layer'
import { useGardenInteractions } from './use-garden-interactions'
import { SanctuaryGardenChrome } from './sanctuary-garden-chrome'
import { selectSanctuaryActivePlant } from './sanctuary-plant-selection'
import { DailyGardenAtmosphereLayer } from './daily-garden-atmosphere'
import { GardenEncounterReveal } from './garden-encounter-reveal'
import { useDailyGardenEncounter } from './use-daily-garden-encounter'
import { usePlants } from '@/lib/context/plants-context'
import { useGardenSettingsOptional } from '@/lib/context/garden-settings-context'
import { useInventoryOptional } from '@/lib/context/inventory-context'
import { useGardenZoom, useVisibleTiles } from '@/lib/hooks'
import { formatGoalValue } from '@/lib/goal-progress'
import type { PlantWithType, PlantType, WeatherType } from '@/types/database'
import {
  calculateRequiredGridSize,
  buildOccupiedCellsMap,
  buildOccupiedCellsMapCombined,
  isAnchorCell,
  decorationsAsGridItems, canPlacePlantAt,
} from '@/lib/utils/grid-positioning'
import {
  getGardenSize,
} from '@/lib/progression-system'
import { toast } from 'sonner'
import { isVisibleInGarden } from '@/lib/plant-status'
import {
  calculateGardenVisualBounds,
  fitVisualBoundsToSafeArea,
  getPlantAssetVisualBounds,
  getSanctuarySafeInsets,
} from '@/lib/garden/camera-safe-area'
import { getGardenTileSize, getPlantGrowthScale } from '@/lib/assets/game-asset-render-metrics'

interface IsometricGardenProps {
  plantTypes: PlantType[]
  weather?: WeatherType | null
  journalStreak?: number
  userLevel?: number
  focusMode?: boolean
  focusStates?: Map<string, FocusState>
  welcomeBackPending?: boolean
  onWelcomeBackUsed?: () => void
  sanctuaryMode?: boolean
  welcomeBackDays?: number
}

const DEFAULT_TILE_SIZE = 140
const subscribeToHardware = () => () => undefined
const EditModeOverlay = dynamic(
  () => import('./edit-mode/edit-mode-overlay').then((module) => ({ default: module.EditModeOverlay })),
  { ssr: false }
)
const GardenCelebrationLayer = dynamic(
  () => import('./garden-celebration-layer').then((module) => ({ default: module.GardenCelebrationLayer })),
  { ssr: false }
)
const AmbientParticlesCanvas = dynamic(
  () => import(/* webpackChunkName: "garden-effects" */ './ambient-particles-canvas').then((module) => ({ default: module.AmbientParticlesCanvas })),
  { ssr: false }
)
const GardenModals = dynamic(
  () => import('./garden-modals').then((module) => ({ default: module.GardenModals })),
  { ssr: false }
)

function getPlacementErrorMessage(error: string): string {
  const normalized = error.toLowerCase()
  if (normalized.includes('occupied')) return 'Khu vực này đã có cây hoặc vật trang trí khác.'
  if (normalized.includes('inventory') || normalized.includes('no items')) return 'Vật này không còn trong kho. Hãy mở lại kho trang trí.'
  if (normalized.includes('unauthorized')) return 'Phiên đăng nhập đã hết hạn. Hãy tải lại trang.'
  if (normalized.includes('grid position')) return 'Vị trí này nằm ngoài khu vườn.'
  if (normalized.includes('network')) return 'Mất kết nối khi đặt vật trang trí. Hãy thử lại.'
  return error
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
  sanctuaryMode = false,
  welcomeBackDays = 0,
}: IsometricGardenProps) {
  const { plants, movePlant, recordActivity, isPlantPending } = usePlants()
  const gardenSettings = useGardenSettingsOptional()
  const isLowPowerDevice = useSyncExternalStore(
    subscribeToHardware,
    () => (navigator.hardwareConcurrency ?? 8) <= 4,
    () => false
  )
  const inventory = useInventoryOptional()
  const editMode = useEditMode()
  const placedDecorations = useMemo(
    () => inventory?.placedDecorations ?? [],
    [inventory?.placedDecorations]
  )
  const selectedPlacedDecoration = useMemo(() => {
    if (!editMode.selectedDecoration) return null
    return placedDecorations.find((decoration) => decoration.id === editMode.selectedDecoration?.id)
      ?? editMode.selectedDecoration
  }, [editMode.selectedDecoration, placedDecorations])
  const activeDecorationGhost = useMemo(() => {
    if (!editMode.ghostPosition) return null
    const inventoryType = editMode.selectedItem?.decoration_type
    if (inventoryType) {
      return {
        ...editMode.ghostPosition,
        decorationType: inventoryType,
        rotation: editMode.ghostRotation,
        isValid: editMode.isGhostValid,
      }
    }
    if (selectedPlacedDecoration) {
      return {
        ...editMode.ghostPosition,
        decorationType: selectedPlacedDecoration.decoration_type,
        rotation: selectedPlacedDecoration.rotation,
        isValid: editMode.isGhostValid,
      }
    }
    return null
  }, [
    editMode.ghostPosition,
    editMode.ghostRotation,
    editMode.isGhostValid,
    editMode.selectedItem,
    selectedPlacedDecoration,
  ])

  // Zoom and pan
  const {
    zoom, minZoom, maxZoom, zoomIn, zoomOut, resetZoom,
    isPanning, didPan, panOffset, bindGestures, resetPan, resetDidPan,
  } = useGardenZoom({ persist: !sanctuaryMode })

  // Garden mode
  const [mode, setModeInternal] = useState<GardenMode>('interact')

  // Viewport/device state
  const [hoveredTile, setHoveredTile] = useState<string | null>(null)
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE)
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 })
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>(() => getTimeOfDay())
  const [sanctuaryFocusedPlantId, setSanctuaryFocusedPlantId] = useState<string | null>(null)
  const [sanctuaryFocusClosing, setSanctuaryFocusClosing] = useState(false)
  const [sanctuaryFocusPanelTop, setSanctuaryFocusPanelTop] = useState<number | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const gardenContainerRef = useRef<HTMLDivElement>(null)
  const focusExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusReturnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (focusExitTimerRef.current) clearTimeout(focusExitTimerRef.current)
      if (focusReturnTimerRef.current) clearTimeout(focusReturnTimerRef.current)
    }
  }, [])

  // Device info + resize
  useEffect(() => {
    const updateDeviceInfo = () => {
      setTileSize(getGardenTileSize(window.innerWidth, sanctuaryMode))
      setViewportSize({ width: window.innerWidth, height: window.innerHeight })
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
    }
    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    return () => window.removeEventListener('resize', updateDeviceInfo)
  }, [sanctuaryMode])

  // The garden may render inside the calibration studio or another bounded
  // surface, so camera fitting must follow the real container rather than the
  // browser window.
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const updateViewport = () => {
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({ width: rect.width, height: rect.height })
      }
    }
    updateViewport()
    const observer = new ResizeObserver(updateViewport)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Prevent browser zoom and text selection within garden container
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault()
    }
    const preventTouchZoom = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.preventDefault()
    }
    const preventSelectStart = (e: Event) => {
      e.preventDefault()
    }

    container.addEventListener('wheel', preventBrowserZoom, { passive: false })
    container.addEventListener('touchmove', preventTouchZoom, { passive: false })
    container.addEventListener('touchstart', preventTouchZoom, { passive: false })
    container.addEventListener('selectstart', preventSelectStart)

    return () => {
      container.removeEventListener('wheel', preventBrowserZoom)
      container.removeEventListener('touchmove', preventTouchZoom)
      container.removeEventListener('touchstart', preventTouchZoom)
      container.removeEventListener('selectstart', preventSelectStart)
    }
  }, [])

  // Time of day
  useEffect(() => {
    const interval = setInterval(() => setCurrentTimeOfDay(getTimeOfDay()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Grid computation
  // Pending losses remain on the grid so their plot cannot be reused early.
  const livingPlants = useMemo(() => plants.filter(isVisibleInGarden), [plants])
  const dailyGardenEncounter = useDailyGardenEncounter({
    plants: livingPlants,
    weather,
    enabled: sanctuaryMode,
  })
  const freshGardenEncounter = dailyGardenEncounter.freshEncounter
  const completeFreshGardenEncounter = dailyGardenEncounter.completeFreshEncounter
  useEffect(() => {
    if (freshGardenEncounter && !gardenSettings.showCelebrations) {
      completeFreshGardenEncounter()
    }
  }, [
    freshGardenEncounter,
    completeFreshGardenEncounter,
    gardenSettings.showCelebrations,
  ])
  const minimumGridSize = useMemo(() => getGardenSize(userLevel), [userLevel])
  // Include decorations in grid size calculation so placed decos don't get cut off
  const allGridItems = useMemo(
    () => [...livingPlants, ...decorationsAsGridItems(placedDecorations)],
    [livingPlants, placedDecorations]
  )
  const gridSize = useMemo(() => calculateRequiredGridSize(allGridItems, minimumGridSize), [allGridItems, minimumGridSize])
  const occupiedCells = useMemo(() => buildOccupiedCellsMap(livingPlants), [livingPlants])
  const occupiedCellsSet = useMemo(
    () => buildOccupiedCellsMapCombined(livingPlants, placedDecorations).allOccupied,
    [livingPlants, placedDecorations]
  )

  const multiCellAreas: MultiCellArea[] = useMemo(() => {
    return [...livingPlants, ...placedDecorations]
      .filter((p) => (p.grid_size || 1) > 1)
      .map((p) => ({ row: p.grid_row || 0, col: p.grid_col || 0, size: p.grid_size || 1 }))
  }, [livingPlants, placedDecorations])

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
  const containerHeight = getGroundPlaneHeight(gridSize, tileSize, sanctuaryMode)
  const visualSceneBounds = useMemo(() => calculateGardenVisualBounds({
    gridSize,
    tileSize,
    containerHeight,
    plants: livingPlants,
    decorations: gardenSettings.showDecorations ? placedDecorations : [],
  }), [
    gridSize,
    tileSize,
    containerHeight,
    livingPlants,
    gardenSettings.showDecorations,
    placedDecorations,
  ])
  const sanctuaryCameraFit = useMemo(() => fitVisualBoundsToSafeArea({
    viewportWidth: viewportSize.width,
    viewportHeight: viewportSize.height,
    containerWidth,
    containerHeight,
    sceneBounds: visualSceneBounds,
    insets: getSanctuarySafeInsets(viewportSize.width),
  }), [viewportSize.width, viewportSize.height, containerWidth, containerHeight, visualSceneBounds])

  const visibleTileKeys = useVisibleTiles({
    gridSize, tileSize, zoom, panOffset,
    viewportWidth: viewportSize.width,
    viewportHeight: viewportSize.height,
    buffer: 2,
  })

  // Interactions hook
  const interactions = useGardenInteractions({
    movePlant, recordActivity, welcomeBackPending, onWelcomeBackUsed,
    mode, didPan, resetDidPan, livingPlants,
    editSelectedItem: editMode.selectedItem,
    editGhostRotation: editMode.ghostRotation,
    onPlaceDecoration: inventory?.placeDecoration,
    onEditPushUndo: editMode.pushUndo,
    onEditDeselectItem: editMode.deselectItem,
    onEditSelectItem: editMode.selectItem,
    editPlacementPending: inventory?.isPlacing,
    onEditPlacementError: (error) => toast.error('Chưa thể đặt vật trang trí', {
      description: getPlacementErrorMessage(error),
    }),
    onEditPlacementSuccess: () => toast.success('Đã đặt vật trang trí'),
    calmFeedback: sanctuaryMode,
    onActivitySuccess: dailyGardenEncounter.revealEncounter,
  })

  // Fix setMode to use interactions ref
  const setModeWithReset = useCallback((newMode: GardenMode) => {
    setModeInternal(newMode)
    interactions.resetMoveState()
  }, [interactions])

  // Tile hover (manages hoveredTile state here in orchestrator)
  const handleTileHover = useCallback((row: number, col: number) => {
    if (sanctuaryFocusedPlantId) {
      setHoveredTile(null)
      return
    }
    const plant = occupiedCells.get(`${row}-${col}`)
    if (plant && (plant.grid_size || 1) > 1) {
      setHoveredTile(`${plant.grid_row || 0}-${plant.grid_col || 0}`)
    } else {
      setHoveredTile(`${row}-${col}`)
    }
    // Also drive the move-preview (ghost plant + green/red diamond) when
    // a plant is selected in arrange mode. The hook guards on selectedPlant.
    interactions.updateMovePreview(row, col)
    const movingDecoration = editMode.selectedDecoration
    const placingType = editMode.selectedItem?.decoration_type
    const footprint = movingDecoration?.grid_size ?? placingType?.grid_size
    if (footprint) {
      const otherItems = [
        ...livingPlants,
        ...decorationsAsGridItems(placedDecorations.filter((item) => item.id !== movingDecoration?.id)),
      ]
      editMode.setGhostPosition({ row, col })
      editMode.setIsGhostValid(canPlacePlantAt(
        { id: movingDecoration?.id, grid_row: row, grid_col: col, grid_size: footprint },
        row,
        col,
        otherItems,
        gridSize
      ))
    }
  }, [sanctuaryFocusedPlantId, occupiedCells, interactions, editMode, livingPlants, placedDecorations, gridSize])

  const handleTileLeave = useCallback(() => {
    setHoveredTile(null)
    interactions.clearMovePreview()
  }, [interactions])

  const handleGardenTileClick = useCallback(async (
    row: number,
    col: number,
    plant?: PlantWithType,
    decoration?: typeof placedDecorations[number]
  ) => {
    if (mode !== 'arrange') {
      interactions.handleTileClick(row, col, plant)
      return
    }

    if (editMode.selectedItem) {
      if (inventory?.isPlacing) return
      if (!editMode.isGhostValid || plant || decoration) {
        toast.error('Vị trí chưa phù hợp', {
          description: 'Hãy chọn vùng màu xanh không chồng lên cây hoặc vật trang trí khác.',
        })
        return
      }
      interactions.handleTileClick(row, col, plant)
      return
    }

    if (editMode.selectedDecoration) {
      const selected = editMode.selectedDecoration
      if (decoration?.id === selected.id && row === selected.grid_row && col === selected.grid_col) {
        editMode.deselectDecoration()
        return
      }
      if (!editMode.isGhostValid) return
      // Clear the move ghost immediately. InventoryProvider has already made the
      // position optimistic, so the real decoration can render at full opacity.
      editMode.deselectDecoration()
      const result = await inventory?.moveDecoration(selected.id, row, col)
      if (result?.success) {
        editMode.pushUndo({
          type: 'move', placedDecoId: selected.id,
          fromRow: selected.grid_row, fromCol: selected.grid_col,
          toRow: row, toCol: col,
        })
      } else {
        editMode.selectDecoration(selected)
        toast.error('Chưa thể di chuyển vật trang trí', { description: result?.error })
      }
      return
    }

    if (decoration) {
      editMode.selectDecoration(decoration)
      return
    }
    interactions.handleTileClick(row, col, plant)
  }, [mode, interactions, editMode, inventory])

  // Hovered data
  const hoveredPlant = hoveredTile ? occupiedCells.get(hoveredTile) ?? null : null
  const hoveredMultiCellArea = useMemo(() => {
    if (!hoveredTile) return null
    const plant = occupiedCells.get(hoveredTile)
    if (!plant || (plant.grid_size || 1) <= 1) return null
    return { row: plant.grid_row || 0, col: plant.grid_col || 0, size: plant.grid_size || 1 }
  }, [hoveredTile, occupiedCells])

  const isEmpty = livingPlants.length === 0

  const sanctuaryPlants = useMemo(
    () => livingPlants.filter((plant) => plant.status !== 'dead' && plant.status !== 'dormant'),
    [livingPlants]
  )
  const sanctuaryCompleted = useMemo(
    () => sanctuaryPlants.filter((plant) => interactions.isWateredToday(plant)),
    [sanctuaryPlants, interactions]
  )
  const sanctuaryActivePlant = useMemo(() => {
    return selectSanctuaryActivePlant(sanctuaryPlants, interactions.isWateredToday)
  }, [sanctuaryPlants, interactions.isWateredToday])
  const sanctuaryFocusedPlant = useMemo(
    () => sanctuaryPlants.find((plant) => plant.id === sanctuaryFocusedPlantId) ?? null,
    [sanctuaryPlants, sanctuaryFocusedPlantId]
  )
  const sanctuaryDisplayPlant = sanctuaryFocusedPlant ?? sanctuaryActivePlant
  const sanctuaryDisplayPlantCompleted = sanctuaryDisplayPlant
    ? interactions.isWateredToday(sanctuaryDisplayPlant)
    : false

  const handleSanctuaryPlantFocus = useCallback((plant: PlantWithType) => {
    if (focusExitTimerRef.current) clearTimeout(focusExitTimerRef.current)
    if (focusReturnTimerRef.current) clearTimeout(focusReturnTimerRef.current)
    setSanctuaryFocusClosing(false)
    setHoveredTile(null)
    setSanctuaryFocusedPlantId(plant.id)
  }, [])

  const handleSanctuaryFocusClose = useCallback(() => {
    if (!sanctuaryFocusedPlantId || sanctuaryFocusClosing) return
    setSanctuaryFocusClosing(true)
    focusExitTimerRef.current = setTimeout(() => {
      setSanctuaryFocusedPlantId(null)
      // Keep the camera transition enabled until it has returned to idle.
      focusExitTimerRef.current = setTimeout(() => {
        setSanctuaryFocusClosing(false)
      }, 650)
    }, 280)
  }, [sanctuaryFocusedPlantId, sanctuaryFocusClosing])

  useEffect(() => {
    if (!sanctuaryMode || !sanctuaryFocusedPlantId) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleSanctuaryFocusClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sanctuaryMode, sanctuaryFocusedPlantId, handleSanctuaryFocusClose])

  const handleSanctuaryTileClick = useCallback(
    (_row: number, _col: number, plant?: PlantWithType) => {
      if (didPan) {
        resetDidPan()
        return
      }
      if (plant) {
        handleSanctuaryPlantFocus(plant)
      } else if (sanctuaryFocusedPlantId) {
        handleSanctuaryFocusClose()
      }
    },
    [
      didPan,
      resetDidPan,
      sanctuaryFocusedPlantId,
      handleSanctuaryPlantFocus,
      handleSanctuaryFocusClose,
    ]
  )

  const handleSanctuaryAction = useCallback(
    (actionKind: 'care' | 'tiny' | 'rest') => {
      if (sanctuaryDisplayPlant) {
        interactions.handleQuickWaterRequest(
          sanctuaryDisplayPlant,
          actionKind === 'rest' ? 'water' : 'log',
          actionKind
        )
      }
    },
    [sanctuaryDisplayPlant, interactions]
  )

  const handleWateringOpenChange = useCallback(
    (open: boolean) => {
      interactions.setWateringModalOpen(open)
      if (!open && sanctuaryFocusedPlantId) {
        if (focusReturnTimerRef.current) clearTimeout(focusReturnTimerRef.current)
        focusReturnTimerRef.current = setTimeout(() => {
          handleSanctuaryFocusClose()
        }, 750)
      }
    },
    [interactions, sanctuaryFocusedPlantId, handleSanctuaryFocusClose]
  )

  const resolvedFocusStates = useMemo(() => {
    if (!sanctuaryMode) return focusStates
    const states = new Map<string, FocusState>()
    for (const plant of sanctuaryPlants) {
      if (sanctuaryFocusedPlant) {
        states.set(plant.id, plant.id === sanctuaryFocusedPlant.id ? 'highlight' : 'dim')
      } else {
        states.set(plant.id, 'normal')
      }
    }
    return states
  }, [focusStates, sanctuaryMode, sanctuaryFocusedPlant, sanctuaryPlants])

  const sanctuaryFocalArea = useMemo(() => sanctuaryFocusedPlant ? {
    row: sanctuaryFocusedPlant.grid_row ?? 0,
    col: sanctuaryFocusedPlant.grid_col ?? 0,
    size: sanctuaryFocusedPlant.grid_size || 1,
  } : null, [sanctuaryFocusedPlant])

  const visibleTileClickHandler = sanctuaryMode && mode === 'interact'
    ? handleSanctuaryTileClick
    : handleGardenTileClick

  const gardenTransform = useMemo(() => {
    if (!sanctuaryMode) {
      return `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`
    }

    if (!sanctuaryFocusedPlant) {
      const displayScale = zoom * sanctuaryCameraFit.baseScale
      const sceneCenterX = (visualSceneBounds.left + visualSceneBounds.right) / 2
      const sceneCenterY = (visualSceneBounds.top + visualSceneBounds.bottom) / 2
      const scaleDelta = displayScale - sanctuaryCameraFit.baseScale
      const translateX = sanctuaryCameraFit.translateX
        - (sceneCenterX - containerWidth / 2) * scaleDelta
        + panOffset.x
      const translateY = sanctuaryCameraFit.translateY
        - (sceneCenterY - containerHeight / 2) * scaleDelta
        + panOffset.y
      return `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${displayScale})`
    }

    const row = sanctuaryFocusedPlant.grid_row ?? 0
    const col = sanctuaryFocusedPlant.grid_col ?? 0
    const plantGridSize = sanctuaryFocusedPlant.grid_size || 1
    const plantAnchorX = containerWidth / 2 + (col - row) * (tileSize / 2)
    const plantAnchorY = (col + row) * (tileSize / 4)
      + tileSize / 4
      + (plantGridSize - 1) * tileSize / 4
    const focusedPlantBounds = getPlantAssetVisualBounds({
      plant: sanctuaryFocusedPlant,
      contactX: 0,
      contactY: 0,
      tileSize,
      renderScale: 3.4 * getPlantGrowthScale(sanctuaryFocusedPlant.growth_percentage),
    })
    const focusScale = getPlantFocusCameraScale({
      viewportWidth: viewportSize.width,
      viewportHeight: viewportSize.height,
      tileSize,
      gridSize: plantGridSize,
      plantBounds: focusedPlantBounds,
      panelTop: sanctuaryFocusPanelTop,
    })
    const targetY = getPlantFocusTargetY(
      viewportSize.width,
      viewportSize.height,
      sanctuaryFocusPanelTop
    )
    const translateX = -(plantAnchorX - containerWidth / 2) * focusScale
    const translateY = targetY - viewportSize.height / 2
      - (plantAnchorY - containerHeight / 2) * focusScale

    return `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) scale(${focusScale})`
  }, [
    sanctuaryMode,
    sanctuaryFocusedPlant,
    zoom,
    panOffset.x,
    panOffset.y,
    containerWidth,
    containerHeight,
    tileSize,
    viewportSize.width,
    viewportSize.height,
    sanctuaryFocusPanelTop,
    sanctuaryCameraFit,
    visualSceneBounds,
  ])

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

  const handleHarvestClose = useCallback(() => {
    interactions.setHarvestData(null)
  }, [interactions])

  return (
    <div className="relative w-full h-full flex flex-col select-none">
      {sanctuaryMode && (
        <DailyGardenAtmosphereLayer atmosphere={dailyGardenEncounter.atmosphere} />
      )}

      {/* Mode toolbar */}
      {!focusMode && mode !== 'arrange' && (
        <ModeToolbar
          mode={mode}
          onModeChange={setModeWithReset}
          sanctuary={sanctuaryMode}
          className="fixed left-3 top-1/2 -translate-y-1/2 z-50"
        />
      )}

      {/* Zoom Controls */}
      {!sanctuaryFocusedPlant && <ZoomControls
          zoom={zoom}
          minZoom={minZoom}
          maxZoom={maxZoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={() => { resetZoom(); resetPan() }}
          sanctuary={sanctuaryMode}
          className="fixed right-3 top-1/2 -translate-y-1/2 z-50"
        />}

      {/* Empty state */}
      {isEmpty && !sanctuaryMode && (
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
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
        onWheel={sanctuaryFocusedPlant ? undefined : bindGestures.onWheel}
        onTouchStart={sanctuaryFocusedPlant ? undefined : bindGestures.onTouchStart}
        onTouchMove={sanctuaryFocusedPlant ? undefined : bindGestures.onTouchMove}
        onTouchEnd={sanctuaryFocusedPlant ? undefined : bindGestures.onTouchEnd}
        onMouseDown={sanctuaryFocusedPlant ? undefined : bindGestures.onMouseDown}
        onMouseMove={sanctuaryFocusedPlant ? undefined : bindGestures.onMouseMove}
        onMouseUp={sanctuaryFocusedPlant ? undefined : bindGestures.onMouseUp}
        onMouseLeave={sanctuaryFocusedPlant ? undefined : bindGestures.onMouseLeave}
      >
        <div
          className={sanctuaryMode
            ? 'relative h-full w-full'
            : 'flex h-full w-full items-end justify-center'}
          style={sanctuaryMode ? undefined : { paddingBottom: '16px' }}
        >
          <div
            ref={gardenContainerRef}
            className={sanctuaryMode
              ? 'absolute left-1/2 top-1/2 flex-shrink-0 transition-[transform] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-150'
              : 'relative flex-shrink-0 transition-[transform] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-150'}
            style={{
              width: containerWidth,
              height: containerHeight,
              transform: gardenTransform,
              transformOrigin: 'center center',
              willChange: 'transform',
              // Direct manipulation and grid resizing must track state
              // immediately. Only focus camera moves use cinematic easing.
              transitionDuration: sanctuaryFocusedPlant || sanctuaryFocusClosing ? '600ms' : '0ms',
            }}
          >
            {/* Ground plane (canvas renderer) */}
            <GroundPlaneCanvas
              gridSize={gridSize}
              tileSize={tileSize}
              grassColor={defaultTheme.ground.primary}
              grassDarkColor={defaultTheme.ground.secondary}
              multiCellAreas={multiCellAreas}
              hoveredMultiCellArea={hoveredMultiCellArea}
              dragTargetCell={interactions.moveState.selectedPlant
                ? interactions.moveState.previewCell
                : (editMode.selectedDecoration || editMode.selectedItem) ? editMode.ghostPosition : null}
              dragPlantSize={interactions.moveState.selectedPlant?.grid_size
                || editMode.selectedDecoration?.grid_size
                || editMode.selectedItem?.decoration_type?.grid_size
                || 1}
              isDragTargetValid={interactions.moveState.selectedPlant
                ? interactions.moveState.isValidPreview
                : editMode.isGhostValid}
              weather={gardenSettings.showWeatherEffects ? weather : null}
              timeOfDay={currentTimeOfDay}
              showGridLines={!sanctuaryMode || mode === 'arrange'}
              cinematic={sanctuaryMode}
              focalArea={sanctuaryFocalArea}
            />

            {/* Ambient particles (canvas renderer) */}
            {gardenSettings.showParticles && !gardenSettings.reducedMotion && !isLowPowerDevice && (
              <AmbientParticlesCanvas
                weather={gardenSettings.showWeatherEffects ? weather : null}
                timeOfDay={currentTimeOfDay}
                width={containerWidth}
                height={containerHeight}
                cinematic={sanctuaryMode}
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
              focusStates={resolvedFocusStates}
              weather={weather}
              placedDecorations={gardenSettings.showDecorations ? placedDecorations : []}
              onTileClick={visibleTileClickHandler}
              onTileHover={handleTileHover}
              onTileLeave={handleTileLeave}
              onContextMenu={interactions.handleContextMenu}
              hidePlantBadges={sanctuaryMode}
              featuredPlantId={sanctuaryMode ? sanctuaryFocusedPlant?.id : null}
              focusFrameClosing={sanctuaryFocusClosing}
              hideStatusIndicators={sanctuaryMode}
              cinematic={sanctuaryMode}
              selectedDecorationId={selectedPlacedDecoration?.id}
              decorationPlacementActive={Boolean(editMode.selectedItem || selectedPlacedDecoration)}
            />

            {activeDecorationGhost && (
              <DecorationPlacementGhostLayer
                {...activeDecorationGhost}
                gridSize={gridSize}
                tileSize={tileSize}
              />
            )}

          </div>
        </div>
      </div>

      {/* Info bar */}
      {mode === 'interact' && !isTouchDevice && (
        <PlantInfoBar plant={hoveredPlant} suppressed={Boolean(sanctuaryFocusedPlant)} />
      )}

      {/* Screen-reader plant list (a11y for non-visual users) */}
      <ul className="sr-only" aria-label="Plants in your garden">
        {livingPlants.map((p) => (
          <li key={p.id}>
            {p.name} — {p.status}, consistency growth {Math.round(p.growth_percentage)}%
            {p.goal && (
              <>, {p.goal.period_label} goal {formatGoalValue(p.goal.period_progress)} of {formatGoalValue(p.goal.current_period_target)} {p.goal.unit}</>
            )}
          </li>
        ))}
      </ul>

      {/* Modals */}
      {(interactions.wateringModalOpen || interactions.addDialogOpen || interactions.sheetOpen) && <GardenModals
        wateringPlant={interactions.wateringPlant}
        wateringModalOpen={interactions.wateringModalOpen}
        onWateringOpenChange={sanctuaryMode ? handleWateringOpenChange : interactions.setWateringModalOpen}
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
        wateringInitialMode={interactions.wateringInitialMode}
        wateringActionKind={interactions.wateringActionKind}
        sanctuaryMode={sanctuaryMode}
      />}

      {sanctuaryMode && (
        <SanctuaryGardenChrome
          activePlant={sanctuaryDisplayPlant}
          focusedPlant={sanctuaryFocusedPlant}
          activePlantCompleted={sanctuaryDisplayPlantCompleted}
          focusClosing={sanctuaryFocusClosing}
          completedCount={sanctuaryCompleted.length}
          totalCount={sanctuaryPlants.length}
          isSyncing={sanctuaryDisplayPlant ? isPlantPending(sanctuaryDisplayPlant.id) : false}
          welcomeBackDays={welcomeBackDays}
          atmosphere={dailyGardenEncounter.atmosphere}
          encounterMemory={dailyGardenEncounter.memory}
          onPrimaryAction={() => handleSanctuaryAction('care')}
          onTinyAction={() => handleSanctuaryAction('tiny')}
          onRestAction={() => handleSanctuaryAction('rest')}
          onOpenDetails={() => {
            if (sanctuaryDisplayPlant) interactions.handleShowInfo(sanctuaryDisplayPlant)
          }}
          onCloseFocus={handleSanctuaryFocusClose}
          onFocusPanelTopChange={setSanctuaryFocusPanelTop}
        />
      )}

      {/* Decoration edit overlay (visible in arrange mode) */}
      {inventory && mode === 'arrange' && (
        <EditModeOverlay
          isActive
          gridSize={gridSize}
          occupiedCells={occupiedCellsSet}
          onDone={() => setModeWithReset('interact')}
          editMode={editMode}
          movingPlantName={interactions.moveState.selectedPlant?.name}
          onCancelPlantMove={interactions.resetMoveState}
        />
      )}

      {/* Celebrations */}
      {(interactions.celebration?.active
        || interactions.levelUpData
        || interactions.pendingAchievements.length > 0
        || interactions.harvestData) && (
        <GardenCelebrationLayer
          celebration={interactions.celebration}
          onCelebrationComplete={handleCelebrationComplete}
          levelUpData={interactions.levelUpData}
          onLevelUpClose={handleLevelUpClose}
          pendingAchievements={interactions.pendingAchievements}
          onAchievementsComplete={handleAchievementsComplete}
          harvestData={interactions.harvestData}
          onHarvestClose={handleHarvestClose}
          showCelebrations={gardenSettings.showCelebrations}
          sanctuaryMode={sanctuaryMode}
        />
      )}

      {sanctuaryMode
        && gardenSettings.showCelebrations
        && freshGardenEncounter && (
        <GardenEncounterReveal
          memory={freshGardenEncounter}
          reducedMotion={gardenSettings.reducedMotion}
          onComplete={completeFreshGardenEncounter}
        />
      )}
    </div>
  )
}
