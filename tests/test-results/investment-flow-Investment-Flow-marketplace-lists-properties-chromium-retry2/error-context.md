# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: investment-flow.spec.ts >> Investment Flow >> marketplace lists properties
- Location: tests\web\e2e\investment-flow.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Property Marketplace')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Property Marketplace')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - navigation "Main navigation" [ref=e5]:
        - generic [ref=e6]:
          - link "WealthSpot Home" [ref=e7] [cursor=pointer]:
            - /url: /vaults
            - img "WealthSpot" [ref=e10]
            - generic [ref=e11]:
              - generic [ref=e12]: WealthSpot
              - generic [ref=e13]: Private Wealth Access
          - button "Switch to light mode" [ref=e15] [cursor=pointer]:
            - img [ref=e16]
    - main [ref=e22]:
      - generic [ref=e28]:
        - generic [ref=e29]:
          - generic [ref=e31]: Wealth Vault
          - heading "Wealth Vault" [level=1] [ref=e33]
          - paragraph [ref=e34]: Discover RERA-verified investment opportunities across India’s top cities.
          - paragraph [ref=e35]: Every listing passes through a rigorous 7-layer Shield review — from builder credibility to exit clauses — before it earns Shield Certified status.
        - generic [ref=e37]:
          - generic [ref=e38]:
            - generic [ref=e39]:
              - img [ref=e40]
              - generic [ref=e43]: Shield Certified
            - button "Learn more" [ref=e44] [cursor=pointer]:
              - text: Learn more
              - img [ref=e45]
          - generic [ref=e48]:
            - generic [ref=e49]:
              - img [ref=e52]
              - generic [ref=e69]:
                - generic [ref=e70]:
                  - img [ref=e72]
                  - generic [ref=e75]: Builder Assessment
                - paragraph [ref=e76]: Grade, tenure, cashflows & team capability of the builder
                - paragraph [ref=e77]: We grade every builder on delivery history, balance-sheet health, and the people behind the project before a single rupee goes on the platform.
                - generic [ref=e78]: Verified by WealthSpot Team
            - generic [ref=e79]:
              - generic [ref=e80]:
                - img [ref=e81]
                - text: Category Grade
              - generic [ref=e84]:
                - img [ref=e85]
                - text: Tenure & Sqft Delivered
              - generic [ref=e88]:
                - img [ref=e89]
                - text: Proprietor Profile
              - generic [ref=e92]:
                - img [ref=e93]
                - text: Cash Flows
              - generic [ref=e96]:
                - img [ref=e97]
                - text: Team Capabilities
          - generic [ref=e100]:
            - button "View Builder Assessment" [ref=e101] [cursor=pointer]
            - button "View Legal Assessment" [ref=e102] [cursor=pointer]
            - button "View Valuation Assessment" [ref=e103] [cursor=pointer]
            - button "View Location Assessment" [ref=e104] [cursor=pointer]
            - button "View Property Assessment" [ref=e105] [cursor=pointer]
            - button "View Security Assessment" [ref=e106] [cursor=pointer]
            - button "View Exit Assessment" [ref=e107] [cursor=pointer]
      - generic [ref=e110]:
        - complementary [ref=e111]:
          - generic [ref=e112]:
            - heading "Filters" [level=3] [ref=e113]:
              - img [ref=e114]
              - text: Filters
            - generic [ref=e115]:
              - generic [ref=e116]:
                - generic [ref=e117]: City
                - button "All Cities" [ref=e119] [cursor=pointer]:
                  - generic [ref=e120]: All Cities
                  - img [ref=e121]
              - generic [ref=e123]:
                - generic [ref=e124]: Asset Type
                - button "All Types" [ref=e126] [cursor=pointer]:
                  - generic [ref=e127]: All Types
                  - img [ref=e128]
              - generic [ref=e130]:
                - generic [ref=e131]: Status
                - generic [ref=e132]:
                  - button "All" [ref=e133] [cursor=pointer]
                  - button "Upcoming" [ref=e134] [cursor=pointer]
                  - button "Live" [ref=e135] [cursor=pointer]
                  - button "Fully Funded" [ref=e136] [cursor=pointer]
                  - button "Deal Closed" [ref=e137] [cursor=pointer]
              - generic [ref=e138]:
                - generic [ref=e139]: Sort By
                - button "Newest First" [ref=e141] [cursor=pointer]:
                  - generic [ref=e142]: Newest First
                  - img [ref=e143]
              - button "Reset All Filters" [ref=e145] [cursor=pointer]
        - generic [ref=e147]:
          - paragraph [ref=e148]: Loading...
          - generic [ref=e149]:
            - button "Grid view" [ref=e150] [cursor=pointer]:
              - img [ref=e151]
            - button "List view" [ref=e153] [cursor=pointer]:
              - img [ref=e154]
    - contentinfo [ref=e216]:
      - generic [ref=e218]:
        - generic [ref=e219]:
          - generic [ref=e220]:
            - link "WealthSpot" [ref=e221] [cursor=pointer]:
              - /url: /
              - img [ref=e222]
              - generic [ref=e224]: WealthSpot
            - paragraph [ref=e225]: India’s trusted fractional real estate investment platform. Build generational wealth, one fraction at a time.
            - generic [ref=e226]:
              - link "hello@wealthspot.in" [ref=e227] [cursor=pointer]:
                - /url: mailto:hello@wealthspot.in
                - img [ref=e228]
                - text: hello@wealthspot.in
              - link "1800-XXX-XXXX" [ref=e231] [cursor=pointer]:
                - /url: tel:+91-1800-XXX-XXXX
                - img [ref=e232]
                - text: 1800-XXX-XXXX
              - generic [ref=e234]:
                - img [ref=e235]
                - generic [ref=e238]: Bengaluru, Karnataka, India
          - generic [ref=e239]:
            - heading "Platform" [level=3] [ref=e240]
            - list [ref=e241]:
              - listitem [ref=e242]:
                - link "How it Works" [ref=e243] [cursor=pointer]:
                  - /url: /#how-it-works
              - listitem [ref=e244]:
                - link "For Builders" [ref=e245] [cursor=pointer]:
                  - /url: /builders
              - listitem [ref=e246]:
                - link "FAQs" [ref=e247] [cursor=pointer]:
                  - /url: /faqs
              - listitem [ref=e248]:
                - link "Investment Guide" [ref=e249] [cursor=pointer]:
                  - /url: /investment-guide
          - generic [ref=e250]:
            - heading "Company" [level=3] [ref=e251]
            - list [ref=e252]:
              - listitem [ref=e253]:
                - link "About Us" [ref=e254] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e255]:
                - link "Careers" [ref=e256] [cursor=pointer]:
                  - /url: /careers
              - listitem [ref=e257]:
                - link "Contact Us" [ref=e258] [cursor=pointer]:
                  - /url: /contact
          - generic [ref=e259]:
            - heading "Legal" [level=3] [ref=e260]
            - list [ref=e261]:
              - listitem [ref=e262]:
                - link "Terms of Service" [ref=e263] [cursor=pointer]:
                  - /url: /legal/terms
              - listitem [ref=e264]:
                - link "Privacy Policy" [ref=e265] [cursor=pointer]:
                  - /url: /legal/privacy
        - generic [ref=e267]:
          - paragraph [ref=e269]: © 2026 WealthSpot Technologies Pvt. Ltd. All rights reserved.
          - generic [ref=e270]:
            - link "Twitter" [ref=e271] [cursor=pointer]:
              - /url: "#"
              - img [ref=e272]
            - link "LinkedIn" [ref=e274] [cursor=pointer]:
              - /url: "#"
              - img [ref=e275]
            - link "Instagram" [ref=e279] [cursor=pointer]:
              - /url: "#"
              - img [ref=e280]
            - link "YouTube" [ref=e283] [cursor=pointer]:
              - /url: "#"
              - img [ref=e284]
        - paragraph [ref=e288]:
          - strong [ref=e289]: "Risk Disclaimer:"
          - text: Investments in fractional real estate are subject to market risks. Past performance does not guarantee future returns. The projected IRR is an estimate and actual returns may vary. Please read all related documents carefully before investing. WealthSpot is a technology platform and does not provide financial advice.
  - button "Open Diagnostics" [ref=e290] [cursor=pointer]:
    - img [ref=e291]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Investment Flow', () => {
  4  |   test('marketplace lists properties', async ({ page }) => {
  5  |     await page.goto('/marketplace')
> 6  |     await expect(page.getByText('Property Marketplace')).toBeVisible()
     |                                                          ^ Error: expect(locator).toBeVisible() failed
  7  |   })
  8  | 
  9  |   test('property detail page loads from marketplace link', async ({ page }) => {
  10 |     await page.goto('/marketplace')
  11 |     // Click first property card if available
  12 |     const cards = page.locator('[data-testid="property-card"]')
  13 |     const count = await cards.count()
  14 |     if (count > 0) {
  15 |       await cards.first().click()
  16 |       await expect(page.locator('body')).toBeVisible()
  17 |     } else {
  18 |       // Properties may be behind auth or empty in test env – page still loads
  19 |       await expect(page.locator('body')).toBeVisible()
  20 |     }
  21 |   })
  22 | 
  23 |   test('property detail page renders at /property/:slug', async ({ page }) => {
  24 |     await page.goto('/property/test-property')
  25 |     // Either renders detail or shows a not-found/redirect state
  26 |     await expect(page.locator('body')).toBeVisible()
  27 |   })
  28 | 
  29 |   test('invest CTA requires authentication', async ({ page }) => {
  30 |     await page.goto('/marketplace')
  31 |     await expect(page.locator('body')).toBeVisible()
  32 |     // Auth gate should appear if user tries to invest unauthenticated
  33 |     const investBtn = page.getByRole('button', { name: /invest/i })
  34 |     if (await investBtn.isVisible()) {
  35 |       await investBtn.click()
  36 |       // Either redirected to sign-in or auth gate modal opens
  37 |       const isAuthPage = page.url().includes('sign-in') || page.url().includes('login')
  38 |       const isModal = await page.getByRole('dialog').isVisible().catch(() => false)
  39 |       expect(isAuthPage || isModal).toBeTruthy()
  40 |     }
  41 |   })
  42 | 
  43 |   test('marketplace filter changes URL params', async ({ page }) => {
  44 |     await page.goto('/marketplace')
  45 |     await expect(page.getByText(/Filters|Properties/i)).toBeVisible()
  46 | 
  47 |     const citySelect = page.locator('select').first()
  48 |     if (await citySelect.isVisible()) {
  49 |       const options = await citySelect.locator('option').all()
  50 |       if (options.length > 1) {
  51 |         await citySelect.selectOption({ index: 1 })
  52 |         await expect(page.locator('body')).toBeVisible()
  53 |       }
  54 |     }
  55 |   })
  56 | 
  57 |   test('grid/list toggle persists view mode', async ({ page }) => {
  58 |     await page.goto('/marketplace')
  59 |     const listBtn = page.getByRole('button', { name: /list view/i })
  60 |     const gridBtn = page.getByRole('button', { name: /grid view/i })
  61 | 
  62 |     if (await listBtn.isVisible()) {
  63 |       await listBtn.click()
  64 |       await expect(page.locator('body')).toBeVisible()
  65 |     } else if (await gridBtn.isVisible()) {
  66 |       await gridBtn.click()
  67 |       await expect(page.locator('body')).toBeVisible()
  68 |     }
  69 |   })
  70 | })
  71 | 
```