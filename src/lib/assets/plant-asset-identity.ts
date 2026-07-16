import type { PlantStatus, PlantWithType } from '@/types/database'
import { getPlantAssetSpec } from './game-asset-contract'

export const GROWTH_STAGES = {
  seed: { min: 0, max: 10 },
  sprout: { min: 10, max: 25 },
  growing: { min: 25, max: 75 },
  blooming: { min: 75, max: 100 },
  mature: { min: 100, max: Infinity },
} as const

export type GrowthStage = keyof typeof GROWTH_STAGES

const PLANT_TYPE_FOLDERS: Record<string, string> = {
  generic: 'generic', sunflower: 'sunflower', 'cherry blossom': 'cherry-blossom',
  cherry: 'cherry-blossom', sakura: 'cherry-blossom', cactus: 'cactus', bonsai: 'bonsai',
  lotus: 'lotus', rose: 'rose', bamboo: 'bamboo', dandelion: 'dandelion',
  succulent: 'succulent', mushroom: 'mushroom', clover: 'clover', vegetable: 'vegetable',
  bush: 'bush', daisy: 'daisy', mint: 'mint', lavender: 'lavender', tomato: 'tomato',
  orchid: 'orchid', tulip: 'tulip', peony: 'peony', pine: 'pine', banyan: 'banyan',
  'bodhi tree': 'bodhi-tree', bodhi: 'bodhi-tree', 'golden lotus': 'golden-lotus',
  'money tree': 'money-tree', 'magic beanstalk': 'magic-beanstalk',
  'phoenix flower': 'phoenix-flower', 'world tree': 'world-tree',
  'yellow apricot': 'yellow-apricot', 'peach blossom': 'peach-blossom', pumpkin: 'pumpkin',
  'christmas tree': 'christmas-tree',
}

export const STAGE_FILE_PREFIX: Record<GrowthStage, string> = {
  seed: '01-seed',
  sprout: '02-sprout',
  growing: '03-growing',
  blooming: '04-blooming',
  mature: '05-mature',
}

export function getGrowthStage(growthPercentage: number, status: PlantStatus): GrowthStage {
  if (status === 'mature') return 'mature'
  if (status === 'dead') return 'seed'
  if (growthPercentage < GROWTH_STAGES.seed.max) return 'seed'
  if (growthPercentage < GROWTH_STAGES.sprout.max) return 'sprout'
  if (growthPercentage < GROWTH_STAGES.growing.max) return 'growing'
  if (growthPercentage < GROWTH_STAGES.blooming.max) return 'blooming'
  return 'mature'
}

export function getPlantFolder(plantTypeName: string): string {
  return PLANT_TYPE_FOLDERS[plantTypeName.toLowerCase().trim()] || 'generic'
}

export function getPlantImagePath(plantTypeName: string, stage: GrowthStage, isDead: boolean): string {
  const folder = getPlantFolder(plantTypeName)
  return isDead ? `/plants/${folder}/dead.png` : `/plants/${folder}/${STAGE_FILE_PREFIX[stage]}.png`
}

export function getPlantAssetEntry(plant: PlantWithType) {
  if (plant.status === 'dead') return undefined
  const stage = getGrowthStage(plant.growth_percentage, plant.status)
  return getPlantAssetSpec(getPlantFolder(plant.plant_type.name), `${STAGE_FILE_PREFIX[stage]}.png`)
}
