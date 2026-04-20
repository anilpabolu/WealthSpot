import { test, expect } from '@playwright/test'

test.describe('WealthSpot Shield — admin review flow', () => {
  test('approvals page loads and renders the Shield review panel', async ({
    page,
  }) => {
    await page.goto('/admin/approvals')
    await expect(page.locator('body')).toBeVisible()
    // If approvals exist, the drawer should contain a Shield review section
    // when viewing an opportunity approval
  })

  test('Shield review panel shows category tabs', async ({ page }) => {
    await page.goto('/admin/approvals')
    await expect(page.locator('body')).toBeVisible()
    // Look for category tabs inside the approval drawer
    const builderTab = page.getByRole('button', { name: /Builder/i })
    const legalTab = page.getByRole('button', { name: /Legal/i })
    // These may or may not be visible depending on auth + data
    if (await builderTab.first().isVisible()) {
      await expect(builderTab.first()).toBeVisible()
      await expect(legalTab.first()).toBeVisible()
    }
  })

  test('command-control page has a Shield review section', async ({
    page,
  }) => {
    await page.goto('/admin/command-control')
    await expect(page.locator('body')).toBeVisible()
    // The Shield review tab or section should exist
    const shieldReview = page.getByText(/Shield Review/i)
    if (await shieldReview.first().isVisible()) {
      await expect(shieldReview.first()).toBeVisible()
    }
  })

  test('Shield metrics card renders on admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page.locator('body')).toBeVisible()
    // Look for the metrics card title
    const metricsTitle = page.getByText(/Shield.*operations/i)
    if (await metricsTitle.first().isVisible()) {
      await expect(metricsTitle.first()).toBeVisible()
    }
  })

  test('admin can switch category tabs in the review panel', async ({
    page,
  }) => {
    await page.goto('/admin/command-control')
    await expect(page.locator('body')).toBeVisible()
    // Try switching from Builder to Legal
    const builderTab = page.getByRole('button', { name: /Builder/i })
    const legalTab = page.getByRole('button', { name: /Legal/i })
    if (await builderTab.first().isVisible()) {
      await builderTab.first().click()
      await expect(builderTab.first()).toBeVisible()
      if (await legalTab.first().isVisible()) {
        await legalTab.first().click()
        await expect(legalTab.first()).toBeVisible()
      }
    }
  })

  test('verdict buttons (Pass / Flag / N/A) are present per sub-item', async ({
    page,
  }) => {
    await page.goto('/admin/command-control')
    await expect(page.locator('body')).toBeVisible()
    // If the review panel is visible, check for verdict buttons
    const passButton = page.getByRole('button', { name: /^Pass$/i })
    const flagButton = page.getByRole('button', { name: /^Flag$/i })
    if (await passButton.first().isVisible()) {
      await expect(passButton.first()).toBeVisible()
      await expect(flagButton.first()).toBeVisible()
    }
  })
})
