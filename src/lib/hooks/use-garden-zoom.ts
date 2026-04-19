'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

const ZOOM_STORAGE_KEY = 'garden-zoom-level'
const DEFAULT_ZOOM = 1
const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.25

// Smooth zoom animation duration
const ZOOM_ANIMATION_DURATION = 150

// Minimum distance to start panning (prevents accidental pan on tap)
const PAN_THRESHOLD = 8

interface UseGardenZoomOptions {
  minZoom?: number
  maxZoom?: number
  step?: number
  persist?: boolean
  /** Custom storage key for persisting zoom level */
  storageKey?: string
}

interface UseGardenZoomReturn {
  zoom: number
  targetZoom: number
  minZoom: number
  maxZoom: number
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setZoom: (value: number, animate?: boolean) => void
  isZooming: boolean
  // For pan gesture
  isPanning: boolean
  // True if user actually dragged (moved more than threshold) - use to prevent click after drag
  didPan: boolean
  panOffset: { x: number; y: number }
  bindPanGesture: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
  }
  // For pinch gesture
  bindPinchGesture: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
  // Combined gesture handler
  bindGestures: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onWheel: (e: React.WheelEvent) => void
  }
  resetPan: () => void
  // Reset didPan flag (call after handling click)
  resetDidPan: () => void
  // Cancel any ongoing pan gesture (call when external drag ends)
  cancelPan: () => void
}

export function useGardenZoom(options: UseGardenZoomOptions = {}): UseGardenZoomReturn {
  const {
    minZoom = MIN_ZOOM,
    maxZoom = MAX_ZOOM,
    step = ZOOM_STEP,
    persist = true,
    storageKey = ZOOM_STORAGE_KEY,
  } = options

  // Current displayed zoom (animated)
  const [zoom, setZoomState] = useState(DEFAULT_ZOOM)
  // Target zoom (for animation)
  const [targetZoom, setTargetZoom] = useState(DEFAULT_ZOOM)
  const [isZooming, setIsZooming] = useState(false)

  // Pan state
  const [isPanning, setIsPanning] = useState(false)
  const [didPan, setDidPan] = useState(false) // True if user actually moved more than threshold
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const panStartPos = useRef<{ x: number; y: number } | null>(null)
  const panStartOffset = useRef({ x: 0, y: 0 })
  const panThresholdMet = useRef(false) // Track if we've exceeded threshold
  // rAF throttle for pan updates — batches move events to ≤1 setState per frame
  const panRafId = useRef<number | null>(null)
  const pendingPanOffset = useRef<{ x: number; y: number } | null>(null)
  const schedulePanUpdate = useCallback((next: { x: number; y: number }) => {
    pendingPanOffset.current = next
    if (panRafId.current !== null) return
    panRafId.current = requestAnimationFrame(() => {
      panRafId.current = null
      if (pendingPanOffset.current) {
        setPanOffset(pendingPanOffset.current)
        pendingPanOffset.current = null
      }
    })
  }, [])

  // Pinch gesture tracking
  const initialDistance = useRef<number | null>(null)
  const initialZoom = useRef<number>(zoom)
  const pinchCenter = useRef<{ x: number; y: number } | null>(null)

  // Animation frame ref
  const animationFrame = useRef<number | null>(null)

  // Load persisted zoom on mount
  useEffect(() => {
    if (persist && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = parseFloat(saved)
        if (!isNaN(parsed) && parsed >= minZoom && parsed <= maxZoom) {
          setZoomState(parsed)
          setTargetZoom(parsed)
        }
      }
    }
  }, [persist, minZoom, maxZoom, storageKey])

  // Clamp zoom value between min and max
  const clampZoom = useCallback(
    (value: number) => Math.min(maxZoom, Math.max(minZoom, value)),
    [minZoom, maxZoom]
  )

  // Animate zoom smoothly
  const animateZoom = useCallback(
    (from: number, to: number) => {
      const startTime = performance.now()
      const duration = ZOOM_ANIMATION_DURATION

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        const currentZoom = from + (to - from) * eased

        setZoomState(currentZoom)

        if (progress < 1) {
          animationFrame.current = requestAnimationFrame(animate)
        } else {
          setZoomState(to)
          setIsZooming(false)
          // Persist final value
          if (persist && typeof window !== 'undefined') {
            localStorage.setItem(storageKey, to.toString())
          }
        }
      }

      setIsZooming(true)
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
      animationFrame.current = requestAnimationFrame(animate)
    },
    [persist, storageKey]
  )

  // Set zoom with optional animation
  const setZoom = useCallback(
    (value: number, animate = true) => {
      const clamped = clampZoom(value)
      setTargetZoom(clamped)

      if (animate) {
        animateZoom(zoom, clamped)
      } else {
        setZoomState(clamped)
        if (persist && typeof window !== 'undefined') {
          localStorage.setItem(storageKey, clamped.toString())
        }
      }
    },
    [clampZoom, zoom, animateZoom, persist]
  )

  // Zoom in by step
  const zoomIn = useCallback(() => {
    setZoom(targetZoom + step)
  }, [targetZoom, step, setZoom])

  // Zoom out by step
  const zoomOut = useCallback(() => {
    setZoom(targetZoom - step)
  }, [targetZoom, step, setZoom])

  // Reset to default zoom and pan
  const resetZoom = useCallback(() => {
    setZoom(DEFAULT_ZOOM)
    setPanOffset({ x: 0, y: 0 })
  }, [setZoom])

  // Reset pan only
  const resetPan = useCallback(() => {
    setPanOffset({ x: 0, y: 0 })
  }, [])

  // Reset didPan flag (call after handling click to allow next drag detection)
  const resetDidPan = useCallback(() => {
    setDidPan(false)
  }, [])

  // Cancel any ongoing pan gesture (call when external drag ends to prevent ghost pan)
  const cancelPan = useCallback(() => {
    panStartPos.current = null
    panThresholdMet.current = false
    setIsPanning(false)
    setDidPan(false)
  }, [])

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Get center point of two touches
  const getTouchCenter = (touches: React.TouchList): { x: number; y: number } => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    }
  }

  // Handle touch start for pinch gesture
  const handlePinchTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        // Prevent browser zoom on pinch start
        e.preventDefault()

        initialDistance.current = getTouchDistance(e.touches)
        initialZoom.current = zoom
        pinchCenter.current = getTouchCenter(e.touches)
      }
    },
    [zoom]
  )

  // Handle touch move for pinch gesture
  const handlePinchTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialDistance.current !== null) {
        // Prevent browser zoom on pinch
        e.preventDefault()

        const currentDistance = getTouchDistance(e.touches)
        const scale = currentDistance / initialDistance.current
        const newZoom = clampZoom(initialZoom.current * scale)

        // Update zoom without animation for real-time feel
        setZoomState(newZoom)
        setTargetZoom(newZoom)
      }
    },
    [clampZoom]
  )

  // Handle touch end for pinch gesture
  const handlePinchTouchEnd = useCallback(() => {
    if (initialDistance.current !== null) {
      // Persist zoom value after pinch ends
      if (persist && typeof window !== 'undefined') {
        localStorage.setItem(storageKey, zoom.toString())
      }
    }
    initialDistance.current = null
    pinchCenter.current = null
  }, [zoom, persist])

  // Pan gesture handlers - Touch
  const handlePanTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        panStartPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        }
        panStartOffset.current = { ...panOffset }
        panThresholdMet.current = false
        // Don't set isPanning yet - wait for threshold
      }
    },
    [panOffset]
  )

  const handlePanTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && panStartPos.current) {
        const dx = e.touches[0].clientX - panStartPos.current.x
        const dy = e.touches[0].clientY - panStartPos.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Only start panning after threshold is met
        if (!panThresholdMet.current && distance >= PAN_THRESHOLD) {
          panThresholdMet.current = true
          setIsPanning(true)
          setDidPan(true)
        }

        if (panThresholdMet.current) {
          schedulePanUpdate({
            x: panStartOffset.current.x + dx,
            y: panStartOffset.current.y + dy,
          })
        }
      }
    },
    [schedulePanUpdate]
  )

  const handlePanTouchEnd = useCallback(() => {
    panStartPos.current = null
    panThresholdMet.current = false
    // Flush any pending pan update before clearing rAF
    if (panRafId.current !== null) {
      cancelAnimationFrame(panRafId.current)
      panRafId.current = null
      if (pendingPanOffset.current) {
        setPanOffset(pendingPanOffset.current)
        pendingPanOffset.current = null
      }
    }
    setIsPanning(false)
    // Note: didPan is NOT reset here - it's reset by the consumer after handling click
  }, [])

  // Pan gesture handlers - Mouse
  const handlePanMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Left mouse button (0) or middle mouse button (1)
      if (e.button === 0 || e.button === 1) {
        panStartPos.current = { x: e.clientX, y: e.clientY }
        panStartOffset.current = { ...panOffset }
        panThresholdMet.current = false
        // Don't set isPanning yet - wait for threshold
        // Don't preventDefault here to allow click events to work
      }
    },
    [panOffset]
  )

  const handlePanMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (panStartPos.current) {
        const dx = e.clientX - panStartPos.current.x
        const dy = e.clientY - panStartPos.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Only start panning after threshold is met
        if (!panThresholdMet.current && distance >= PAN_THRESHOLD) {
          panThresholdMet.current = true
          setIsPanning(true)
          setDidPan(true)
        }

        if (panThresholdMet.current) {
          schedulePanUpdate({
            x: panStartOffset.current.x + dx,
            y: panStartOffset.current.y + dy,
          })
        }
      }
    },
    [schedulePanUpdate]
  )

  const handlePanMouseUp = useCallback(() => {
    panStartPos.current = null
    panThresholdMet.current = false
    if (panRafId.current !== null) {
      cancelAnimationFrame(panRafId.current)
      panRafId.current = null
      if (pendingPanOffset.current) {
        setPanOffset(pendingPanOffset.current)
        pendingPanOffset.current = null
      }
    }
    setIsPanning(false)
    // Note: didPan is NOT reset here - it's reset by the consumer after handling click
  }, [])

  // Debounce timer for persisting zoom
  const persistTimer = useRef<NodeJS.Timeout | null>(null)

  // Mouse wheel zoom - smooth continuous zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Always prevent default to stop browser zoom (especially on Ctrl+scroll)
      // e.preventDefault()
      e.stopPropagation()

      // Use deltaY directly for smooth continuous zooming
      // Normalize deltaY for different browsers/devices (typically 100-120 per scroll tick)
      const normalizedDelta = e.deltaY / 500
      const zoomDelta = -normalizedDelta * step * 2
      const newZoom = clampZoom(zoom + zoomDelta)

      // Update zoom directly without animation for immediate response
      setZoomState(newZoom)
      setTargetZoom(newZoom)

      // Debounce persistence to avoid excessive writes
      if (persistTimer.current) {
        clearTimeout(persistTimer.current)
      }
      if (persist && typeof window !== 'undefined') {
        persistTimer.current = setTimeout(() => {
          localStorage.setItem(storageKey, newZoom.toString())
        }, 300)
      }
    },
    [zoom, step, clampZoom, persist]
  )

  // Combined touch handler (pinch takes priority over pan)
  const handleCombinedTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        // Prevent browser zoom - handle app zoom instead
        e.preventDefault()
        handlePinchTouchStart(e)
        setIsPanning(false)
        panStartPos.current = null
      } else if (e.touches.length === 1) {
        handlePanTouchStart(e)
      }
    },
    [handlePinchTouchStart, handlePanTouchStart]
  )

  const handleCombinedTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        // Prevent browser zoom - handle app zoom instead
        e.preventDefault()
        handlePinchTouchMove(e)
      } else if (e.touches.length === 1) {
        handlePanTouchMove(e)
      }
    },
    [handlePinchTouchMove, handlePanTouchMove]
  )

  const handleCombinedTouchEnd = useCallback(() => {
    handlePinchTouchEnd()
    handlePanTouchEnd()
  }, [handlePinchTouchEnd, handlePanTouchEnd])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
      if (panRafId.current !== null) {
        cancelAnimationFrame(panRafId.current)
      }
    }
  }, [])

  return {
    zoom,
    targetZoom,
    minZoom,
    maxZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    isZooming,
    isPanning,
    didPan,
    panOffset,
    bindPanGesture: {
      onTouchStart: handlePanTouchStart,
      onTouchMove: handlePanTouchMove,
      onTouchEnd: handlePanTouchEnd,
      onMouseDown: handlePanMouseDown,
      onMouseMove: handlePanMouseMove,
      onMouseUp: handlePanMouseUp,
      onMouseLeave: handlePanMouseUp,
    },
    bindPinchGesture: {
      onTouchStart: handlePinchTouchStart,
      onTouchMove: handlePinchTouchMove,
      onTouchEnd: handlePinchTouchEnd,
    },
    bindGestures: {
      onTouchStart: handleCombinedTouchStart,
      onTouchMove: handleCombinedTouchMove,
      onTouchEnd: handleCombinedTouchEnd,
      onMouseDown: handlePanMouseDown,
      onMouseMove: handlePanMouseMove,
      onMouseUp: handlePanMouseUp,
      onMouseLeave: handlePanMouseUp,
      onWheel: handleWheel,
    },
    resetPan,
    resetDidPan,
    cancelPan,
  }
}
