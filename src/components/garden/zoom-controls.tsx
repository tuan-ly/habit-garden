'use client'

import { Plus, Minus, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PREMIUM_GARDEN_ENABLED } from './lighting'
import { glassPanel, radius, motion } from './ui-tokens'

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

  const containerClass = PREMIUM_GARDEN_ENABLED
    ? cn('flex flex-col items-center gap-1 p-1.5', glassPanel, radius.control, className)
    : cn(
        'flex flex-col items-center gap-1 p-1.5 rounded-xl',
        'bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-lg',
        className
      )

  const btnBase = PREMIUM_GARDEN_ENABLED
    ? cn('w-8 h-8 rounded-lg flex items-center justify-center', motion.fast)
    : 'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200'

  return (
    <div className={containerClass}>
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className={cn(
          btnBase,
          canZoomIn
            ? 'text-white hover:bg-white/10 active:scale-95'
            : 'text-slate-600 cursor-not-allowed'
        )}
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Zoom percentage indicator */}
      <div className="px-1 py-0.5 text-[10px] font-medium text-white/60 select-none">
        {Math.round(zoom * 100)}%
      </div>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={cn(
          btnBase,
          canZoomOut
            ? 'text-white hover:bg-white/10 active:scale-95'
            : 'text-slate-600 cursor-not-allowed'
        )}
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-5 h-px bg-white/10 my-0.5" />

      {/* Reset to 100% */}
      <button
        onClick={onReset}
        disabled={isDefaultZoom}
        className={cn(
          btnBase,
          !isDefaultZoom
            ? 'text-white hover:bg-white/10 active:scale-95'
            : 'text-slate-600 cursor-not-allowed'
        )}
        aria-label="Reset zoom"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
