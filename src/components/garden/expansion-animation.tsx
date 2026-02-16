'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ExpansionAnimationProps {
  /** Whether the animation is active */
  isActive: boolean
  /** Grid size in tiles */
  gridSize: number
  /** Tile size in pixels */
  tileSize: number
  /** Callback when animation completes */
  onComplete?: () => void
}

/**
 * Garden expansion animation - shows rippling effect when garden size increases
 *
 * Creates multiple expanding rings that ripple outward from the center
 * with a subtle glow effect on new tiles
 */
export function ExpansionAnimation({
  isActive,
  gridSize,
  tileSize,
  onComplete,
}: ExpansionAnimationProps) {
  const [rings, setRings] = useState<number[]>([])
  const [showGlow, setShowGlow] = useState(false)

  // Calculate container dimensions (isometric)
  const containerWidth = gridSize * tileSize
  const containerHeight = gridSize * (tileSize / 2) + tileSize * 0.3
  const centerX = containerWidth / 2
  const centerY = containerHeight / 2

  useEffect(() => {
    if (!isActive) {
      setRings([])
      setShowGlow(false)
      return
    }

    // Start with glow
    setShowGlow(true)

    // Create 3 rings with staggered timing
    const ringTimers: NodeJS.Timeout[] = []

    for (let i = 0; i < 3; i++) {
      const timer = setTimeout(() => {
        setRings((prev) => [...prev, Date.now()])
      }, i * 300)
      ringTimers.push(timer)
    }

    // Complete animation after all rings finish
    const completeTimer = setTimeout(() => {
      setShowGlow(false)
      setRings([])
      onComplete?.()
    }, 2000)

    return () => {
      ringTimers.forEach(clearTimeout)
      clearTimeout(completeTimer)
    }
  }, [isActive, onComplete])

  if (!isActive && rings.length === 0) {
    return null
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 50 }}
    >
      {/* Center glow */}
      {showGlow && (
        <div
          className="absolute rounded-full bg-emerald-400/30 blur-3xl animate-pulse"
          style={{
            width: containerWidth * 0.5,
            height: containerHeight * 0.5,
            left: centerX - containerWidth * 0.25,
            top: centerY - containerHeight * 0.25,
          }}
        />
      )}

      {/* Expanding rings */}
      {rings.map((id, index) => (
        <ExpandingRing
          key={id}
          centerX={centerX}
          centerY={centerY}
          maxWidth={containerWidth * 0.8}
          maxHeight={containerHeight * 0.8}
          delay={0}
          color={['#22c55e', '#10b981', '#059669'][index % 3]}
        />
      ))}

      {/* Edge sparkles */}
      {showGlow && (
        <EdgeSparkles
          containerWidth={containerWidth}
          containerHeight={containerHeight}
          gridSize={gridSize}
          tileSize={tileSize}
        />
      )}
    </div>
  )
}

// Single expanding ring
function ExpandingRing({
  centerX,
  centerY,
  maxWidth,
  maxHeight,
  delay,
  color,
}: {
  centerX: number
  centerY: number
  maxWidth: number
  maxHeight: number
  delay: number
  color: string
}) {
  return (
    <div
      className="absolute animate-expansion-ripple"
      style={{
        left: centerX - maxWidth / 2,
        top: centerY - maxHeight / 2,
        width: maxWidth,
        height: maxHeight,
        animationDelay: `${delay}ms`,
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <ellipse
          cx="50"
          cy="50"
          rx="48"
          ry="30"
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity="0.6"
        />
      </svg>
    </div>
  )
}

// Sparkles at the garden edges
function EdgeSparkles({
  containerWidth,
  containerHeight,
  gridSize,
  tileSize,
}: {
  containerWidth: number
  containerHeight: number
  gridSize: number
  tileSize: number
}) {
  const sparkleCount = Math.min(12, gridSize * 2)

  return (
    <>
      {Array.from({ length: sparkleCount }).map((_, i) => {
        // Distribute sparkles around the diamond edge
        const angle = (i / sparkleCount) * Math.PI * 2
        const radiusX = containerWidth * 0.45
        const radiusY = containerHeight * 0.4
        const x = containerWidth / 2 + Math.cos(angle) * radiusX
        const y = containerHeight / 2 + Math.sin(angle) * radiusY * 0.5

        return (
          <div
            key={i}
            className={cn(
              'absolute w-2 h-2 rounded-full',
              'bg-emerald-300 animate-sparkle-twinkle'
            )}
            style={{
              left: x,
              top: y,
              animationDelay: `${i * 100}ms`,
            }}
          />
        )
      })}
    </>
  )
}

/**
 * Hook to track garden size changes and trigger expansion animation
 */
export function useExpansionAnimation(currentSize: number) {
  const [previousSize, setPreviousSize] = useState(currentSize)
  const [isExpanding, setIsExpanding] = useState(false)

  useEffect(() => {
    if (currentSize > previousSize) {
      setIsExpanding(true)
    }
    setPreviousSize(currentSize)
  }, [currentSize, previousSize])

  const handleAnimationComplete = () => {
    setIsExpanding(false)
  }

  return {
    isExpanding,
    onComplete: handleAnimationComplete,
  }
}
