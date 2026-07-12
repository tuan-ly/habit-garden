import { readdir, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const output = path.join(root, 'src/generated/game-asset-manifest.json')
const alphaThreshold = 12
const canonicalStages = ['01-seed.png', '02-sprout.png', '03-growing.png', '04-blooming.png', '05-mature.png']
const decorationSources = {
  'stone-lantern': 'sanctuary-rock-lantern.png',
  'koi-pond': 'sanctuary-pond.png',
}
const scaleOverrides = { 'stone-lantern': 1.08, 'koi-pond': 1.04 }

const round = (value) => Number(value.toFixed(4))

async function analyze(file, identity) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  let left = width, right = -1, top = height, bottom = -1
  let alphaSum = 0, weightedX = 0, weightedY = 0, opaquePixels = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3]
      if (alpha <= alphaThreshold) continue
      const weight = alpha / 255
      left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
      alphaSum += weight; weightedX += x * weight; weightedY += y * weight; opaquePixels++
    }
  }

  if (right < 0) throw new Error(`Asset is fully transparent: ${file}`)
  const contactBandTop = Math.max(top, bottom - Math.max(2, Math.round((bottom - top + 1) * 0.025)))
  let contactWeight = 0, contactX = 0
  for (let y = contactBandTop; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      const alpha = data[(y * width + x) * channels + 3]
      if (alpha <= alphaThreshold) continue
      const weight = alpha / 255
      contactWeight += weight; contactX += x * weight
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
    ...identity,
    path: `/${path.relative(path.join(root, 'public'), file).replaceAll('\\', '/')}`,
    display: {
      anchorX: round((contactWeight ? contactX / contactWeight : (left + right) / 2) / width),
      anchorY: round(bottom / height),
      scale: identity.kind === 'decoration' ? (scaleOverrides[identity.slug] ?? 1) : 1,
    },
    analysis: {
      width, height,
      alphaCoverage: round(opaquePixels / (width * height)),
      bounds: { left: round(left / width), top: round(top / height), right: round(right / width), bottom: round(bottom / height) },
      centroid: { x: round(weightedX / alphaSum / width), y: round(weightedY / alphaSum / height) },
      transparent, touchesEdge,
    },
    checks,
  }
}

async function collectPlants() {
  const base = path.join(root, 'public/plants')
  const folders = (await readdir(base, { withFileTypes: true })).filter((entry) => entry.isDirectory())
  const assets = []
  for (const folder of folders) {
    const names = await readdir(path.join(base, folder.name))
    const stageNames = canonicalStages.filter((name) => names.includes(name))
    for (const filename of stageNames) {
      assets.push(await analyze(path.join(base, folder.name, filename), {
        id: `plant:${folder.name}:${filename.replace('.png', '')}`,
        kind: 'plant', slug: folder.name, variant: filename.replace('.png', ''),
      }))
    }
  }
  return assets
}

async function collectDecorations() {
  return Promise.all(Object.entries(decorationSources).map(([slug, filename]) =>
    analyze(path.join(root, 'public/garden/decorations', filename), {
      id: `decoration:${slug}:default`, kind: 'decoration', slug, variant: 'default',
    })
  ))
}

const assets = [...await collectPlants(), ...await collectDecorations()]
assets.sort((a, b) => a.id.localeCompare(b.id))
const result = { schemaVersion: 1, generatedAt: new Date().toISOString(), assets }
await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8')
const errors = assets.flatMap((asset) => asset.checks.filter((check) => check.level === 'error'))
const warnings = assets.flatMap((asset) => asset.checks.filter((check) => check.level === 'warning'))
console.log(`Analyzed ${assets.length} assets → ${path.relative(root, output)}`)
console.log(`${errors.length} errors, ${warnings.length} warnings`)
if (process.argv.includes('--check') && errors.length) process.exitCode = 1
