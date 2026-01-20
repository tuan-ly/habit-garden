'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

const ZOOM_STORAGE_KEY = 'garden-zoom-level'
const DEFAULT_ZOOM = 1
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const ZOOM_STEP = 0.25

interface UseGardenZoomOptions {
  minZoom?: number
  maxZoom?: number
  step?: number
  persist?: boolean
}

interface UseGardenZoomReturn {
  zoom: number
  minZoom: number
  maxZoom: number
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setZoom: (value: number) => void
  bindPinchGesture: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

export function useGardenZoom(options: UseGardenZoomOptions = {}): UseGardenZoomReturn {
  const {
    minZoom = MIN_ZOOM,
    maxZoom = MAX_ZOOM,
    step = ZOOM_STEP,
    persist = true,
  } = options

  // Initialize zoom from localStorage or default
  const [zoom, setZoomState] = useState(DEFAULT_ZOOM)

  // Pinch gesture tracking
  const initialDistance = useRef<number | null>(null)
  const initialZoom = useRef<number>(zoom)

  // Load persisted zoom on mount
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      const saved = localStorage.getItem(ZOOM_STORAGE_KEY)
      if (saved) {
        const parsed = parseFloat(saved)
        if (!isNaN(parsed) && parsed >= minZoom && parsed <= maxZoom) {
          setZoomState(parsed)
        }
      }
    }
  }, [persist, minZoom, maxZoom])

  // Clamp zoom value between min and max
  const clampZoom = useCallback(
    (value: number) => Math.min(maxZoom, Math.max(minZoom, value)),
    [minZoom, maxZoom]
  )

  // Set zoom with persistence
  const setZoom = useCallback(
    (value: number) => {
      const clamped = clampZoom(value)
      setZoomState(clamped)
      if (persist && typeof window !== 'undefined') {
        localStorage.setItem(ZOOM_STORAGE_KEY, clamped.toString())
      }
    },
    [clampZoom, persist]
  )

  // Zoom in by step
  const zoomIn = useCallback(() => {
    setZoom(zoom + step)
  }, [zoom, step, setZoom])

  // Zoom out by step
  const zoomOut = useCallback(() => {
    setZoom(zoom - step)
  }, [zoom, step, setZoom])

  // Reset to default zoom
  const resetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM)
  }, [setZoom])

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Handle touch start for pinch gesture
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance.current = getTouchDistance(e.touches)
        initialZoom.current = zoom
      }
    },
    [zoom]
  )

  // Handle touch move for pinch gesture
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialDistance.current !== null) {
        const currentDistance = getTouchDistance(e.touches)
        const scale = currentDistance / initialDistance.current
        const newZoom = initialZoom.current * scale
        setZoom(newZoom)
      }
    },
    [setZoom]
  )

  // Handle touch end for pinch gesture
  const handleTouchEnd = useCallback(() => {
    initialDistance.current = null
  }, [])

  // Bind pinch gesture handlers
  const bindPinchGesture = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }

  return {
    zoom,
    minZoom,
    maxZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    bindPinchGesture,
  }
}
