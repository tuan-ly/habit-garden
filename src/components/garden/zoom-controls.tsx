'use client'

import { Plus, Minus, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ZoomControlsProps {
  zoom: number
  minZoom?: number
  maxZoom?: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  className?: string
}

export function ZoomControls({
  zoom,
  minZoom = 0.5,
  maxZoom = 2,
  onZoomIn,
  onZoomOut,
  onReset,
  className,
}: ZoomControlsProps) {
  const canZoomIn = zoom < maxZoom
  const canZoomOut = zoom > minZoom
  const isDefaultZoom = zoom === 1

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 p-1.5 rounded-xl',
        'garden-chrome',
        className
      )}
    >
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
          canZoomIn
            ? 'garden-icon-button active:scale-95'
            : 'text-canopy/30 cursor-not-allowed'
        )}
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Zoom percentage indicator */}
      <div className="px-1 py-0.5 text-[10px] font-semibold text-canopy/60 select-none">
        {Math.round(zoom * 100)}%
      </div>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
          canZoomOut
            ? 'garden-icon-button active:scale-95'
            : 'text-canopy/30 cursor-not-allowed'
        )}
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-5 h-px bg-canopy/10 my-0.5" />

      {/* Reset to 100% */}
      <button
        onClick={onReset}
        disabled={isDefaultZoom}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
          !isDefaultZoom
            ? 'garden-icon-button active:scale-95'
            : 'text-canopy/30 cursor-not-allowed'
        )}
        aria-label="Reset zoom"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
