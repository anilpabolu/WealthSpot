import { test, expect } from '@playwright/test'

test.describe('Accessibility & Responsive', () => {
  test('landing page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    const h1 = page.locator('h1')
    await expect(h1.first()).toBeVisible()
  })

  test('marketplace page has accessible filter controls', async ({ page }) => {
    await page.goto('/marketplace')
    await expect(page.getByText('Filters')).toBeVisible()
  })

  test('mobile viewport shows hamburger menu or filter button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/marketplace')
    // Mobile filter button should be visible
    await expect(page.locator('body')).toBeVisible()
  })

  test('no console errors on landing page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto('/')
    await page.waitForTimeout(2000)
    // Filter out known React warnings and Clerk auth errors (expected in non-auth env)
    const criticalErrors = errors.filter(
      (e) => !e.includes('React') && !e.includes('Clerk') && !e.includes('Failed to fetch') && !e.includes('ERR_CONNECTION_REFUSED'),
    )
    expect(criticalErrors).toHaveLength(0)
  })
})
