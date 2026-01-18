'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Minus, Plus, Droplets, Loader2 } from 'lucide-react'

interface QuickLogModalProps {
  plant: PlantWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLog: (value: number, notes?: string) => Promise<void>
  todayLogCount?: number
  todayValue?: number
  unit?: string
  estimatedXp?: number
}

// Predefined quick pick values
const DEFAULT_QUICK_PICKS = [10, 20, 30, 50]

/**
 * Quick log modal for goal plants.
 * Allows fast value input with +/- buttons and quick picks.
 */
export function QuickLogModal({
  plant,
  open,
  onOpenChange,
  onLog,
  todayLogCount = 0,
  todayValue = 0,
  unit = '',
  estimatedXp = 15,
}: QuickLogModalProps) {
  const [value, setValue] = useState(10)
  const [notes, setNotes] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setValue(10)
      setNotes('')
      // Focus input after animation
      setTimeout(() => inputRef.current?.select(), 100)
    }
  }, [open])

  const handleLog = async () => {
    if (isLogging || value <= 0) return

    setIsLogging(true)
    try {
      await onLog(value, notes.trim() || undefined)
      onOpenChange(false)
    } finally {
      setIsLogging(false)
    }
  }

  const handleIncrement = () => setValue((v) => v + 1)
  const handleDecrement = () => setValue((v) => Math.max(0, v - 1))

  const handleQuickPick = (v: number) => {
    setValue(v)
    inputRef.current?.focus()
  }

  if (!plant) return null

  // Determine quick picks based on unit
  const quickPicks = unit.toLowerCase().includes('km')
    ? [1, 2, 5, 10]
    : unit.toLowerCase().includes('min')
    ? [15, 30, 45, 60]
    : DEFAULT_QUICK_PICKS

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{plant.plant_type.icon}</span>
            <div>
              <DialogTitle className="text-white">{plant.name}</DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {plant.habit_description || plant.plant_type.name}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Value Input */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              How much?
            </label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDecrement}
                disabled={value <= 0}
                className="h-12 w-12 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white shrink-0"
              >
                <Minus className="w-5 h-5" />
              </Button>

              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="number"
                  value={value}
                  onChange={(e) => setValue(Math.max(0, Number(e.target.value)))}
                  className={cn(
                    'w-full h-12 text-center text-2xl font-bold',
                    'bg-slate-800 border border-slate-600 rounded-xl',
                    'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
                    'outline-none transition-all',
                    'text-white'
                  )}
                />
                {unit && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    {unit}
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleIncrement}
                className="h-12 w-12 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white shrink-0"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Picks */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">
              Quick picks
            </label>
            <div className="flex gap-2">
              {quickPicks.map((v) => (
                <button
                  key={v}
                  onClick={() => handleQuickPick(v)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                    value === v
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">
              Note (optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you accomplish?"
              maxLength={500}
              className={cn(
                'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500',
                'focus:border-emerald-500 focus:ring-emerald-500/20',
                'resize-none h-20'
              )}
            />
          </div>

          {/* Log Button */}
          <Button
            onClick={handleLog}
            disabled={isLogging || value <= 0}
            className={cn(
              'w-full h-12',
              'bg-linear-to-r from-emerald-500 to-green-600',
              'hover:from-emerald-400 hover:to-green-500',
              'text-white font-semibold text-base',
              'shadow-lg shadow-emerald-500/30',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLogging ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                <Droplets className="w-5 h-5 mr-2" />
                Log (+{estimatedXp} XP)
              </>
            )}
          </Button>

          {/* Today's Summary */}
          {todayLogCount > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <span>Today:</span>
              <span className="flex items-center gap-1">
                {Array.from({ length: Math.min(todayLogCount, 5) }).map((_, i) => (
                  <span key={i}>💧</span>
                ))}
                {todayLogCount > 5 && <span>+{todayLogCount - 5}</span>}
              </span>
              {todayValue > 0 && (
                <span className="text-emerald-400 font-medium">
                  ({todayValue} {unit} total)
                </span>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
