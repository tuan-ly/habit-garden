import type {
  GameAssetDisplaySpec,
  GameAssetEntry,
  FootprintKey,
  NormalizedBounds,
} from './game-asset-contract'

export interface AssetCheck {
  code: string
  level: 'pass' | 'warning' | 'error'
  message: string
}

export interface GameAssetStudioEntry extends GameAssetEntry {
  autoDisplay: GameAssetDisplaySpec
  analysis: {
    width: number
    height: number
    alphaCoverage: number
    bounds: NormalizedBounds
    centroid: { x: number; y: number }
    transparent: boolean
    touchesEdge: boolean
  }
  checks: AssetCheck[]
}

export interface ReviewedDisplayOverride {
  display: Partial<GameAssetDisplaySpec>
  reason: string
}

export interface GameAssetOverride {
  base?: ReviewedDisplayOverride
  profiles?: Partial<Record<FootprintKey, ReviewedDisplayOverride>>
}

export interface GameAssetOverrideDocument {
  schemaVersion: 2
  assets: Record<string, GameAssetOverride>
}

export interface DecorationCatalogEntry {
  canonicalFootprint: number
  reason: string
}

export interface GameAssetCatalogDocument {
  schemaVersion: 1
  decorations: Record<string, DecorationCatalogEntry>
}

export interface ImportedAssetAnalysis {
  suggestedDisplay: GameAssetDisplaySpec
  analysis: GameAssetStudioEntry['analysis']
  checks: AssetCheck[]
}
