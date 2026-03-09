'use client'

import { memo } from 'react'
import { WateringCelebration } from './watering-celebration'
import { LevelUpModal } from '@/components/game-ui/level-up-modal'
import { AchievementQueue } from '@/components/gamification/achievement-popup'
import type { AchievementDefinition } from '@/lib/achievements'
import type { CelebrationState } from './use-garden-interactions'

interface GardenCelebrationLayerProps {
  celebration: CelebrationState | null
  onCelebrationComplete: () => void
  levelUpData: { newLevel: number; oldLevel: number } | null
  onLevelUpClose: () => void
  pendingAchievements: AchievementDefinition[]
  onAchievementsComplete: () => void
  showCelebrations: boolean
}

export const GardenCelebrationLayer = memo(function GardenCelebrationLayer({
  celebration,
  onCelebrationComplete,
  levelUpData,
  onLevelUpClose,
  pendingAchievements,
  onAchievementsComplete,
  showCelebrations,
}: GardenCelebrationLayerProps) {
  return (
    <>
      {/* Watering celebration effect */}
      {showCelebrations && (
        <WateringCelebration
          isActive={celebration?.active ?? false}
          position={celebration?.position}
          xpEarned={celebration?.xpEarned}
          plantName={celebration?.plantName}
          plantIcon={celebration?.plantIcon}
          streakCount={celebration?.streakCount}
          onComplete={onCelebrationComplete}
        />
      )}

      {/* Level up modal */}
      <LevelUpModal
        open={!!levelUpData}
        onOpenChange={(open) => { if (!open) onLevelUpClose() }}
        newLevel={levelUpData?.newLevel ?? 1}
        oldLevel={levelUpData?.oldLevel}
      />

      {/* Achievement unlock notifications */}
      {pendingAchievements.length > 0 && (
        <AchievementQueue
          achievements={pendingAchievements}
          onComplete={onAchievementsComplete}
        />
      )}
    </>
  )
})
