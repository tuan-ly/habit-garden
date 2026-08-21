'use client'

import { CapabilitySlot } from '@/components/capabilities/capability-slot'
import type { PlantWithType } from '@/types/database'

interface ReadingCapabilityControlProps {
  plant: PlantWithType
  onAttached?: () => void
  compact?: boolean
}

/**
 * Compatibility wrapper for older call sites. New UI should render the generic
 * CapabilitySlot so adding another capability does not widen Garden code.
 */
export function ReadingCapabilityControl({
  plant,
  onAttached,
}: ReadingCapabilityControlProps) {
  return (
    <CapabilitySlot
      plant={plant}
      onAttached={() => onAttached?.()}
    />
  )
}
