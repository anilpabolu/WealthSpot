import { test, expect } from '@playwright/test'

test.describe('WealthSpot Shield — marketplace surface', () => {
  test('hero strip is visible on the marketplace page', async ({ page }) => {
    await page.goto('/marketplace')
    // The strip carries a "WealthSpot Shield" wordmark
    await expect(
      page.getByText('WealthSpot Shield').first(),
    ).toBeVisible()
  })

  test('clicking a Shield tile opens the info modal', async ({ page }) => {
    await page.goto('/marketplace')
    // Tiles render the short category name — "Builder" is the first.
    await page.getByRole('button', { name: /Builder/i }).first().click()
    await expect(
      page.getByText(/7 layers between you/i),
    ).toBeVisible()
    // Modal lists every layer
    await expect(page.getByText('Builder Assessment')).toBeVisible()
    await expect(page.getByText('Legal Assessment')).toBeVisible()
    await expect(page.getByText('Exit Assessment')).toBeVisible()
  })

  test('"What is Shield Certified?" link opens the modal', async ({ page }) => {
    await page.goto('/marketplace')
    await page
      .getByRole('button', { name: /What is Shield Certified\?/i })
      .click()
    await expect(
      page.getByText(/7 layers between you/i),
    ).toBeVisible()
  })

  test('modal closes via the X button', async ({ page }) => {
    await page.goto('/marketplace')
    await page
      .getByRole('button', { name: /What is Shield Certified\?/i })
      .click()
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(
      page.getByText(/7 layers between you/i),
    ).not.toBeVisible()
  })
})
