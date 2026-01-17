'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useEnergy } from '@/lib/context/energy-context'
import { getAllEnergyLevels, type EnergyLevel, type EnergyConfig } from '@/lib/energy-system'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Battery, BatteryLow, BatteryMedium, BatteryFull, ChevronDown, Zap } from 'lucide-react'

interface EnergySelectorProps {
  className?: string
}

// Energy bar visual component
function EnergyBars({ level, size = 'sm' }: { level: EnergyLevel; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'h-3 w-1',
    md: 'h-4 w-1.5',
    lg: 'h-5 w-2',
  }
  const gaps = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1',
  }

  const colors: Record<EnergyLevel, string> = {
    4: 'bg-green-500',
    3: 'bg-emerald-500',
    2: 'bg-amber-500',
    1: 'bg-slate-400',
  }

  return (
    <div className={cn('flex items-end', gaps[size])}>
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={cn(
            sizes[size],
            'rounded-full transition-all duration-300',
            bar <= level ? colors[level] : 'bg-slate-200 dark:bg-slate-700'
          )}
          style={{ height: `${bar * (size === 'sm' ? 3 : size === 'md' ? 4 : 5)}px` }}
        />
      ))}
    </div>
  )
}

export function EnergySelector({ className }: EnergySelectorProps) {
  const { energy, setEnergy, adjustmentText, isRestDay, isLoading } = useEnergy()
  const [isOpen, setIsOpen] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)

  const energyLevels = getAllEnergyLevels()
  const currentEnergy = energyLevels.find((e) => e.level === energy)!

  const handleSelectEnergy = async (selectedLevel: EnergyLevel) => {
    if (selectedLevel === energy) {
      setIsOpen(false)
      return
    }

    setIsSelecting(true)
    await setEnergy(selectedLevel)
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
          <EnergyBars level={energy} size="sm" />
          <span className="text-xs font-medium">{currentEnergy.labelVi}</span>
          {isRestDay && <span className="text-[10px] text-slate-400">Rest</span>}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            How's your energy today?
          </SheetTitle>
          <SheetDescription>Your goals will adjust to match your capacity</SheetDescription>
        </SheetHeader>

        <div className="space-y-3 py-4">
          {energyLevels.map((config) => (
            <EnergyOption
              key={config.level}
              config={config}
              isSelected={energy === config.level}
              onSelect={() => handleSelectEnergy(config.level)}
              disabled={isSelecting}
            />
          ))}
        </div>

        {/* Explanation */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <p className="text-sm text-muted-foreground text-center">
            {energy === 1 ? (
              <>
                <span className="font-medium text-primary">Rest days are important. </span>
                Just checking in keeps your streak alive.
              </>
            ) : energy === 2 ? (
              <>
                <span className="font-medium text-primary">Taking it easy today. </span>
                Your targets are adjusted to 60%.
              </>
            ) : energy === 3 ? (
              <>
                <span className="font-medium text-primary">Good energy! </span>
                Targets at 85% - a sustainable pace.
              </>
            ) : (
              <>
                <span className="font-medium text-primary">Full power! </span>
                Let's hit those 100% targets today.
              </>
            )}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function EnergyOption({
  config,
  isSelected,
  onSelect,
  disabled,
}: {
  config: EnergyConfig
  isSelected: boolean
  onSelect: () => void
  disabled: boolean
}) {
  const targetPercent = config.level === 1 ? 'Check-in only' : `${Math.round(config.targetMultiplier * 100)}% target`

  const BatteryIcon =
    config.level === 4
      ? BatteryFull
      : config.level === 3
        ? BatteryMedium
        : config.level === 2
          ? BatteryLow
          : Battery

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
      {/* Energy bars */}
      <div className="flex-shrink-0">
        <EnergyBars level={config.level} size="lg" />
      </div>

      {/* Info */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium">{config.labelVi}</span>
          <BatteryIcon className={cn('h-4 w-4', config.color)} />
        </div>
        <p className="text-xs text-muted-foreground">{config.descriptionVi}</p>
      </div>

      {/* Target adjustment */}
      <div className="flex-shrink-0 text-right">
        <span
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            config.level === 4
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : config.level === 3
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : config.level === 2
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
          )}
        >
          {targetPercent}
        </span>
      </div>
    </button>
  )
}

// Compact energy indicator for HUD
export function EnergyIndicator({ className }: { className?: string }) {
  const { energy, isRestDay, isLoading } = useEnergy()

  if (isLoading) {
    return <div className={cn('w-8 h-4 bg-muted animate-pulse rounded', className)} />
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <EnergyBars level={energy} size="sm" />
      {isRestDay && <span className="text-[10px] text-slate-400">Rest</span>}
    </div>
  )
}
