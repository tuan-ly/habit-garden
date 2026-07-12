'use client'

import { DecorationImage } from '@/components/garden/decoration-image'
import type { DecorationType, DecorationRotation } from '@/types/database'
import { cn } from '@/lib/utils'

interface PlacementGhostProps {
  decorationType: DecorationType
  rotation: DecorationRotation
  isValid: boolean
  pixelSize: number
  className?: string
}

export function PlacementGhost({
  decorationType,
  rotation,
  isValid,
  pixelSize,
  className,
}: PlacementGhostProps) {
  return (
    <div
      className={cn(
        'relative pointer-events-none transition-[opacity,filter] duration-150',
        isValid ? 'opacity-65 drop-shadow-[0_8px_8px_rgba(41,54,31,0.25)]' : 'opacity-35 grayscale-[0.35]',
        className
      )}
    >
      <DecorationImage
        decorationType={decorationType}
        size="lg"
        rotation={rotation}
        isGhost
        pixelSize={pixelSize}
      />
      {!isValid && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-red-500 text-2xl">✕</span>
        </div>
      )}
    </div>
  )
}
