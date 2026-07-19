import type { CSSProperties } from 'react'
import type { GameAssetDisplaySpec } from './game-asset-contract'

export function getGroundedArtTransform(
  spec: Pick<GameAssetDisplaySpec, 'anchorX' | 'anchorY' | 'scale'>
): CSSProperties {
  const translateX = Number(((0.5 - spec.anchorX) * 100).toFixed(4))
  const translateY = Number(((1 - spec.anchorY) * 100).toFixed(4))

  return {
    transform: `translate(${translateX}%, ${translateY}%) scale(${spec.scale})`,
    transformOrigin: `${spec.anchorX * 100}% ${spec.anchorY * 100}%`,
  }
}

export function getTileOffsetTransform(
  spec: Pick<GameAssetDisplaySpec, 'offsetX' | 'offsetY'>,
  tileSize: number
): CSSProperties {
  const x = Number((spec.offsetX * tileSize).toFixed(4))
  const y = Number((spec.offsetY * tileSize).toFixed(4))
  return x === 0 && y === 0 ? {} : { transform: `translate(${x}px, ${y}px)` }
}
