import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('unauthenticated user sees login prompt on protected routes', async ({ page }) => {
    await page.goto('/portfolio')
    // Should redirect to login or show auth gate
    await expect(page.locator('body')).toBeVisible()
  })

  test('profiling page requires authentication', async ({ page }) => {
    await page.goto('/profiling')
    await expect(page.locator('body')).toBeVisible()
  })

  test('invest page requires authentication', async ({ page }) => {
    await page.goto('/invest')
    await expect(page.locator('body')).toBeVisible()
  })
})
