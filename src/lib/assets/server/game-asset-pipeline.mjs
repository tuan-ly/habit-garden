import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
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

const assetOverrideSchema = z.object({
  display: displayOverrideSchema,
  reason: z.string().trim().min(3).max(200),
}).strict()

const overrideDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  assets: z.record(z.string(), assetOverrideSchema),
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
  return overrideDocumentSchema.parse(value)
}

export function parseAssetOverride(value) {
  return assetOverrideSchema.parse(value)
}

export async function readGameAssetOverrides(root) {
  const file = path.join(root, 'config/game-asset-overrides.json')
  try {
    return parseGameAssetOverrides(JSON.parse(await readFile(file, 'utf8')))
  } catch (error) {
    if (error?.code === 'ENOENT') return { schemaVersion: 1, assets: {} }
    throw error
  }
}

export async function analyzeGameAssetBuffer(input) {
  return decodeAndAnalyze(input)
}

export async function buildGameAssetManifests(root, overrideDocument) {
  const overrides = overrideDocument
    ? parseGameAssetOverrides(overrideDocument)
    : await readGameAssetOverrides(root)
  const assets = [...await collectPlants(root), ...await collectDecorations(root)]
  assets.sort((a, b) => a.id.localeCompare(b.id))

  const knownIds = new Set(assets.map((asset) => asset.id))
  for (const id of Object.keys(overrides.assets)) {
    if (!knownIds.has(id)) throw new Error(`Override references unknown asset: ${id}`)
  }

  for (const asset of assets) {
    asset.display = mergeGameAssetDisplay(asset.autoDisplay, overrides.assets[asset.id]?.display)
  }

  const fullManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    assets,
  }
  const runtimeManifest = {
    schemaVersion: 1,
    assets: assets.map(({ id, kind, slug, variant, path: assetPath, display, analysis }) => ({
      id,
      kind,
      slug,
      variant,
      path: assetPath,
      display,
      analysis: { bounds: analysis.bounds },
    })),
  }
  return { fullManifest, runtimeManifest, overrides }
}

async function prepareAtomicFile(target, contents) {
  await mkdir(path.dirname(target), { recursive: true })
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temp, contents, 'utf8')
  return { target, temp }
}

async function commitAtomicFiles(files) {
  try {
    for (const file of files) await rename(file.temp, file.target)
  } finally {
    await Promise.all(files.map((file) => rm(file.temp, { force: true }).catch(() => undefined)))
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

export async function mutateGameAssetOverride(root, mutation) {
  const current = await readGameAssetOverrides(root)
  const next = structuredClone(current)
  if (mutation.override === null) {
    delete next.assets[mutation.assetId]
  } else {
    next.assets[mutation.assetId] = parseAssetOverride(mutation.override)
  }

  const result = await buildGameAssetManifests(root, next)
  const overridePath = path.join(root, 'config/game-asset-overrides.json')
  const fullPath = path.join(root, 'src/generated/game-asset-manifest.json')
  const runtimePath = path.join(root, 'src/generated/game-asset-runtime-manifest.json')
  const files = await Promise.all([
    prepareAtomicFile(overridePath, `${JSON.stringify(next, null, 2)}\n`),
    prepareAtomicFile(fullPath, `${JSON.stringify(result.fullManifest, null, 2)}\n`),
    prepareAtomicFile(runtimePath, `${JSON.stringify(result.runtimeManifest)}\n`),
  ])
  await commitAtomicFiles(files)
  return {
    override: next.assets[mutation.assetId] ?? null,
    asset: result.fullManifest.assets.find((asset) => asset.id === mutation.assetId) ?? null,
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
