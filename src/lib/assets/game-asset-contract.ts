import manifest from '@/generated/game-asset-runtime-manifest.json'

export type GameAssetKind = 'plant' | 'decoration'

export interface GameAssetDisplaySpec {
  anchorX: number
  anchorY: number
  scale: number
}

export interface GameAssetEntry {
  id: string
  kind: GameAssetKind
  slug: string
  variant: string
  path: string
  display: GameAssetDisplaySpec
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
