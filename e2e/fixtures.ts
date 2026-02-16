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
