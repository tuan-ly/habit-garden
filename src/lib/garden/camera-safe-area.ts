import type { PlantWithType, PlacedDecorationWithType } from '@/types/database'
import type { GameAssetDisplaySpec, NormalizedBounds } from '@/lib/assets/game-asset-contract'
import { getDecorationAssetSpec, resolveGameAssetDisplay } from '@/lib/assets/game-asset-contract'
import { getPlantAssetEntry } from '@/lib/assets/plant-asset-identity'
import {
  GARDEN_PLANT_ART_BOX_SIZE,
  getDecorationPixelSize,
  getPlantGrowthScale,
} from '@/lib/assets/game-asset-render-metrics'
import { getPlantSizeScale } from '@/lib/utils/grid-positioning'

export interface VisualBounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface CameraSafeInsets {
  left: number
  right: number
  top: number
  bottom: number
}

export interface CameraFit {
  baseScale: number
  translateX: number
  translateY: number
  safeBounds: VisualBounds
}

const FULL_SOURCE_BOUNDS: NormalizedBounds = { left: 0, top: 0, right: 1, bottom: 1 }
const DEFAULT_DISPLAY: GameAssetDisplaySpec = {
  anchorX: 0.5,
  anchorY: 1,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
}
const DEFAULT_DECORATION_DISPLAY: GameAssetDisplaySpec = {
  anchorX: 0.52,
  anchorY: 0.88,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
}

export function unionVisualBounds(...bounds: VisualBounds[]): VisualBounds {
  if (bounds.length === 0) return { left: 0, top: 0, right: 0, bottom: 0 }
  return bounds.reduce((union, next) => ({
    left: Math.min(union.left, next.left),
    top: Math.min(union.top, next.top),
    right: Math.max(union.right, next.right),
    bottom: Math.max(union.bottom, next.bottom),
  }))
}

export function getGardenEntityContactPoint(
  row: number,
  col: number,
  gridSize: number,
  footprint: number,
  tileSize: number
) {
  return {
    x: gridSize * tileSize / 2 + (col - row) * tileSize / 2,
    y: (col + row) * tileSize / 4 + tileSize / 4 + (footprint - 1) * tileSize / 4,
  }
}

export function getTransformedAssetBounds({
  contactX,
  contactY,
  sourceBounds,
  display,
  boxSize,
  renderScale = 1,
  tileSize,
}: {
  contactX: number
  contactY: number
  sourceBounds: NormalizedBounds
  display: GameAssetDisplaySpec
  boxSize: number
  renderScale?: number
  tileSize: number
}): VisualBounds {
  const artScale = boxSize * display.scale * renderScale
  const offsetX = display.offsetX * tileSize
  const offsetY = display.offsetY * tileSize
  return {
    left: contactX + (sourceBounds.left - display.anchorX) * artScale + offsetX,
    top: contactY + (sourceBounds.top - display.anchorY) * artScale + offsetY,
    right: contactX + (sourceBounds.right - display.anchorX) * artScale + offsetX,
    bottom: contactY + (sourceBounds.bottom - display.anchorY) * artScale + offsetY,
  }
}

export function getEntityShadowBounds(
  contactX: number,
  contactY: number,
  tileSize: number,
  footprint: number,
  kind: 'plant' | 'decoration'
): VisualBounds {
  const width = tileSize * (kind === 'plant'
    ? 0.94 + (footprint - 1) * 0.48
    : 0.38 + (footprint - 1) * 0.28)
  const height = tileSize * (kind === 'plant'
    ? 0.24 + (footprint - 1) * 0.12
    : 0.18 + (footprint - 1) * 0.1)
  const centerX = contactX - (kind === 'plant' ? tileSize * 0.08 : 0)
  const centerY = contactY + tileSize * 0.06
  const blurAllowance = kind === 'plant' ? 8 : 4
  return {
    left: centerX - width / 2 - blurAllowance,
    top: centerY - height / 2 - blurAllowance,
    right: centerX + width / 2 + blurAllowance,
    bottom: centerY + height / 2 + blurAllowance,
  }
}

export function calculateGardenVisualBounds({
  gridSize,
  tileSize,
  containerHeight,
  plants,
  decorations,
}: {
  gridSize: number
  tileSize: number
  containerHeight: number
  plants: PlantWithType[]
  decorations: PlacedDecorationWithType[]
}): VisualBounds {
  const result: VisualBounds[] = [{
    left: 0,
    top: 0,
    right: gridSize * tileSize,
    bottom: containerHeight,
  }]

  for (const plant of plants) {
    const footprint = plant.grid_size || 1
    const contact = getGardenEntityContactPoint(
      plant.grid_row || 0,
      plant.grid_col || 0,
      gridSize,
      footprint,
      tileSize
    )
    const asset = getPlantAssetEntry(plant)
    result.push(getTransformedAssetBounds({
      contactX: contact.x,
      contactY: contact.y,
      sourceBounds: asset?.analysis.bounds ?? FULL_SOURCE_BOUNDS,
      display: asset ? resolveGameAssetDisplay(asset, footprint) : DEFAULT_DISPLAY,
      boxSize: GARDEN_PLANT_ART_BOX_SIZE,
      renderScale: getPlantGrowthScale(plant.growth_percentage) * getPlantSizeScale(footprint),
      tileSize,
    }))
    result.push(getEntityShadowBounds(contact.x, contact.y, tileSize, footprint, 'plant'))
  }

  for (const decoration of decorations) {
    const footprint = decoration.grid_size || 1
    const contact = getGardenEntityContactPoint(
      decoration.grid_row || 0,
      decoration.grid_col || 0,
      gridSize,
      footprint,
      tileSize
    )
    const asset = getDecorationAssetSpec(decoration.decoration_type.slug)
    result.push(getTransformedAssetBounds({
      contactX: contact.x,
      contactY: contact.y,
      sourceBounds: asset?.analysis.bounds ?? FULL_SOURCE_BOUNDS,
      display: asset ? resolveGameAssetDisplay(asset, footprint) : DEFAULT_DECORATION_DISPLAY,
      boxSize: getDecorationPixelSize(tileSize, footprint),
      tileSize,
    }))
    result.push(getEntityShadowBounds(contact.x, contact.y, tileSize, footprint, 'decoration'))
  }

  return unionVisualBounds(...result)
}

export function getSanctuarySafeInsets(viewportWidth: number): CameraSafeInsets {
  return viewportWidth < 640
    ? { left: 16, right: 16, top: 256, bottom: 120 }
    : { left: 32, right: 32, top: 112, bottom: 144 }
}

export function fitVisualBoundsToSafeArea({
  viewportWidth,
  viewportHeight,
  containerWidth,
  containerHeight,
  sceneBounds,
  insets,
}: {
  viewportWidth: number
  viewportHeight: number
  containerWidth: number
  containerHeight: number
  sceneBounds: VisualBounds
  insets: CameraSafeInsets
}): CameraFit {
  const safeBounds = {
    left: insets.left,
    top: insets.top,
    right: Math.max(insets.left + 1, viewportWidth - insets.right),
    bottom: Math.max(insets.top + 1, viewportHeight - insets.bottom),
  }
  const sceneWidth = Math.max(1, sceneBounds.right - sceneBounds.left)
  const sceneHeight = Math.max(1, sceneBounds.bottom - sceneBounds.top)
  const availableWidth = Math.max(1, safeBounds.right - safeBounds.left)
  const availableHeight = Math.max(1, safeBounds.bottom - safeBounds.top)
  const baseScale = Math.min(1, availableWidth / sceneWidth, availableHeight / sceneHeight)
  const sceneCenterX = (sceneBounds.left + sceneBounds.right) / 2
  const sceneCenterY = (sceneBounds.top + sceneBounds.bottom) / 2
  const safeCenterX = (safeBounds.left + safeBounds.right) / 2
  const safeCenterY = (safeBounds.top + safeBounds.bottom) / 2

  return {
    baseScale,
    translateX: safeCenterX - viewportWidth / 2 - (sceneCenterX - containerWidth / 2) * baseScale,
    translateY: safeCenterY - viewportHeight / 2 - (sceneCenterY - containerHeight / 2) * baseScale,
    safeBounds,
  }
}
