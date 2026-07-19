import { expect, test } from '@playwright/test'

test.describe('Footprint-aware Asset Calibration Studio', () => {
  test('calibrates a footprint, opens the production sandbox and mocks reviewed save', async ({ page }) => {
    await page.route('**/api/dev/asset-studio/overrides', async (route) => {
      const payload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          override: {
            profiles: {
              [payload.footprint]: { display: payload.display, reason: payload.reason },
            },
          },
          profile: { display: payload.display, reason: payload.reason },
          migrationPath: null,
          catalog: { schemaVersion: 1, decorations: {} },
          asset: {
            id: payload.assetId,
            kind: 'plant',
            slug: 'cactus',
            variant: '05-mature',
            path: '/plants/cactus/05-mature.png',
            autoDisplay: { anchorX: 0.5, anchorY: 0.9, scale: 1, offsetX: 0, offsetY: 0 },
            display: { anchorX: 0.5, anchorY: 0.9, scale: 1, offsetX: 0, offsetY: 0 },
            displayByFootprint: {
              [payload.footprint]: { anchorX: 0.5, anchorY: 0.9, scale: 1.1, offsetX: 0, offsetY: 0 },
            },
            analysis: { width: 1024, height: 1024, alphaCoverage: 0.2, bounds: { left: 0.2, top: 0.1, right: 0.8, bottom: 0.9 }, centroid: { x: 0.5, y: 0.5 }, transparent: true, touchesEdge: false },
            checks: [],
          },
        }),
      })
    })

    await page.goto('/dev/asset-studio')
    await expect(page.getByRole('heading', { name: 'Asset Calibration Studio' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Calibration Bench' })).toBeVisible()

    await page.getByRole('button', { name: '3×3' }).click()
    await expect(page.getByTestId('footprint-cell')).toHaveCount(9)

    await page.getByText('Production Sandbox', { exact: true }).click()
    await expect(page.getByTestId('asset-studio-sandbox')).toBeVisible()
    await page.getByRole('button', { name: /Edge/ }).click()
    await page.getByRole('button', { name: /Corner/ }).click()

    await page.getByLabel('Scale').fill('1.1')
    await page.getByLabel('Override reason').fill('Reviewed at three footprints')
    await page.getByRole('button', { name: /^Save$/ }).click()
    await expect(page.getByText('Đã lưu profile và sinh lại manifest.')).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: 'Calibration Inspector' })).toBeVisible()
    await expect(page.getByTestId('asset-studio-preview')).toBeVisible()
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll')
  })
})
