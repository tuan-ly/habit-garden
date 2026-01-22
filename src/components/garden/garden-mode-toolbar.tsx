'use client'

import { useState, useEffect } from 'react'
import { Eye, Droplet, Move, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type GardenMode = 'explore' | 'water' | 'edit'

interface GardenModeToolbarProps {
  mode: GardenMode
  onModeChange: (mode: GardenMode) => void
  className?: string
  // Optional: show hint text
  showHint?: boolean
}

const MODES: { id: GardenMode; icon: React.ElementType; label: string; shortLabel: string; hint: string }[] = [
  {
    id: 'explore',
    icon: Eye,
    label: 'Explore',
    shortLabel: 'View',
    hint: 'Pinch to zoom, drag to pan, tap for info',
  },
  {
    id: 'water',
    icon: Droplet,
    label: 'Water',
    shortLabel: 'Water',
    hint: 'Tap plants to water or log goals',
  },
  {
    id: 'edit',
    icon: Move,
    label: 'Edit',
    shortLabel: 'Move',
    hint: 'Hold and drag plants to move them',
  },
]

export function GardenModeToolbar({
  mode,
  onModeChange,
  className,
  showHint = true,
}: GardenModeToolbarProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [lastMode, setLastMode] = useState<GardenMode>(mode)

  // Show tooltip briefly when mode changes
  useEffect(() => {
    if (mode !== lastMode) {
      setShowTooltip(true)
      setLastMode(mode)
      const timer = setTimeout(() => setShowTooltip(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [mode, lastMode])

  const currentMode = MODES.find(m => m.id === mode)

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Mode hint tooltip */}
      {showHint && showTooltip && currentMode && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap animate-fade-in">
          <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-lg text-xs text-white border border-slate-700/50 shadow-lg">
            {currentMode.hint}
          </div>
        </div>
      )}

      {/* Mode buttons */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-lg">
        {MODES.map(({ id, icon: Icon, label, shortLabel }) => {
          const isActive = mode === id
          return (
            <button
              key={id}
              onClick={() => onModeChange(id)}
              className={cn(
                'relative flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              )}
              aria-label={label}
              aria-pressed={isActive}
            >
              <Icon className={cn('w-4 h-4', isActive && 'animate-pulse-slow')} />
              <span className="text-xs font-medium hidden sm:inline">{label}</span>
              <span className="text-xs font-medium sm:hidden">{shortLabel}</span>

              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Compact version for mobile - just icons
export function GardenModeToolbarCompact({
  mode,
  onModeChange,
  className,
}: Omit<GardenModeToolbarProps, 'showHint'>) {
  return (
    <div className={cn('flex items-center gap-0.5 p-1 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-lg', className)}>
      {MODES.map(({ id, icon: Icon, label }) => {
        const isActive = mode === id
        return (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            className={cn(
              'relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
            aria-label={label}
            aria-pressed={isActive}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}
    </div>
  )
}

// Mode hint banner - shows at top when mode changes
export function GardenModeHint({
  mode,
  onDismiss,
  className,
}: {
  mode: GardenMode
  onDismiss?: () => void
  className?: string
}) {
  const modeConfig = MODES.find(m => m.id === mode)
  if (!modeConfig) return null

  const Icon = modeConfig.icon

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2 rounded-full',
        'bg-slate-900/70 backdrop-blur-md border border-slate-700/50 shadow-lg',
        'text-xs text-slate-300 animate-slide-down',
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 text-emerald-400" />
      <span>{modeConfig.hint}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-1 p-0.5 rounded hover:bg-slate-700/50 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
