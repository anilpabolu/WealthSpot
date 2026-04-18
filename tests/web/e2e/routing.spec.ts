import { test, expect } from '@playwright/test'

test.describe('Routing & Navigation', () => {
  test('404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz')
    await expect(page.getByText(/not found|404|page doesn.*t exist/i)).toBeVisible()
  })

  test('marketplace route is accessible', async ({ page }) => {
    const response = await page.goto('/marketplace')
    expect(response?.status()).toBe(200)
  })

  test('persona selection route exists', async ({ page }) => {
    const response = await page.goto('/persona-select')
    expect(response?.status()).toBe(200)
  })

  test('all public pages return 200', async ({ page }) => {
    const publicRoutes = ['/', '/marketplace']
    for (const route of publicRoutes) {
      const response = await page.goto(route)
      expect(response?.status(), `${route} should return 200`).toBe(200)
    }
  })
})
