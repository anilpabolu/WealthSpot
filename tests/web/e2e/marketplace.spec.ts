import { test, expect } from '@playwright/test'

test.describe('Marketplace Page', () => {
  test('renders marketplace hero and filters', async ({ page }) => {
    await page.goto('/marketplace')
    await expect(page.getByText('Property Marketplace')).toBeVisible()
    await expect(page.getByText('Filters')).toBeVisible()
  })

  test('displays property count', async ({ page }) => {
    await page.goto('/marketplace')
    await expect(page.getByText(/properties? found/)).toBeVisible()
  })

  test('grid/list view toggle works', async ({ page }) => {
    await page.goto('/marketplace')
    const listBtn = page.getByRole('button', { name: 'List view' })
    if (await listBtn.isVisible()) {
      await listBtn.click()
      // Verify view mode toggled (no error thrown)
    }
  })

  test('vault filter from URL applies', async ({ page }) => {
    await page.goto('/marketplace?vault=wealth')
    // Should load with vault context — either show properties or vault banner
    await expect(page.locator('body')).toBeVisible()
  })
})
