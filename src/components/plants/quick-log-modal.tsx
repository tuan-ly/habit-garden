'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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
import { Minus, Plus, Droplets, Loader2, Sparkles, PenLine } from 'lucide-react'

interface QuickLogModalProps {
  plant: PlantWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLog: (value: number, notes?: string) => Promise<void>
  todayLogCount?: number
  todayValue?: number
  unit?: string
  estimatedXp?: number
  journalStreak?: number
}

// Predefined quick pick values
const DEFAULT_QUICK_PICKS = [10, 20, 30, 50]

// Calculate note bonus based on note length (mirror server logic)
function calculateNoteBonus(noteLength: number, journalStreak: number): number {
  if (noteLength === 0) return 0

  let bonus = 3 // Base bonus
  if (noteLength > 50) bonus += 2 // Thoughtful
  if (noteLength > 100) bonus += 2 // Detailed

  // Journal streak bonus
  if (journalStreak >= 30) bonus += 12
  else if (journalStreak >= 14) bonus += 8
  else if (journalStreak >= 7) bonus += 5
  else if (journalStreak >= 3) bonus += 3

  return bonus
}

/**
 * Quick log modal for goal plants.
 * Allows fast value input with +/- buttons and quick picks.
 * Note: First log of the day gives full XP, subsequent logs only give note XP.
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
  journalStreak = 0,
}: QuickLogModalProps) {
  const [value, setValue] = useState(10)
  const [notes, setNotes] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  // Calculate note bonus XP
  const noteBonus = useMemo(() => {
    return calculateNoteBonus(notes.trim().length, journalStreak)
  }, [notes, journalStreak])

  // First log of day gets full XP, subsequent logs only get note XP
  const isFirstLogToday = todayLogCount === 0
  const baseXp = isFirstLogToday ? estimatedXp : 0
  const totalXp = baseXp + noteBonus

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

  // Determine note bonus tier for visual feedback
  const noteLength = notes.trim().length
  const noteTier = noteLength > 100 ? 'detailed' : noteLength > 50 ? 'thoughtful' : noteLength > 0 ? 'basic' : 'none'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
              <span className="relative text-3xl">{plant.plant_type.icon}</span>
            </div>
            <div>
              <DialogTitle className="text-white">{plant.name}</DialogTitle>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>{plant.habit_description || plant.plant_type.name}</span>
                {journalStreak > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-purple-400">Journal: {journalStreak} days 📝</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
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

          {/* Notes with XP Bonus Indicator */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5" />
                Note (optional)
              </label>
              {noteBonus > 0 && (
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 transition-all",
                  noteTier === 'detailed'
                    ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30"
                    : noteTier === 'thoughtful'
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-emerald-500/20 text-emerald-300"
                )}>
                  <Sparkles className="w-3 h-3" />
                  +{noteBonus} XP
                </span>
              )}
            </div>
            <Textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you accomplish? How did it feel?"
              maxLength={500}
              className={cn(
                'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500',
                'focus:border-emerald-500 focus:ring-emerald-500/20',
                'resize-none h-20 transition-all',
                noteBonus > 0 && 'border-emerald-500/50'
              )}
            />

            {/* Note bonus tiers hint */}
            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
              <span className={cn(
                "px-1.5 py-0.5 rounded",
                noteLength > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800"
              )}>
                Any note +3
              </span>
              <span className={cn(
                "px-1.5 py-0.5 rounded",
                noteLength > 50 ? "bg-blue-500/20 text-blue-400" : "bg-slate-800"
              )}>
                50+ chars +2
              </span>
              <span className={cn(
                "px-1.5 py-0.5 rounded",
                noteLength > 100 ? "bg-purple-500/20 text-purple-400" : "bg-slate-800"
              )}>
                100+ chars +2
              </span>
            </div>
          </div>

          {/* Motivation tip when no note on subsequent logs */}
          {!isFirstLogToday && noteLength === 0 && (
            <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20 text-xs text-amber-200/80">
              <p className="flex items-start gap-2">
                <span className="text-base">💡</span>
                <span>
                  <strong>Tip:</strong> You've already logged today, so this entry won't earn base XP.
                  However, adding a note will still earn you bonus XP! Reflect on what you accomplished.
                </span>
              </p>
            </div>
          )}

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
                Log (+{totalXp} XP)
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
