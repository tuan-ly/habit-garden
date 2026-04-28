'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { PlantWithType, PlantStatus } from '@/types/database'

// Growth stage thresholds matching plant-visual.tsx
const GROWTH_STAGES = {
    seed: { min: 0, max: 10 },
    sprout: { min: 10, max: 25 },
    growing: { min: 25, max: 75 },
    blooming: { min: 75, max: 100 },
    mature: { min: 100, max: Infinity },
} as const

export type GrowthStage = keyof typeof GROWTH_STAGES

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
}

function getGrowthStage(growthPercentage: number, status: PlantStatus): GrowthStage {
    if (status === 'mature') return 'mature'
    if (status === 'dead') return 'seed' // Dead plants show withered version

    if (growthPercentage < GROWTH_STAGES.seed.max) return 'seed'
    if (growthPercentage < GROWTH_STAGES.sprout.max) return 'sprout'
    if (growthPercentage < GROWTH_STAGES.growing.max) return 'growing'
    if (growthPercentage < GROWTH_STAGES.blooming.max) return 'blooming'
    return 'mature'
}

// Map plant type names to folder names
function getPlantFolder(plantTypeName: string): string {
    const PLANT_TYPE_FOLDERS: Record<string, string> = {
        'generic': 'generic',
        'sunflower': 'sunflower',
        'cherry blossom': 'cherry-blossom',
        'cherry': 'cherry-blossom',
        'sakura': 'cherry-blossom',
        'cactus': 'cactus',
        'bonsai': 'bonsai',
        'lotus': 'lotus',
        'rose': 'rose',
        'bamboo': 'bamboo',
    }
    const normalizedName = plantTypeName.toLowerCase().trim()
    return PLANT_TYPE_FOLDERS[normalizedName] || 'generic'
}

// Map clean stage names to numbered file prefixes
const STAGE_FILE_PREFIX: Record<GrowthStage, string> = {
    seed: '01-seed',
    sprout: '02-sprout',
    growing: '03-growing',
    blooming: '04-blooming',
    mature: '05-mature',
}

function getPlantImagePath(plantTypeName: string, stage: GrowthStage, isDead: boolean): string {
    const folder = getPlantFolder(plantTypeName)

    if (isDead) {
        return `/plants/${folder}/dead.png`
    }

    return `/plants/${folder}/${STAGE_FILE_PREFIX[stage]}.png`
}

export function PlantImage({
    plant,
    size = 'md',
    showGrowthTransition = false,
    className,
    alignBottom = false,
}: PlantImageProps) {
    const isDead = plant.status === 'dead'
    const currentStage = getGrowthStage(plant.growth_percentage, plant.status)
    const sizeConfig = SIZE_CONFIG[size]

    const imagePath = getPlantImagePath(plant.plant_type.name, currentStage, isDead)
    const icon = plant.plant_type.icon || '🌱'

    // Track image load errors for emoji fallback
    const [imgError, setImgError] = useState(false)

    // Reset error state when plant type or stage changes
    useEffect(() => {
        setImgError(false)
    }, [plant.plant_type.name, currentStage, isDead])

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
                    loading="lazy"
                    onError={() => setImgError(true)}
                    className={cn(
                        'transition-all duration-300 object-contain',
                        isDead && 'grayscale opacity-60'
                    )}
                />
            )}

            {/* Wilting indicator for low moisture */}
            {!isDead && plant.current_moisture < 30 && (
                <span className="absolute -top-1 -right-1 text-xs animate-pulse">💦</span>
            )}
        </div>
    )
}

// Export helper functions for use in other components
export { getGrowthStage, getPlantFolder, getPlantImagePath, GROWTH_STAGES }
