import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

afterEach(() => vi.unstubAllEnvs())

describe('asset studio analyze API', () => {
  it('is unavailable outside development', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    const response = await POST(new Request('http://localhost/api/dev/asset-studio/analyze', { method: 'POST' }))
    expect(response.status).toBe(404)
  })

  it('rejects non-PNG uploads before analysis', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const formData = new FormData()
    formData.set('file', new File(['not an image'], 'asset.jpg', { type: 'image/jpeg' }))
    const response = await POST({ formData: async () => formData } as Request)
    expect(response.status).toBe(415)
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining('PNG') })
  })
})
