# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shield-builder-submit.spec.ts >> WealthSpot Shield — builder submit flow >> builder listing creation includes an optional Shield step
- Location: tests\web\e2e\shield-builder-submit.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Shield/i).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Shield/i).first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - text: "404"
      - generic [ref=e8]:
        - img [ref=e9]
        - paragraph [ref=e12]: Page not found
    - paragraph [ref=e13]: The page you're looking for doesn't exist or has been moved. Let's get you back on track.
    - generic [ref=e14]:
      - link "Go Home" [ref=e15] [cursor=pointer]:
        - /url: /
        - img [ref=e16]
        - text: Go Home
      - button "Go Back" [ref=e19] [cursor=pointer]:
        - img [ref=e20]
        - text: Go Back
  - button "Open Diagnostics" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('WealthSpot Shield — builder submit flow', () => {
  4  |   test('builder listing creation includes an optional Shield step', async ({
  5  |     page,
  6  |   }) => {
  7  |     await page.goto('/builder/listings/new')
  8  |     // The wizard renders multiple steps; "Shield" should appear in the step list
  9  |     await expect(page.locator('body')).toBeVisible()
  10 |     // Look for the Shield step label or indicator
  11 |     const shieldStep = page.getByText(/Shield/i)
> 12 |     await expect(shieldStep.first()).toBeVisible()
     |                                      ^ Error: expect(locator).toBeVisible() failed
  13 |   })
  14 | 
  15 |   test('Shield step renders 7 collapsible category sections', async ({
  16 |     page,
  17 |   }) => {
  18 |     await page.goto('/builder/listings/new')
  19 |     await expect(page.locator('body')).toBeVisible()
  20 |     // Navigate to the Shield step if it requires clicking "Next"
  21 |     const shieldLink = page.getByText(/Shield/i).first()
  22 |     if (await shieldLink.isVisible()) {
  23 |       await shieldLink.click()
  24 |     }
  25 |     // Verify all 7 categories are present
  26 |     const categories = [
  27 |       'Builder Assessment',
  28 |       'Legal Assessment',
  29 |       'Valuation Assessment',
  30 |       'Location Assessment',
  31 |       'Property Assessment',
  32 |       'Security Assessment',
  33 |       'Exit Assessment',
  34 |     ]
  35 |     for (const cat of categories) {
  36 |       await expect(page.getByText(cat).first()).toBeVisible()
  37 |     }
  38 |   })
  39 | 
  40 |   test('Shield step shows the optional disclaimer banner', async ({
  41 |     page,
  42 |   }) => {
  43 |     await page.goto('/builder/listings/new')
  44 |     await expect(page.locator('body')).toBeVisible()
  45 |     const shieldLink = page.getByText(/Shield/i).first()
  46 |     if (await shieldLink.isVisible()) {
  47 |       await shieldLink.click()
  48 |     }
  49 |     await expect(
  50 |       page.getByText(/everything on this step is optional/i).first(),
  51 |     ).toBeVisible()
  52 |   })
  53 | 
  54 |   test('builder can expand a category and see sub-items', async ({ page }) => {
  55 |     await page.goto('/builder/listings/new')
  56 |     await expect(page.locator('body')).toBeVisible()
  57 |     const shieldLink = page.getByText(/Shield/i).first()
  58 |     if (await shieldLink.isVisible()) {
  59 |       await shieldLink.click()
  60 |     }
  61 |     // Click on a category to expand it
  62 |     const builderCategory = page.getByText('Builder Assessment').first()
  63 |     if (await builderCategory.isVisible()) {
  64 |       await builderCategory.click()
  65 |       // Should show sub-item prompts / inputs
  66 |       await expect(
  67 |         page.getByText(/Category Grade/i).first(),
  68 |       ).toBeVisible()
  69 |     }
  70 |   })
  71 | 
  72 |   test('builder can submit listing with empty Shield answers', async ({
  73 |     page,
  74 |   }) => {
  75 |     await page.goto('/builder/listings/new')
  76 |     await expect(page.locator('body')).toBeVisible()
  77 |     // The submit / create button should be available even if Shield is empty
  78 |     const submitButton = page.getByRole('button', { name: /submit|create|save/i })
  79 |     if (await submitButton.first().isVisible()) {
  80 |       // Just verify it's not disabled
  81 |       await expect(submitButton.first()).toBeEnabled()
  82 |     }
  83 |   })
  84 | })
  85 | 
```