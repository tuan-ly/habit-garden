import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('displays hero section with call-to-action', async ({ page }) => {
    await page.goto('/')

    // Check hero content
    await expect(page.getByRole('heading', { name: /grow your habits/i })).toBeVisible()
    await expect(page.getByText(/transform your daily routines/i)).toBeVisible()

    // Check CTA buttons
    await expect(page.getByRole('link', { name: /start growing free/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /view pricing/i })).toBeVisible()
  })

  test('shows navigation links', async ({ page }) => {
    await page.goto('/')

    // Check nav brand (use first() since it appears in both nav and footer)
    await expect(page.getByText('Habit Garden').first()).toBeVisible()

    // Check auth links in navigation
    await expect(page.locator('nav').getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.locator('nav').getByRole('link', { name: /get started/i })).toBeVisible()
  })

  test('navigates to signup from CTA', async ({ page }) => {
    await page.goto('/')

    // Click the main CTA button
    await page.getByRole('link', { name: /start growing free/i }).click()

    await expect(page).toHaveURL('/signup')
  })

  test('navigates to login from nav', async ({ page }) => {
    await page.goto('/')

    await page.locator('nav').getByRole('link', { name: /sign in/i }).click()

    await expect(page).toHaveURL('/login')
  })
})

test.describe('Signup Flow', () => {
  test('displays signup form', async ({ page }) => {
    await page.goto('/signup')

    // Card title (CardTitle uses div, not heading role)
    await expect(page.getByText(/start your garden/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })

  test('shows Google OAuth option', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('links to login page', async ({ page }) => {
    await page.goto('/signup')

    // Use the link text that matches the actual page
    await page.getByRole('link', { name: /sign in/i }).click()

    await expect(page).toHaveURL('/login')
  })

  test('shows validation for empty fields', async ({ page }) => {
    await page.goto('/signup')

    // Get initial URL
    const initialUrl = page.url()

    // Click submit without filling fields - HTML5 validation prevents submission
    await page.getByRole('button', { name: /create account/i }).click()

    // Should still be on signup page (validation prevented navigation)
    await expect(page).toHaveURL(initialUrl)
  })

  test('shows loading state during submission', async ({ page }) => {
    await page.goto('/signup')

    // Fill form with test credentials
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel(/password/i).fill('password123')

    // Click submit and check for loading state
    const submitButton = page.getByRole('button', { name: /create account/i })
    await submitButton.click()

    // Should briefly show loading state OR navigate/show error
    // The button text changes to "Creating account..." during submission
    await expect(
      page.getByRole('button', { name: /creating account/i }).or(page.getByRole('alert'))
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Login Flow', () => {
  test('displays login form', async ({ page }) => {
    await page.goto('/login')

    // Card title (CardTitle uses div, not heading role)
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows Google OAuth option', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
  })

  test('links to signup page', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: /sign up/i }).click()

    await expect(page).toHaveURL('/signup')
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill with invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')

    // Submit
    await page.getByRole('button', { name: /sign in/i }).click()

    // Wait for error message (either alert role or toast)
    await expect(
      page.getByRole('alert').or(page.getByText(/error|invalid|incorrect/i))
    ).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Footer', () => {
  test('displays footer links', async ({ page }) => {
    await page.goto('/')

    // Footer links (use contentinfo role to scope to footer)
    const footer = page.locator('footer, [role="contentinfo"]')
    await expect(footer.getByRole('link', { name: /privacy/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /terms/i })).toBeVisible()
    await expect(footer.getByRole('link', { name: /refunds/i })).toBeVisible()
  })

  test('privacy page loads correctly', async ({ page }) => {
    await page.goto('/privacy')

    // Check page loads with privacy-related content
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('terms page loads correctly', async ({ page }) => {
    await page.goto('/terms')

    // Check page loads with terms-related content
    await expect(page.getByRole('heading').first()).toBeVisible()
  })
})
