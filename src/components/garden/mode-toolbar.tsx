'use client'

import { cn } from '@/lib/utils'
import { Pencil, Palette } from 'lucide-react'

export type GardenMode = 'interact' | 'edit' | 'decorate'

interface ModeToolbarProps {
  mode: GardenMode
  onModeChange: (mode: GardenMode) => void
  className?: string
}

/**
 * Mode toggle toolbar for the garden.
 * - interact: Click plant → watering modal
 * - edit:     Add / move plants around the grid
 * - decorate: Place / move decorations in edit mode overlay
 */
export function ModeToolbar({ mode, onModeChange, className }: ModeToolbarProps) {
  const isEditing = mode === 'edit'
  const isDecorating = mode === 'decorate'

  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-2 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl',
        className
      )}
    >
      {/* Edit mode button */}
      <button
        onClick={() => onModeChange(isEditing ? 'interact' : 'edit')}
        className={cn(
          'relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-200',
          'hover:scale-105 active:scale-95',
          isEditing
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
        )}
        title={isEditing ? 'Exit edit mode' : 'Edit garden'}
        aria-pressed={isEditing}
      >
        <Pencil className="w-5 h-5" strokeWidth={2.5} />
        <span className="text-[10px] font-medium leading-none">Edit</span>

        {/* Active indicator glow */}
        {isEditing && (
          <div className="absolute inset-0 rounded-xl bg-amber-400/20 animate-pulse pointer-events-none" />
        )}
      </button>

      {/* Decorate mode button */}
      <button
        onClick={() => onModeChange(isDecorating ? 'interact' : 'decorate')}
        className={cn(
          'relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-200',
          'hover:scale-105 active:scale-95',
          isDecorating
            ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30'
            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
        )}
        title={isDecorating ? 'Exit decorate mode' : 'Decorate garden'}
        aria-pressed={isDecorating}
      >
        <Palette className="w-5 h-5" strokeWidth={2.5} />
        <span className="text-[10px] font-medium leading-none">Decorate</span>

        {/* Active indicator glow */}
        {isDecorating && (
          <div className="absolute inset-0 rounded-xl bg-purple-400/20 animate-pulse pointer-events-none" />
        )}
      </button>
    </div>
  )
}
