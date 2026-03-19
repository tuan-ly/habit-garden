import { test, expect } from '@playwright/test'
import { TEST_USER, loginAndGoToGarden } from './fixtures'

/**
 * Garden Navigation E2E Tests
 *
 * Tests core navigation between dashboard pages.
 * Requires authentication — skipped if no test user configured.
 */

test.describe('Dashboard Navigation', () => {
  test.skip(
    () => !process.env.E2E_TEST_EMAIL,
    'Skipping authenticated tests - no E2E_TEST_EMAIL configured'
  )

  test.beforeEach(async ({ page }) => {
    await loginAndGoToGarden(page)
  })

  test('garden page loads with main content', async ({ page }) => {
    await expect(page).toHaveURL(/\/garden/)
    await expect(page.locator('main, [role="main"], .garden-container').first()).toBeVisible()
  })

  test('bottom nav shows all main tabs', async ({ page }) => {
    // Bottom nav should have Garden, Overview, Store, Stats
    const nav = page.locator('nav')
    await expect(nav.getByText('Garden')).toBeVisible()
    await expect(nav.getByText('Overview')).toBeVisible()
    await expect(nav.getByText('Store')).toBeVisible()
    await expect(nav.getByText('Stats')).toBeVisible()
  })

  test('navigates to overview page', async ({ page }) => {
    await page.locator('nav').getByText('Overview').click()
    await expect(page).toHaveURL(/\/overview/)
  })

  test('navigates to store page', async ({ page }) => {
    await page.locator('nav').getByText('Store').click()
    await expect(page).toHaveURL(/\/store/)
  })

  test('navigates to stats page', async ({ page }) => {
    await page.locator('nav').getByText('Stats').click()
    await expect(page).toHaveURL(/\/stats/)
  })

  test('navigates back to garden from other page', async ({ page }) => {
    // Go to stats first
    await page.locator('nav').getByText('Stats').click()
    await expect(page).toHaveURL(/\/stats/)

    // Navigate back to garden
    await page.locator('nav').getByText('Garden').click()
    await expect(page).toHaveURL(/\/garden/)
  })

  test('settings page is accessible', async ({ page }) => {
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/settings/)
    // Settings page should have some content
    await expect(page.locator('main, [role="main"]').first()).toBeVisible()
  })

  test('profile page is accessible', async ({ page }) => {
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/profile/)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible()
  })
})

test.describe('Mobile Navigation', () => {
  test.skip(
    () => !process.env.E2E_TEST_EMAIL,
    'Skipping authenticated tests - no E2E_TEST_EMAIL configured'
  )

  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await loginAndGoToGarden(page)
  })

  test('bottom nav is visible on mobile', async ({ page }) => {
    const nav = page.locator('nav')
    await expect(nav.first()).toBeVisible()
  })

  test('garden content loads on mobile viewport', async ({ page }) => {
    await expect(page).toHaveURL(/\/garden/)
    await expect(page.locator('main, [role="main"], .garden-container').first()).toBeVisible()
  })
})
