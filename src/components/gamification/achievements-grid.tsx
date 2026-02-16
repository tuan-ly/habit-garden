'use client'

import { cn } from '@/lib/utils'
import {
  type AchievementProgress,
  getVisibleAchievements,
} from '@/lib/achievements'
import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { claimAchievement } from '@/lib/actions/profile'
import { useRouter } from 'next/navigation'

interface AchievementsGridProps {
  progress: AchievementProgress[]
  unlockedIds: string[]
  className?: string
}

export function AchievementsGrid({
  progress,
  unlockedIds,
  className,
}: AchievementsGridProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementProgress | null>(null)
  const [claimedIds, setClaimedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const allUnlockedIds = [...unlockedIds, ...claimedIds]

  const achievementProgress = getVisibleAchievements().map((achievement) => {
    const found = progress.find((p) => p.achievement.id === achievement.id)
    const isNewlyClaimed = claimedIds.includes(achievement.id)
    if (found) {
      return {
        ...found,
        isComplete: found.isComplete || isNewlyClaimed,
        progress: (found.isComplete || isNewlyClaimed) ? 100 : found.progress,
      }
    }
    return {
      achievement,
      currentValue: 0,
      isComplete: allUnlockedIds.includes(achievement.id),
      progress: allUnlockedIds.includes(achievement.id) ? 100 : 0,
    }
  })

  // Group by tier
  const tiers: Record<number, AchievementProgress[]> = { 1: [], 2: [], 3: [], 4: [] }
  achievementProgress.forEach((p) => {
    tiers[p.achievement.tier].push(p)
  })

  const tierNames = {
    1: 'Bronze',
    2: 'Silver',
    3: 'Gold',
    4: 'Legendary',
  }

  const tierColors = {
    1: 'from-amber-600 to-amber-700',
    2: 'from-gray-400 to-gray-500',
    3: 'from-yellow-400 to-yellow-500',
    4: 'from-purple-500 to-pink-500',
  }

  // Check if an achievement is claimable (met requirements but not yet unlocked)
  const isClaimable = (item: AchievementProgress) => {
    return !item.isComplete &&
      item.currentValue >= item.achievement.requirementValue &&
      !allUnlockedIds.includes(item.achievement.id)
  }

  const handleClaim = async (achievementId: string) => {
    startTransition(async () => {
      const result = await claimAchievement(achievementId)
      if (result.success) {
        setClaimedIds(prev => [...prev, achievementId])
        toast.success(`Achievement unlocked! +${result.xpAwarded} XP`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to claim achievement')
      }
    })
  }

  // Count claimable achievements
  const claimableCount = achievementProgress.filter(isClaimable).length

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
        <div>
          <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
          <p className="text-2xl font-bold">
            {allUnlockedIds.length} / {getVisibleAchievements().length}
          </p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((tier) => {
            const unlocked = tiers[tier].filter((p) => p.isComplete).length
            const total = tiers[tier].length
            return (
              <div
                key={tier}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                  unlocked === total
                    ? `bg-gradient-to-br ${tierColors[tier as keyof typeof tierColors]} text-white`
                    : 'bg-muted text-muted-foreground'
                )}
                title={`${tierNames[tier as keyof typeof tierNames]}: ${unlocked}/${total}`}
              >
                {unlocked}
              </div>
            )
          })}
        </div>
      </div>

      {/* Claimable banner */}
      {claimableCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
            You have {claimableCount} achievement{claimableCount > 1 ? 's' : ''} ready to claim!
          </p>
        </div>
      )}

      {/* Tiers */}
      {([1, 2, 3, 4] as const).map((tier) => (
        <div key={tier}>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span
              className={cn(
                'w-4 h-4 rounded-full bg-gradient-to-br',
                tierColors[tier]
              )}
            />
            {tierNames[tier]} Achievements
            <span className="text-sm text-muted-foreground font-normal">
              ({tiers[tier].filter((p) => p.isComplete).length}/{tiers[tier].length})
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {tiers[tier].map((item) => (
              <AchievementCard
                key={item.achievement.id}
                progress={item}
                claimable={isClaimable(item)}
                onClaim={() => handleClaim(item.achievement.id)}
                isClaiming={isPending}
                onClick={() => setSelectedAchievement(item)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Achievement Detail Dialog */}
      <Dialog
        open={!!selectedAchievement}
        onOpenChange={(open) => !open && setSelectedAchievement(null)}
      >
        <DialogContent>
          {selectedAchievement && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'text-4xl',
                      !selectedAchievement.isComplete && !isClaimable(selectedAchievement) && 'grayscale opacity-50'
                    )}
                  >
                    {selectedAchievement.achievement.icon}
                  </span>
                  <div>
                    <DialogTitle>{selectedAchievement.achievement.name}</DialogTitle>
                    <DialogDescription>
                      {selectedAchievement.achievement.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-medium',
                      selectedAchievement.isComplete
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : isClaimable(selectedAchievement)
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {selectedAchievement.isComplete
                      ? 'Unlocked'
                      : isClaimable(selectedAchievement)
                      ? 'Ready to Claim'
                      : 'Locked'}
                  </span>
                </div>

                {/* Progress */}
                {!selectedAchievement.isComplete && !isClaimable(selectedAchievement) && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span>
                        {selectedAchievement.currentValue} /{' '}
                        {selectedAchievement.achievement.requirementValue}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${selectedAchievement.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Reward */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">XP Reward</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                    +{selectedAchievement.achievement.xpReward} XP
                  </span>
                </div>

                {/* Tier */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tier</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-3 h-3 rounded-full bg-gradient-to-br',
                        tierColors[selectedAchievement.achievement.tier]
                      )}
                    />
                    <span className="font-medium">
                      {tierNames[selectedAchievement.achievement.tier]}
                    </span>
                  </div>
                </div>

                {/* Claim button in dialog */}
                {isClaimable(selectedAchievement) && (
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                    onClick={() => {
                      handleClaim(selectedAchievement.achievement.id)
                      setSelectedAchievement(null)
                    }}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Gift className="h-4 w-4 mr-2" />
                    )}
                    Claim +{selectedAchievement.achievement.xpReward} XP
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Individual achievement card
interface AchievementCardProps {
  progress: AchievementProgress
  claimable?: boolean
  onClaim?: () => void
  isClaiming?: boolean
  onClick?: () => void
}

function AchievementCard({ progress, claimable, onClaim, isClaiming, onClick }: AchievementCardProps) {
  const { achievement, isComplete, progress: progressPercent, currentValue } = progress

  return (
    <button
      onClick={claimable ? onClaim : onClick}
      className={cn(
        'p-3 rounded-lg border text-center transition-all hover:shadow-md relative',
        isComplete
          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300 dark:border-yellow-700'
          : claimable
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/50 animate-pulse'
          : 'bg-card border-border hover:bg-accent'
      )}
    >
      {/* Claim badge */}
      {claimable && (
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
          <Gift className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Icon */}
      <span className={cn('text-3xl block mb-2', !isComplete && !claimable && 'grayscale opacity-50')}>
        {achievement.icon}
      </span>

      {/* Name */}
      <p className="text-sm font-medium truncate">{achievement.name}</p>

      {/* Progress or checkmark */}
      {isComplete ? (
        <span className="text-xs text-green-600 dark:text-green-400">Unlocked</span>
      ) : claimable ? (
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
          {isClaiming ? 'Claiming...' : `Claim +${achievement.xpReward} XP`}
        </span>
      ) : (
        <div className="mt-2">
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/60"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {currentValue}/{achievement.requirementValue}
          </span>
        </div>
      )}
    </button>
  )
}
