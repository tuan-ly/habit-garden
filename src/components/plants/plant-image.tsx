'use client'

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

// Size configurations - using text sizes for emoji
const SIZE_CONFIG = {
    sm: { className: 'w-8 h-8 text-2xl' },
    md: { className: 'w-10 h-10 text-3xl' },
    lg: { className: 'w-12 h-12 text-4xl' },
    xl: { className: 'w-16 h-16 text-5xl' },
    '2xl': { className: 'w-24 h-24 text-7xl' },
} as const

interface PlantImageProps {
    plant: PlantWithType
    size?: keyof typeof SIZE_CONFIG
    showGrowthTransition?: boolean
    className?: string
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

// Map plant type names to folder names (kept for future use)
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
        'money tree': 'money-tree',
        'money': 'money-tree',
    }
    const normalizedName = plantTypeName.toLowerCase().trim()
    return PLANT_TYPE_FOLDERS[normalizedName] || 'generic'
}

function getPlantImagePath(plantTypeName: string, stage: GrowthStage, isDead: boolean): string {
    const folder = getPlantFolder(plantTypeName)

    if (isDead) {
        return `/plants/${folder}/dead.png`
    }

    return `/plants/${folder}/${stage}.png`
}

export function PlantImage({
    plant,
    size = 'md',
    showGrowthTransition = false,
    className,
}: PlantImageProps) {
    const isDead = plant.status === 'dead'
    const currentStage = getGrowthStage(plant.growth_percentage, plant.status)
    const sizeConfig = SIZE_CONFIG[size]

    // Temporarily use emoji icon from plant_type instead of PNG images
    // TODO: Replace with Image component when proper plant images are ready
    const icon = plant.plant_type.icon || '🌱'

    return (
        <div
            className={cn(
                'relative inline-flex items-center justify-center',
                sizeConfig.className,
                showGrowthTransition && 'animate-growth-burst',
                className
            )}
        >
            <span
                className={cn(
                    'transition-all duration-300 select-none',
                    isDead && 'grayscale opacity-60'
                )}
                role="img"
                aria-label={`${plant.plant_type.name} - ${currentStage}`}
            >
                {icon}
            </span>

            {/* Wilting indicator for low moisture */}
            {!isDead && plant.current_moisture < 30 && (
                <span className="absolute -top-1 -right-1 text-xs animate-pulse">💦</span>
            )}
        </div>
    )
}

// Export helper functions for use in other components
export { getGrowthStage, getPlantFolder, getPlantImagePath, GROWTH_STAGES }
