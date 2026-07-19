declare module '@/lib/assets/server/game-asset-pipeline.mjs' {
  import type { GameAssetDisplaySpec } from '@/lib/assets/game-asset-contract'
  import type {
    GameAssetOverride,
    GameAssetOverrideDocument,
    GameAssetStudioEntry,
    ImportedAssetAnalysis,
    ReviewedDisplayOverride,
  } from '@/lib/assets/asset-studio-types'

  export function analyzeGameAssetBuffer(input: Buffer | Uint8Array): Promise<ImportedAssetAnalysis>
  export function parseAssetOverride(value: unknown): ReviewedDisplayOverride
  export function parseGameAssetOverrides(value: unknown): GameAssetOverrideDocument
  export function resolveManifestDisplay(
    autoDisplay: GameAssetDisplaySpec,
    assetOverride?: GameAssetOverride,
    footprint?: number
  ): GameAssetDisplaySpec
  export function createFootprintMigrationSql(input: {
    slug: string
    from: number
    to: number
    reason: string
  }): string
  export function mergeGameAssetDisplay(
    autoDisplay: GameAssetDisplaySpec,
    override?: Partial<GameAssetDisplaySpec>
  ): GameAssetDisplaySpec
  export function mutateGameAssetOverride(
    root: string,
    mutation: {
      assetId: string
      footprint?: number
      override?: ReviewedDisplayOverride | null
      canonicalFootprint?: number
      catalogReason?: string
    }
  ): Promise<{
    override: GameAssetOverride | null
    profile: ReviewedDisplayOverride | null
    asset: GameAssetStudioEntry | null
    migrationPath: string | null
  }>
  export function readGameAssetOverrides(root: string): Promise<GameAssetOverrideDocument>
}
