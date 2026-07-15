import { NextResponse } from 'next/server'
import { analyzeGameAssetBuffer } from '@/lib/assets/server/game-asset-pipeline.mjs'

const MAX_BYTES = 10 * 1024 * 1024
const MAX_DIMENSION = 4096

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    // Avoid cross-realm instanceof checks: multipart parsers may construct a
    // File with a different global prototype in tests and edge runtimes.
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'PNG file is required.' }, { status: 400 })
    }
    if (file.type !== 'image/png' || !file.name.toLowerCase().endsWith('.png')) {
      return NextResponse.json({ error: 'Only PNG files are supported.' }, { status: 415 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'PNG must be 10 MB or smaller.' }, { status: 413 })
    }

    const analysis = await analyzeGameAssetBuffer(Buffer.from(await file.arrayBuffer()))
    if (analysis.analysis.width > MAX_DIMENSION || analysis.analysis.height > MAX_DIMENSION) {
      return NextResponse.json({ error: 'PNG dimensions must not exceed 4096×4096.' }, { status: 422 })
    }
    return NextResponse.json(analysis)
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unable to analyze PNG.',
    }, { status: 422 })
  }
}
