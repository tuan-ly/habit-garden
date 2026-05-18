'use client'

import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'

export type GardenMode = 'interact' | 'arrange'

interface ModeToolbarProps {
  mode: GardenMode
  onModeChange: (mode: GardenMode) => void
  className?: string
}

/**
 * Mode toggle toolbar for the garden.
 * - interact: Click plant → watering modal
 * - arrange:  Add / move plants, place / move decorations
 */
export function ModeToolbar({ mode, onModeChange, className }: ModeToolbarProps) {
  const isArranging = mode === 'arrange'

  return (
    <div
      className={cn(
        'garden-chrome flex flex-col gap-1 p-2 rounded-2xl',
        className
      )}
    >
      <button
        onClick={() => onModeChange(isArranging ? 'interact' : 'arrange')}
        className={cn(
          'relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-200',
          'hover:scale-105 active:scale-95',
          isArranging
            ? 'bg-leaf text-primary-foreground shadow-leaf'
            : 'garden-icon-button'
        )}
        title={isArranging ? 'Done arranging' : 'Arrange garden'}
        aria-pressed={isArranging}
      >
        <Pencil className="w-5 h-5" strokeWidth={2.5} />
        <span className="text-[10px] font-medium leading-none">Arrange</span>

        {isArranging && (
          <div className="absolute inset-0 rounded-xl bg-bloom/20 animate-pulse pointer-events-none" />
        )}
      </button>
    </div>
  )
}
