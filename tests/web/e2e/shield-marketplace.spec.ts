import { test, expect } from '@playwright/test'

test.describe('WealthSpot Shield — marketplace surface', () => {
  test('hero strip is visible on the marketplace page', async ({ page }) => {
    await page.goto('/marketplace')
    await expect(
      page.getByText('Shield Certified').first(),
    ).toBeVisible()
  })

  test('clicking Learn more opens the info modal', async ({ page }) => {
    await page.goto('/marketplace')
    await page.getByRole('button', { name: /Learn more/i }).first().click()
    await expect(
      page.getByText(/7 layers of trust/i),
    ).toBeVisible()
    // Modal lists every layer
    await expect(page.getByText('Builder Assessment').first()).toBeVisible()
    await expect(page.getByText('Legal Assessment').first()).toBeVisible()
    await expect(page.getByText('Exit Assessment').first()).toBeVisible()
  })

  test('modal closes via the X button', async ({ page }) => {
    await page.goto('/marketplace')
    await page.getByRole('button', { name: /Learn more/i }).first().click()
    await page.getByRole('button', { name: 'Close', exact: true }).first().click()
    await expect(
      page.getByText(/7 layers of trust/i),
    ).not.toBeVisible()
  })
})
