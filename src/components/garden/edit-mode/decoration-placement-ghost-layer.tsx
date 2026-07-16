'use client'

import type { DecorationRotation, DecorationType } from '@/types/database'
import { getDecorationPixelSize } from '@/lib/assets/game-asset-render-metrics'
import { PlacementGhost } from './placement-ghost'

interface DecorationPlacementGhostLayerProps {
  row: number
  col: number
  gridSize: number
  tileSize: number
  decorationType: DecorationType
  rotation: DecorationRotation
  isValid: boolean
}

export function getDecorationGhostWorldPosition({
  row,
  col,
  gridSize,
  tileSize,
  footprint,
}: {
  row: number
  col: number
  gridSize: number
  tileSize: number
  footprint: number
}) {
  return {
    left: gridSize * tileSize / 2 + (col - row) * tileSize / 2,
    top: (row + col + footprint) * tileSize / 4,
  }
}

/**
 * Render the decoration preview in garden/world space instead of inside a tile
 * button. This keeps the full sprite above tile stacking contexts and makes the
 * preview independent from plant-add hover affordances and tile virtualization.
 */
export function DecorationPlacementGhostLayer({
  row,
  col,
  gridSize,
  tileSize,
  decorationType,
  rotation,
  isValid,
}: DecorationPlacementGhostLayerProps) {
  const footprint = decorationType.grid_size || 1
  const position = getDecorationGhostWorldPosition({
    row,
    col,
    gridSize,
    tileSize,
    footprint,
  })

  return (
    <div
      className="absolute pointer-events-none flex flex-col items-center"
      data-placement-ghost="true"
      style={{
        left: position.left,
        top: position.top,
        transform: 'translate(-50%, -100%)',
        transformOrigin: 'bottom center',
        zIndex: 1000 + row + col,
      }}
    >
      <PlacementGhost
        decorationType={decorationType}
        rotation={rotation}
        isValid={isValid}
        pixelSize={getDecorationPixelSize(tileSize, footprint)}
        tileSize={tileSize}
      />
    </div>
  )
}
