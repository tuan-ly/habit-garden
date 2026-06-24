'use client'

/**
 * Gentle Watering Modal — Living Garden theme
 *
 * Flow:
 * - "I did it!" → log progress + water (primary)
 * - "Not today" → show up, rest; still waters plant (secondary)
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Moon,
  Check,
  Flame,
  Leaf,
  ArrowLeft,
} from 'lucide-react'
import { resolveGrowthConflict } from '@/lib/actions/plants'
import { waterPlantSimple, logProgress } from '@/lib/actions/activity'
import {
  formatGoalValue,
  getGoalLogCopy,
  roundGoalValue,
} from '@/lib/goal-progress'
import { toast } from 'sonner'
import { XP_VALUES, isMorningTime } from '@/lib/xp-constants'

type ActionMode = 'choose' | 'water' | 'log'

interface GentleWateringModalProps {
  plant: PlantWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onWater?: (notes: string | undefined, estimatedXp: number) => Promise<void>
  onLogAndWater?: (value: number | undefined, notes: string | undefined, estimatedXp: number) => Promise<void>
  onDetails?: () => void
  estimatedXp?: number
  journalStreak?: number
  hasGoal?: boolean
  goalUnit?: string
  goalMode?: 'build_capacity' | 'total_progress'
  isWateredToday?: boolean
  periodProgress?: number
  currentPeriodTarget?: number
  periodLabel?: string
  daysLeftInPeriod?: number
}

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
  journalStreak = 0,
  hasGoal = false,
  goalUnit = '',
  goalMode,
  isWateredToday = false,
  periodProgress,
  currentPeriodTarget,
  periodLabel,
  daysLeftInPeriod,
}: GentleWateringModalProps) {
  const [mode, setMode] = useState<ActionMode>('choose')
  const [notes, setNotes] = useState('')
  const [logValue, setLogValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const logInputRef = useRef<HTMLInputElement>(null)

  const noteBonus = useMemo(() => {
    return calculateNoteBonus(notes.trim().length, journalStreak)
  }, [notes, journalStreak])

  const isMorning = isMorningTime()
  const isFirstActivityToday = !isWateredToday

  const wateringBaseXp = 0
  const totalXp = noteBonus

  const logBaseXp = isFirstActivityToday
    ? (XP_VALUES.WATERING_BASE + (isMorning ? XP_VALUES.MORNING_BONUS : 0))
    : 0
  const logXp = logBaseXp + noteBonus

  useEffect(() => {
    if (open) {
      setMode(hasGoal ? 'log' : 'choose')
      setNotes('')
      setLogValue('')
      setIsLoading(false)
    }
  }, [open, hasGoal])

  useEffect(() => {
    if (!open) return

    if (mode === 'water' && window.matchMedia('(min-width: 640px)').matches) {
      setTimeout(() => notesRef.current?.focus(), 100)
    }
    if (mode === 'log') {
      setTimeout(() => logInputRef.current?.focus(), 100)
    }
  }, [mode, open])

  const handleWater = async () => {
    if (isLoading || !plant) return
    setIsLoading(true)

    if (onWater) {
      onWater(notes.trim() || undefined, totalXp)
      setIsLoading(false)
      setTimeout(() => onOpenChange(false), 100)
      return
    }

    try {
      const result = await waterPlantSimple(plant.id, notes.trim() || undefined)
      if (result.success) {
        toast.success(result.message || 'Plant watered!', { description: `+${result.xpEarned} XP` })
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

    if (onLogAndWater) {
      onLogAndWater(value, notes.trim() || undefined, logXp)
      setIsLoading(false)
      setTimeout(() => onOpenChange(false), 100)
      return
    }

    try {
      if (hasGoal && value !== undefined) {
        const logResult = await logProgress({
          plant_id: plant.id,
          activity_type: 'progress',
          value,
          notes: notes.trim() || undefined,
        })
        if (logResult.success) {
          toast.success(logResult.message || 'Progress logged!', {
            description: `+${logResult.xpEarned} XP${logResult.isPersonalRecord ? ' — New Record!' : ''}`,
          })
        } else {
          toast.error('Could not log progress', { description: logResult.error })
        }
      } else {
        const result = await waterPlantSimple(plant.id, notes.trim() || undefined)
        if (result.success) {
          toast.success('Great job!', { description: `+${result.xpEarned} XP` })
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
        toast.error('Could not expand', { description: result.error || 'Failed to rearrange garden.' })
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
  const goalLogCopy = getGoalLogCopy(goalMode ?? 'total_progress', goalUnit)
  const numericLogValue = Number.parseFloat(logValue)
  const hasValidLogValue = Number.isFinite(numericLogValue) && numericLogValue > 0
  const logStep = goalUnit.toLowerCase().includes('km') ? 0.5 : 1
  const adjustLogValue = (delta: number) => {
    const currentValue = Number.isFinite(numericLogValue) ? numericLogValue : 0
    setLogValue(String(roundGoalValue(Math.max(0, currentValue + delta))))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto surface-paper border-0 shadow-dappled-lg p-6 gap-0">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-2xl bg-white/90 dark:bg-card flex items-center justify-center shadow-dappled">
              <span className="text-3xl">{plant.plant_type.icon}</span>
            </div>
            <div className="flex-1">
              <DialogTitle asChild>
                <h2 className="font-display text-xl font-semibold text-canopy dark:text-foreground">
                  {plant.name}
                </h2>
              </DialogTitle>
              <DialogDescription className="sr-only">
                {hasGoal
                  ? `Log measurable progress for ${plant.name}.`
                  : `Record today\u2019s check-in for ${plant.name}.`}
              </DialogDescription>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {plant.current_streak > 0 && (
                  <span className="inline-flex items-center gap-1 text-bloom">
                    <Flame className="h-3 w-3" />
                    {plant.current_streak} day{plant.current_streak !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Plant stats strip */}
        {mode === 'choose' && (
          <div className="flex items-center gap-4 py-4 mt-4 border-y border-border">
            <MiniMeter
              icon={<Droplets className="h-3.5 w-3.5" />}
              value={plant.current_moisture}
              label="Moisture"
              tone={
                plant.current_moisture >= 70 ? 'moisture'
                  : plant.current_moisture >= 40 ? 'bloom'
                    : 'danger'
              }
            />
            <div className="w-px h-10 bg-border" />
            <MiniMeter
              icon={<Leaf className="h-3.5 w-3.5" />}
              value={plant.growth_percentage}
              label="Growth"
              tone="leaf"
            />
          </div>
        )}

        <div className="space-y-4 pt-4">
          {/* Growth conflict */}
          {plant.growth_blocked && (
            <div className="p-4 rounded-2xl bg-bloom/10 ring-1 ring-bloom/25 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white/80 dark:bg-muted shadow-sm">
                  <Move className="w-4 h-4 text-bloom" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-canopy dark:text-foreground">Needs space to grow</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    This plant is ready to expand but is blocked by neighbors.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleResolveConflict}
                disabled={isResolving}
                className="w-full h-10 rounded-full bg-bloom hover:bg-bloom/90 text-canopy shadow-bloom cursor-pointer"
                size="sm"
              >
                {isResolving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Rearranging…</>
                ) : (
                  <><ArrowUpRight className="w-4 h-4 mr-2" />Expand & Auto-Arrange</>
                )}
              </Button>
            </div>
          )}

          {/* Why I started */}
          {plant.why_i_started && mode === 'choose' && (
            <div className="p-3.5 rounded-2xl bg-bloom/10 ring-1 ring-bloom/20">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-bloom flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-canopy/70 dark:text-muted-foreground mb-1">
                    Why I started
                  </p>
                  <p className="font-display text-sm text-canopy dark:text-foreground italic leading-snug">
                    &ldquo;{plant.why_i_started}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Goal context strip */}
          {hasGoal && currentPeriodTarget !== undefined && currentPeriodTarget > 0 && mode !== 'water' && (
            <div className={cn(
              'rounded-2xl p-3.5 space-y-2 ring-1',
              (periodProgress ?? 0) >= currentPeriodTarget
                ? 'bg-leaf/10 ring-leaf/25'
                : 'bg-white/70 dark:bg-card ring-border shadow-dappled'
            )}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  {periodLabel ?? 'This Week'}
                </span>
                {(periodProgress ?? 0) >= currentPeriodTarget ? (
                  <span className="text-leaf font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Done
                  </span>
                ) : (
                  <span className="text-bloom font-semibold">
                    {Math.round((currentPeriodTarget - (periodProgress ?? 0)) * 10) / 10} {goalUnit} to go
                  </span>
                )}
              </div>
              <div className="h-1.5 w-full bg-mist dark:bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-500 ease-out',
                    (periodProgress ?? 0) >= currentPeriodTarget ? 'bg-leaf' : 'bg-moss'
                  )}
                  style={{
                    width: `${Math.min(100, currentPeriodTarget > 0 ? ((periodProgress ?? 0) / currentPeriodTarget) * 100 : 0)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="tabular-nums">{periodProgress ?? 0} / {currentPeriodTarget} {goalUnit}</span>
                {daysLeftInPeriod !== undefined && (
                  <span>{daysLeftInPeriod} day{daysLeftInPeriod !== 1 ? 's' : ''} left</span>
                )}
              </div>
            </div>
          )}

          {/* MODE: Choose */}
          {mode === 'choose' && (
            <div className="space-y-2.5">
              {plant.easy_mode && plant.tiny_seed && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-moss/10 ring-1 ring-moss/20 px-3.5 py-2.5">
                  <Sprout className="h-4 w-4 text-leaf mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-canopy dark:text-foreground">Easy Mode reminder</div>
                    <div className="text-xs text-muted-foreground italic mt-0.5">&ldquo;{plant.tiny_seed}&rdquo;</div>
                  </div>
                </div>
              )}

              {/* Primary: I did it */}
              <Button
                onClick={() => setMode('log')}
                className={cn(
                  'w-full h-16 justify-start px-4 rounded-2xl cursor-pointer',
                  'bg-leaf hover:bg-canopy text-white shadow-leaf'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/15 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-display text-base font-semibold">I did it!</div>
                    <div className="text-xs opacity-80 font-normal">Record your progress</div>
                  </div>
                </div>
              </Button>

              {/* Secondary: Not today */}
              {!isWateredToday && (
                <Button
                  onClick={() => setMode('water')}
                  variant="outline"
                  className={cn(
                    'w-full h-16 justify-start px-4 rounded-2xl cursor-pointer',
                    'bg-white/70 dark:bg-card border-border hover:bg-white hover:border-moss/40 text-canopy dark:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-garden dark:bg-accent rounded-xl">
                      <Moon className="w-5 h-5 text-leaf" />
                    </div>
                    <div className="text-left">
                      <div className="font-display text-base font-semibold">Not today</div>
                      <div className="text-xs text-muted-foreground font-normal">Resting is part of growing</div>
                    </div>
                  </div>
                </Button>
              )}

              {onDetails && (
                <button
                  onClick={onDetails}
                  className="w-full text-sm text-muted-foreground hover:text-canopy dark:hover:text-foreground flex items-center gap-1.5 justify-center mt-2 py-2 cursor-pointer transition-colors"
                >
                  <Info className="w-4 h-4" />
                  View plant details
                </button>
              )}
            </div>
          )}

          {/* MODE: Not today */}
          {mode === 'water' && (
            <div className="space-y-4">
              <BackButton onClick={() => setMode('choose')} />

              <div className="p-3.5 rounded-2xl bg-sky-garden/50 dark:bg-accent ring-1 ring-moss/20">
                <div className="flex items-start gap-3">
                  <Moon className="w-5 h-5 text-leaf flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-canopy dark:text-foreground">Showing up matters</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Resting is part of growing. You&apos;re still here — that counts for everything.
                    </p>
                  </div>
                </div>
              </div>

              <NotesField
                value={notes}
                onChange={setNotes}
                bonus={noteBonus}
                tier={noteTier}
                placeholder="Tired? Busy? Just need a break? It's all okay…"
                textareaRef={notesRef}
                label="How are you feeling? (optional)"
              />

              <Button
                onClick={handleWater}
                disabled={isLoading}
                className="w-full h-12 rounded-full bg-leaf hover:bg-canopy text-white shadow-leaf font-semibold cursor-pointer"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Watering…</>
                ) : (
                  <><Moon className="w-5 h-5 mr-2" />Water plant (+{totalXp} XP)</>
                )}
              </Button>
            </div>
          )}

          {/* MODE: Log progress */}
          {mode === 'log' && (
            <div className="space-y-4">
              <BackButton onClick={() => setMode('choose')} />

              <div className="p-3.5 rounded-2xl bg-leaf/10 ring-1 ring-leaf/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-leaf flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-canopy dark:text-foreground">
                      {hasGoal ? 'Log today\u2019s progress' : 'Great job!'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {hasGoal
                        ? 'Goal progress tracks the result. Your tree grows from showing up.'
                        : 'Every small step counts toward your goals.'}
                    </p>
                  </div>
                </div>
              </div>

              {hasGoal && (
                <>
                  <div>
                    <label
                      htmlFor="goal-log-value"
                      className="text-sm font-medium text-canopy dark:text-foreground mb-1 block"
                    >
                      {goalLogCopy.label}
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">{goalLogCopy.hint}</p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustLogValue(-logStep)}
                        disabled={!hasValidLogValue}
                        aria-label={`Decrease by ${logStep} ${goalUnit}`.trim()}
                        className="h-12 w-12 rounded-xl border-border bg-white/70 dark:bg-card text-canopy dark:text-foreground hover:bg-white shrink-0 cursor-pointer"
                      >
                        <Minus className="w-5 h-5" />
                      </Button>

                      <div className="flex-1 relative">
                        <input
                          ref={logInputRef}
                          id="goal-log-value"
                          type="number"
                          inputMode="decimal"
                          min={logStep}
                          step={logStep}
                          value={logValue}
                          onChange={(e) => setLogValue(e.target.value)}
                          className={cn(
                            'w-full h-12 text-center font-display text-2xl font-semibold',
                            'bg-white/70 dark:bg-card border border-border rounded-xl',
                            'focus:border-leaf focus:ring-2 focus:ring-leaf/20',
                            'outline-none transition-all tabular-nums',
                            'text-canopy dark:text-foreground'
                          )}
                        />
                        {goalUnit && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            {goalUnit}
                          </span>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustLogValue(logStep)}
                        aria-label={`Increase by ${logStep} ${goalUnit}`.trim()}
                        className="h-12 w-12 rounded-xl border-border bg-white/70 dark:bg-card text-canopy dark:text-foreground hover:bg-white shrink-0 cursor-pointer"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
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
                            'flex-1 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer',
                            numericLogValue === v
                              ? 'bg-leaf text-white shadow-leaf'
                              : 'bg-white/70 dark:bg-card text-canopy dark:text-foreground hover:bg-mist'
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <NotesField
                value={notes}
                onChange={setNotes}
                bonus={noteBonus}
                tier={noteTier}
                placeholder="What did you accomplish? How did it feel?"
                textareaRef={notesRef}
                label="Note (optional)"
              />

              {!isFirstActivityToday && noteLength === 0 && (
                <div className="p-3 rounded-2xl bg-bloom/10 ring-1 ring-bloom/20 text-xs text-canopy/80 dark:text-foreground/80">
                  <p className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-bloom flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Tip:</strong> Adding a note earns bonus XP. Reflect on what you accomplished.
                    </span>
                  </p>
                </div>
              )}

              <Button
                onClick={handleLogAndWater}
                disabled={isLoading || (hasGoal && !hasValidLogValue)}
                className="w-full h-12 rounded-full bg-leaf hover:bg-canopy text-white shadow-leaf font-semibold cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Logging…</>
                ) : (
                  <>
                    <Droplets className="w-5 h-5 mr-2" />
                    {hasGoal && hasValidLogValue
                      ? `Log ${formatGoalValue(numericLogValue)} ${goalUnit}`.trim()
                      : `Log (+${logXp} XP)`}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between text-[11px] text-muted-foreground px-1 pt-2">
            <span className="flex items-center gap-1">
              <Sprout className="w-3 h-3" />
              {hasGoal ? 'Consistency growth' : 'Growth'}: {Math.round(plant.growth_percentage)}%
            </span>
            <span>{hasGoal ? 'Check-ins' : 'Total Waterings'}: {plant.total_waterings}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── helpers ───

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-muted-foreground hover:text-canopy dark:hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
    >
      <ArrowLeft className="w-3 h-3" />
      Back to options
    </button>
  )
}

function MiniMeter({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode
  value: number
  label: string
  tone: 'leaf' | 'moisture' | 'bloom' | 'danger'
}) {
  const toneCfg = {
    leaf: { color: 'text-leaf', bg: 'bg-leaf' },
    moisture: { color: 'text-moisture', bg: 'bg-moisture' },
    bloom: { color: 'text-bloom', bg: 'bg-bloom' },
    danger: { color: 'text-moisture-low', bg: 'bg-moisture-low' },
  }[tone]

  return (
    <div className="flex-1">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={toneCfg.color}>{icon}</span>
        <span className={cn('font-display text-sm font-semibold tabular-nums', toneCfg.color)}>
          {Math.round(value)}%
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider ml-auto">{label}</span>
      </div>
      <div className="w-full h-1.5 bg-mist dark:bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-[width]', toneCfg.bg)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

function NotesField({
  value,
  onChange,
  bonus,
  tier,
  placeholder,
  textareaRef,
  label,
}: {
  value: string
  onChange: (v: string) => void
  bonus: number
  tier: string
  placeholder: string
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  label: string
}) {
  const noteLength = value.trim().length
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <PenLine className="w-3.5 h-3.5" />
          {label}
        </label>
        {bonus > 0 && (
          <span className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1',
            tier === 'detailed' ? 'bg-leaf/15 text-leaf ring-1 ring-leaf/30'
              : tier === 'thoughtful' ? 'bg-moss/15 text-leaf'
                : 'bg-bloom/15 text-bloom'
          )}>
            <Sparkles className="w-3 h-3" />
            +{bonus} XP
          </span>
        )}
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={500}
        className={cn(
          'bg-white/70 dark:bg-card border-border text-canopy dark:text-foreground placeholder:text-muted-foreground/70',
          'focus-visible:border-leaf focus-visible:ring-leaf/20',
          'resize-none h-24 rounded-2xl'
        )}
      />
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className={cn('px-2 py-0.5 rounded-full',
          noteLength > 0 ? 'bg-bloom/15 text-bloom font-semibold' : 'bg-mist dark:bg-muted')}>
          Any +3
        </span>
        <span className={cn('px-2 py-0.5 rounded-full',
          noteLength > 50 ? 'bg-moss/20 text-leaf font-semibold' : 'bg-mist dark:bg-muted')}>
          50+ chars +2
        </span>
        <span className={cn('px-2 py-0.5 rounded-full',
          noteLength > 100 ? 'bg-leaf/15 text-leaf font-semibold' : 'bg-mist dark:bg-muted')}>
          100+ chars +2
        </span>
      </div>
    </div>
  )
}
