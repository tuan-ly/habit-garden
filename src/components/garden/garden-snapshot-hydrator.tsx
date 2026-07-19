'use client'

import { useEffect } from 'react'
import { useInventory } from '@/lib/context/inventory-context'
import type { PlacedDecorationWithType } from '@/types/database'

export function GardenSnapshotHydrator({
  placedDecorations,
}: {
  placedDecorations: PlacedDecorationWithType[]
}) {
  const { hydratePlacedDecorations } = useInventory()

  useEffect(() => {
    hydratePlacedDecorations(placedDecorations)
  }, [hydratePlacedDecorations, placedDecorations])

  return null
}
