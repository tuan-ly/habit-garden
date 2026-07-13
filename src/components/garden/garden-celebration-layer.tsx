'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'
import { WateringCelebration } from './watering-celebration'
import { SanctuaryGardenReaction } from './sanctuary-garden-reaction'
import type { AchievementDefinition } from '@/lib/achievements'
import type { CelebrationState } from './use-garden-interactions'

// Dynamic imports — these are shown rarely (level up, achievement unlock)
const LevelUpModal = dynamic(() => import('@/components/game-ui/level-up-modal').then(m => ({ default: m.LevelUpModal })), { ssr: false })
const AchievementQueue = dynamic(() => import('@/components/gamification/achievement-popup').then(m => ({ default: m.AchievementQueue })), { ssr: false })
const HarvestDialog = dynamic(() => import('@/components/plants/harvest-dialog').then(m => ({ default: m.HarvestDialog })), { ssr: false })

interface GardenCelebrationLayerProps {
  celebration: CelebrationState | null
  onCelebrationComplete: () => void
  levelUpData: { newLevel: number; oldLevel: number } | null
  onLevelUpClose: () => void
  pendingAchievements: AchievementDefinition[]
  onAchievementsComplete: () => void
  harvestData: { plantName: string; material: { name: string; icon: string } } | null
  onHarvestClose: () => void
  showCelebrations: boolean
  sanctuaryMode?: boolean
}

export const GardenCelebrationLayer = memo(function GardenCelebrationLayer({
  celebration,
  onCelebrationComplete,
  levelUpData,
  onLevelUpClose,
  pendingAchievements,
  onAchievementsComplete,
  harvestData,
  onHarvestClose,
  showCelebrations,
  sanctuaryMode = false,
}: GardenCelebrationLayerProps) {
  return (
    <>
      {/* Watering celebration effect */}
      {showCelebrations && sanctuaryMode && (
        <SanctuaryGardenReaction
          active={celebration?.active ?? false}
          plantName={celebration?.plantName}
          onComplete={onCelebrationComplete}
        />
      )}

      {showCelebrations && !sanctuaryMode && (
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
      {!sanctuaryMode && levelUpData && (
        <LevelUpModal
          open
          onOpenChange={(open) => { if (!open) onLevelUpClose() }}
          newLevel={levelUpData.newLevel}
          oldLevel={levelUpData.oldLevel}
        />
      )}

      {/* Achievement unlock notifications */}
      {!sanctuaryMode && pendingAchievements.length > 0 && (
        <AchievementQueue
          achievements={pendingAchievements}
          onComplete={onAchievementsComplete}
        />
      )}

      {/* Harvest material notification */}
      {!sanctuaryMode && harvestData && (
        <HarvestDialog
          open
          onClose={onHarvestClose}
          plantName={harvestData.plantName}
          material={harvestData.material}
        />
      )}
    </>
  )
})
