import manifest from '@/generated/game-asset-runtime-manifest.json'

export type GameAssetKind = 'plant' | 'decoration'
export type FootprintKey = `${number}`

export interface GameAssetDisplaySpec {
  anchorX: number
  anchorY: number
  scale: number
  offsetX: number
  offsetY: number
}

export interface NormalizedBounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface GameAssetEntry {
  id: string
  kind: GameAssetKind
  slug: string
  variant: string
  path: string
  display: GameAssetDisplaySpec
  displayByFootprint?: Record<FootprintKey, GameAssetDisplaySpec>
  canonicalFootprint?: number
  analysis: {
    bounds: NormalizedBounds
  }
}

export function toFootprintKey(footprint: number): FootprintKey {
  return String(Math.max(1, Math.floor(footprint))) as FootprintKey
}

/** Resolve the reviewed profile without baking footprint scale into display metadata. */
export function resolveGameAssetDisplay(
  entry: Pick<GameAssetEntry, 'display' | 'displayByFootprint'>,
  footprint: number
): GameAssetDisplaySpec {
  return entry.displayByFootprint?.[toFootprintKey(footprint)] ?? entry.display
}

const entries = manifest.assets as GameAssetEntry[]
const entryById = new Map(entries.map((entry) => [entry.id, entry]))

export function getGameAssetSpec(id: string): GameAssetEntry | undefined {
  return entryById.get(id)
}

export function getPlantAssetSpec(folder: string, filename: string): GameAssetEntry | undefined {
  return getGameAssetSpec(`plant:${folder}:${filename.replace(/\.png$/i, '')}`)
}

export function getDecorationAssetSpec(slug: string): GameAssetEntry | undefined {
  return getGameAssetSpec(`decoration:${slug}:default`)
}
