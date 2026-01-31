'use client'

/**
 * Gentle Watering Modal - 3-Action Flow
 *
 * Philosophy:
 * - Watering ≠ Completing
 * - 💧 Water = "I'm caring for you"
 * - 📊 Log Progress = "I achieved something"
 * - 😴 Rest Day = "I'm taking care of myself"
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
  Moon,
  Heart,
  Lightbulb,
} from 'lucide-react'
import { resolveGrowthConflict } from '@/lib/actions/plants'
import { waterPlantSimple, markRestDay, getRestDaysRemaining } from '@/lib/actions/activity'
import { toast } from 'sonner'

type ActionMode = 'choose' | 'water' | 'log' | 'rest'

interface GentleWateringModalProps {
  plant: PlantWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onWater?: (notes?: string) => Promise<void>
  onLogProgress?: () => void
  estimatedXp?: number
  journalStreak?: number
  hasGoal?: boolean
}

// Calculate note bonus based on note length
function calculateNoteBonus(noteLength: number, journalStreak: number): number {
  if (noteLength === 0) return 0
  let bonus = 3
  if (noteLength > 50) bonus += 2
  if (noteLength > 100) bonus += 2
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
  onLogProgress,
  estimatedXp = 8,
  journalStreak = 0,
  hasGoal = false,
}: GentleWateringModalProps) {
  const [mode, setMode] = useState<ActionMode>('choose')
  const [notes, setNotes] = useState('')
  const [restReason, setRestReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [restDaysRemaining, setRestDaysRemaining] = useState(2)
  const notesRef = useRef<HTMLTextAreaElement>(null)

  // Calculate note bonus XP
  const noteBonus = useMemo(() => {
    return calculateNoteBonus(notes.trim().length, journalStreak)
  }, [notes, journalStreak])

  const totalXp = estimatedXp + noteBonus

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setMode('choose')
      setNotes('')
      setRestReason('')
      // Fetch rest days remaining
      if (plant) {
        getRestDaysRemaining(plant.id).then(setRestDaysRemaining)
      }
    }
  }, [open, plant])

  // Focus textarea when entering water mode
  useEffect(() => {
    if (mode === 'water' && window.matchMedia('(min-width: 640px)').matches) {
      setTimeout(() => notesRef.current?.focus(), 100)
    }
  }, [mode])

  const handleWater = async () => {
    if (isLoading || !plant) return
    setIsLoading(true)

    try {
      if (onWater) {
        await onWater(notes.trim() || undefined)
      } else {
        const result = await waterPlantSimple(plant.id, notes.trim() || undefined)
        if (result.success) {
          toast.success(result.message || 'Plant watered!', {
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

  const handleRestDay = async () => {
    if (isLoading || !plant) return
    setIsLoading(true)

    try {
      const result = await markRestDay({
        plant_id: plant.id,
        reason: restReason.trim() || undefined,
      })

      if (result.success) {
        toast.success('Rest day marked', {
          description: result.message,
          icon: '💚',
        })
        onOpenChange(false)
      } else {
        toast.error('Could not mark rest day', { description: result.error })
      }
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
              {/* Water Only Button */}
              <Button
                onClick={() => setMode('water')}
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
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div>Water Plant</div>
                    <div className="text-xs opacity-70">Just checking in, caring for you</div>
                  </div>
                </div>
              </Button>

              {/* Log Progress Button (if has goal) */}
              {hasGoal && onLogProgress && (
                <Button
                  onClick={() => {
                    onOpenChange(false)
                    onLogProgress()
                  }}
                  className={cn(
                    'w-full h-14 justify-start px-4',
                    'bg-gradient-to-r from-indigo-600 to-purple-600',
                    'hover:from-indigo-500 hover:to-purple-500',
                    'text-white font-medium text-base',
                    'shadow-lg shadow-indigo-500/20',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div>Log Progress</div>
                      <div className="text-xs opacity-70">Record what you achieved today</div>
                    </div>
                  </div>
                </Button>
              )}

              {/* Rest Day Button */}
              <Button
                onClick={() => setMode('rest')}
                variant="outline"
                className={cn(
                  'w-full h-14 justify-start px-4',
                  'border-slate-600 bg-slate-800/50',
                  'hover:bg-slate-700/50 hover:border-blue-500/50',
                  'text-slate-200 font-medium text-base',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Moon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div>Rest Today</div>
                    <div className="text-xs text-slate-400">
                      {restDaysRemaining > 0
                        ? `${restDaysRemaining} rest days left this week`
                        : 'No rest days left this week'}
                    </div>
                  </div>
                </div>
              </Button>
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

          {/* MODE: Rest Day */}
          {mode === 'rest' && (
            <div className="space-y-4">
              <button
                onClick={() => setMode('choose')}
                className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
              >
                ← Back to options
              </button>

              {/* Encouraging message */}
              <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Heart className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-200">Rest is part of growth</h4>
                    <p className="text-xs text-blue-200/70 mt-1">
                      Taking intentional rest days is healthy and celebrated here.
                      Your streak stays protected. 💚
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason (optional) */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">
                  Why are you resting? (optional)
                </label>
                <Textarea
                  value={restReason}
                  onChange={(e) => setRestReason(e.target.value)}
                  placeholder="Feeling tired, busy day, just need a break..."
                  maxLength={200}
                  className={cn(
                    'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500',
                    'focus:border-blue-500 focus:ring-blue-500/20',
                    'resize-none h-20',
                  )}
                />
              </div>

              {/* Mark Rest Day Button */}
              <Button
                onClick={handleRestDay}
                disabled={isLoading || restDaysRemaining <= 0}
                className={cn(
                  'w-full h-12',
                  'bg-gradient-to-r from-blue-600 to-indigo-600',
                  'hover:from-blue-500 hover:to-indigo-500',
                  'text-white font-semibold text-base',
                  'shadow-lg shadow-blue-500/30',
                  'disabled:opacity-50',
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Marking...
                  </>
                ) : restDaysRemaining <= 0 ? (
                  'No rest days left this week'
                ) : (
                  <>
                    <Moon className="w-5 h-5 mr-2" />
                    Mark as Rest Day (+2 XP)
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
