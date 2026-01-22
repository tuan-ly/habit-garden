'use client'

import { cn } from '@/lib/utils'
import { Droplets, Hand, Sprout } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type GardenMode = 'view' | 'drag' | 'add'

interface ModeToolbarProps {
  mode: GardenMode
  onModeChange: (mode: GardenMode) => void
  className?: string
}

const modes: { id: GardenMode; Icon: LucideIcon; label: string; description: string }[] = [
  {
    id: 'view',
    Icon: Droplets,
    label: 'Water',
    description: 'View & Water',
  },
  {
    id: 'drag',
    Icon: Hand,
    label: 'Move',
    description: 'Drag plants',
  },
  {
    id: 'add',
    Icon: Sprout,
    label: 'Plant',
    description: 'Add plants',
  },
]

export function ModeToolbar({ mode, onModeChange, className }: ModeToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-2 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl',
        className
      )}
    >
      {modes.map((m) => {
        const isActive = mode === m.id
        const Icon = m.Icon
        return (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={cn(
              'relative flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isActive
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            )}
            title={m.description}
          >
            <Icon className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-[10px] font-medium leading-none">{m.label}</span>

            {/* Active indicator glow */}
            {isActive && (
              <div className="absolute inset-0 rounded-xl bg-emerald-400/20 animate-pulse pointer-events-none" />
            )}
          </button>
        )
      })}
    </div>
  )
}
