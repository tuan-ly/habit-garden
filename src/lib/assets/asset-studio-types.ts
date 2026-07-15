import type {
  GameAssetDisplaySpec,
  GameAssetEntry,
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

export interface GameAssetOverride {
  display: Partial<GameAssetDisplaySpec>
  reason: string
}

export interface GameAssetOverrideDocument {
  schemaVersion: 1
  assets: Record<string, GameAssetOverride>
}

export interface ImportedAssetAnalysis {
  suggestedDisplay: GameAssetDisplaySpec
  analysis: GameAssetStudioEntry['analysis']
  checks: AssetCheck[]
}
