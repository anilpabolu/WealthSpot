# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: routing.spec.ts >> Routing & Navigation >> 404 page for unknown routes
- Location: tests\web\e2e\routing.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/not found|404|page doesn.*t exist/i)
Expected: visible
Error: strict mode violation: getByText(/not found|404|page doesn.*t exist/i) resolved to 2 elements:
    1) <span class="text-[10rem] leading-none font-display font-bold text-white/10 select-none">404</span> aka getByText('404')
    2) <p class="text-theme-primary font-semibold text-lg">Page not found</p> aka getByText('Page not found')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/not found|404|page doesn.*t exist/i)

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
  3  | test.describe('Routing & Navigation', () => {
  4  |   test('404 page for unknown routes', async ({ page }) => {
  5  |     await page.goto('/this-does-not-exist-xyz')
> 6  |     await expect(page.getByText(/not found|404|page doesn.*t exist/i)).toBeVisible()
     |                                                                        ^ Error: expect(locator).toBeVisible() failed
  7  |   })
  8  | 
  9  |   test('marketplace route is accessible', async ({ page }) => {
  10 |     const response = await page.goto('/marketplace')
  11 |     expect(response?.status()).toBe(200)
  12 |   })
  13 | 
  14 |   test('persona selection route exists', async ({ page }) => {
  15 |     const response = await page.goto('/persona-select')
  16 |     expect(response?.status()).toBe(200)
  17 |   })
  18 | 
  19 |   test('all public pages return 200', async ({ page }) => {
  20 |     const publicRoutes = ['/', '/marketplace']
  21 |     for (const route of publicRoutes) {
  22 |       const response = await page.goto(route)
  23 |       expect(response?.status(), `${route} should return 200`).toBe(200)
  24 |     }
  25 |   })
  26 | })
  27 | 
```