'use client'

import { useEffect, useCallback } from 'react'
import { X, RotateCcw, Bug, ChevronUp, ChevronDown, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useDevDebug, type SubscriptionTier, type DevOverrides } from './dev-debug-context'
import { cn } from '@/lib/utils'
import { getMaxPlants, getBasicUnlockedTiers, getGardenSize, getUserPhase } from '@/lib/progression-system'
import { getXpForLevel, getLevelFromXp, getLevelTitle } from '@/lib/xp-system'
import type { PlantTier } from '@/types/database'

interface ProfileSnapshot {
  level: number
  xp: number
  maxPlants: number
  unlockedTiers: PlantTier[]
  gardenSize: number
  phase: string
  subscriptionTier: SubscriptionTier
}

interface DevDebugPanelProps {
  /**
   * Real profile data for display when no overrides are set
   */
  profile?: ProfileSnapshot
}

const isDev = process.env.NODE_ENV === 'development'

export function DevDebugPanel({ profile }: DevDebugPanelProps) {
  const {
    isPanelOpen,
    overrides,
    setOverrides,
    resetOverrides,
    togglePanel,
    closePanel,
  } = useDevDebug()

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    if (!isDev) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        togglePanel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePanel])

  // Get current effective values
  const effectiveLevel = overrides.level ?? profile?.level ?? 1
  const effectiveXp = overrides.xp ?? profile?.xp ?? 0
  const effectiveSubscription = overrides.subscriptionTier ?? profile?.subscriptionTier ?? 'FREE'

  // Calculated values based on overrides
  const calculatedMaxPlants = getMaxPlants(effectiveLevel)
  const calculatedTiers = getBasicUnlockedTiers(effectiveLevel)
  const calculatedGardenSize = getGardenSize(effectiveLevel)
  const calculatedPhase = getUserPhase(effectiveLevel)

  const handleLevelChange = useCallback(
    (values: number[]) => {
      const newLevel = values[0]
      const newXp = getXpForLevel(newLevel)
      setOverrides({
        level: newLevel,
        xp: newXp,
        maxPlants: getMaxPlants(newLevel),
        unlockedTiers: getBasicUnlockedTiers(newLevel),
        gardenSize: getGardenSize(newLevel),
        phase: getUserPhase(newLevel),
      })
    },
    [setOverrides]
  )

  const handleSubscriptionChange = useCallback(
    (value: string) => {
      setOverrides({ subscriptionTier: value as SubscriptionTier })
    },
    [setOverrides]
  )

  const handleBypassToggle = useCallback(
    (key: 'bypassSlotLimit' | 'bypassTierLimit', checked: boolean) => {
      setOverrides({ [key]: checked })
    },
    [setOverrides]
  )

  // Quick actions
  const quickLevelUp = useCallback(() => {
    const newLevel = Math.min(20, effectiveLevel + 1)
    handleLevelChange([newLevel])
  }, [effectiveLevel, handleLevelChange])

  const quickMaxLevel = useCallback(() => {
    handleLevelChange([20])
  }, [handleLevelChange])

  const quickSetPro = useCallback(() => {
    setOverrides({ subscriptionTier: 'PRO' })
  }, [setOverrides])

  const quickSetPremium = useCallback(() => {
    setOverrides({ subscriptionTier: 'PREMIUM' })
  }, [setOverrides])

  if (!isDev) return null

  // Floating toggle button
  if (!isPanelOpen) {
    return (
      <button
        onClick={togglePanel}
        className={cn(
          'fixed bottom-20 left-4 z-[100]',
          'w-10 h-10 rounded-full',
          'bg-purple-600 text-white shadow-lg',
          'flex items-center justify-center',
          'hover:bg-purple-700 hover:scale-110',
          'transition-all duration-200',
          'ring-2 ring-purple-400/50'
        )}
        title="Open Dev Panel (Ctrl+Shift+D)"
      >
        <Bug className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 z-[100]',
        'w-80 max-h-[70vh] overflow-y-auto',
        'bg-slate-900/95 backdrop-blur-md',
        'border border-purple-500/50 rounded-lg shadow-2xl',
        'text-white text-sm'
      )}
    >
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-purple-500/30 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-purple-400" />
          <span className="font-semibold">Dev Panel</span>
          <Badge variant="outline" className="text-[10px] text-purple-300 border-purple-500/50">
            DEV
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={resetOverrides}
            title="Reset all overrides"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={closePanel}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-4">
        {/* Current State */}
        <div className="p-2 bg-slate-800/50 rounded-md">
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">
            Current State
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{effectiveLevel}</div>
              <div className="text-slate-500">Level</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">
                {calculatedMaxPlants === Infinity ? '∞' : calculatedMaxPlants}
              </div>
              <div className="text-slate-500">Slots</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {calculatedGardenSize === 0 ? '∞' : `${calculatedGardenSize}×${calculatedGardenSize}`}
              </div>
              <div className="text-slate-500">Garden</div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {calculatedTiers.map((tier) => (
              <Badge
                key={tier}
                variant="secondary"
                className="text-[10px] bg-amber-500/20 text-amber-300"
              >
                {'⭐'.repeat(tier)}
              </Badge>
            ))}
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px]',
                effectiveSubscription === 'PREMIUM'
                  ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-pink-300'
                  : effectiveSubscription === 'PRO'
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-slate-700 text-slate-300'
              )}
            >
              {effectiveSubscription}
            </Badge>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Level Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-300">Level</Label>
            <span className="text-xs text-slate-400">
              {effectiveLevel} - {getLevelTitle(effectiveLevel)}
            </span>
          </div>
          <Slider
            value={[effectiveLevel]}
            min={1}
            max={20}
            step={1}
            onValueChange={handleLevelChange}
            className="[&_[role=slider]]:bg-purple-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
          </div>
        </div>

        {/* Subscription Tier */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-300">Subscription Tier</Label>
          <Select value={effectiveSubscription} onValueChange={handleSubscriptionChange}>
            <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="FREE" className="text-xs">
                FREE - 3 plants, Tier 1-2
              </SelectItem>
              <SelectItem value="PRO" className="text-xs">
                PRO - 8 plants, Tier 1-4, Goals
              </SelectItem>
              <SelectItem value="PREMIUM" className="text-xs">
                PREMIUM - Unlimited, All Tiers
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="bg-slate-700" />

        {/* Bypass Options */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Bypass Limits</div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-300">Bypass Slot Limit</Label>
            <Switch
              checked={overrides.bypassSlotLimit ?? false}
              onCheckedChange={(checked) => handleBypassToggle('bypassSlotLimit', checked)}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-300">Bypass Tier Limit</Label>
            <Switch
              checked={overrides.bypassTierLimit ?? false}
              onCheckedChange={(checked) => handleBypassToggle('bypassTierLimit', checked)}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Quick Actions */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Quick Actions</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={quickLevelUp}
              className="h-8 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <ChevronUp className="w-3 h-3 mr-1" />
              Level Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={quickMaxLevel}
              className="h-8 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Max Level
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={quickSetPro}
              className="h-8 text-xs bg-blue-900/50 border-blue-700 hover:bg-blue-800/50"
            >
              <Zap className="w-3 h-3 mr-1" />
              Set PRO
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={quickSetPremium}
              className="h-8 text-xs bg-purple-900/50 border-purple-700 hover:bg-purple-800/50"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Set PREMIUM
            </Button>
          </div>
        </div>

        {/* Active Overrides Indicator */}
        {Object.keys(overrides).length > 0 && (
          <>
            <Separator className="bg-slate-700" />
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
              <div className="flex items-center gap-2 text-amber-300 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {Object.keys(overrides).length} override(s) active
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-slate-900/95 border-t border-purple-500/30 px-3 py-2">
        <div className="text-[10px] text-slate-500 text-center">
          Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">Ctrl+Shift+D</kbd> to toggle
        </div>
      </div>
    </div>
  )
}

export function DevDebugToggle() {
  const { togglePanel, isPanelOpen } = useDevDebug()

  if (!isDev) return null

  return (
    <button
      onClick={togglePanel}
      className={cn(
        'fixed bottom-20 left-4 z-[100]',
        'w-10 h-10 rounded-full',
        'flex items-center justify-center',
        'transition-all duration-200',
        isPanelOpen
          ? 'bg-purple-500 text-white'
          : 'bg-slate-800 text-slate-400 hover:bg-purple-600 hover:text-white'
      )}
      title="Toggle Dev Panel (Ctrl+Shift+D)"
    >
      <Bug className="w-5 h-5" />
    </button>
  )
}
