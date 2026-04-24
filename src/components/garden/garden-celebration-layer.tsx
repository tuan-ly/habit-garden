'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'
import { WateringCelebration } from './watering-celebration'
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

      {/* Harvest material notification */}
      <HarvestDialog
        open={!!harvestData}
        onClose={onHarvestClose}
        plantName={harvestData?.plantName ?? ''}
        material={harvestData?.material ?? null}
      />
    </>
  )
})
