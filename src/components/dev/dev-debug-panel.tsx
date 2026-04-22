'use client'

import { useEffect, useCallback, useTransition, useState } from 'react'
import { X, RotateCcw, Bug, ChevronUp, ChevronDown, Sparkles, Zap, Loader2, Leaf } from 'lucide-react'
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
import { devSetSubscriptionTier, devResetSubscriptionTier, devSetPlantBypass, devSetPlantParams } from '@/lib/actions/dev'
import { getPlants } from '@/lib/actions/plants'
import type { PlantTier, PlantWithType } from '@/types/database'

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

  const [isPending, startTransition] = useTransition()

  // Plants editor state
  const [plants, setPlants] = useState<PlantWithType[]>([])
  const [plantsLoading, setPlantsLoading] = useState(false)
  const [plantsExpanded, setPlantsExpanded] = useState(false)
  const [edits, setEdits] = useState<Record<string, { grid_size?: number; growth_percentage?: number; status?: string }>>({})
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const loadPlants = useCallback(async () => {
    setPlantsLoading(true)
    try {
      const data = await getPlants()
      setPlants(data)
    } finally {
      setPlantsLoading(false)
    }
  }, [])

  const togglePlantsSection = useCallback(() => {
    setPlantsExpanded((prev) => {
      const next = !prev
      if (next && plants.length === 0) {
        loadPlants()
      }
      return next
    })
  }, [plants.length, loadPlants])

  const applyPlantEdits = useCallback(
    async (plantId: string) => {
      const params = edits[plantId]
      if (!params) return
      setApplyingId(plantId)
      try {
        const result = await devSetPlantParams(plantId, params)
        if (!result.success) {
          console.error('[DEV] devSetPlantParams failed:', result.error)
        } else {
          await loadPlants()
          setEdits((prev) => {
            const next = { ...prev }
            delete next[plantId]
            return next
          })
        }
      } finally {
        setApplyingId(null)
      }
    },
    [edits, loadPlants]
  )

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
      const tier = value as SubscriptionTier
      setOverrides({ subscriptionTier: tier })

      // Set cookie so server actions respect the override
      startTransition(async () => {
        const cookieTier = tier.toLowerCase() as 'free' | 'pro' | 'premium'
        const result = await devSetSubscriptionTier(cookieTier)
        if (!result.success) {
          console.error('[DEV] Failed to set tier cookie:', result.error)
        }
      })
    },
    [setOverrides]
  )

  const handleBypassToggle = useCallback(
    (key: 'bypassSlotLimit' | 'bypassTierLimit', checked: boolean) => {
      setOverrides({ [key]: checked })
    },
    [setOverrides]
  )

  const handleBypassAllPlantRestrictions = useCallback(
    (checked: boolean) => {
      setOverrides({
        bypassPlantRestrictions: checked,
        bypassSlotLimit: checked,
        bypassTierLimit: checked,
      })
      startTransition(async () => {
        await devSetPlantBypass(checked)
      })
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
    startTransition(async () => {
      await devSetSubscriptionTier('pro')
    })
  }, [setOverrides])

  const quickSetPremium = useCallback(() => {
    setOverrides({ subscriptionTier: 'PREMIUM' })
    startTransition(async () => {
      await devSetSubscriptionTier('premium')
    })
  }, [setOverrides])

  const handleReset = useCallback(() => {
    resetOverrides()
    // Also clear the tier override cookie
    startTransition(async () => {
      await devResetSubscriptionTier()
      await devSetPlantBypass(false)
    })
  }, [resetOverrides])

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
          {isPending && (
            <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={handleReset}
            disabled={isPending}
            title="Reset all overrides"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
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

          <div className="flex items-center justify-between">
            <Label className="text-xs text-slate-300">
              Bypass Plant Restrictions <span className="text-[10px] text-slate-500">(server)</span>
            </Label>
            <Switch
              checked={overrides.bypassPlantRestrictions ?? false}
              onCheckedChange={handleBypassAllPlantRestrictions}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Plants Editor */}
        <div className="space-y-2">
          <button
            onClick={togglePlantsSection}
            className="flex items-center justify-between w-full text-[10px] uppercase tracking-wide text-slate-400 hover:text-slate-200"
          >
            <span className="flex items-center gap-1">
              <Leaf className="w-3 h-3" /> Plants ({plants.length})
            </span>
            {plantsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {plantsExpanded && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {plantsLoading && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                </div>
              )}

              {!plantsLoading && plants.length === 0 && (
                <div className="text-[11px] text-slate-500 text-center py-2">
                  No plants. Press refresh after planting.
                </div>
              )}

              {plants.map((p) => {
                const edit = edits[p.id] || {}
                const effSize = edit.grid_size ?? p.grid_size ?? 1
                const effGrowth = edit.growth_percentage ?? p.growth_percentage ?? 0
                const effStatus = edit.status ?? p.status
                const dirty = !!edits[p.id]

                return (
                  <div
                    key={p.id}
                    className="p-2 bg-slate-800/50 rounded border border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {p.name || p.plant_type?.name || p.id.slice(0, 8)}
                      </span>
                      <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">
                        T{p.plant_type?.tier ?? 1}
                      </Badge>
                    </div>

                    {/* Growth slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Growth</span>
                        <span>{Math.round(effGrowth)}%</span>
                      </div>
                      <Slider
                        value={[effGrowth]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(v) =>
                          setEdits((prev) => ({
                            ...prev,
                            [p.id]: { ...prev[p.id], growth_percentage: v[0] },
                          }))
                        }
                        className="[&_[role=slider]]:bg-green-500"
                      />
                    </div>

                    {/* Size + Status row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400">Size</Label>
                        <Select
                          value={String(effSize)}
                          onValueChange={(v) =>
                            setEdits((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], grid_size: parseInt(v) },
                            }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs bg-slate-900 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="1" className="text-xs">1×1</SelectItem>
                            <SelectItem value="2" className="text-xs">2×2</SelectItem>
                            <SelectItem value="3" className="text-xs">3×3</SelectItem>
                            <SelectItem value="4" className="text-xs">4×4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-400">Status</Label>
                        <Select
                          value={effStatus}
                          onValueChange={(v) =>
                            setEdits((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], status: v },
                            }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs bg-slate-900 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="growing" className="text-xs">growing</SelectItem>
                            <SelectItem value="thriving" className="text-xs">thriving</SelectItem>
                            <SelectItem value="resting" className="text-xs">resting</SelectItem>
                            <SelectItem value="waiting" className="text-xs">waiting</SelectItem>
                            <SelectItem value="sleeping" className="text-xs">sleeping</SelectItem>
                            <SelectItem value="mature" className="text-xs">mature</SelectItem>
                            <SelectItem value="dead" className="text-xs">dead</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!dirty || applyingId === p.id}
                      onClick={() => applyPlantEdits(p.id)}
                      className="w-full h-7 text-xs bg-purple-900/40 border-purple-700 hover:bg-purple-800/50 disabled:opacity-40"
                    >
                      {applyingId === p.id ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : null}
                      Apply
                    </Button>
                  </div>
                )
              })}

              <Button
                variant="ghost"
                size="sm"
                onClick={loadPlants}
                disabled={plantsLoading}
                className="w-full h-7 text-[10px] text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          )}
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
