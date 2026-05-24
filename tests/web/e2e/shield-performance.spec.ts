import { test, expect } from '@playwright/test'

test.describe('Performance & Load testing', () => {
  test('marketplace page loads within acceptable performance budgets', async ({ page }) => {
    // Navigate to the marketplace
    const startTime = Date.now()
    await page.goto('/marketplace')
    const loadTime = Date.now() - startTime

    // Validate that page loaded in less than 3000ms
    expect(loadTime).toBeLessThan(3000)

    // Verify main components are interactive
    await expect(page.getByText('Shield Certified').first()).toBeVisible()

    // Test scrolling performance (smoke test for smooth UI)
    await page.evaluate(() => window.scrollBy(0, 1000))
    await page.waitForTimeout(100)
    await page.evaluate(() => window.scrollBy(0, -1000))
  })

  test('builder opportunity creation flow loads quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/builder/listings/new')
    const loadTime = Date.now() - startTime
    
    // Validate that page loaded in less than 3000ms
    expect(loadTime).toBeLessThan(3000)
    
    await expect(page.getByRole('button', { name: /Wealth Vault/i })).toBeVisible()
  })
})
