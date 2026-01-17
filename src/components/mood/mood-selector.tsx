'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useMood } from '@/lib/context/mood-context'
import { getAllMoodLevels, type MoodLevel, type MoodConfig } from '@/lib/mood-system'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ChevronDown, Sparkles } from 'lucide-react'

interface MoodSelectorProps {
  className?: string
}

export function MoodSelector({ className }: MoodSelectorProps) {
  const { mood, setMood, xpMultiplier, isToughDay, isLoading } = useMood()
  const [isOpen, setIsOpen] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)

  const moodLevels = getAllMoodLevels()
  const currentMood = moodLevels.find((m) => m.level === mood)!

  const handleSelectMood = async (selectedLevel: MoodLevel) => {
    if (selectedLevel === mood) {
      setIsOpen(false)
      return
    }

    setIsSelecting(true)
    await setMood(selectedLevel)
    setIsSelecting(false)
    setIsOpen(false)
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted animate-pulse',
          className
        )}
      >
        <div className="w-5 h-5 rounded-full bg-muted-foreground/20" />
        <div className="w-12 h-4 rounded bg-muted-foreground/20" />
      </div>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm',
            'border border-white/20 dark:border-slate-700/50',
            'shadow-sm hover:shadow-md transition-all duration-200',
            'hover:scale-105 active:scale-95',
            className
          )}
        >
          <span className="text-lg">{currentMood.icon}</span>
          <span className="text-xs font-medium">{currentMood.weather}</span>
          {isToughDay && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
              +{Math.round((xpMultiplier - 1) * 100)}%
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="flex items-center justify-center gap-2">
            How's your weather today?
          </SheetTitle>
          <SheetDescription>
            Tough days earn bonus XP - you're stronger than you think!
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 py-4">
          {moodLevels.map((config) => (
            <MoodOption
              key={config.level}
              config={config}
              isSelected={mood === config.level}
              onSelect={() => handleSelectMood(config.level)}
              disabled={isSelecting}
            />
          ))}
        </div>

        {/* Encouragement message */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <p className="text-sm text-muted-foreground text-center">
            {mood <= 2 ? (
              <>
                <Sparkles className="inline h-4 w-4 text-purple-500 mr-1" />
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  You showed up on a tough day!{' '}
                </span>
                That takes real strength.
              </>
            ) : mood === 3 ? (
              <>
                <span className="font-medium text-primary">Cloudy days happen. </span>
                Every habit still counts toward your growth.
              </>
            ) : mood === 4 ? (
              <>
                <span className="font-medium text-primary">Nice day ahead! </span>
                Perfect for building good habits.
              </>
            ) : (
              <>
                <span className="font-medium text-primary">Sunshine energy! </span>
                Make the most of this great day.
              </>
            )}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MoodOption({
  config,
  isSelected,
  onSelect,
  disabled,
}: {
  config: MoodConfig
  isSelected: boolean
  onSelect: () => void
  disabled: boolean
}) {
  const bonusPercent = Math.round((config.xpMultiplier - 1) * 100)
  const hasBonus = bonusPercent > 0

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200',
        'border-2',
        isSelected
          ? 'border-primary bg-primary/10 shadow-lg'
          : 'border-transparent bg-muted/50 hover:bg-muted',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Weather icon */}
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
          `bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo}`,
          'shadow-md'
        )}
      >
        {config.icon}
      </div>

      {/* Info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium">{config.weather}</span>
        </div>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>

      {/* XP bonus */}
      <div className="flex-shrink-0 text-right">
        {hasBonus ? (
          <span
            className={cn(
              'text-xs font-bold px-2 py-1 rounded-full',
              'bg-gradient-to-r',
              config.level === 1
                ? 'from-purple-500 to-violet-600 text-white'
                : config.level === 2
                  ? 'from-blue-500 to-indigo-600 text-white'
                  : 'from-slate-400 to-slate-500 text-white'
            )}
          >
            +{bonusPercent}% XP
          </span>
        ) : (
          <span className="text-xs text-muted-foreground px-2 py-1">Base XP</span>
        )}
      </div>
    </button>
  )
}

// Compact mood indicator for HUD
export function MoodIndicator({ className }: { className?: string }) {
  const { mood, isToughDay, xpMultiplier, isLoading } = useMood()
  const moodLevels = getAllMoodLevels()
  const currentMood = moodLevels.find((m) => m.level === mood)!

  if (isLoading) {
    return <div className={cn('w-8 h-6 bg-muted animate-pulse rounded', className)} />
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-base">{currentMood.icon}</span>
      {isToughDay && (
        <span className="text-[10px] font-bold text-purple-500">
          +{Math.round((xpMultiplier - 1) * 100)}%
        </span>
      )}
    </div>
  )
}
