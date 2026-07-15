import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'
import {
  mergeGameAssetDisplay,
  mutateGameAssetOverride,
  parseAssetOverride,
  parseGameAssetOverrides,
  resolveManifestDisplay,
  createFootprintMigrationSql,
} from '@/lib/assets/server/game-asset-pipeline.mjs'

const temporaryRoots: string[] = []

async function createAssetRoot() {
  const root = await mkdtemp(path.join(tmpdir(), 'habit-garden-assets-'))
  temporaryRoots.push(root)
  const plantDir = path.join(root, 'public/plants/cactus')
  const decorationDir = path.join(root, 'public/garden/decorations')
  const generatedDir = path.join(root, 'src/generated')
  await Promise.all([
    mkdir(plantDir, { recursive: true }),
    mkdir(decorationDir, { recursive: true }),
    mkdir(generatedDir, { recursive: true }),
    mkdir(path.join(root, 'config'), { recursive: true }),
  ])
  const png = await sharp({
    create: { width: 16, height: 16, channels: 4, background: { r: 80, g: 140, b: 60, alpha: 0.8 } },
  }).png().toBuffer()
  await Promise.all([
    writeFile(path.join(plantDir, '05-mature.png'), png),
    writeFile(path.join(decorationDir, 'sanctuary-rock-lantern.png'), png),
    writeFile(path.join(decorationDir, 'sanctuary-pond.png'), png),
    writeFile(path.join(root, 'config/game-asset-overrides.json'), '{"schemaVersion":1,"assets":{}}\n'),
    writeFile(path.join(root, 'config/game-asset-catalog.json'), '{"schemaVersion":1,"decorations":{"stone-lantern":{"canonicalFootprint":2,"reason":"Production catalog"},"koi-pond":{"canonicalFootprint":3,"reason":"Production catalog"}}}\n'),
    writeFile(path.join(generatedDir, 'game-asset-manifest.json'), 'full-marker'),
    writeFile(path.join(generatedDir, 'game-asset-runtime-manifest.json'), 'runtime-marker'),
  ])
  return root
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('game asset override pipeline', () => {
  it('merges auto analysis with a partial reviewed override and generated defaults', () => {
    expect(mergeGameAssetDisplay(
      { anchorX: 0.456789, anchorY: 0.9, scale: 1, offsetX: 0, offsetY: 0 },
      { scale: 1.08, offsetY: -0.12555 }
    )).toEqual({ anchorX: 0.4568, anchorY: 0.9, scale: 1.08, offsetX: 0, offsetY: -0.1255 })
  })

  it('validates reason, anchor, scale and offset ranges', () => {
    expect(() => parseAssetOverride({ display: { scale: 1.1 }, reason: 'ok' })).toThrow()
    expect(() => parseAssetOverride({ display: { anchorX: 2 }, reason: 'reviewed' })).toThrow()
    expect(() => parseAssetOverride({ display: { scale: 1.6 }, reason: 'reviewed' })).toThrow()
    expect(() => parseAssetOverride({ display: { offsetY: -0.6 }, reason: 'reviewed' })).toThrow()
  })

  it('migrates v1 overrides to a base profile and resolves exact footprint first', () => {
    const migrated = parseGameAssetOverrides({
      schemaVersion: 1,
      assets: { cactus: { display: { scale: 1.1 }, reason: 'Legacy review' } },
    })
    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.assets.cactus.base?.display.scale).toBe(1.1)
    const auto = { anchorX: 0.5, anchorY: 0.9, scale: 1, offsetX: 0, offsetY: 0 }
    const reviewed = {
      base: { display: { scale: 1.1 }, reason: 'Base review' },
      profiles: { '2': { display: { offsetY: -0.1 }, reason: 'Two cell review' } },
    }
    expect(resolveManifestDisplay(auto, reviewed, 2)).toMatchObject({ scale: 1.1, offsetY: -0.1 })
    expect(resolveManifestDisplay(auto, reviewed, 3)).toMatchObject({ scale: 1.1, offsetY: 0 })
  })

  it('does not replace any destination when generation validation fails', async () => {
    const root = await createAssetRoot()
    await expect(mutateGameAssetOverride(root, {
      assetId: 'plant:unknown:05-mature',
      override: { display: { scale: 1.1 }, reason: 'Unknown asset test' },
    })).rejects.toThrow('unknown asset')

    await expect(readFile(path.join(root, 'src/generated/game-asset-manifest.json'), 'utf8')).resolves.toBe('full-marker')
    await expect(readFile(path.join(root, 'src/generated/game-asset-runtime-manifest.json'), 'utf8')).resolves.toBe('runtime-marker')
    await expect(readFile(path.join(root, 'config/game-asset-overrides.json'), 'utf8')).resolves.toBe('{"schemaVersion":1,"assets":{}}\n')
  })

  it('saves and resets a canonical override while regenerating both manifests', async () => {
    const root = await createAssetRoot()
    const assetId = 'decoration:stone-lantern:default'
    const saved = await mutateGameAssetOverride(root, {
      assetId,
      override: { display: { scale: 1.08 }, reason: 'Reviewed against sanctuary' },
    })
    expect(saved.asset?.display.scale).toBe(1.08)
    expect(saved.asset?.display.offsetX).toBe(0)

    const reset = await mutateGameAssetOverride(root, { assetId, override: null })
    expect(reset.override).toBeNull()
    expect(reset.asset?.display.scale).toBe(1)
    expect(JSON.parse(await readFile(path.join(root, 'config/game-asset-overrides.json'), 'utf8')).assets).toEqual({})
  })

  it('saves a footprint profile and emits a reconciliation migration for canonical changes', async () => {
    const root = await createAssetRoot()
    const assetId = 'decoration:stone-lantern:default'
    const result = await mutateGameAssetOverride(root, {
      assetId,
      footprint: 3,
      override: { display: { scale: 0.92 }, reason: 'Three cell profile' },
      canonicalFootprint: 3,
      catalogReason: 'Make the lantern a three-cell object',
    })
    expect(result.asset?.canonicalFootprint).toBe(3)
    expect(result.asset?.displayByFootprint?.['3'].scale).toBe(0.92)
    expect(result.migrationPath).toMatch(/calibrate_stone_lantern_footprint\.sql$/)
    const migration = await readFile(path.join(root, result.migrationPath!), 'utf8')
    expect(migration).toContain("pg_advisory_xact_lock")
    expect(migration).toContain("WHERE slug = 'stone-lantern'")
    expect(migration).toContain('Could not reconcile decoration')
  })

  it('generates transactional SQL for both growth and shrink reconciliation', () => {
    const sql = createFootprintMigrationSql({ slug: 'koi-pond', from: 3, to: 2, reason: 'Reviewed footprint' })
    expect(sql).toContain('SET grid_size = 2')
    expect(sql).toContain('int4range(candidate_row, candidate_row + item.desired_size)')
    expect(sql.trim().endsWith('$$;')).toBe(true)
  })
})
