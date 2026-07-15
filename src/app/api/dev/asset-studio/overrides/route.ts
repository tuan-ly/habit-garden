import { NextResponse } from 'next/server'
import { mutateGameAssetOverride } from '@/lib/assets/server/game-asset-pipeline.mjs'
import type { GameAssetOverride } from '@/lib/assets/asset-studio-types'

async function readMutation(request: Request): Promise<{ assetId: string; override?: GameAssetOverride }> {
  const body = await request.json() as { assetId?: unknown; override?: unknown }
  if (typeof body.assetId !== 'string' || body.assetId.length < 3) {
    throw new Error('A valid assetId is required.')
  }
  return { assetId: body.assetId, override: body.override as GameAssetOverride | undefined }
}

async function handle(request: Request, remove: boolean) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  try {
    const body = await readMutation(request)
    if (!remove && !body.override) throw new Error('Override payload is required.')
    const result = await mutateGameAssetOverride(process.cwd(), {
      assetId: body.assetId,
      override: remove ? null : body.override!,
    })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unable to update override.',
    }, { status: 400 })
  }
}

export function PUT(request: Request) {
  return handle(request, false)
}

export function DELETE(request: Request) {
  return handle(request, true)
}
