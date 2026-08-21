import { expect, test } from '@playwright/test'
import { loginAndGoToGarden } from './fixtures'

test.describe('Plant Story', () => {
  test.skip(
    () => !process.env.E2E_TEST_EMAIL,
    'Skipping authenticated tests - no E2E_TEST_EMAIL configured'
  )

  test('opens one plant lifetime story and explores available chapters', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('habit-garden-onboarding-completed', 'true')
    })

    await loginAndGoToGarden(page)
    await page.goto('/overview')

    const plantStoryLink = page.locator('a[href^="/overview/"]').first()
    await expect(plantStoryLink).toBeVisible()

    const storyHref = await plantStoryLink.getAttribute('href')
    if (!storyHref || !/^\/overview\/[^/]+$/.test(storyHref)) {
      throw new Error('Journey plant rows must link to their plant story route')
    }

    await plantStoryLink.click()
    await expect(page).toHaveURL(new RegExp(`${storyHref}$`), { timeout: 20_000 })

    await expect(page.getByText('Câu chuyện của', { exact: true })).toBeVisible()
    const plantName = page.getByRole('heading', { level: 1 })
    await expect(plantName).toBeVisible()
    expect((await plantName.textContent())?.trim()).not.toBe('')

    const currentChapter = page.locator(
      'section[aria-labelledby="current-chapter-heading"]'
    )
    await expect(currentChapter).toBeVisible()
    await expect(currentChapter.getByRole('heading', { level: 2 })).toBeVisible()

    const currentEmptyState = currentChapter.getByText(
      'Chưa có khoảnh khắc nào trong tháng này'
    )
    const currentEntries = currentChapter.locator('article')
    await expect.poll(async () => (
      await currentEmptyState.isVisible().catch(() => false)
      || await currentEntries.count() > 0
    )).toBe(true)

    const currentMonthExpand = currentChapter.locator('button[aria-expanded]').first()
    if (await currentMonthExpand.isVisible().catch(() => false)) {
      await expect(currentMonthExpand).toHaveAccessibleName(/^Xem tất cả \d+ khoảnh khắc$/)
      const previewCount = await currentEntries.count()

      await currentMonthExpand.click()

      await expect(currentMonthExpand).toHaveAttribute('aria-expanded', 'true')
      await expect(currentMonthExpand).toHaveAccessibleName(/Thu gọn tháng này/)
      await expect.poll(() => currentEntries.count()).toBeGreaterThanOrEqual(previewCount)
    }

    const archive = page.locator('section[aria-labelledby="archive-heading"]')
    await expect(archive).toBeVisible()

    const olderChapter = archive.locator('button[aria-controls^="chapter-"]').first()
    if (await olderChapter.isVisible().catch(() => false)) {
      const panelId = await olderChapter.getAttribute('aria-controls')
      if (!panelId) throw new Error('Older chapter row must identify its details panel')

      await olderChapter.click()

      await expect(olderChapter).toHaveAttribute('aria-expanded', 'true')
      await expect(page.locator(`#${panelId}`)).toBeVisible()
      await expect(page.locator(`#${panelId} article`).first()).toBeVisible()
    } else {
      await expect(archive.getByText('Chưa có tháng trước để xem lại')).toBeVisible()
    }
  })
})
