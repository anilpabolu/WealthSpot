import { test, expect } from '@playwright/test'

test.describe('WealthSpot Shield — builder submit flow', () => {
  test('builder can navigate to the shield step and see categories', async ({
    page,
  }) => {
    await page.goto('/builder/listings/new')

    // 1. Vault Selection
    await page.getByRole('button', { name: /Wealth Vault/i }).click()

    // 2. Details Step 1: Company & Basics
    await expect(page.getByText('Company / Entity')).toBeVisible()
    await page.getByPlaceholder('e.g. Premium 2BHK Residences').fill('Test Title')
    await page.getByPlaceholder('e.g. Verified docs').fill('Test Tagline')
    await page.getByPlaceholder('Describe the investment opportunity').fill('Test Description')
    await page.getByRole('button', { name: /Save & Continue/i }).click()

    // 3. Details Step 2: Property & Financials
    await expect(page.getByText('Property Type')).toBeVisible()
    
    // Select property type (first one in the grid)
    await page.getByRole('button', { name: /Residential/i }).first().click()
    
    // Total Floors
    await page.getByPlaceholder('e.g. 20').fill('10')
    
    // Land Parcel
    await page.locator('input[placeholder="Enter value"]').fill('1000') // sqft
    
    // Investment Mode
    await page.getByRole('button', { name: 'Lumpsum' }).click()
    
    // Pricing
    await page.locator('input[placeholder="e.g. 6500"]').fill('5000') // price per sqft
    await page.locator('input[placeholder="e.g. 250000"]').fill('100000') // total project area
    
    // Min investment
    await page.locator('input[placeholder="e.g. 500000"]').fill('100000')
    
    // Funding Opens
    await page.locator('input[type="date"]').first().fill('2025-01-01')
    
    await page.getByRole('button', { name: /Save & Continue/i }).click()

    // 4. Details Step 3: Location & Media
    await expect(page.getByText('Location & Media')).toBeVisible()
    await page.getByRole('button', { name: /Save & Continue/i }).click()

    // 5. Shield Step
    await expect(page.getByText('WealthSpot Shield')).toBeVisible()
    await expect(page.getByText('7-Layer Trust Framework')).toBeVisible()
    
    // First category is Builder Assessment
    await expect(page.getByText('Builder Assessment')).toBeVisible()
  })
})
