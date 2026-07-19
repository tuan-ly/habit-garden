'use client'

import { cn } from '@/lib/utils'
import { Check, Pencil } from 'lucide-react'

export type GardenMode = 'interact' | 'arrange'

interface ModeToolbarProps {
  mode: GardenMode
  onModeChange: (mode: GardenMode) => void
  sanctuary?: boolean
  className?: string
}

/**
 * Mode toggle toolbar for the garden.
 * - interact: Click plant → watering modal
 * - arrange:  Add / move plants, place / move decorations
 */
export function ModeToolbar({ mode, onModeChange, sanctuary = false, className }: ModeToolbarProps) {
  const isArranging = mode === 'arrange'

  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-2 backdrop-blur-xl rounded-2xl border shadow-xl',
        sanctuary
          ? 'border-white/70 bg-[#fffaf0]/90 text-[#49693f]'
          : 'border-slate-700/50 bg-slate-900/80',
        className
      )}
    >
      <button
        onClick={() => onModeChange(isArranging ? 'interact' : 'arrange')}
        className={cn(
          'relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-200',
          'hover:scale-105 active:scale-95',
          isArranging
            ? sanctuary
              ? 'bg-[#56734d] text-[#fffaf0] shadow-lg shadow-[#365331]/20 ring-1 ring-[#78936d]/60'
              : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/25'
            : sanctuary
              ? 'bg-[#eef2e7]/80 text-[#49693f] hover:bg-[#e3ead9]'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
        )}
        title={isArranging ? 'Xong sắp xếp' : 'Di chuyển cây'}
        aria-label={isArranging ? 'Xong sắp xếp khu vườn' : 'Bật chế độ di chuyển cây'}
        aria-pressed={isArranging}
      >
        {isArranging
          ? <Check className="h-5 w-5" strokeWidth={2.5} />
          : <Pencil className="h-5 w-5" strokeWidth={2.5} />}
        <span className="text-[10px] font-medium leading-none">{isArranging ? 'Xong' : 'Sắp xếp'}</span>

        {isArranging && (
          <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/5" />
        )}
      </button>
    </div>
  )
}
