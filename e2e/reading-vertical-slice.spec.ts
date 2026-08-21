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
    const readingPlantButton = readingBadge.locator('xpath=ancestor::button[1]')
    const gardenPlantLabel = await readingPlantButton.getAttribute('aria-label')
    const gardenPlantName = gardenPlantLabel?.replace(/^Đến thăm\s+/, '').trim()
    const gardenPlantImage = readingPlantButton.locator('img').first()
    await expect(gardenPlantImage).toBeVisible()
    const gardenPlantImageAlt = await gardenPlantImage.getAttribute('alt')

    if (!gardenPlantName || !gardenPlantImageAlt) {
      throw new Error('Reading plant must expose its name and image identity in the Garden')
    }

    await readingPlantButton.click()
    const readingLink = page.getByRole('link', { name: 'Mở hành trình đọc' })
    const plantHref = await readingLink.getAttribute('href')
    if (!plantHref || !/^\/plant\/[^/]+$/.test(plantHref)) {
      throw new Error('Reading capability must link to its owning plant route')
    }
    await readingLink.click()
    await expect(page).toHaveURL(new RegExp(`${plantHref}$`))

    await expect(page.getByRole('heading', { name: gardenPlantName })).toBeVisible()
    await expect(page.getByRole('img', { name: gardenPlantImageAlt })).toBeVisible()
    await expect(page.getByRole('link', { name: /Growth Plan/i })).toBeVisible()

    const startButton = page.getByRole('button', {
      name: /Bắt đầu đọc|Đọc thêm|Tiếp tục đọc|Ghi kết quả/i,
    })
    await startButton.click()
    await page.waitForURL(new RegExp(`${plantHref}/reading/(session|completion)`), { timeout: 15_000 })

    if (page.url().includes(`${plantHref}/reading/session`)) {
      await expect(page.getByRole('heading', { name: `30 phút cùng ${gardenPlantName}` })).toBeVisible()
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

    await expect(page).toHaveURL(new RegExp(`${plantHref}/reading/completion`), { timeout: 15_000 })
    const pagesInput = page.getByLabel('Số trang đã đọc')
    await expect(pagesInput).toBeVisible({ timeout: 15_000 })
    await pagesInput.fill('7')
    await page.getByRole('button', { name: 'Lưu kết quả' }).click()

    await expect(page.getByText(/trang đã thành tăng trưởng/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/\+\d+ growth/)).toBeVisible()
    await page.getByRole('link', { name: /Xem Growth Plan/i }).click()
    await expect(page).toHaveURL(new RegExp(`${plantHref}/reading/growth-plan`))
    await expect(page.getByRole('heading', { name: '5→30 trang mỗi ngày' })).toBeVisible()
    await expect(page.getByText(/Review mỗi 7 ngày/)).toBeVisible()
  })
})
