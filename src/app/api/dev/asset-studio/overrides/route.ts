import { NextResponse } from 'next/server'
import { mutateGameAssetOverride } from '@/lib/assets/server/game-asset-pipeline.mjs'
import type { ReviewedDisplayOverride } from '@/lib/assets/asset-studio-types'

async function readMutation(request: Request): Promise<{
  assetId: string
  footprint?: number
  override?: ReviewedDisplayOverride
  canonicalFootprint?: number
  reason: string
  resetProfile: boolean
  resetAll: boolean
}> {
  const body = await request.json() as {
    assetId?: unknown
    footprint?: unknown
    display?: unknown
    reason?: unknown
    canonicalFootprint?: unknown
    resetProfile?: unknown
    resetAll?: unknown
  }
  if (typeof body.assetId !== 'string' || body.assetId.length < 3) {
    throw new Error('A valid assetId is required.')
  }
  const resetAll = body.resetAll === true
  if (!resetAll && (!Number.isInteger(body.footprint) || Number(body.footprint) < 1)) {
    throw new Error('A positive footprint is required.')
  }
  const hasDisplay = body.display && typeof body.display === 'object' && Object.keys(body.display).length > 0
  return {
    assetId: body.assetId,
    footprint: resetAll ? undefined : Number(body.footprint),
    override: hasDisplay ? {
      display: body.display as ReviewedDisplayOverride['display'],
      reason: String(body.reason ?? ''),
    } : undefined,
    canonicalFootprint: body.canonicalFootprint === undefined
      ? undefined
      : Number(body.canonicalFootprint),
    reason: String(body.reason ?? ''),
    resetProfile: body.resetProfile === true,
    resetAll,
  }
}

async function handle(request: Request, remove: boolean) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  try {
    const body = await readMutation(request)
    if (!remove && !body.override && !body.resetProfile && body.canonicalFootprint === undefined) {
      throw new Error('A display override or canonical footprint is required.')
    }
    const result = await mutateGameAssetOverride(process.cwd(), {
      assetId: body.assetId,
      footprint: body.footprint,
      override: remove || body.resetProfile ? null : body.override,
      canonicalFootprint: remove ? undefined : body.canonicalFootprint,
      catalogReason: body.reason,
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
