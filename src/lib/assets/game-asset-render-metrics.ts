export const GARDEN_PLANT_ART_BOX_SIZE = 64

export function getGardenTileSize(viewportWidth: number, sanctuaryMode = true): number {
  if (sanctuaryMode && viewportWidth < 640) return 132
  if (viewportWidth < 640) return 100
  if (viewportWidth < 1024) return 120
  return 140
}

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

export function getGardenEntityRenderMetrics({
  kind,
  tileSize,
  footprint,
  growthPercentage = 100,
}: {
  kind: 'plant' | 'decoration'
  tileSize: number
  footprint: number
  growthPercentage?: number
}) {
  if (kind === 'decoration') {
    return {
      artBoxSize: getDecorationPixelSize(tileSize, footprint),
      renderScale: 1,
      artSize: getDecorationPixelSize(tileSize, footprint),
    }
  }
  const footprintScale = 1 + (Math.max(1, footprint) - 1) * 0.8
  const renderScale = getPlantGrowthScale(growthPercentage) * footprintScale
  return {
    artBoxSize: GARDEN_PLANT_ART_BOX_SIZE,
    renderScale,
    artSize: GARDEN_PLANT_ART_BOX_SIZE * renderScale,
  }
}
