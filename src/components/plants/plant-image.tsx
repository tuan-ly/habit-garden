'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'
import { getGroundedArtTransform } from '@/lib/assets/game-asset-display'
import {
    GROWTH_STAGES,
    getGrowthStage,
    getPlantAssetEntry,
    getPlantFolder,
    getPlantImagePath,
    type GrowthStage,
} from '@/lib/assets/plant-asset-identity'

export type { GrowthStage }

// Size configurations - pixel dimensions for <img> + classNames for container
// width/height = intrinsic bitmap size requested from Next.js image optimizer
// Must be large enough to stay sharp at max zoom (2.5x) and on high-DPR screens
const SIZE_CONFIG = {
    sm:  { width: 32,  height: 32,  className: 'w-8 h-8',   classNameAlignBottom: 'w-8' },
    md:  { width: 48,  height: 48,  className: 'w-10 h-10', classNameAlignBottom: 'w-10' },
    lg:  { width: 64,  height: 64,  className: 'w-12 h-12', classNameAlignBottom: 'w-12' },
    xl:  { width: 384, height: 384, className: 'w-16 h-16', classNameAlignBottom: 'w-16' },
    '2xl': { width: 512, height: 512, className: 'w-24 h-24', classNameAlignBottom: 'w-24' },
} as const

interface PlantImageProps {
    plant: PlantWithType
    size?: keyof typeof SIZE_CONFIG
    showGrowthTransition?: boolean
    className?: string
    /** If true, aligns content to bottom (no vertical centering) */
    alignBottom?: boolean
    showStatusIndicator?: boolean
    priority?: boolean
}

export function PlantImage({
    plant,
    size = 'md',
    showGrowthTransition = false,
    className,
    alignBottom = false,
    showStatusIndicator = true,
    priority = false,
}: PlantImageProps) {
    const isDead = plant.status === 'dead'
    const currentStage = getGrowthStage(plant.growth_percentage, plant.status)
    const sizeConfig = SIZE_CONFIG[size]

    const imagePath = getPlantImagePath(plant.plant_type.name, currentStage, isDead)
    const assetSpec = getPlantAssetEntry(plant)?.display
    const icon = plant.plant_type.icon || '🌱'

    // Track image load errors for emoji fallback
    const [failedPath, setFailedPath] = useState<string | null>(null)
    const imgError = failedPath === imagePath

    return (
        <div
            className={cn(
                'relative inline-flex justify-center',
                alignBottom ? 'items-end' : 'items-center',
                alignBottom ? sizeConfig.classNameAlignBottom : sizeConfig.className,
                showGrowthTransition && 'animate-growth-burst',
                className
            )}
        >
            {imgError ? (
                // Emoji fallback when image fails to load
                <span
                    className={cn(
                        'transition-all duration-300 select-none leading-none',
                        isDead && 'grayscale opacity-60'
                    )}
                    role="img"
                    aria-label={`${plant.plant_type.name} - ${currentStage}`}
                >
                    {icon}
                </span>
            ) : (
                <Image
                    src={imagePath}
                    alt={`${plant.plant_type.name} - ${currentStage}`}
                    width={sizeConfig.width}
                    height={sizeConfig.height}
                    sizes={`${sizeConfig.width}px`}
                    quality={85}
                    priority={priority}
                    loading={priority ? undefined : 'lazy'}
                    onError={() => setFailedPath(imagePath)}
                    className={cn(
                        'transition-all duration-300 object-contain',
                        isDead && 'grayscale opacity-60'
                    )}
                    style={alignBottom && assetSpec ? getGroundedArtTransform(assetSpec) : undefined}
                />
            )}

            {/* Wilting indicator for low moisture */}
            {showStatusIndicator && !isDead && plant.current_moisture < 30 && (
                <span className="absolute -top-1 -right-1 text-xs animate-pulse">💦</span>
            )}
        </div>
    )
}

// Export helper functions for use in other components
export { getGrowthStage, getPlantFolder, getPlantImagePath, GROWTH_STAGES }
