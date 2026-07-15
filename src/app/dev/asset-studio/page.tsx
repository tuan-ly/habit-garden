import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { notFound } from 'next/navigation'
import { AssetStudioClient } from '@/components/dev/asset-studio/asset-studio-client'
import type {
  GameAssetOverrideDocument,
  GameAssetCatalogDocument,
  GameAssetStudioEntry,
} from '@/lib/assets/asset-studio-types'

export const dynamic = 'force-dynamic'

export default async function AssetStudioPage() {
  if (process.env.NODE_ENV !== 'development') notFound()

  const root = process.cwd()
  const [manifestText, overrideText, catalogText] = await Promise.all([
    readFile(path.join(root, 'src/generated/game-asset-manifest.json'), 'utf8'),
    readFile(path.join(root, 'config/game-asset-overrides.json'), 'utf8'),
    readFile(path.join(root, 'config/game-asset-catalog.json'), 'utf8'),
  ])
  const manifest = JSON.parse(manifestText) as { assets: GameAssetStudioEntry[] }
  const overrides = JSON.parse(overrideText) as GameAssetOverrideDocument
  const catalog = JSON.parse(catalogText) as GameAssetCatalogDocument

  return <AssetStudioClient
    initialAssets={manifest.assets}
    initialOverrides={overrides.assets}
    initialCatalog={catalog}
  />
}
