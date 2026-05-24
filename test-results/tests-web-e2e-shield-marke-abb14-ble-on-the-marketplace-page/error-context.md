# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\web\e2e\shield-marketplace.spec.ts >> WealthSpot Shield — marketplace surface >> hero strip is visible on the marketplace page
- Location: tests\web\e2e\shield-marketplace.spec.ts:4:3

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/marketplace", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('WealthSpot Shield — marketplace surface', () => {
  4  |   test('hero strip is visible on the marketplace page', async ({ page }) => {
> 5  |     await page.goto('/marketplace')
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  6  |     await expect(
  7  |       page.getByText('Shield Certified').first(),
  8  |     ).toBeVisible()
  9  |   })
  10 | 
  11 |   test('clicking Learn more opens the info modal', async ({ page }) => {
  12 |     await page.goto('/marketplace')
  13 |     await page.getByRole('button', { name: /Learn more/i }).first().click()
  14 |     await expect(
  15 |       page.getByText(/7 layers of trust/i),
  16 |     ).toBeVisible()
  17 |     // Modal lists every layer
  18 |     await expect(page.getByText('Builder Assessment')).toBeVisible()
  19 |     await expect(page.getByText('Legal Assessment')).toBeVisible()
  20 |     await expect(page.getByText('Exit Assessment')).toBeVisible()
  21 |   })
  22 | 
  23 |   test('modal closes via the X button', async ({ page }) => {
  24 |     await page.goto('/marketplace')
  25 |     await page.getByRole('button', { name: /Learn more/i }).first().click()
  26 |     await page.getByRole('button', { name: 'Close' }).click()
  27 |     await expect(
  28 |       page.getByText(/7 layers of trust/i),
  29 |     ).not.toBeVisible()
  30 |   })
  31 | })
  32 | 
```