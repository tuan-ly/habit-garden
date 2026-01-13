'use client'

import { cn } from '@/lib/utils'
import {
  type AchievementDefinition,
  type AchievementProgress,
  ACHIEVEMENTS,
  getVisibleAchievements,
} from '@/lib/achievements'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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

  const achievementProgress = getVisibleAchievements().map((achievement) => {
    const found = progress.find((p) => p.achievement.id === achievement.id)
    return found || {
      achievement,
      currentValue: 0,
      isComplete: unlockedIds.includes(achievement.id),
      progress: unlockedIds.includes(achievement.id) ? 100 : 0,
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

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
        <div>
          <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
          <p className="text-2xl font-bold">
            {unlockedIds.length} / {getVisibleAchievements().length}
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
                      !selectedAchievement.isComplete && 'grayscale opacity-50'
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
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {selectedAchievement.isComplete ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                {/* Progress */}
                {!selectedAchievement.isComplete && (
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
  onClick?: () => void
}

function AchievementCard({ progress, onClick }: AchievementCardProps) {
  const { achievement, isComplete, progress: progressPercent, currentValue } = progress

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border text-center transition-all hover:shadow-md',
        isComplete
          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300 dark:border-yellow-700'
          : 'bg-card border-border hover:bg-accent'
      )}
    >
      {/* Icon */}
      <span className={cn('text-3xl block mb-2', !isComplete && 'grayscale opacity-50')}>
        {achievement.icon}
      </span>

      {/* Name */}
      <p className="text-sm font-medium truncate">{achievement.name}</p>

      {/* Progress or checkmark */}
      {isComplete ? (
        <span className="text-xs text-green-600 dark:text-green-400">Unlocked</span>
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
