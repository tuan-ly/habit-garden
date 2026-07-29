'use client'

import { memo } from 'react'
import { Book } from 'lucide-react'
import type { VirtualPlant } from '@/lib/habit-plant-mapping'

interface HabitPlantTileProps {
  plant: VirtualPlant
  isActive: boolean
  onClick: () => void
}

/**
 * Temporary placeholder component for habit plants in the garden.
 * Phase 2.2 will replace this with full visual treatment.
 */
function HabitPlantTileComponent({ plant, isActive }: HabitPlantTileProps) {
  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* Simple book icon as placeholder */}
      <div
        className={`
          flex items-center justify-center
          w-12 h-12 rounded-lg
          bg-gradient-to-br from-amber-100 to-amber-200
          border-2 border-amber-300
          shadow-lg
          transition-all duration-300
          ${isActive ? 'ring-2 ring-blue-400 ring-offset-2 animate-pulse' : ''}
        `}
      >
        <Book className="w-6 h-6 text-amber-700" />
      </div>

      {/* Plant name */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-medium text-stone-600 bg-white/80 px-2 py-0.5 rounded-full">
          {plant.name}
        </span>
      </div>
    </div>
  )
}

export const HabitPlantTile = memo(HabitPlantTileComponent)
