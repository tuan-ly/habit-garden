export const GARDEN_PLANT_ART_BOX_SIZE = 64

export function getPlantGrowthScale(growthPercentage: number): number {
  if (growthPercentage < 10) return 0.72
  if (growthPercentage < 25) return 0.84
  if (growthPercentage < 50) return 0.96
  if (growthPercentage < 75) return 1.08
  if (growthPercentage < 100) return 1.14
  return 1.2
}

export function getDecorationPixelSize(tileSize: number, gridSize: number): number {
  return tileSize * (0.62 + gridSize * 0.62)
}
