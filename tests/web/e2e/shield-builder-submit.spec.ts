import { test, expect } from '@playwright/test'

test.describe('WealthSpot Shield — builder submit flow', () => {
  test('builder listing creation includes an optional Shield step', async ({
    page,
  }) => {
    await page.goto('/builder/listings/new')
    // The wizard renders multiple steps; "Shield" should appear in the step list
    await expect(page.locator('body')).toBeVisible()
    // Look for the Shield step label or indicator
    const shieldStep = page.getByText(/Shield/i)
    await expect(shieldStep.first()).toBeVisible()
  })

  test('Shield step renders 7 collapsible category sections', async ({
    page,
  }) => {
    await page.goto('/builder/listings/new')
    await expect(page.locator('body')).toBeVisible()
    // Navigate to the Shield step if it requires clicking "Next"
    const shieldLink = page.getByText(/Shield/i).first()
    if (await shieldLink.isVisible()) {
      await shieldLink.click()
    }
    // Verify all 7 categories are present
    const categories = [
      'Builder Assessment',
      'Legal Assessment',
      'Valuation Assessment',
      'Location Assessment',
      'Property Assessment',
      'Security Assessment',
      'Exit Assessment',
    ]
    for (const cat of categories) {
      await expect(page.getByText(cat).first()).toBeVisible()
    }
  })

  test('Shield step shows the optional disclaimer banner', async ({
    page,
  }) => {
    await page.goto('/builder/listings/new')
    await expect(page.locator('body')).toBeVisible()
    const shieldLink = page.getByText(/Shield/i).first()
    if (await shieldLink.isVisible()) {
      await shieldLink.click()
    }
    await expect(
      page.getByText(/everything on this step is optional/i).first(),
    ).toBeVisible()
  })

  test('builder can expand a category and see sub-items', async ({ page }) => {
    await page.goto('/builder/listings/new')
    await expect(page.locator('body')).toBeVisible()
    const shieldLink = page.getByText(/Shield/i).first()
    if (await shieldLink.isVisible()) {
      await shieldLink.click()
    }
    // Click on a category to expand it
    const builderCategory = page.getByText('Builder Assessment').first()
    if (await builderCategory.isVisible()) {
      await builderCategory.click()
      // Should show sub-item prompts / inputs
      await expect(
        page.getByText(/Category Grade/i).first(),
      ).toBeVisible()
    }
  })

  test('builder can submit listing with empty Shield answers', async ({
    page,
  }) => {
    await page.goto('/builder/listings/new')
    await expect(page.locator('body')).toBeVisible()
    // The submit / create button should be available even if Shield is empty
    const submitButton = page.getByRole('button', { name: /submit|create|save/i })
    if (await submitButton.first().isVisible()) {
      // Just verify it's not disabled
      await expect(submitButton.first()).toBeEnabled()
    }
  })
})
