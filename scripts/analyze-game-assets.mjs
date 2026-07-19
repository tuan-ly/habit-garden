import path from 'node:path'
import {
  summarizeManifest,
  writeGameAssetManifests,
} from '../src/lib/assets/server/game-asset-pipeline.mjs'

const root = process.cwd()
const result = await writeGameAssetManifests(root)
const { errors, warnings } = summarizeManifest(result)

console.log(`Analyzed ${result.fullManifest.assets.length} assets → ${path.relative(root, path.join(root, 'src/generated/game-asset-manifest.json'))}`)
console.log(`Runtime manifest → ${path.relative(root, path.join(root, 'src/generated/game-asset-runtime-manifest.json'))}`)
console.log(`${errors.length} errors, ${warnings.length} warnings`)

if (process.argv.includes('--check') && errors.length) {
  for (const error of errors) console.error(`ERROR ${error.assetId}: ${error.message}`)
  process.exitCode = 1
}
