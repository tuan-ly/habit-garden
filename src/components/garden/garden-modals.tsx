'use client'

import { memo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { PlantWithType, PlantType } from '@/types/database'
import type { WateringActionMode } from '@/components/plants/gentle-watering-modal'

// Dynamic imports — these heavy modal components are only loaded when needed
const AddPlantDialog = dynamic(() => import('@/components/plants/add-plant-dialog').then(m => ({ default: m.AddPlantDialog })), { ssr: false })
const PlantDetailSheet = dynamic(() => import('@/components/plants/plant-detail-sheet').then(m => ({ default: m.PlantDetailSheet })), { ssr: false })
const GentleWateringModal = dynamic(() => import('@/components/plants/gentle-watering-modal').then(m => ({ default: m.GentleWateringModal })), { ssr: false })
const SanctuaryActionDialog = dynamic(() => import('./sanctuary-action-dialog').then(m => ({ default: m.SanctuaryActionDialog })), { ssr: false })
const SanctuaryPlantDetailSheet = dynamic(() => import('./sanctuary-plant-detail-sheet').then(m => ({ default: m.SanctuaryPlantDetailSheet })), { ssr: false })

interface GardenModalsProps {
  // Watering modal
  wateringPlant: PlantWithType | null
  wateringModalOpen: boolean
  onWateringOpenChange: (open: boolean) => void
  onWater: (notes: string | undefined, estimatedXp: number) => Promise<void>
  onLogAndWater: (value: number | undefined, notes: string | undefined, estimatedXp: number) => Promise<void>
  onDetails: () => void
  // Add dialog
  plantTypes: PlantType[]
  addDialogOpen: boolean
  onAddDialogOpenChange: (open: boolean) => void
  gridPosition: { row: number; col: number } | null
  onGridPositionClear: () => void
  // Detail sheet
  selectedPlant: PlantWithType | null
  sheetOpen: boolean
  onSheetOpenChange: (open: boolean) => void
  // Shared
  journalStreak: number
  isWateredToday: (plant: PlantWithType) => boolean
  wateringInitialMode?: WateringActionMode
  sanctuaryMode?: boolean
}

function getDaysLeftInPeriod(periodEnd?: string): number | undefined {
  if (!periodEnd) return undefined

  const end = new Date(periodEnd)
  const now = new Date()
  if (Number.isNaN(end.getTime())) return undefined

  const millisecondsPerDay = 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / millisecondsPerDay))
}

export const GardenModals = memo(function GardenModals({
  wateringPlant,
  wateringModalOpen,
  onWateringOpenChange,
  onWater,
  onLogAndWater,
  onDetails,
  plantTypes,
  addDialogOpen,
  onAddDialogOpenChange,
  gridPosition,
  onGridPositionClear,
  selectedPlant,
  sheetOpen,
  onSheetOpenChange,
  journalStreak,
  isWateredToday,
  wateringInitialMode,
  sanctuaryMode = false,
}: GardenModalsProps) {
  const handleAddDialogOpenChange = useCallback(
    (open: boolean) => {
      onAddDialogOpenChange(open)
      if (!open) onGridPositionClear()
    },
    [onAddDialogOpenChange, onGridPositionClear]
  )

  return (
    <>
      {wateringModalOpen && wateringPlant && (sanctuaryMode ? (
        <SanctuaryActionDialog
          key={wateringPlant?.id ?? 'sanctuary-action'}
          plant={wateringPlant}
          open={wateringModalOpen}
          initialMode={wateringInitialMode ?? 'choose'}
          onOpenChange={onWateringOpenChange}
          onWater={onWater}
          onLogAndWater={onLogAndWater}
          onDetails={onDetails}
        />
      ) : (
        <GentleWateringModal
          plant={wateringPlant}
          open={wateringModalOpen}
          onOpenChange={onWateringOpenChange}
          onWater={onWater}
          onLogAndWater={onLogAndWater}
          onDetails={onDetails}
          hasGoal={!!wateringPlant?.goal_mode}
          goalUnit={wateringPlant?.goal?.unit}
          goalMode={wateringPlant?.goal_mode || undefined}
          isWateredToday={wateringPlant ? isWateredToday(wateringPlant) : false}
          journalStreak={journalStreak}
          periodProgress={wateringPlant?.goal?.period_progress}
          currentPeriodTarget={wateringPlant?.goal?.current_period_target}
          periodLabel={wateringPlant?.goal?.period_label}
          daysLeftInPeriod={getDaysLeftInPeriod(wateringPlant?.goal?.period_end)}
          initialMode={wateringInitialMode}
        />
      ))}

      {/* Add plant dialog */}
      {addDialogOpen && (
        <AddPlantDialog
          plantTypes={plantTypes}
          open={addDialogOpen}
          onOpenChange={handleAddDialogOpenChange}
          gridPosition={gridPosition}
        />
      )}

      {sheetOpen && selectedPlant && (sanctuaryMode ? (
        <SanctuaryPlantDetailSheet
          plant={selectedPlant}
          open={sheetOpen}
          onOpenChange={onSheetOpenChange}
        />
      ) : (
        <PlantDetailSheet
          plant={selectedPlant}
          open={sheetOpen}
          onOpenChange={onSheetOpenChange}
        />
      ))}
    </>
  )
})
