# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\web\e2e\shield-builder-submit.spec.ts >> WealthSpot Shield — builder submit flow >> builder can navigate to the shield step and see categories
- Location: tests\web\e2e\shield-builder-submit.spec.ts:4:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/builder/listings/new", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('WealthSpot Shield — builder submit flow', () => {
  4  |   test('builder can navigate to the shield step and see categories', async ({
  5  |     page,
  6  |   }) => {
> 7  |     await page.goto('/builder/listings/new')
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  8  | 
  9  |     // 1. Vault Selection
  10 |     await page.getByRole('button', { name: /Safe Vault/i }).click()
  11 | 
  12 |     // 2. Details Step 1: Company & Basics
  13 |     await expect(page.getByText('Company & Basics')).toBeVisible()
  14 |     await page.getByPlaceholder('e.g. Premium 2BHK Residences').fill('Test Title')
  15 |     await page.getByPlaceholder('e.g. Verified docs').fill('Test Tagline')
  16 |     await page.getByPlaceholder('Describe the investment opportunity').fill('Test Description')
  17 |     await page.getByRole('button', { name: /Save & Continue/i }).click()
  18 | 
  19 |     // 3. Details Step 2: Property & Financials
  20 |     await expect(page.getByText('Property & Financials')).toBeVisible()
  21 |     
  22 |     // Select property type (first one in the grid)
  23 |     await page.getByRole('button', { name: /Residential/i }).first().click()
  24 |     
  25 |     // Fill Safe Vault fields
  26 |     await page.getByPlaceholder('e.g. 14').fill('14') // Interest Rate
  27 |     await page.getByPlaceholder('e.g. 36').fill('24') // Tenure
  28 |     await page.getByPlaceholder('e.g. 50000000').fill('10000000') // Target Amount
  29 |     await page.getByPlaceholder('e.g. 500000').fill('500000') // Min Investment
  30 |     
  31 |     // Funding Opens
  32 |     await page.locator('input[type="date"]').first().fill('2025-01-01')
  33 |     
  34 |     await page.getByRole('button', { name: /Save & Continue/i }).click()
  35 | 
  36 |     // 4. Details Step 3: Location & Media
  37 |     await expect(page.getByText('Location & Media')).toBeVisible()
  38 |     await page.getByRole('button', { name: /Save & Continue/i }).click()
  39 | 
  40 |     // 5. Shield Step
  41 |     await expect(page.getByText('WealthSpot Shield')).toBeVisible()
  42 |     await expect(page.getByText('7-Layer Trust Framework')).toBeVisible()
  43 |     
  44 |     // First category is Builder Assessment
  45 |     await expect(page.getByText('Builder Assessment')).toBeVisible()
  46 |   })
  47 | })
  48 | 
```