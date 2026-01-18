'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PlantWithType, GoalLog } from '@/types/database'
import { Button } from '@/components/ui/button'
import { X, Droplets, BarChart3 } from 'lucide-react'

interface FloatingPlantCardProps {
  plant: PlantWithType | null
  position: { x: number; y: number }
  todayLogs?: Array<{ time: string; value?: number; notes?: string }>
  todayValue?: number
  onClose: () => void
  onLog: () => void
  onDetails: () => void
}

// Get gradient based on plant type
function getPlantGradient(plantTypeId: string): string {
  const gradients: Record<string, string> = {
    'cactus': 'from-emerald-500 to-green-600',
    'rose': 'from-pink-500 to-rose-600',
    'bonsai': 'from-green-600 to-emerald-700',
    'bamboo': 'from-lime-500 to-green-600',
    'lotus': 'from-pink-400 to-fuchsia-500',
    'cherry-blossom': 'from-pink-300 to-rose-400',
    'money-tree': 'from-yellow-500 to-amber-600',
    'fruit-tree': 'from-orange-400 to-red-500',
    'sunflower': 'from-yellow-400 to-orange-500',
  }
  for (const [key, value] of Object.entries(gradients)) {
    if (plantTypeId.toLowerCase().includes(key)) {
      return value
    }
  }
  return 'from-green-500 to-emerald-600'
}

/**
 * Floating info card that appears on long-press or right-click.
 * Shows plant details, today's activity, and quick actions.
 */
export function FloatingPlantCard({
  plant,
  position,
  todayLogs = [],
  todayValue,
  onClose,
  onLog,
  onDetails,
}: FloatingPlantCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  // Adjust position to avoid overflow
  useEffect(() => {
    if (!cardRef.current || !plant) return

    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    const padding = 16

    let x = position.x
    let y = position.y

    // Adjust horizontal position
    if (x + rect.width + padding > window.innerWidth) {
      x = window.innerWidth - rect.width - padding
    }
    if (x < padding) {
      x = padding
    }

    // Adjust vertical position
    if (y + rect.height + padding > window.innerHeight) {
      y = position.y - rect.height - 20 // Show above
    }
    if (y < padding) {
      y = padding
    }

    setAdjustedPosition({ x, y })
  }, [position, plant])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Close on escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!plant) return null

  const gradient = getPlantGradient(plant.plant_type.id)
  const moisturePercent = plant.current_moisture
  const growthPercent = Math.round(plant.growth_percentage)
  const isThirsty = moisturePercent < 30 && plant.status !== 'dead'
  const hasGoal = !!plant.goal_mode

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-150" />

      {/* Card */}
      <div
        ref={cardRef}
        className={cn(
          'fixed z-50 w-80',
          'bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl',
          'animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-200',
          'overflow-hidden'
        )}
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
        }}
      >
        {/* Gradient accent bar */}
        <div className={cn('h-1 bg-linear-to-r', gradient)} />

        {/* Header */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            {/* Plant icon with glow */}
            <div className="relative">
              <div className={cn('absolute inset-0 blur-xl opacity-50 bg-linear-to-r', gradient)} />
              <span className="relative text-4xl drop-shadow-lg">{plant.plant_type.icon}</span>
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-white text-lg leading-tight truncate">{plant.name}</h3>
              <p className="text-xs text-slate-400">{plant.plant_type.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 flex items-center gap-4 border-y border-slate-700/50 bg-slate-800/30">
          {/* Moisture */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">💧</span>
              <span
                className={cn(
                  'text-lg font-bold tabular-nums',
                  moisturePercent >= 70
                    ? 'text-emerald-400'
                    : moisturePercent >= 40
                    ? 'text-amber-400'
                    : moisturePercent >= 20
                    ? 'text-orange-400'
                    : 'text-red-400'
                )}
              >
                {moisturePercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  moisturePercent >= 70
                    ? 'bg-emerald-500'
                    : moisturePercent >= 40
                    ? 'bg-amber-500'
                    : moisturePercent >= 20
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${moisturePercent}%` }}
              />
            </div>
          </div>

          {/* Growth */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">🌱</span>
              <span className="text-lg font-bold tabular-nums text-green-400">{growthPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                style={{ width: `${growthPercent}%` }}
              />
            </div>
          </div>

          {/* Streak */}
          {plant.current_streak > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-900/50 rounded-lg border border-orange-500/30">
              <span className="text-sm">🔥</span>
              <span className="font-bold text-orange-400 text-sm">{plant.current_streak}</span>
            </div>
          )}
        </div>

        {/* Today's Activity (for goal plants) */}
        {hasGoal && todayLogs.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Today&apos;s Activity
              </span>
              <span className="text-xs font-bold text-emerald-400">
                💧 {todayLogs.length} logs {todayValue !== undefined && `• ${todayValue} total`}
              </span>
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {todayLogs.slice(0, 3).map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-slate-500">{log.time}</span>
                  {log.value !== undefined && (
                    <span className="font-medium">{log.value}</span>
                  )}
                  {log.notes && (
                    <span className="text-slate-500 truncate flex-1">{log.notes}</span>
                  )}
                </div>
              ))}
              {todayLogs.length > 3 && (
                <span className="text-xs text-slate-500">
                  +{todayLogs.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Warning */}
        {isThirsty && (
          <div className="mx-4 mt-3 p-2.5 bg-red-900/30 rounded-lg border border-red-500/30 flex items-center gap-2">
            <span className="animate-pulse">⚠️</span>
            <span className="text-sm font-medium text-red-400">
              This plant is thirsty! Water it soon.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex gap-2">
          <Button
            onClick={onLog}
            className={cn(
              'flex-1 h-10',
              'bg-linear-to-r from-emerald-500 to-green-600',
              'hover:from-emerald-400 hover:to-green-500',
              'text-white font-semibold shadow-lg shadow-emerald-500/30',
              'transition-all duration-200'
            )}
          >
            <Droplets className="w-4 h-4 mr-2" />
            {hasGoal ? 'Log' : 'Water'}
          </Button>

          <Button
            onClick={onDetails}
            variant="outline"
            className="flex-1 h-10 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Details
          </Button>
        </div>
      </div>
    </>
  )
}
