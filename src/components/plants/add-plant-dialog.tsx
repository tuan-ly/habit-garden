'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Clock, Sparkles, Lock, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlantType, Profile, PlantTier } from '@/types/database'
import { createPlant } from '@/lib/actions/plants'
import { usePlants } from '@/lib/context/plants-context'
import { useSubscription } from '@/lib/context/subscription-context'
import { useDevOverride, useDevDebug } from '@/components/dev/dev-debug-context'
import { toast } from 'sonner'
import { TierBadge } from '@/components/ui/tier-badge'
import { SlotIndicator } from '@/components/garden/slot-indicator'
import { Switch } from '@/components/ui/switch'
import {
  isTierUnlocked,
  getTierUnlockLevel,
  checkSlotAvailability,
  PLANT_CREATION_GATES_ENABLED,
} from '@/lib/progression-system'
import { getMinimumSubscriptionForPlantTier } from '@/lib/subscription-limits'

interface AddPlantDialogProps {
  plantTypes: PlantType[]
  profile?: Profile | null
  currentPlantCount?: number
  // Support controlled mode for isometric garden
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Optional grid position - if provided, plant will be placed at this position */
  gridPosition?: { row: number; col: number } | null
}

export function AddPlantDialog({
  plantTypes,
  profile,
  currentPlantCount = 0,
  open: controlledOpen,
  onOpenChange,
  gridPosition,
}: AddPlantDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const { addPlant, plants } = usePlants()
  const { canUsePlantTier, canAddPlant: checkSubscriptionPlantLimit, showUpgradeModal, limits } = useSubscription()

  // Dev overrides for testing
  const { overrides: devOverrides } = useDevDebug()
  const effectiveLevel = useDevOverride('level', profile?.level ?? 1)

  // Create effective profile with dev override
  const effectiveProfile = profile ? { ...profile, level: effectiveLevel ?? profile.level } : null

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setUncontrolledOpen
  const [step, setStep] = useState<'select' | 'details'>('select')
  const [selectedType, setSelectedType] = useState<PlantType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [easyMode, setEasyMode] = useState(false)
  const [tinySeed, setTinySeed] = useState('')
  const [isPending, startTransition] = useTransition()

  // Calculate actual plant count (from context or prop)
  const actualPlantCount = currentPlantCount || plants.filter(p => p.status !== 'dead').length

  // Check slot availability (level-based)
  const levelSlotCheck = useMemo(() => {
    if (!PLANT_CREATION_GATES_ENABLED) {
      return { hasSlot: true, currentCount: actualPlantCount, maxSlots: -1 }
    }
    // Dev bypass for slot limit
    if (devOverrides.bypassSlotLimit) {
      return { hasSlot: true, currentCount: actualPlantCount, maxSlots: 999, message: 'Dev bypass active' }
    }
    if (!effectiveProfile) return { hasSlot: true, currentCount: actualPlantCount, maxSlots: 999 }
    return checkSlotAvailability(effectiveProfile, actualPlantCount)
  }, [effectiveProfile, actualPlantCount, devOverrides.bypassSlotLimit])

  // Check subscription-based plant limit
  const subscriptionHasSlot = checkSubscriptionPlantLimit(actualPlantCount)

  // Combined slot check - both level AND subscription must allow
  const slotCheck = useMemo(() => {
    if (!PLANT_CREATION_GATES_ENABLED) {
      return {
        ...levelSlotCheck,
        maxSlots: -1,
        hasSlot: true,
        isSubscriptionLimited: false,
      }
    }
    // Use the more restrictive of level or subscription limits
    const maxSlots = Math.min(levelSlotCheck.maxSlots, limits.maxPlants === -1 ? 999 : limits.maxPlants)
    const hasSlot = levelSlotCheck.hasSlot && subscriptionHasSlot
    return {
      ...levelSlotCheck,
      maxSlots,
      hasSlot,
      isSubscriptionLimited: levelSlotCheck.hasSlot && !subscriptionHasSlot,
    }
  }, [levelSlotCheck, subscriptionHasSlot, limits.maxPlants])

  // Group plants by tier
  const plantsByTier = useMemo(() => {
    const grouped: Record<PlantTier, PlantType[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] }
    for (const plant of plantTypes) {
      const tier = (plant.tier || 1) as PlantTier
      grouped[tier].push(plant)
    }
    return grouped
  }, [plantTypes])

  // Check which tiers are unlocked (both level-based AND subscription-based)
  const tierStatus = useMemo(() => {
    if (!PLANT_CREATION_GATES_ENABLED) {
      return { 1: true, 2: true, 3: true, 4: true, 5: true }
    }
    // Dev bypass for tier limit
    if (devOverrides.bypassTierLimit) {
      return { 1: true, 2: true, 3: true, 4: true, 5: true }
    }
    if (!effectiveProfile) return { 1: true, 2: true, 3: true, 4: true, 5: true }
    return {
      1: isTierUnlocked(effectiveProfile, 1) && canUsePlantTier(1),
      2: isTierUnlocked(effectiveProfile, 2) && canUsePlantTier(2),
      3: isTierUnlocked(effectiveProfile, 3) && canUsePlantTier(3),
      4: isTierUnlocked(effectiveProfile, 4) && canUsePlantTier(4),
      5: isTierUnlocked(effectiveProfile, 5) && canUsePlantTier(5),
    }
  }, [effectiveProfile, canUsePlantTier, devOverrides.bypassTierLimit])

  // Check if tier is locked due to subscription (not level)
  const isSubscriptionLocked = useCallback((tier: PlantTier): boolean => {
    if (!PLANT_CREATION_GATES_ENABLED) return false
    if (devOverrides.bypassTierLimit) return false
    if (!effectiveProfile) return false
    // If level unlocked but subscription doesn't allow
    return isTierUnlocked(effectiveProfile, tier) && !canUsePlantTier(tier)
  }, [effectiveProfile, canUsePlantTier, devOverrides.bypassTierLimit])

  // Backward compatibility: filter by category if tier not set
  const basicPlants = plantTypes.filter((p) => p.category === 'basic')
  const specialPlants = plantTypes.filter((p) => p.category === 'special')

  // Check if we should use tier-based grouping (if any plant has tier > 1)
  const useTierGrouping = plantTypes.some(p => p.tier && p.tier > 1)

  const handleSelectType = (plantType: PlantType, isLocked: boolean) => {
    if (isLocked) {
      const tier = (plantType.tier || 1) as PlantTier

      // Check if it's subscription-locked
      if (isSubscriptionLocked(tier)) {
        showUpgradeModal('tier_limit', plantType.name)
        return
      }

      // Otherwise it's level-locked
      const unlockLevel = getTierUnlockLevel(tier)
      toast.error('Plant locked', {
        description: `Reach Level ${unlockLevel} to unlock Tier ${tier} plants.`,
      })
      return
    }

    if (!slotCheck.hasSlot) {
      // Check if it's subscription-limited
      if (slotCheck.isSubscriptionLimited) {
        showUpgradeModal('plant_limit')
        return
      }
      // Otherwise it's level-limited
      toast.error('No slots available', {
        description: slotCheck.message,
      })
      return
    }

    setSelectedType(plantType)
    setStep('details')
  }

  const handleBack = () => {
    setStep('select')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedType || !name.trim()) return

    startTransition(async () => {
      const result = await createPlant({
        plant_type_id: selectedType.id,
        name: name.trim(),
        habit_description: description.trim() || undefined,
        grid_row: gridPosition?.row,
        grid_col: gridPosition?.col,
        easy_mode: easyMode,
        tiny_seed: easyMode && tinySeed.trim() ? tinySeed.trim() : null,
      })

      if (result.success && result.plant) {
        // Add plant to context immediately for instant UI update
        addPlant(result.plant)

        toast.success('Plant created!', {
          description: `${name} has been planted in your garden.`,
        })
        setOpen(false)
        resetForm()
      } else {
        toast.error('Failed to create plant', {
          description: result.error,
        })
      }
    })
  }

  const resetForm = () => {
    setStep('select')
    setSelectedType(null)
    setName('')
    setDescription('')
    setEasyMode(false)
    setTinySeed('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const renderPlantCard = (plant: PlantType, isLocked: boolean) => {
    const tier = (plant.tier || 1) as PlantTier
    return (
      <button
        key={plant.id}
        onClick={() => handleSelectType(plant, isLocked)}
        disabled={isLocked}
        className={cn(
          'relative flex min-h-40 flex-col items-center rounded-[1.35rem] border p-4 text-left transition-all',
          isLocked
            ? 'cursor-not-allowed border-[#d9dfce] bg-[#ecebe2] opacity-60'
            : 'border-[#dbe3cf] bg-white/55 text-[#355239] shadow-[0_5px_18px_rgba(78,101,67,.06)] hover:-translate-y-0.5 hover:border-[#9cb787] hover:bg-[#f3f7e9] hover:shadow-[0_10px_24px_rgba(78,101,67,.11)]',
          plant.category === 'special' && !isLocked && 'border-[#d8cdd9] hover:border-[#bca5bf] hover:bg-[#faf2f7]'
        )}
      >
        {isLocked && (
          <div className="absolute top-2 right-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <span className="text-3xl mb-2">{plant.icon}</span>
        <span className="text-sm font-semibold">{plant.name}</span>
        <div className="mt-1 flex items-center gap-1 text-xs text-[#71806c]">
          <Clock className="h-3 w-3" />
          <span>{plant.maturity_days} days</span>
        </div>
        <div className="mt-2">
          <TierBadge tier={tier} size="sm" locked={isLocked} />
        </div>
        {plant.special_effect && !isLocked && (
          <span className="text-xs text-purple-600 mt-1">Special ability</span>
        )}
        {isLocked && (
          <span className="text-xs text-muted-foreground mt-1">
            Level {getTierUnlockLevel(tier)}
          </span>
        )}
      </button>
    )
  }

  const renderTierSection = (tier: PlantTier) => {
    const plants = plantsByTier[tier]
    if (plants.length === 0) return null

    const isLocked = !tierStatus[tier]
    const isSubLocked = isSubscriptionLocked(tier)
    const requiredSub = getMinimumSubscriptionForPlantTier(tier)

    return (
      <div key={tier}>
        <h3 className={cn('mb-3 flex items-center gap-2 font-semibold text-[#4d6748]', isLocked && 'opacity-60')}>
          <TierBadge tier={tier} showLabel showTooltip={false} locked={isLocked} />
          {isLocked && !isSubLocked && (
            <span className="text-xs text-muted-foreground">
              (Level {getTierUnlockLevel(tier)})
            </span>
          )}
          {isSubLocked && (
            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Crown className="h-3 w-3" />
              {requiredSub.toUpperCase()}
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {plants.map((plant) => renderPlantCard(plant, isLocked))}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Only show trigger button in uncontrolled mode */}
      {!isControlled && (
        <DialogTrigger asChild>
          <Button disabled={!slotCheck.hasSlot}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plant
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto border-[#d9dfce] bg-[#fffaf0]/98 text-[#355239] shadow-[0_28px_90px_rgba(52,70,44,.28)] sm:rounded-[2rem]">
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-[#355239]">Chọn một người bạn mới</DialogTitle>
              <DialogDescription className="text-[#71806c]">
                Chọn dáng cây bạn muốn ngắm lớn lên cùng thói quen này.
              </DialogDescription>
            </DialogHeader>

            {/* Slot indicator */}
            {PLANT_CREATION_GATES_ENABLED && effectiveProfile && (
              <div className="py-2">
                <SlotIndicator
                  currentCount={actualPlantCount}
                  maxSlots={slotCheck.maxSlots}
                  variant="progress"
                />
              </div>
            )}

            {!slotCheck.hasSlot && (
              <div className={cn(
                "p-3 rounded-lg border",
                slotCheck.isSubscriptionLimited
                  ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
              )}>
                {slotCheck.isSubscriptionLimited ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">
                      Your garden is full! Upgrade to grow more plants.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                      onClick={() => showUpgradeModal('plant_limit')}
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      Upgrade
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Your garden is full! Level up to unlock more plant slots.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-7 py-4">
              {useTierGrouping ? (
                // Tier-based grouping (new system)
                <>
                  {([1, 2, 3, 4, 5] as PlantTier[]).map(renderTierSection)}
                </>
              ) : (
                // Backward compatibility: category-based grouping
                <>
                  <div>
                    <h3 className="font-medium mb-3">Basic Plants</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {basicPlants.map((plant) => renderPlantCard(plant, false))}
                    </div>
                  </div>

                  {specialPlants.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Special Plants
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {specialPlants.map((plant) => renderPlantCard(plant, false))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{selectedType?.icon}</span>
                Trồng {selectedType?.name}
              </DialogTitle>
              <DialogDescription>
                Gọi tên thói quen để cây có câu chuyện riêng trong khu vườn.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên thói quen *</Label>
                <Input
                  id="name"
                  placeholder="Ví dụ: Chạy bộ sáng, đọc 30 phút, thiền"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-[#d7dfcc] bg-white/75 text-[#355239] placeholder:text-[#9aa393] focus-visible:ring-[#91aa7e]"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Vì sao bạn bắt đầu? (không bắt buộc)</Label>
                <Textarea
                  id="description"
                  placeholder="Một lời nhắc dịu dàng cho chính bạn…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl border-[#d7dfcc] bg-white/75 text-[#355239] placeholder:text-[#9aa393] focus-visible:ring-[#91aa7e]"
                  rows={3}
                />
              </div>

              {/* Easy Mode Toggle */}
              <div className="space-y-3 rounded-[1.35rem] border border-[#dbe5cd] bg-[#edf3df]/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌱</span>
                    <div>
                      <div className="text-sm font-semibold">Bắt đầu thật nhỏ</div>
                      <div className="text-xs text-[#71806c]">Phiên bản chỉ mất 2 phút</div>
                    </div>
                  </div>
                  <Switch
                    id="easy-mode"
                    checked={easyMode}
                    onCheckedChange={setEasyMode}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                {/* XP bonus callout - always visible */}
                <div className="flex items-center gap-1 text-xs text-[#60804e]">
                  <span>⚡</span>
                  <span>Thêm 20% XP trong 30 ngày đầu</span>
                </div>

                {/* Tiny seed input - only when easy mode is ON */}
                {easyMode && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      What&apos;s the 2-minute version?
                    </label>
                    <input
                      type="text"
                      value={tinySeed}
                      onChange={(e) => setTinySeed(e.target.value)}
                      placeholder={`e.g., "Read just 1 page"`}
                      maxLength={100}
                      className="w-full text-sm rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      This is what counts when you really don&apos;t feel like it.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-[1.25rem] border border-[#e2e2d5] bg-white/55 p-4">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  Nhịp lớn lên
                  {selectedType?.tier && (
                    <TierBadge tier={selectedType.tier as PlantTier} size="sm" />
                  )}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Trưởng thành sau {selectedType?.maturity_days} ngày</li>
                  <li>
                    • Frequency:{' '}
                    {selectedType?.frequency_type === 'daily' ? 'Chăm mỗi ngày' : 'Linh hoạt'}
                  </li>
                  <li>
                    • Độ ẩm giảm {selectedType?.moisture_decay_rate}% mỗi ngày chưa chăm
                  </li>
                  {selectedType?.special_effect && (
                    <li className="text-purple-600">• Has special ability!</li>
                  )}
                </ul>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleBack} className="rounded-full border-[#cad5bd] bg-white/70 text-[#4d6748] hover:bg-[#edf3df]">
                Quay lại
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()} className="rounded-full bg-[#638653] px-6 text-white hover:bg-[#557747]">
                {isPending ? 'Đang vun đất…' : 'Trồng cây'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
