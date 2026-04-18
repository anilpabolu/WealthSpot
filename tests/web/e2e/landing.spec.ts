import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('loads homepage with hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/WealthSpot/)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('navigation links are visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('marketplace link navigates correctly', async ({ page }) => {
    await page.goto('/')
    const marketplaceLink = page.getByRole('link', { name: /marketplace/i })
    if (await marketplaceLink.isVisible()) {
      await marketplaceLink.click()
      await expect(page).toHaveURL(/marketplace/)
    }
  })
})
