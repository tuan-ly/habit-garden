'use client'

import { useEffect, useCallback, useTransition, useState, useMemo } from 'react'
import {
  X,
  RotateCcw,
  Bug,
  ChevronUp,
  Sparkles,
  Zap,
  Loader2,
  Search,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useDevDebug, type SubscriptionTier } from './dev-debug-context'
import { cn } from '@/lib/utils'
import { getMaxPlants, getBasicUnlockedTiers, getGardenSize, getUserPhase } from '@/lib/progression-system'
import { getXpForLevel, getLevelTitle } from '@/lib/xp-system'
import { devSetSubscriptionTier, devResetSubscriptionTier, devSetPlantBypass, devSetPlantParams } from '@/lib/actions/dev'
import { getPlants } from '@/lib/actions/plants'
import { PlantImage } from '@/components/plants/plant-image'
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
  profile?: ProfileSnapshot
}

const isDev = process.env.NODE_ENV === 'development'

const GROWTH_PRESETS = [0, 33, 66, 100] as const

const LIVING_STATUSES = ['growing', 'thriving', 'resting', 'waiting', 'sleeping']
const TERMINAL_STATUSES = ['mature', 'dead']

type TierFilter = 'all' | '1' | '2' | '3' | '4' | '5'
type StatusFilter = 'all' | 'living' | 'terminal'
type SortKey = 'name' | 'tier' | 'growth' | 'status'

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
  const [edits, setEdits] = useState<Record<string, { grid_size?: number; growth_percentage?: number; status?: string }>>({})
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [bulkApplying, setBulkApplying] = useState(false)

  // Filters — persisted to localStorage
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [editedOnly, setEditedOnly] = useState(false)

  // Width toggle
  const [wide, setWide] = useState(false)

  // Load filter state from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('devPanelFilters')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.search !== undefined) setSearch(parsed.search)
        if (parsed.tierFilter) setTierFilter(parsed.tierFilter)
        if (parsed.statusFilter) setStatusFilter(parsed.statusFilter)
        if (parsed.sortKey) setSortKey(parsed.sortKey)
        if (parsed.editedOnly !== undefined) setEditedOnly(parsed.editedOnly)
        if (parsed.wide !== undefined) setWide(parsed.wide)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(
      'devPanelFilters',
      JSON.stringify({ search, tierFilter, statusFilter, sortKey, editedOnly, wide })
    )
  }, [search, tierFilter, statusFilter, sortKey, editedOnly, wide])

  const loadPlants = useCallback(async () => {
    setPlantsLoading(true)
    try {
      const data = await getPlants()
      setPlants(data)
    } finally {
      setPlantsLoading(false)
    }
  }, [])

  // Auto-load plants when panel opens
  useEffect(() => {
    if (isPanelOpen && plants.length === 0 && !plantsLoading) {
      loadPlants()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanelOpen])

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

  const visiblePlants = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = plants.filter((p) => {
      if (q) {
        const name = (p.name || '').toLowerCase()
        const typeName = (p.plant_type?.name || '').toLowerCase()
        if (!name.includes(q) && !typeName.includes(q)) return false
      }
      if (tierFilter !== 'all') {
        if (String(p.plant_type?.tier ?? 1) !== tierFilter) return false
      }
      if (statusFilter === 'living' && !LIVING_STATUSES.includes(p.status)) return false
      if (statusFilter === 'terminal' && !TERMINAL_STATUSES.includes(p.status)) return false
      if (editedOnly && !edits[p.id]) return false
      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'tier':
          return (a.plant_type?.tier ?? 0) - (b.plant_type?.tier ?? 0)
        case 'growth':
          return (b.growth_percentage ?? 0) - (a.growth_percentage ?? 0)
        case 'status':
          return (a.status || '').localeCompare(b.status || '')
        case 'name':
        default: {
          const an = (a.name || a.plant_type?.name || '').toLowerCase()
          const bn = (b.name || b.plant_type?.name || '').toLowerCase()
          return an.localeCompare(bn)
        }
      }
    })

    return sorted
  }, [plants, search, tierFilter, statusFilter, editedOnly, edits, sortKey])

  const editedCount = Object.keys(edits).length

  const applyAllEdits = useCallback(async () => {
    const ids = Object.keys(edits)
    if (!ids.length) return
    setBulkApplying(true)
    try {
      for (const id of ids) {
        const params = edits[id]
        if (!params) continue
        const result = await devSetPlantParams(id, params)
        if (!result.success) {
          console.error('[DEV] bulk apply failed for', id, result.error)
        }
      }
      await loadPlants()
      setEdits({})
    } finally {
      setBulkApplying(false)
    }
  }, [edits, loadPlants])

  const bulkSetGrowth = useCallback(
    (value: number) => {
      setEdits((prev) => {
        const next = { ...prev }
        for (const p of visiblePlants) {
          next[p.id] = { ...next[p.id], growth_percentage: value }
        }
        return next
      })
    },
    [visiblePlants]
  )

  const bulkSetStatus = useCallback(
    (status: string) => {
      setEdits((prev) => {
        const next = { ...prev }
        for (const p of visiblePlants) {
          next[p.id] = { ...next[p.id], status }
        }
        return next
      })
    },
    [visiblePlants]
  )

  const discardEdits = useCallback(() => setEdits({}), [])

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

  const effectiveLevel = overrides.level ?? profile?.level ?? 1
  const effectiveSubscription = overrides.subscriptionTier ?? profile?.subscriptionTier ?? 'FREE'

  const calculatedMaxPlants = getMaxPlants(effectiveLevel)
  const calculatedTiers = getBasicUnlockedTiers(effectiveLevel)
  const calculatedGardenSize = getGardenSize(effectiveLevel)

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
      startTransition(async () => {
        const cookieTier = tier.toLowerCase() as 'free' | 'pro' | 'premium'
        const result = await devSetSubscriptionTier(cookieTier)
        if (!result.success) console.error('[DEV] Failed to set tier cookie:', result.error)
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

  const quickLevelUp = useCallback(() => {
    handleLevelChange([Math.min(20, effectiveLevel + 1)])
  }, [effectiveLevel, handleLevelChange])

  const quickMaxLevel = useCallback(() => handleLevelChange([20]), [handleLevelChange])

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
    startTransition(async () => {
      await devResetSubscriptionTier()
      await devSetPlantBypass(false)
    })
  }, [resetOverrides])

  if (!isDev) return null

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
        wide ? 'w-[720px]' : 'w-[480px]',
        'max-h-[85vh] flex flex-col',
        'bg-slate-900/95 backdrop-blur-md',
        'border border-purple-500/50 rounded-lg shadow-2xl',
        'text-white text-sm',
        'transition-[width] duration-200'
      )}
    >
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-purple-500/30 p-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-purple-400" />
          <span className="font-semibold">Dev Panel</span>
          <Badge variant="outline" className="text-[10px] text-purple-300 border-purple-500/50">
            DEV
          </Badge>
          {isPending && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setWide((w) => !w)}
            title={wide ? 'Shrink' : 'Expand'}
          >
            <span className="text-[10px] font-mono">{wide ? '⇤⇥' : '⇔'}</span>
          </Button>
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

      {/* Tabs */}
      <Tabs defaultValue="plants" className="flex-1 flex flex-col min-h-0">
        <div className="px-3 pt-3 shrink-0">
          <TabsList className="grid grid-cols-3 w-full bg-slate-800 h-9">
            <TabsTrigger value="state" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              State
            </TabsTrigger>
            <TabsTrigger value="plants" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Plants ({plants.length})
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Actions
            </TabsTrigger>
          </TabsList>
        </div>

        {/* STATE TAB */}
        <TabsContent value="state" className="flex-1 overflow-y-auto p-3 space-y-4 mt-2">
          <div className="p-2 bg-slate-800/50 rounded-md">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Current State</div>
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
                <Badge key={tier} variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-300">
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
              <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-slate-300">Subscription Tier</Label>
            <Select value={effectiveSubscription} onValueChange={handleSubscriptionChange}>
              <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[9999] bg-slate-800 border-slate-700">
                <SelectItem value="FREE" className="text-xs">FREE - 3 plants, Tier 1-2</SelectItem>
                <SelectItem value="PRO" className="text-xs">PRO - 8 plants, Tier 1-4, Goals</SelectItem>
                <SelectItem value="PREMIUM" className="text-xs">PREMIUM - Unlimited, All Tiers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-slate-700" />

          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Bypass Limits</div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-300">Bypass Slot Limit</Label>
              <Switch
                checked={overrides.bypassSlotLimit ?? false}
                onCheckedChange={(c) => handleBypassToggle('bypassSlotLimit', c)}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-300">Bypass Tier Limit</Label>
              <Switch
                checked={overrides.bypassTierLimit ?? false}
                onCheckedChange={(c) => handleBypassToggle('bypassTierLimit', c)}
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

          {Object.keys(overrides).length > 0 && (
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
              <div className="flex items-center gap-2 text-amber-300 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {Object.keys(overrides).length} override(s) active
              </div>
            </div>
          )}
        </TabsContent>

        {/* PLANTS TAB */}
        <TabsContent value="plants" className="flex-1 flex flex-col min-h-0 mt-2">
          {/* Toolbar */}
          <div className="px-3 py-2 border-b border-slate-700 space-y-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <Input
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-7 text-xs bg-slate-800 border-slate-700"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={loadPlants}
                disabled={plantsLoading}
                className="h-8 w-8 shrink-0 text-slate-400 hover:text-white"
                title="Refresh"
              >
                {plantsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as TierFilter)}>
                <SelectTrigger className="h-7 text-[11px] bg-slate-800 border-slate-700">
                  <Filter className="w-3 h-3 mr-1 text-slate-500" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[9999] bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-xs">All tiers</SelectItem>
                  <SelectItem value="1" className="text-xs">Tier 1</SelectItem>
                  <SelectItem value="2" className="text-xs">Tier 2</SelectItem>
                  <SelectItem value="3" className="text-xs">Tier 3</SelectItem>
                  <SelectItem value="4" className="text-xs">Tier 4</SelectItem>
                  <SelectItem value="5" className="text-xs">Tier 5</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-7 text-[11px] bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[9999] bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-xs">All status</SelectItem>
                  <SelectItem value="living" className="text-xs">Living</SelectItem>
                  <SelectItem value="terminal" className="text-xs">Terminal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="h-7 text-[11px] bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[9999] bg-slate-800 border-slate-700">
                  <SelectItem value="name" className="text-xs">Sort: Name</SelectItem>
                  <SelectItem value="tier" className="text-xs">Sort: Tier</SelectItem>
                  <SelectItem value="growth" className="text-xs">Sort: Growth</SelectItem>
                  <SelectItem value="status" className="text-xs">Sort: Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>
                <span className="text-slate-200 font-medium">{visiblePlants.length}</span> of {plants.length}
                {editedCount > 0 && (
                  <span className="ml-2 text-amber-400">• {editedCount} unsaved</span>
                )}
              </span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editedOnly}
                  onChange={(e) => setEditedOnly(e.target.checked)}
                  className="w-3 h-3 accent-purple-500"
                />
                Edited only
              </label>
            </div>

            {visiblePlants.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-800">
                <span className="text-[10px] text-slate-500 mr-1">Bulk:</span>
                {GROWTH_PRESETS.map((v) => (
                  <Button
                    key={v}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[10px] bg-slate-800/50 border-slate-700 hover:bg-green-900/40"
                    onClick={() => bulkSetGrowth(v)}
                    title={`Set growth=${v}% for ${visiblePlants.length} visible plant(s)`}
                  >
                    Grow→{v}%
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[10px] bg-slate-800/50 border-slate-700 hover:bg-blue-900/40"
                  onClick={() => bulkSetStatus('mature')}
                >
                  →mature
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[10px] bg-slate-800/50 border-slate-700 hover:bg-slate-700"
                  onClick={() => bulkSetStatus('growing')}
                >
                  →growing
                </Button>
                {editedCount > 0 && (
                  <>
                    <div className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={discardEdits}
                      className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyAllEdits}
                      disabled={bulkApplying}
                      className="h-6 px-2 text-[10px] bg-purple-600 hover:bg-purple-500"
                    >
                      {bulkApplying && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      Apply All ({editedCount})
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Plants list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {plantsLoading && plants.length === 0 && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              </div>
            )}

            {!plantsLoading && plants.length === 0 && (
              <div className="text-[11px] text-slate-500 text-center py-6">
                No plants. Refresh after planting.
              </div>
            )}

            {!plantsLoading && plants.length > 0 && visiblePlants.length === 0 && (
              <div className="text-[11px] text-slate-500 text-center py-6">
                No plants match the current filters.
              </div>
            )}

            {visiblePlants.map((p) => {
              const edit = edits[p.id] || {}
              const effSize = edit.grid_size ?? p.grid_size ?? 1
              const effGrowth = edit.growth_percentage ?? p.growth_percentage ?? 0
              const effStatus = edit.status ?? p.status
              const dirty = !!edits[p.id]

              const previewPlant: PlantWithType = {
                ...p,
                growth_percentage: effGrowth,
                status: effStatus as PlantWithType['status'],
              }

              return (
                <div
                  key={p.id}
                  className={cn(
                    'p-2 bg-slate-800/50 rounded border space-y-2 transition-colors',
                    dirty ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-slate-900/60 rounded border border-slate-700 overflow-hidden">
                      <PlantImage plant={previewPlant} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {p.name || p.plant_type?.name || p.id.slice(0, 8)}
                        </span>
                        <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600 shrink-0">
                          T{p.plant_type?.tier ?? 1}
                        </Badge>
                        {dirty && (
                          <Badge className="text-[9px] bg-amber-500/20 text-amber-300 border-amber-500/40 shrink-0">
                            edited
                          </Badge>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {p.plant_type?.name} • {effStatus}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!dirty || applyingId === p.id}
                      onClick={() => applyPlantEdits(p.id)}
                      className="h-7 px-2 text-xs bg-purple-900/40 border-purple-700 hover:bg-purple-800/50 disabled:opacity-40 shrink-0"
                    >
                      {applyingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Growth</span>
                      <span className="font-mono">{Math.round(effGrowth)}%</span>
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
                    <div className="flex gap-1">
                      {GROWTH_PRESETS.map((v) => (
                        <button
                          key={v}
                          onClick={() =>
                            setEdits((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], growth_percentage: v },
                            }))
                          }
                          className={cn(
                            'flex-1 h-5 text-[10px] rounded border transition-colors',
                            Math.round(effGrowth) === v
                              ? 'bg-green-600/40 border-green-500 text-green-200'
                              : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
                          )}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>

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
                        <SelectContent position="popper" className="z-[9999] bg-slate-800 border-slate-700">
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
                        <SelectContent position="popper" className="z-[9999] bg-slate-800 border-slate-700">
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
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* ACTIONS TAB */}
        <TabsContent value="actions" className="flex-1 overflow-y-auto p-3 space-y-3 mt-2">
          <div className="text-[10px] uppercase tracking-wide text-slate-400">Quick Actions</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={quickLevelUp}
              className="h-9 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <ChevronUp className="w-3 h-3 mr-1" />
              Level Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={quickMaxLevel}
              className="h-9 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Max Level
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={quickSetPro}
              className="h-9 text-xs bg-blue-900/50 border-blue-700 hover:bg-blue-800/50"
            >
              <Zap className="w-3 h-3 mr-1" />
              Set PRO
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={quickSetPremium}
              className="h-9 text-xs bg-purple-900/50 border-purple-700 hover:bg-purple-800/50"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Set PREMIUM
            </Button>
          </div>

          <Separator className="bg-slate-700" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isPending}
            className="w-full h-9 text-xs bg-red-900/30 border-red-800 hover:bg-red-900/50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RotateCcw className="w-3.5 h-3.5 mr-1" />}
            Reset All Overrides
          </Button>

          {Object.keys(overrides).length > 0 && (
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
              <div className="flex items-center gap-2 text-amber-300 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                {Object.keys(overrides).length} override(s) active
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="bg-slate-900/95 border-t border-purple-500/30 px-3 py-2 shrink-0">
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
