'use client'

import { memo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { PlantWithType, PlantType } from '@/types/database'

// Dynamic imports — these heavy modal components are only loaded when needed
const AddPlantDialog = dynamic(() => import('@/components/plants/add-plant-dialog').then(m => ({ default: m.AddPlantDialog })), { ssr: false })
const PlantDetailSheet = dynamic(() => import('@/components/plants/plant-detail-sheet').then(m => ({ default: m.PlantDetailSheet })), { ssr: false })
const GentleWateringModal = dynamic(() => import('@/components/plants/gentle-watering-modal').then(m => ({ default: m.GentleWateringModal })), { ssr: false })

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
        periodProgress={wateringPlant?.goal?.period_progress}
        currentPeriodTarget={wateringPlant?.goal?.current_period_target}
        periodLabel={wateringPlant?.goal?.period_label}
        daysLeftInPeriod={getDaysLeftInPeriod(wateringPlant?.goal?.period_end)}
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
