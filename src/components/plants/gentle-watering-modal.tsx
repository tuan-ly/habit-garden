'use client'

/**
 * Gentle Watering Modal - 3-Action Flow
 *
 * Philosophy:
 * - Watering ≠ Completing
 * 📊 Log Progress = "I achieved something"
 * - 💧 Water = "Just checking in"
 * - 
 * - 
 */

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
import {
  Droplets,
  Loader2,
  Sprout,
  ArrowUpRight,
  Move,
  Sparkles,
  PenLine,
  BarChart3,
  Minus,
  Plus,
  Lightbulb,
  Info,
} from 'lucide-react'
import { resolveGrowthConflict } from '@/lib/actions/plants'
import { waterPlantSimple, logProgress } from '@/lib/actions/activity'
import { toast } from 'sonner'
import { XP_VALUES, isMorningTime } from '@/lib/xp-constants'

type ActionMode = 'choose' | 'water' | 'log' | 'rest'

interface GentleWateringModalProps {
  plant: PlantWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called for "Just checking in" water action. Receives notes and estimated XP from modal */
  onWater?: (notes: string | undefined, estimatedXp: number) => Promise<void>
  /** Called for "I did it" log action. Receives value, notes and estimated XP from modal */
  onLogAndWater?: (value: number | undefined, notes: string | undefined, estimatedXp: number) => Promise<void>
  /** Called when user clicks "View Details" link */
  onDetails?: () => void
  estimatedXp?: number
  journalStreak?: number
  hasGoal?: boolean
  goalUnit?: string
  goalMode?: 'build_capacity' | 'total_progress'
  isWateredToday?: boolean
}

// Calculate note bonus based on note length
function calculateNoteBonus(noteLength: number, journalStreak: number): number {
  if (noteLength === 0) return 0
  let bonus = XP_VALUES.NOTE_ANY
  if (noteLength > 50) bonus += XP_VALUES.NOTE_LONG
  if (noteLength > 100) bonus += XP_VALUES.NOTE_VERY_LONG
  if (journalStreak >= 30) bonus += 12
  else if (journalStreak >= 14) bonus += 8
  else if (journalStreak >= 7) bonus += 5
  else if (journalStreak >= 3) bonus += 3
  return bonus
}

export function GentleWateringModal({
  plant,
  open,
  onOpenChange,
  onWater,
  onLogAndWater,
  onDetails,
  estimatedXp = 8, // Deprecated prop, using constants now
  journalStreak = 0,
  hasGoal = false,
  goalUnit = '',
  goalMode,
  isWateredToday = false,
}: GentleWateringModalProps) {
  const [mode, setMode] = useState<ActionMode>('choose')
  const [notes, setNotes] = useState('')
  const [logValue, setLogValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  // Calculate note bonus XP
  const noteBonus = useMemo(() => {
    return calculateNoteBonus(notes.trim().length, journalStreak)
  }, [notes, journalStreak])

  // XP Calculation using Shared Constants
  const isMorning = isMorningTime()

  // Check if first activity today (any activity, not just watering)
  // isWateredToday is passed from parent - means ANY activity exists today
  const isFirstActivityToday = !isWateredToday

  // 1. Watering XP (Just checking in)
  // Base + Morning + Note (only if first activity today)
  const wateringBaseXp = isFirstActivityToday
    ? (XP_VALUES.WATERING_BASE + (isMorning ? XP_VALUES.MORNING_BONUS : 0))
    : 0
  const totalXp = wateringBaseXp + noteBonus

  // 2. Log Progress XP (I did it) - includes watering XP if first activity today
  // Watering Base + Morning + Note + (PR bonus calculated on server)
  const logBaseXp = isFirstActivityToday
    ? (XP_VALUES.WATERING_BASE + (isMorning ? XP_VALUES.MORNING_BONUS : 0))
    : 0

  // Note: Personal record bonus is calculated on server, optimistic UI assumes standard log
  const logXp = logBaseXp + noteBonus

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMode('choose')
      setNotes('')
      setLogValue('')
    }
  }, [open])

  // Focus textarea when entering water mode
  useEffect(() => {
    if (mode === 'water' && window.matchMedia('(min-width: 640px)').matches) {
      setTimeout(() => notesRef.current?.focus(), 100)
    }
  }, [mode])

  const handleWater = async () => {
    if (isLoading || !plant) return
    setIsLoading(true)

    // If external onWater callback is provided, close modal IMMEDIATELY
    // Parent component handles the async call and celebration
    if (onWater) {
      onOpenChange(false)
      // Fire and forget - parent handles the async call
      // Pass totalXp (watering XP) calculated by modal
      onWater(notes.trim() || undefined, totalXp).finally(() => {
        setIsLoading(false)
      })
      return
    }

    // Fallback: handle internally if no onWater callback
    try {
      const result = await waterPlantSimple(plant.id, notes.trim() || undefined)
      if (result.success) {
        toast.success(result.message || 'Plant watered!', {
          description: `+${result.xpEarned} XP`,
        })
      } else {
        toast.error('Could not water plant', { description: result.error })
      }
      onOpenChange(false)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogAndWater = async () => {
    if (isLoading || !plant) return
    setIsLoading(true)

    const value = logValue.trim() ? parseFloat(logValue) : undefined

    // If external callback is provided, close modal IMMEDIATELY
    // Parent component handles the async call and celebration
    if (onLogAndWater) {
      onOpenChange(false)
      // Fire and forget - parent handles the async call
      // Pass logXp (progress logging XP) calculated by modal
      onLogAndWater(value, notes.trim() || undefined, logXp).finally(() => {
        setIsLoading(false)
      })
      return
    }

    // Fallback: handle internally if no onLogAndWater callback
    try {
      // First log progress if has goal
      if (hasGoal && value !== undefined) {
        const logResult = await logProgress({
          plant_id: plant.id,
          activity_type: 'progress',
          value,
          notes: notes.trim() || undefined,
        })
        if (logResult.success) {
          toast.success(logResult.message || 'Progress logged!', {
            description: `+${logResult.xpEarned} XP${logResult.isPersonalRecord ? ' 🏆 New Record!' : ''}`,
          })
        } else {
          toast.error('Could not log progress', { description: logResult.error })
        }
      } else {
        // Just water with notes
        const result = await waterPlantSimple(plant.id, notes.trim() || undefined)
        if (result.success) {
          toast.success('Great job! 🎉', {
            description: `+${result.xpEarned} XP`,
          })
        } else {
          toast.error('Could not water plant', { description: result.error })
        }
      }
      onOpenChange(false)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolveConflict = async () => {
    if (isResolving || !plant) return
    setIsResolving(true)
    try {
      const result = await resolveGrowthConflict(plant.id)
      if (result.success) {
        toast.success('Garden Rearranged!', {
          description: `${plant.name} has grown and neighbors have been moved.`,
        })
        onOpenChange(false)
      } else {
        toast.error('Could not expand', {
          description: result.error || 'Failed to rearrange garden.',
        })
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsResolving(false)
    }
  }

  if (!plant) return null

  const noteLength = notes.trim().length
  const noteTier = noteLength > 100 ? 'detailed' : noteLength > 50 ? 'thoughtful' : noteLength > 0 ? 'basic' : 'none'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
              <span className="relative text-3xl">{plant.plant_type.icon}</span>
            </div>
            <div>
              <DialogTitle className="text-white flex items-center gap-2">
                {plant.name}
              </DialogTitle>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>Streak: {plant.current_streak} days</span>
                {plant.current_streak > 3 && <span>🔥</span>}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Plant Stats (merged from FloatingCard) */}
        {mode === 'choose' && (
          <div className="flex items-center gap-4 px-1 py-3 border-b border-slate-700/50">
            {/* Moisture */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">💧</span>
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    plant.current_moisture >= 70
                      ? 'text-emerald-400'
                      : plant.current_moisture >= 40
                        ? 'text-amber-400'
                        : plant.current_moisture >= 20
                          ? 'text-orange-400'
                          : 'text-red-400'
                  )}
                >
                  {plant.current_moisture}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    plant.current_moisture >= 70
                      ? 'bg-emerald-500'
                      : plant.current_moisture >= 40
                        ? 'bg-amber-500'
                        : plant.current_moisture >= 20
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                  )}
                  style={{ width: `${plant.current_moisture}%` }}
                />
              </div>
            </div>

            {/* Growth */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">🌱</span>
                <span className="text-sm font-bold tabular-nums text-green-400">
                  {Math.round(plant.growth_percentage)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${plant.growth_percentage}%` }}
                />
              </div>
            </div>

            {/* Streak badge */}
            {plant.current_streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-900/50 rounded-lg border border-orange-500/30">
                <span className="text-sm">🔥</span>
                <span className="font-bold text-orange-400 text-sm">{plant.current_streak}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Growth Conflict Resolution */}
          {plant.growth_blocked && (
            <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-500/20 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-full">
                  <Move className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-200">Needs Space to Grow!</h4>
                  <p className="text-xs text-amber-200/70 mt-1">
                    This plant is ready to expand but is blocked by neighbors.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleResolveConflict}
                disabled={isResolving}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white border-amber-500"
                size="sm"
              >
                {isResolving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rearranging...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Expand & Auto-Arrange
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Why I Started - Motivation reminder */}
          {plant.why_i_started && mode === 'choose' && (
            <div className="p-3 rounded-lg bg-purple-900/10 border border-purple-500/20">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-purple-300/70 mb-1">Why I started:</p>
                  <p className="text-sm text-purple-200 italic">&ldquo;{plant.why_i_started}&rdquo;</p>
                </div>
              </div>
            </div>
          )}

          {/* MODE: Choose Action */}
          {mode === 'choose' && (
            <div className="space-y-3">
              {/* I Did It  - Primary */}
              <Button
                onClick={() => setMode('log')}
                className={cn(
                  'w-full h-14 justify-start px-4',
                  'bg-gradient-to-r from-emerald-600 to-green-600',
                  'hover:from-emerald-500 hover:to-green-500',
                  'text-white font-medium text-base',
                  'shadow-lg shadow-emerald-500/20',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div>I did it!</div>
                    <div className="text-xs opacity-70">Record your progress</div>
                  </div>
                </div>
              </Button>

              {/* Just Checking In - Secondary - Only show if NOT watered today */}
              {!isWateredToday && (
                <Button
                  onClick={() => setMode('water')}
                  variant="outline"
                  className={cn(
                    'w-full h-14 justify-start px-4',
                    'border-slate-600 bg-slate-800/50',
                    'hover:bg-slate-700/50 hover:border-emerald-500/50',
                    'text-slate-200 font-medium text-base',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Droplets className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-left">
                      <div>Just checking in</div>
                      <div className="text-xs text-slate-400">Water only</div>
                    </div>
                  </div>
                </Button>
              )}

              {/* Details link - smaller tertiary option */}
              {onDetails && (
                <button
                  onClick={onDetails}
                  className="w-full text-sm text-slate-400 hover:text-slate-300 flex items-center gap-1.5 justify-center mt-2 py-2"
                >
                  <Info className="w-4 h-4" />
                  View plant details
                </button>
              )}
            </div>
          )}

          {/* MODE: Water */}
          {mode === 'water' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('choose')}
                className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
              >
                ← Back to options
              </button>

              {/* Encouraging message */}
              <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-200">Great job! 🎉</h4>
                    <p className="text-xs text-emerald-200/70 mt-1">
                      Every small step counts toward your goals.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes with XP Bonus */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5" />
                    Add a reflection (optional)
                  </label>
                  {noteBonus > 0 && (
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1',
                      noteTier === 'detailed'
                        ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30'
                        : noteTier === 'thoughtful'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-emerald-500/20 text-emerald-300'
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
                  placeholder="How are you feeling? Any thoughts to capture?"
                  maxLength={500}
                  className={cn(
                    'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500',
                    'focus:border-emerald-500 focus:ring-emerald-500/20',
                    'resize-none h-24',
                    noteBonus > 0 && 'border-emerald-500/50'
                  )}
                />

                {/* Note bonus tiers */}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                  <span className={cn(
                    'px-1.5 py-0.5 rounded',
                    noteLength > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800'
                  )}>
                    Any note +3
                  </span>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded',
                    noteLength > 50 ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800'
                  )}>
                    50+ chars +2
                  </span>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded',
                    noteLength > 100 ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800'
                  )}>
                    100+ chars +2
                  </span>
                </div>
              </div>

              {/* Water Button */}
              <Button
                onClick={handleWater}
                disabled={isLoading}
                className={cn(
                  'w-full h-12',
                  'bg-gradient-to-r from-emerald-500 to-green-600',
                  'hover:from-emerald-400 hover:to-green-500',
                  'text-white font-semibold text-base',
                  'shadow-lg shadow-emerald-500/30',
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Watering...
                  </>
                ) : (
                  <>
                    <Droplets className="w-5 h-5 mr-2" />
                    Water Plant (+{totalXp} XP)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* MODE: Log Progress (I did it today!) */}
          {mode === 'log' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('choose')}
                className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
              >
                ← Back to options
              </button>

              {/* Encouraging message */}
              <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-200">Great job! 🎉</h4>
                    <p className="text-xs text-emerald-200/70 mt-1">
                      Every small step counts toward your goals.
                    </p>
                  </div>
                </div>
              </div>



              {/* Number input for goals - FIRST */}
              {hasGoal && (
                <>
                  {/* Value Input with +/- buttons */}
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">
                      How much?
                    </label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setLogValue(v => String(Math.max(0, (parseInt(v) || 0) - 1)))}
                        disabled={!logValue || parseInt(logValue) <= 0}
                        className="h-12 w-12 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white shrink-0"
                      >
                        <Minus className="w-5 h-5" />
                      </Button>

                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={logValue}
                          onChange={(e) => setLogValue(e.target.value)}
                          className={cn(
                            'w-full h-12 text-center text-2xl font-bold',
                            'bg-slate-800 border border-slate-600 rounded-xl',
                            'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
                            'outline-none transition-all',
                            'text-white'
                          )}
                        />
                        {goalUnit && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                            {goalUnit}
                          </span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setLogValue(v => String((parseInt(v) || 0) + 1))}
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
                      {(goalUnit?.toLowerCase().includes('km')
                        ? [1, 2, 5, 10]
                        : goalUnit?.toLowerCase().includes('min')
                          ? [15, 30, 45, 60]
                          : [10, 20, 30, 50]
                      ).map((v) => (
                        <button
                          key={v}
                          onClick={() => setLogValue(String(v))}
                          className={cn(
                            'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                            parseInt(logValue) === v
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Notes with XP Bonus */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5" />
                    Note (optional)
                  </label>
                  {noteBonus > 0 && (
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1',
                      noteTier === 'detailed'
                        ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30'
                        : noteTier === 'thoughtful'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-emerald-500/20 text-emerald-300'
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
                    'resize-none h-20',
                    noteBonus > 0 && 'border-emerald-500/50'
                  )}
                />
                {/* Note bonus tiers hint */}
                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    notes.trim().length > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800"
                  )}>
                    Any note +3
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    notes.trim().length > 50 ? "bg-blue-500/20 text-blue-400" : "bg-slate-800"
                  )}>
                    50+ chars +2
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded",
                    notes.trim().length > 100 ? "bg-purple-500/20 text-purple-400" : "bg-slate-800"
                  )}>
                    100+ chars +2
                  </span>
                </div>
              </div>

              {/* Motivation tip when no note on subsequent logs */}
              {!isFirstActivityToday && noteLength === 0 && (
                <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/20 text-xs text-amber-200/80">
                  <p className="flex items-start gap-2">
                    <span className="text-base">💡</span>
                    <span>
                      <strong>Tip:</strong> Adding a note earns bonus XP! Reflect on what you accomplished.
                    </span>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleLogAndWater}
                disabled={isLoading || (hasGoal && (!logValue || parseInt(logValue) <= 0))}
                className={cn(
                  'w-full h-12',
                  'bg-gradient-to-r from-emerald-500 to-green-600',
                  'hover:from-emerald-400 hover:to-green-500',
                  'text-white font-semibold text-base',
                  'shadow-lg shadow-emerald-500/30',
                  'disabled:opacity-50',
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <Droplets className="w-5 h-5 mr-2" />
                    Log (+{logXp} XP)
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Status footer */}
          <div className="flex justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <Sprout className="w-3 h-3" />
              Growth: {Math.round(plant.growth_percentage)}%
            </span>
            <span>
              Total Waterings: {plant.total_waterings}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
