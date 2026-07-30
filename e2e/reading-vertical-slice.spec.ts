import { expect, test } from '@playwright/test'
import { loginAndGoToGarden } from './fixtures'

test.describe('Reading Habit Vertical Slice', () => {
  test.skip(
    () => !process.env.E2E_TEST_EMAIL,
    'Skipping authenticated tests - no E2E_TEST_EMAIL configured'
  )

  test('persists the journey from Home Garden through completion and Growth Plan', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('habit-garden-onboarding-completed', 'true')
    })

    await loginAndGoToGarden(page)
    const readingBadge = page.locator('[data-guided-capability="reading"]').first()
    await expect(readingBadge).toBeVisible()
    await readingBadge.locator('xpath=ancestor::button[1]').click()
    await page.getByRole('link', { name: 'Mở hành trình đọc' }).click()
    await expect(page).toHaveURL(/\/reading$/)

    await expect(page.getByRole('heading', { name: 'Đọc sách mỗi ngày' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Growth Plan/i })).toBeVisible()

    const startButton = page.getByRole('button', {
      name: /Bắt đầu đọc|Đọc thêm|Tiếp tục đọc|Ghi kết quả/i,
    })
    await startButton.click()
    await page.waitForURL(/\/reading\/(session|completion)/, { timeout: 15_000 })

    if (page.url().includes('/reading/session')) {
      await expect(page.getByText('30 phút cùng một cuốn sách')).toBeVisible()
      await expect(page.getByText(/Target/).first()).toBeVisible()

      const pauseButton = page.getByRole('button', { name: 'Tạm dừng' })
      if (await pauseButton.isVisible().catch(() => false)) {
        await pauseButton.click()
        await expect(page.getByRole('button', { name: 'Tiếp tục' })).toBeVisible()
        await page.reload()
        await expect(page.getByText('Đang tạm dừng')).toBeVisible()
        await page.getByRole('button', { name: 'Tiếp tục' }).click()
      }

      await page.getByRole('button', { name: 'Bật âm thanh rừng' }).click()
      await expect(page.getByRole('button', { name: 'Tắt âm thanh rừng' })).toBeVisible()
      await page.getByRole('button', { name: /Kết thúc & ghi trang/i }).click()
    }

    await expect(page).toHaveURL(/\/reading\/completion/, { timeout: 15_000 })
    const pagesInput = page.getByLabel('Số trang đã đọc')
    await expect(pagesInput).toBeVisible({ timeout: 15_000 })
    await pagesInput.fill('7')
    await page.getByRole('button', { name: 'Lưu kết quả' }).click()

    await expect(page.getByText(/trang đã thành tăng trưởng/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/\+\d+ growth/)).toBeVisible()
    await page.getByRole('link', { name: /Xem Growth Plan/i }).click()
    await expect(page).toHaveURL(/\/reading\/growth-plan/)
    await expect(page.getByRole('heading', { name: '5→30 trang mỗi ngày' })).toBeVisible()
    await expect(page.getByText(/Review mỗi 7 ngày/)).toBeVisible()
  })
})
