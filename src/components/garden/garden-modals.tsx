'use client'

import { memo, useCallback } from 'react'
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import { GentleWateringModal } from '@/components/plants/gentle-watering-modal'
import type { PlantWithType, PlantType } from '@/types/database'

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
      {/* Gentle watering modal */}
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
        periodProgress={wateringPlant?.today_value}
        currentPeriodTarget={wateringPlant?.goal?.current_week_target}
        periodLabel={wateringPlant?.goal ? `Week ${wateringPlant.goal.week_number}` : undefined}
        daysLeftInPeriod={wateringPlant?.goal ? (() => { const d = new Date().getDay(); return d === 0 ? 0 : 7 - d })() : undefined}
      />

      {/* Add plant dialog */}
      <AddPlantDialog
        plantTypes={plantTypes}
        open={addDialogOpen}
        onOpenChange={handleAddDialogOpenChange}
        gridPosition={gridPosition}
      />

      {/* Plant detail sheet */}
      <PlantDetailSheet
        plant={selectedPlant}
        open={sheetOpen}
        onOpenChange={onSheetOpenChange}
      />
    </>
  )
})
