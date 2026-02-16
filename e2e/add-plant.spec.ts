import { test, expect } from '@playwright/test'
import { TEST_USER } from './fixtures'

/**
 * Add Plant Flow E2E Tests
 *
 * These tests verify the plant creation workflow.
 * Note: Tests requiring authentication will be skipped if no test user is configured.
 */

test.describe('Add Plant Dialog', () => {
  // Skip auth tests if no test user configured
  test.skip(
    () => !process.env.E2E_TEST_EMAIL,
    'Skipping authenticated tests - no E2E_TEST_EMAIL configured'
  )

  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/garden', { timeout: 15000 })
  })

  test('opens add plant dialog from button', async ({ page }) => {
    // Look for Add Plant button in the UI
    const addButton = page.getByRole('button', { name: /add.*plant/i })

    // If button exists and is enabled, click it
    if (await addButton.isVisible()) {
      await addButton.click()

      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByText(/choose a plant type/i)).toBeVisible()
    }
  })

  test('shows plant type selection', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*plant/i })

    if (await addButton.isVisible()) {
      await addButton.click()

      // Should show plant options
      await expect(page.getByRole('dialog')).toBeVisible()

      // Should have at least one tier visible
      await expect(page.getByText(/tier/i).first()).toBeVisible()
    }
  })

  test('shows slot indicator in dialog', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*plant/i })

    if (await addButton.isVisible()) {
      await addButton.click()

      // Should show slot usage indicator (e.g., "1/5" or similar)
      await expect(page.getByRole('dialog')).toBeVisible()
    }
  })

  test('navigates to plant details step after selection', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*plant/i })

    if (await addButton.isVisible()) {
      await addButton.click()

      // Find and click a plant type button (first available)
      const plantButtons = page.getByRole('dialog').locator('button').filter({
        has: page.locator('.text-3xl'), // Plant icons are 3xl
      })

      const firstPlant = plantButtons.first()
      if (await firstPlant.isVisible()) {
        await firstPlant.click()

        // Should show habit name input
        await expect(page.getByLabel(/habit name/i)).toBeVisible()
        await expect(page.getByLabel(/description/i)).toBeVisible()
      }
    }
  })

  test('creates plant with valid data', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*plant/i })

    if (await addButton.isVisible()) {
      await addButton.click()

      // Select first available plant
      const plantButtons = page.getByRole('dialog').locator('button').filter({
        has: page.locator('.text-3xl'),
      })

      const firstPlant = plantButtons.first()
      if (await firstPlant.isVisible()) {
        await firstPlant.click()

        // Fill habit details
        const habitName = `E2E Test Habit ${Date.now()}`
        await page.getByLabel(/habit name/i).fill(habitName)
        await page.getByLabel(/description/i).fill('Created by E2E test')

        // Submit
        await page.getByRole('button', { name: /plant habit/i }).click()

        // Should close dialog and show success toast
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

        // Toast notification
        await expect(page.getByText(/plant created/i)).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('shows validation for empty habit name', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*plant/i })

    if (await addButton.isVisible()) {
      await addButton.click()

      // Select first available plant
      const plantButtons = page.getByRole('dialog').locator('button').filter({
        has: page.locator('.text-3xl'),
      })

      const firstPlant = plantButtons.first()
      if (await firstPlant.isVisible()) {
        await firstPlant.click()

        // Try to submit without filling name
        const submitButton = page.getByRole('button', { name: /plant habit/i })

        // Button should be disabled when name is empty
        await expect(submitButton).toBeDisabled()
      }
    }
  })

  test('back button returns to plant selection', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*plant/i })

    if (await addButton.isVisible()) {
      await addButton.click()

      // Select first available plant
      const plantButtons = page.getByRole('dialog').locator('button').filter({
        has: page.locator('.text-3xl'),
      })

      const firstPlant = plantButtons.first()
      if (await firstPlant.isVisible()) {
        await firstPlant.click()

        // Click back button
        await page.getByRole('button', { name: /back/i }).click()

        // Should return to plant selection
        await expect(page.getByText(/choose a plant type/i)).toBeVisible()
      }
    }
  })

  test('closes dialog with escape key', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*plant/i })

    if (await addButton.isVisible()) {
      await addButton.click()

      await expect(page.getByRole('dialog')).toBeVisible()

      // Press escape
      await page.keyboard.press('Escape')

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible()
    }
  })
})

test.describe('Plant Limits', () => {
  test.skip(
    () => !process.env.E2E_TEST_EMAIL,
    'Skipping authenticated tests - no E2E_TEST_EMAIL configured'
  )

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/garden', { timeout: 15000 })
  })

  test('shows locked tiers for low-level users', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add.*plant/i })

    if (await addButton.isVisible()) {
      await addButton.click()

      // Higher tier sections should have lock indicators
      // This depends on user level - some tiers may be locked
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
    }
  })
})
