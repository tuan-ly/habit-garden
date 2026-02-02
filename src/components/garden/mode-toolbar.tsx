'use client'

import { cn } from '@/lib/utils'
import { Hand } from 'lucide-react'

export type GardenMode = 'interact' | 'move'

interface ModeToolbarProps {
  mode: GardenMode
  onModeChange: (mode: GardenMode) => void
  className?: string
}

/**
 * Single toggle button for Move mode.
 * - Default (interact): Click plant → watering modal, Click empty → add plant
 * - Move mode: Click to select plant, click to place
 */
export function ModeToolbar({ mode, onModeChange, className }: ModeToolbarProps) {
  const isMoving = mode === 'move'

  return (
    <div
      className={cn(
        'p-2 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl',
        className
      )}
    >
      <button
        onClick={() => onModeChange(isMoving ? 'interact' : 'move')}
        className={cn(
          'relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-200',
          'hover:scale-105 active:scale-95',
          isMoving
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
        )}
        title={isMoving ? 'Exit move mode' : 'Move plants'}
        aria-pressed={isMoving}
      >
        <Hand className="w-5 h-5" strokeWidth={2.5} />
        <span className="text-[10px] font-medium leading-none">Move</span>

        {/* Active indicator glow */}
        {isMoving && (
          <div className="absolute inset-0 rounded-xl bg-amber-400/20 animate-pulse pointer-events-none" />
        )}
      </button>
    </div>
  )
}
