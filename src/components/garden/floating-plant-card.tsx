'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'
import { Button } from '@/components/ui/button'
import { AlertTriangle, BarChart3, Check, Droplets, Flame, Sprout, X } from 'lucide-react'

interface FloatingPlantCardProps {
  plant: PlantWithType | null
  position: { x: number; y: number }
  todayLogs?: Array<{ time: string; value?: number; notes?: string }>
  todayValue?: number
  onClose: () => void
  onLog: () => void
  onDetails: () => void
}

function getPlantGradient(plantTypeId: string): string {
  const gradients: Record<string, string> = {
    cactus: 'from-leaf to-canopy',
    rose: 'from-bloom to-[#C96B88]',
    bonsai: 'from-canopy to-leaf',
    bamboo: 'from-sage to-leaf',
    lotus: 'from-bloom to-[#D18AA2]',
    'cherry-blossom': 'from-bloom to-[#D18AA2]',
    'fruit-tree': 'from-honey to-[#D7893A]',
    sunflower: 'from-honey to-[#D7893A]',
  }

  for (const [key, value] of Object.entries(gradients)) {
    if (plantTypeId.toLowerCase().includes(key)) {
      return value
    }
  }

  return 'from-leaf to-canopy'
}

function getMoistureText(moisture: number) {
  if (moisture >= 70) return 'text-leaf'
  if (moisture >= 40) return 'text-honey'
  if (moisture >= 20) return 'text-[#B7793A]'
  return 'text-bloom'
}

function getMoistureFill(moisture: number) {
  if (moisture >= 70) return 'bg-leaf'
  if (moisture >= 40) return 'bg-honey'
  if (moisture >= 20) return 'bg-[#D7893A]'
  return 'bg-bloom'
}

/**
 * Floating info card that appears on long-press or right-click.
 * Uses Habien v3 garden chrome so the card feels like a world object, not a dashboard popover.
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

  useEffect(() => {
    if (!cardRef.current || !plant) return

    const frame = window.requestAnimationFrame(() => {
      if (!cardRef.current) return

      const card = cardRef.current
      const rect = card.getBoundingClientRect()
      const padding = 16

      let x = position.x
      let y = position.y

      if (x + rect.width + padding > window.innerWidth) {
        x = window.innerWidth - rect.width - padding
      }
      if (x < padding) {
        x = padding
      }
      if (y + rect.height + padding > window.innerHeight) {
        y = position.y - rect.height - 20
      }
      if (y < padding) {
        y = padding
      }

      setAdjustedPosition({ x, y })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [position, plant])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

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
      <div className="fixed inset-0 z-40 bg-canopy/10 backdrop-blur-[2px] animate-in fade-in duration-150" />

      <div
        ref={cardRef}
        className={cn(
          'garden-chrome fixed z-50 w-80 overflow-hidden rounded-2xl border border-cream/70 shadow-2xl',
          'animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-200'
        )}
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
        }}
      >
        <div className={cn('h-1 bg-linear-to-r', gradient)} />

        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cn('absolute inset-0 blur-xl opacity-35 bg-linear-to-r', gradient)} />
              <span className="relative text-4xl drop-shadow-lg">{plant.plant_type.icon}</span>
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-canopy text-lg leading-tight truncate">{plant.name}</h3>
              <p className="text-xs text-canopy/55">{plant.plant_type.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-leaf/10 transition-colors text-canopy/45 hover:text-canopy"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 flex items-center gap-4 border-y border-canopy/10 bg-cream/30">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Droplets className="h-4 w-4 text-moisture" />
              <span className={cn('text-lg font-bold tabular-nums', getMoistureText(moisturePercent))}>
                {moisturePercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-canopy/10 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', getMoistureFill(moisturePercent))}
                style={{ width: `${moisturePercent}%` }}
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Sprout className="h-4 w-4 text-leaf" />
              <span className="text-lg font-bold tabular-nums text-leaf">{growthPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-canopy/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-leaf to-canopy rounded-full transition-all"
                style={{ width: `${growthPercent}%` }}
              />
            </div>
          </div>

          {plant.current_streak > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-honey/15 rounded-lg border border-honey/35">
              <Flame className="h-3.5 w-3.5 text-honey" />
              <span className="font-bold text-canopy text-sm">{plant.current_streak}</span>
            </div>
          )}
        </div>

        {hasGoal && todayLogs.length > 0 && (
          <div className="px-4 py-3 border-b border-canopy/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-canopy/55 uppercase tracking-wider">
                Today&apos;s Activity
              </span>
              <span className="text-xs font-bold text-leaf inline-flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                {todayLogs.length} logs {todayValue !== undefined && `- ${todayValue} total`}
              </span>
            </div>
            <div className="space-y-1.5 max-h-24 overflow-y-auto">
              {todayLogs.slice(0, 3).map((log, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-canopy/70">
                  <Check className="h-3 w-3 text-leaf" />
                  <span className="text-canopy/45">{log.time}</span>
                  {log.value !== undefined && <span className="font-medium">{log.value}</span>}
                  {log.notes && <span className="text-canopy/45 truncate flex-1">{log.notes}</span>}
                </div>
              ))}
              {todayLogs.length > 3 && (
                <span className="text-xs text-canopy/45">+{todayLogs.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        {isThirsty && (
          <div className="mx-4 mt-3 p-2.5 bg-bloom/15 rounded-lg border border-bloom/35 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-bloom animate-pulse" />
            <span className="text-sm font-medium text-canopy">
              This plant is thirsty! Water it soon.
            </span>
          </div>
        )}

        <div className="p-4 flex gap-2">
          <Button
            onClick={onLog}
            className="flex-1 h-10 bg-leaf hover:bg-canopy text-white font-semibold shadow-leaf transition-all duration-200"
          >
            <Droplets className="w-4 h-4 mr-2" />
            {hasGoal ? 'Log' : 'Water'}
          </Button>

          <Button
            onClick={onDetails}
            variant="outline"
            className="flex-1 h-10 border-canopy/20 text-canopy hover:bg-leaf/10 hover:text-canopy"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Details
          </Button>
        </div>
      </div>
    </>
  )
}
