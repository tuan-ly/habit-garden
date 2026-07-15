declare module '@/lib/assets/server/game-asset-pipeline.mjs' {
  import type { GameAssetDisplaySpec } from '@/lib/assets/game-asset-contract'
  import type {
    GameAssetOverride,
    GameAssetOverrideDocument,
    GameAssetStudioEntry,
    ImportedAssetAnalysis,
  } from '@/lib/assets/asset-studio-types'

  export function analyzeGameAssetBuffer(input: Buffer | Uint8Array): Promise<ImportedAssetAnalysis>
  export function parseAssetOverride(value: unknown): GameAssetOverride
  export function mergeGameAssetDisplay(
    autoDisplay: GameAssetDisplaySpec,
    override?: Partial<GameAssetDisplaySpec>
  ): GameAssetDisplaySpec
  export function mutateGameAssetOverride(
    root: string,
    mutation: { assetId: string; override: GameAssetOverride | null }
  ): Promise<{ override: GameAssetOverride | null; asset: GameAssetStudioEntry | null }>
  export function readGameAssetOverrides(root: string): Promise<GameAssetOverrideDocument>
}
