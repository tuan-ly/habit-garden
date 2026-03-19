import { test as base, expect } from '@playwright/test'

/**
 * Custom fixtures for Habit Garden E2E tests
 * Provides authentication and common test utilities
 */

// Test user credentials (use environment variables in CI)
export const TEST_USER = {
  email: process.env.E2E_TEST_EMAIL || 'e2e-test@habitgarden.test',
  password: process.env.E2E_TEST_PASSWORD || 'TestPassword123!',
}

// Extended test fixture with authentication
export const test = base.extend<{
  authenticatedPage: typeof base
}>({
  // Fixture that provides an authenticated page
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login
    await page.goto('/login')

    // Fill login form
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)

    // Submit login
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for redirect to garden
    await page.waitForURL('**/garden', { timeout: 10000 })

    await use(base)
  },
})

export { expect }

/**
 * Helper: Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: typeof base.prototype) {
  await page.waitForLoadState('networkidle')
}

/**
 * Helper: Check if element is visible with timeout
 */
export async function isVisible(
  page: typeof base.prototype,
  selector: string,
  timeout = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: 'visible', timeout })
    return true
  } catch {
    return false
  }
}

/**
 * Helper: Login and navigate to garden page
 * DRYs up the common beforeEach pattern across auth-required test files
 */
export async function loginAndGoToGarden(page: typeof base.prototype) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('Password').fill(TEST_USER.password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/garden', { timeout: 15000 })
}

/**
 * Helper: Open a plant interaction modal by clicking the first visible plant
 * Returns true if modal was opened, false if no plant found
 */
export async function openPlantModal(page: typeof base.prototype): Promise<boolean> {
  const plantElement = page.locator('[class*="plant-card"], [class*="PlantCard"]').first()
  if (!(await plantElement.isVisible().catch(() => false))) return false

  await plantElement.click()
  const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]'))
  await dialog.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
  return dialog.isVisible()
}
