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
  sanctuary?: boolean
}

export function ZoomControls({
  zoom,
  minZoom = 0.5,
  maxZoom = 2,
  onZoomIn,
  onZoomOut,
  onReset,
  className,
  sanctuary = false,
}: ZoomControlsProps) {
  const canZoomIn = zoom < maxZoom
  const canZoomOut = zoom > minZoom
  const isDefaultZoom = zoom === 1

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 p-1.5 rounded-xl',
        sanctuary
          ? 'bg-[#fffaf0]/90 backdrop-blur-xl border border-white/70 shadow-lg'
          : 'bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-lg',
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
            ? sanctuary ? 'text-[#49693f] hover:bg-[#e8efdd] active:scale-95' : 'text-white hover:bg-slate-700/50 active:scale-95'
            : 'text-slate-600 cursor-not-allowed'
        )}
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4" />
      </button>

      {/* Zoom percentage indicator */}
      <div className={cn('px-1 py-0.5 text-[10px] font-medium select-none', sanctuary ? 'text-[#67805d]' : 'text-slate-400')}>
        {Math.round(zoom * 100)}%
      </div>

      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
          canZoomOut
            ? sanctuary ? 'text-[#49693f] hover:bg-[#e8efdd] active:scale-95' : 'text-white hover:bg-slate-700/50 active:scale-95'
            : 'text-slate-600 cursor-not-allowed'
        )}
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Divider */}
      <div className="w-5 h-px bg-slate-700/50 my-0.5" />

      {/* Reset to 100% */}
      <button
        onClick={onReset}
        disabled={isDefaultZoom}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
          !isDefaultZoom
            ? sanctuary ? 'text-[#49693f] hover:bg-[#e8efdd] active:scale-95' : 'text-white hover:bg-slate-700/50 active:scale-95'
            : 'text-slate-600 cursor-not-allowed'
        )}
        aria-label="Reset zoom"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
