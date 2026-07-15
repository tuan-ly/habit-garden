import { expect, test } from '@playwright/test'

test.describe('Asset Calibration Studio', () => {
  test('selects assets, previews Edge Stress responsively and mocks reviewed save', async ({ page }) => {
    await page.route('**/api/dev/asset-studio/overrides', async (route) => {
      const request = route.request()
      const payload = request.postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          override: payload.override,
          asset: {
            id: payload.assetId,
            kind: 'plant',
            slug: 'cactus',
            variant: '05-mature',
            path: '/plants/cactus/05-mature.png',
            autoDisplay: { anchorX: 0.5, anchorY: 0.9, scale: 1, offsetX: 0, offsetY: 0 },
            display: { anchorX: 0.5, anchorY: 0.9, scale: 1.1, offsetX: 0, offsetY: 0 },
            analysis: { width: 1024, height: 1024, alphaCoverage: 0.2, bounds: { left: 0.2, top: 0.1, right: 0.8, bottom: 0.9 }, centroid: { x: 0.5, y: 0.5 }, transparent: true, touchesEdge: false },
            checks: [],
          },
        }),
      })
    })

    await page.goto('/dev/asset-studio')
    await expect(page.getByRole('heading', { name: 'Asset Calibration Studio' })).toBeVisible()
    await expect(page.getByTestId('asset-studio-preview')).toBeVisible()

    await page.getByLabel('Scene preset').click()
    await page.getByRole('option', { name: 'Edge Stress' }).click()
    await expect(page.getByLabel('Scene preset')).toContainText('Edge Stress')

    await page.getByLabel('Scale').fill('1.1')
    await page.getByLabel('Override reason').fill('Reviewed in Edge Stress')
    await page.getByRole('button', { name: /^Save$/ }).click()
    await expect(page.getByText('Đã lưu override và sinh lại manifest.')).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: 'Calibration Inspector' })).toBeVisible()
    await expect(page.getByTestId('asset-studio-preview')).toBeVisible()
  })
})
