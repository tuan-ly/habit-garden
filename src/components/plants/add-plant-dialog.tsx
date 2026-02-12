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
import { usePlants, useSubscription } from '@/lib/context'
import { useDevOverride, useDevDebug } from '@/components/dev/dev-debug-context'
import { toast } from 'sonner'
import { TierBadge } from '@/components/ui/tier-badge'
import { SlotIndicator } from '@/components/garden/slot-indicator'
import {
  isTierUnlocked,
  getTierInfo,
  getTierUnlockLevel,
  checkSlotAvailability,
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
  const effectiveProfile = profile ? { ...profile, level: effectiveLevel } : null

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? (onOpenChange || (() => {})) : setUncontrolledOpen
  const [step, setStep] = useState<'select' | 'details'>('select')
  const [selectedType, setSelectedType] = useState<PlantType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()

  // Calculate actual plant count (from context or prop)
  const actualPlantCount = currentPlantCount || plants.filter(p => p.status !== 'dead').length

  // Check slot availability (level-based)
  const levelSlotCheck = useMemo(() => {
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
        const requiredSub = getMinimumSubscriptionForPlantTier(tier)
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
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const renderPlantCard = (plant: PlantType, isLocked: boolean) => {
    const tier = (plant.tier || 1) as PlantTier
    const tierInfo = getTierInfo(tier)

    return (
      <button
        key={plant.id}
        onClick={() => handleSelectType(plant, isLocked)}
        disabled={isLocked}
        className={cn(
          'flex flex-col items-center p-4 rounded-lg border transition-colors text-left relative',
          isLocked
            ? 'opacity-60 cursor-not-allowed bg-muted border-muted'
            : 'hover:border-primary hover:bg-accent',
          plant.category === 'special' && !isLocked && 'border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950'
        )}
      >
        {isLocked && (
          <div className="absolute top-2 right-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <span className="text-3xl mb-2">{plant.icon}</span>
        <span className="font-medium text-sm">{plant.name}</span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
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
    const tierInfo = getTierInfo(tier)
    const requiredSub = getMinimumSubscriptionForPlantTier(tier)

    return (
      <div key={tier}>
        <h3 className={cn('font-medium mb-3 flex items-center gap-2', isLocked && 'opacity-60')}>
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle>Choose a Plant Type</DialogTitle>
              <DialogDescription>
                Each plant type has different growth requirements and maturity times.
              </DialogDescription>
            </DialogHeader>

            {/* Slot indicator */}
            {effectiveProfile && (
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

            <div className="space-y-6 py-4">
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
                Plant a {selectedType?.name}
              </DialogTitle>
              <DialogDescription>
                Give your habit a name and description to help you stay motivated.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Habit Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Morning Exercise, Read 30 mins, Meditate"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Why is this habit important to you?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="p-3 rounded-lg bg-muted">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  Plant Info
                  {selectedType?.tier && (
                    <TierBadge tier={selectedType.tier as PlantTier} size="sm" />
                  )}
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Matures in {selectedType?.maturity_days} days</li>
                  <li>
                    • Frequency:{' '}
                    {selectedType?.frequency_type === 'daily' ? 'Daily check-in' : 'Flexible'}
                  </li>
                  <li>
                    • Moisture decay: {selectedType?.moisture_decay_rate}% per day without
                    watering
                  </li>
                  {selectedType?.special_effect && (
                    <li className="text-purple-600">• Has special ability!</li>
                  )}
                </ul>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? 'Planting...' : 'Plant Habit'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
