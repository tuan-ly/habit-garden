import { access, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { z } from 'zod'

const ALPHA_THRESHOLD = 12
const CANONICAL_STAGES = [
  '01-seed.png',
  '02-sprout.png',
  '03-growing.png',
  '04-blooming.png',
  '05-mature.png',
]
const DECORATION_SOURCES = {
  'stone-lantern': 'sanctuary-rock-lantern.png',
  'koi-pond': 'sanctuary-pond.png',
}

const displayOverrideSchema = z.object({
  anchorX: z.number().min(0).max(1).optional(),
  anchorY: z.number().min(0).max(1).optional(),
  scale: z.number().min(0.5).max(1.5).optional(),
  offsetX: z.number().min(-0.5).max(0.5).optional(),
  offsetY: z.number().min(-0.5).max(0.5).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Display override must contain at least one field.',
})

const reviewedDisplayOverrideSchema = z.object({
  display: displayOverrideSchema,
  reason: z.string().trim().min(3).max(200),
}).strict()

const legacyOverrideDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  assets: z.record(z.string(), reviewedDisplayOverrideSchema),
}).strict()

const assetOverrideSchema = z.object({
  base: reviewedDisplayOverrideSchema.optional(),
  profiles: z.record(z.string().regex(/^[1-9]\d*$/), reviewedDisplayOverrideSchema).optional(),
}).strict().refine((value) => value.base || Object.keys(value.profiles ?? {}).length > 0, {
  message: 'Asset override must contain a base or footprint profile.',
})

const overrideDocumentSchema = z.object({
  schemaVersion: z.literal(2),
  assets: z.record(z.string(), assetOverrideSchema),
}).strict()

const catalogEntrySchema = z.object({
  canonicalFootprint: z.number().int().min(1),
  reason: z.string().trim().min(3).max(200),
}).strict()

const catalogDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  decorations: z.record(z.string(), catalogEntrySchema),
}).strict()

const round = (value) => Number(value.toFixed(4))

function defaultDisplay(display) {
  return {
    anchorX: round(display.anchorX),
    anchorY: round(display.anchorY),
    scale: round(display.scale ?? 1),
    offsetX: round(display.offsetX ?? 0),
    offsetY: round(display.offsetY ?? 0),
  }
}

export function mergeGameAssetDisplay(autoDisplay, override) {
  return defaultDisplay({ ...autoDisplay, ...(override ?? {}) })
}

export function resolveManifestDisplay(autoDisplay, assetOverride, footprint) {
  const base = mergeGameAssetDisplay(autoDisplay, assetOverride?.base?.display)
  return footprint
    ? mergeGameAssetDisplay(base, assetOverride?.profiles?.[String(footprint)]?.display)
    : base
}

async function decodeAndAnalyze(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  let left = width
  let right = -1
  let top = height
  let bottom = -1
  let alphaSum = 0
  let weightedX = 0
  let weightedY = 0
  let opaquePixels = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3]
      if (alpha <= ALPHA_THRESHOLD) continue
      const weight = alpha / 255
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
      alphaSum += weight
      weightedX += x * weight
      weightedY += y * weight
      opaquePixels++
    }
  }

  if (right < 0) throw new Error('Asset is fully transparent.')

  const contactBandTop = Math.max(top, bottom - Math.max(2, Math.round((bottom - top + 1) * 0.025)))
  let contactWeight = 0
  let contactX = 0
  for (let y = contactBandTop; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const alpha = data[(y * width + x) * channels + 3]
      if (alpha <= ALPHA_THRESHOLD) continue
      const weight = alpha / 255
      contactWeight += weight
      contactX += x * weight
    }
  }

  const transparent = opaquePixels < width * height * 0.98
  const touchesEdge = left === 0 || top === 0 || right === width - 1 || bottom === height - 1
  const verticalPadding = 1 - (bottom - top + 1) / height
  const checks = [
    transparent
      ? { code: 'transparent-background', level: 'pass', message: 'Có nền trong suốt.' }
      : { code: 'transparent-background', level: 'error', message: 'Ảnh gần như kín canvas; kiểm tra nền chưa được xóa.' },
    touchesEdge
      ? { code: 'safe-padding', level: 'warning', message: 'Silhouette chạm mép canvas.' }
      : { code: 'safe-padding', level: 'pass', message: 'Silhouette nằm trong safe area.' },
    verticalPadding > 0.55
      ? { code: 'excess-padding', level: 'warning', message: 'Padding dọc lớn; asset có thể hiển thị quá nhỏ.' }
      : { code: 'excess-padding', level: 'pass', message: 'Tỷ lệ silhouette/canvas hợp lý.' },
  ]

  return {
    suggestedDisplay: defaultDisplay({
      anchorX: (contactWeight ? contactX / contactWeight : (left + right) / 2) / width,
      anchorY: bottom / height,
      scale: 1,
    }),
    analysis: {
      width,
      height,
      alphaCoverage: round(opaquePixels / (width * height)),
      bounds: {
        left: round(left / width),
        top: round(top / height),
        right: round(right / width),
        bottom: round(bottom / height),
      },
      centroid: {
        x: round(weightedX / alphaSum / width),
        y: round(weightedY / alphaSum / height),
      },
      transparent,
      touchesEdge,
    },
    checks,
  }
}

async function analyzeFile(root, file, identity) {
  const analyzed = await decodeAndAnalyze(file)
  return {
    ...identity,
    path: `/${path.relative(path.join(root, 'public'), file).replaceAll('\\', '/')}`,
    autoDisplay: analyzed.suggestedDisplay,
    display: analyzed.suggestedDisplay,
    analysis: analyzed.analysis,
    checks: analyzed.checks,
  }
}

async function collectPlants(root) {
  const base = path.join(root, 'public/plants')
  const folders = (await readdir(base, { withFileTypes: true })).filter((entry) => entry.isDirectory())
  const assets = []
  for (const folder of folders) {
    const names = await readdir(path.join(base, folder.name))
    for (const filename of CANONICAL_STAGES.filter((name) => names.includes(name))) {
      assets.push(await analyzeFile(root, path.join(base, folder.name, filename), {
        id: `plant:${folder.name}:${filename.replace('.png', '')}`,
        kind: 'plant',
        slug: folder.name,
        variant: filename.replace('.png', ''),
      }))
    }
  }
  return assets
}

async function collectDecorations(root) {
  return Promise.all(Object.entries(DECORATION_SOURCES).map(([slug, filename]) =>
    analyzeFile(root, path.join(root, 'public/garden/decorations', filename), {
      id: `decoration:${slug}:default`,
      kind: 'decoration',
      slug,
      variant: 'default',
    })
  ))
}

export function parseGameAssetOverrides(value) {
  if (value?.schemaVersion === 1) {
    const legacy = legacyOverrideDocumentSchema.parse(value)
    return {
      schemaVersion: 2,
      assets: Object.fromEntries(Object.entries(legacy.assets).map(([id, reviewed]) => [id, { base: reviewed }])),
    }
  }
  return overrideDocumentSchema.parse(value)
}

export function parseAssetOverride(value) {
  return reviewedDisplayOverrideSchema.parse(value)
}

export async function readGameAssetOverrides(root) {
  const file = path.join(root, 'config/game-asset-overrides.json')
  try {
    return parseGameAssetOverrides(JSON.parse(await readFile(file, 'utf8')))
  } catch (error) {
    if (error?.code === 'ENOENT') return { schemaVersion: 2, assets: {} }
    throw error
  }
}

export function parseGameAssetCatalog(value) {
  return catalogDocumentSchema.parse(value)
}

export async function readGameAssetCatalog(root) {
  const file = path.join(root, 'config/game-asset-catalog.json')
  try {
    return parseGameAssetCatalog(JSON.parse(await readFile(file, 'utf8')))
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        schemaVersion: 1,
        decorations: {
          'stone-lantern': { canonicalFootprint: 2, reason: 'Production catalog footprint.' },
          'koi-pond': { canonicalFootprint: 3, reason: 'Production catalog footprint.' },
        },
      }
    }
    throw error
  }
}

export async function analyzeGameAssetBuffer(input) {
  return decodeAndAnalyze(input)
}

export async function buildGameAssetManifests(root, overrideDocument, catalogDocument) {
  const overrides = overrideDocument
    ? parseGameAssetOverrides(overrideDocument)
    : await readGameAssetOverrides(root)
  const catalog = catalogDocument
    ? parseGameAssetCatalog(catalogDocument)
    : await readGameAssetCatalog(root)
  const assets = [...await collectPlants(root), ...await collectDecorations(root)]
  assets.sort((a, b) => a.id.localeCompare(b.id))

  const knownIds = new Set(assets.map((asset) => asset.id))
  for (const id of Object.keys(overrides.assets)) {
    if (!knownIds.has(id)) throw new Error(`Override references unknown asset: ${id}`)
  }

  for (const asset of assets) {
    const reviewed = overrides.assets[asset.id]
    asset.display = resolveManifestDisplay(asset.autoDisplay, reviewed)
    asset.displayByFootprint = Object.fromEntries(
      Object.keys(reviewed?.profiles ?? {}).map((footprint) => [
        footprint,
        resolveManifestDisplay(asset.autoDisplay, reviewed, footprint),
      ])
    )
    if (asset.kind === 'decoration') {
      asset.canonicalFootprint = catalog.decorations[asset.slug]?.canonicalFootprint ?? 1
    }
  }

  const fullManifest = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    assets,
  }
  const runtimeManifest = {
    schemaVersion: 2,
    assets: assets.map(({ id, kind, slug, variant, path: assetPath, display, displayByFootprint, canonicalFootprint, analysis }) => ({
      id,
      kind,
      slug,
      variant,
      path: assetPath,
      display,
      ...(Object.keys(displayByFootprint).length > 0 ? { displayByFootprint } : {}),
      ...(canonicalFootprint ? { canonicalFootprint } : {}),
      analysis: { bounds: analysis.bounds },
    })),
  }
  return { fullManifest, runtimeManifest, overrides, catalog }
}

async function prepareAtomicFile(target, contents) {
  await mkdir(path.dirname(target), { recursive: true })
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temp, contents, 'utf8')
  return { target, temp }
}

async function commitAtomicFiles(files) {
  const committed = []
  try {
    for (const file of files) {
      const backup = `${file.target}.${process.pid}.${Date.now()}.bak`
      let existed = true
      try {
        await rename(file.target, backup)
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error
        existed = false
      }
      try {
        await rename(file.temp, file.target)
        committed.push({ ...file, backup, existed })
      } catch (error) {
        if (existed) await rename(backup, file.target).catch(() => undefined)
        throw error
      }
    }
    await Promise.all(committed.filter((file) => file.existed).map((file) => rm(file.backup, { force: true })))
  } catch (error) {
    for (const file of committed.reverse()) {
      await rm(file.target, { force: true }).catch(() => undefined)
      if (file.existed) await rename(file.backup, file.target).catch(() => undefined)
    }
    throw error
  } finally {
    await Promise.all(files.flatMap((file) => [
      rm(file.temp, { force: true }).catch(() => undefined),
      rm(`${file.target}.${process.pid}.${Date.now()}.bak`, { force: true }).catch(() => undefined),
    ]))
  }
}

export async function writeGameAssetManifests(root, overrideDocument) {
  const result = await buildGameAssetManifests(root, overrideDocument)
  const fullPath = path.join(root, 'src/generated/game-asset-manifest.json')
  const runtimePath = path.join(root, 'src/generated/game-asset-runtime-manifest.json')
  const files = await Promise.all([
    prepareAtomicFile(fullPath, `${JSON.stringify(result.fullManifest, null, 2)}\n`),
    prepareAtomicFile(runtimePath, `${JSON.stringify(result.runtimeManifest)}\n`),
  ])
  await commitAtomicFiles(files)
  return result
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

export function createFootprintMigrationSql({ slug, from, to, reason }) {
  const comment = String(reason).replace(/[\r\n]+/g, ' ').replaceAll('*/', '* /')
  return `-- Asset Calibration Studio: ${slug} ${from}x${from} -> ${to}x${to}\n-- Reason: ${comment}\nDO $$\nDECLARE\n  item record;\n  candidate_row integer;\n  candidate_col integer;\n  radius integer;\n  row_offset integer;\n  col_offset integer;\n  found_position boolean;\nBEGIN\n  PERFORM pg_advisory_xact_lock(hashtext('reconcile-decoration-footprints'));\n\n  UPDATE public.decoration_types\n  SET grid_size = ${to}\n  WHERE slug = ${sqlLiteral(slug)};\n\n  IF NOT FOUND THEN\n    RAISE EXCEPTION 'Decoration type % does not exist', ${sqlLiteral(slug)};\n  END IF;\n\n  FOR item IN\n    SELECT pd.id, pd.user_id, pd.grid_row, pd.grid_col, dt.grid_size AS desired_size\n    FROM public.placed_decorations pd\n    JOIN public.decoration_types dt ON dt.id = pd.decoration_type_id\n    WHERE dt.slug = ${sqlLiteral(slug)}\n    ORDER BY pd.placed_at ASC, pd.id ASC\n  LOOP\n    found_position := false;\n\n    FOR radius IN 0..64 LOOP\n      FOR row_offset IN -radius..radius LOOP\n        FOR col_offset IN -radius..radius LOOP\n          CONTINUE WHEN radius > 0 AND abs(row_offset) <> radius AND abs(col_offset) <> radius;\n          candidate_row := item.grid_row + row_offset;\n          candidate_col := item.grid_col + col_offset;\n          CONTINUE WHEN candidate_row < 0 OR candidate_col < 0;\n\n          IF NOT EXISTS (\n            SELECT 1 FROM public.plants p\n            WHERE p.user_id = item.user_id AND p.status <> 'dead'\n              AND int4range(candidate_row, candidate_row + item.desired_size) && int4range(p.grid_row, p.grid_row + coalesce(p.grid_size, 1))\n              AND int4range(candidate_col, candidate_col + item.desired_size) && int4range(p.grid_col, p.grid_col + coalesce(p.grid_size, 1))\n          ) AND NOT EXISTS (\n            SELECT 1 FROM public.placed_decorations other\n            WHERE other.user_id = item.user_id AND other.id <> item.id\n              AND int4range(candidate_row, candidate_row + item.desired_size) && int4range(other.grid_row, other.grid_row + other.grid_size)\n              AND int4range(candidate_col, candidate_col + item.desired_size) && int4range(other.grid_col, other.grid_col + other.grid_size)\n          ) THEN\n            UPDATE public.placed_decorations\n            SET grid_row = candidate_row, grid_col = candidate_col, grid_size = item.desired_size\n            WHERE id = item.id;\n            found_position := true;\n            EXIT;\n          END IF;\n        END LOOP;\n        EXIT WHEN found_position;\n      END LOOP;\n      EXIT WHEN found_position;\n    END LOOP;\n\n    IF NOT found_position THEN\n      RAISE EXCEPTION 'Could not reconcile decoration % within search radius', item.id;\n    END IF;\n  END LOOP;\nEND\n$$;\n`
}

function formatMigrationTimestamp(date) {
  return date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
}

async function getMigrationTarget(root, slug) {
  const safeSlug = slug.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').toLowerCase()
  const base = Date.now()
  for (let offset = 0; offset < 120; offset++) {
    const target = path.join(root, 'supabase/migrations', `${formatMigrationTimestamp(new Date(base + offset * 1000))}_calibrate_${safeSlug}_footprint.sql`)
    try {
      await access(target)
    } catch (error) {
      if (error?.code === 'ENOENT') return target
      throw error
    }
  }
  throw new Error('Unable to allocate a unique footprint migration filename.')
}

export async function mutateGameAssetOverride(root, mutation) {
  const current = await readGameAssetOverrides(root)
  const currentCatalog = await readGameAssetCatalog(root)
  const next = structuredClone(current)
  const footprint = mutation.footprint === undefined
    ? undefined
    : z.number().int().min(1).parse(mutation.footprint)
  const currentAssetOverride = next.assets[mutation.assetId] ?? {}
  if (footprint !== undefined && mutation.override !== undefined) {
    const profiles = { ...(currentAssetOverride.profiles ?? {}) }
    if (mutation.override === null) delete profiles[String(footprint)]
    else profiles[String(footprint)] = parseAssetOverride(mutation.override)
    const updated = { ...currentAssetOverride, ...(Object.keys(profiles).length ? { profiles } : {}) }
    if (!Object.keys(profiles).length) delete updated.profiles
    if (!updated.base && !updated.profiles) delete next.assets[mutation.assetId]
    else next.assets[mutation.assetId] = updated
  } else if (footprint === undefined && mutation.override === null) {
    delete next.assets[mutation.assetId]
  } else if (footprint === undefined && mutation.override !== undefined) {
    next.assets[mutation.assetId] = { ...currentAssetOverride, base: parseAssetOverride(mutation.override) }
  }

  const nextCatalog = structuredClone(currentCatalog)
  let migration = null
  if (mutation.canonicalFootprint !== undefined) {
    if (!mutation.assetId.startsWith('decoration:')) throw new Error('Canonical footprint is decoration-only.')
    const canonicalFootprint = z.number().int().min(1).parse(mutation.canonicalFootprint)
    const slug = mutation.assetId.split(':')[1]
    const previous = currentCatalog.decorations[slug]?.canonicalFootprint ?? 1
    const reason = (mutation.catalogReason ?? mutation.override?.reason ?? '').trim()
    if (reason.length < 3 || reason.length > 200) throw new Error('Canonical footprint reason must be 3-200 characters.')
    nextCatalog.decorations[slug] = { canonicalFootprint, reason }
    if (canonicalFootprint !== previous) {
      migration = {
        target: await getMigrationTarget(root, slug),
        contents: createFootprintMigrationSql({ slug, from: previous, to: canonicalFootprint, reason }),
      }
    }
  }

  const result = await buildGameAssetManifests(root, next, nextCatalog)
  const overridePath = path.join(root, 'config/game-asset-overrides.json')
  const catalogPath = path.join(root, 'config/game-asset-catalog.json')
  const fullPath = path.join(root, 'src/generated/game-asset-manifest.json')
  const runtimePath = path.join(root, 'src/generated/game-asset-runtime-manifest.json')
  const files = await Promise.all([
    prepareAtomicFile(overridePath, `${JSON.stringify(next, null, 2)}\n`),
    prepareAtomicFile(catalogPath, `${JSON.stringify(nextCatalog, null, 2)}\n`),
    prepareAtomicFile(fullPath, `${JSON.stringify(result.fullManifest, null, 2)}\n`),
    prepareAtomicFile(runtimePath, `${JSON.stringify(result.runtimeManifest)}\n`),
    ...(migration ? [prepareAtomicFile(migration.target, migration.contents)] : []),
  ])
  await commitAtomicFiles(files)
  return {
    override: next.assets[mutation.assetId] ?? null,
    profile: footprint === undefined
      ? next.assets[mutation.assetId]?.base ?? null
      : next.assets[mutation.assetId]?.profiles?.[String(footprint)] ?? null,
    asset: result.fullManifest.assets.find((asset) => asset.id === mutation.assetId) ?? null,
    catalog: nextCatalog,
    migrationPath: migration ? path.relative(root, migration.target).replaceAll('\\', '/') : null,
  }
}

export function summarizeManifest(result) {
  const errors = result.fullManifest.assets.flatMap((asset) => asset.checks
    .filter((check) => check.level === 'error')
    .map((check) => ({ assetId: asset.id, ...check })))
  const warnings = result.fullManifest.assets.flatMap((asset) => asset.checks
    .filter((check) => check.level === 'warning')
    .map((check) => ({ assetId: asset.id, ...check })))
  return { errors, warnings }
}
