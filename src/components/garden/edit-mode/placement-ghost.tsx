'use client'

import { DecorationImage } from '@/components/garden/decoration-image'
import type { DecorationType, DecorationRotation } from '@/types/database'
import { cn } from '@/lib/utils'

interface PlacementGhostProps {
  decorationType: DecorationType
  rotation: DecorationRotation
  isValid: boolean
  className?: string
}

export function PlacementGhost({
  decorationType,
  rotation,
  isValid,
  className,
}: PlacementGhostProps) {
  return (
    <div
      className={cn(
        'pointer-events-none transition-opacity duration-150',
        isValid ? 'opacity-60' : 'opacity-30',
        className
      )}
    >
      <DecorationImage
        decorationType={decorationType}
        size="lg"
        rotation={rotation}
        isGhost
      />
      {!isValid && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-red-500 text-2xl">✕</span>
        </div>
      )}
    </div>
  )
}
