# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shield-marketplace.spec.ts >> WealthSpot Shield — marketplace surface >> "What is Shield Certified?" link opens the modal
- Location: tests\web\e2e\shield-marketplace.spec.ts:25:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /What is Shield Certified\?/i })

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
          - generic [ref=e14]:
            - button "Switch to light mode" [ref=e15] [cursor=pointer]:
              - img [ref=e16]
            - generic [ref=e22]:
              - button "Sign In" [ref=e23] [cursor=pointer]
              - button "Get Access to a Better Opportunity Environment" [ref=e24] [cursor=pointer]
    - main [ref=e25]:
      - generic [ref=e31]:
        - generic [ref=e32]:
          - generic [ref=e34]: Wealth Vault
          - heading "Wealth Vault" [level=1] [ref=e36]
          - paragraph [ref=e37]: Discover RERA-verified investment opportunities across India’s top cities.
          - paragraph [ref=e38]: Every listing passes through a rigorous 7-layer Shield review — from builder credibility to exit clauses — before it earns Shield Certified status.
        - generic [ref=e40]:
          - generic [ref=e41]:
            - generic [ref=e42]:
              - img [ref=e43]
              - generic [ref=e46]: Shield Certified
            - button "Learn more" [ref=e47] [cursor=pointer]:
              - text: Learn more
              - img [ref=e48]
          - generic [ref=e51]:
            - generic [ref=e52]:
              - img [ref=e55]
              - generic [ref=e68]:
                - generic [ref=e69]:
                  - img [ref=e71]
                  - generic [ref=e74]: Security Assessment
                - paragraph [ref=e75]: Sale agreement, post-dated cheque cover & MoUs with the builder
                - paragraph [ref=e76]: Binding paperwork that sits under the deal — the sale agreement, investor-protection cheques, and MoUs that codify exit and dispute handling.
                - generic [ref=e77]: Verified by WealthSpot Team
            - generic [ref=e78]:
              - generic [ref=e79]:
                - img [ref=e80]
                - text: Sale Agreement / Deeds
              - generic [ref=e83]:
                - img [ref=e84]
                - text: Cheque Security
              - generic [ref=e87]:
                - img [ref=e88]
                - text: MoUs
          - generic [ref=e91]:
            - button "View Builder Assessment" [ref=e92] [cursor=pointer]
            - button "View Legal Assessment" [ref=e93] [cursor=pointer]
            - button "View Valuation Assessment" [ref=e94] [cursor=pointer]
            - button "View Location Assessment" [ref=e95] [cursor=pointer]
            - button "View Property Assessment" [ref=e96] [cursor=pointer]
            - button "View Security Assessment" [ref=e97] [cursor=pointer]
            - button "View Exit Assessment" [ref=e98] [cursor=pointer]
      - generic [ref=e101]:
        - complementary [ref=e102]:
          - generic [ref=e103]:
            - heading "Filters" [level=3] [ref=e104]:
              - img [ref=e105]
              - text: Filters
            - generic [ref=e106]:
              - generic [ref=e107]:
                - generic [ref=e108]: City
                - button "All Cities" [ref=e110] [cursor=pointer]:
                  - generic [ref=e111]: All Cities
                  - img [ref=e112]
              - generic [ref=e114]:
                - generic [ref=e115]: Asset Type
                - button "All Types" [ref=e117] [cursor=pointer]:
                  - generic [ref=e118]: All Types
                  - img [ref=e119]
              - generic [ref=e121]:
                - generic [ref=e122]: Status
                - generic [ref=e123]:
                  - button "All" [ref=e124] [cursor=pointer]
                  - button "Upcoming" [ref=e125] [cursor=pointer]
                  - button "Live" [ref=e126] [cursor=pointer]
                  - button "Fully Funded" [ref=e127] [cursor=pointer]
                  - button "Deal Closed" [ref=e128] [cursor=pointer]
              - generic [ref=e129]:
                - generic [ref=e130]: Sort By
                - button "Newest First" [ref=e132] [cursor=pointer]:
                  - generic [ref=e133]: Newest First
                  - img [ref=e134]
              - button "Reset All Filters" [ref=e136] [cursor=pointer]
        - generic [ref=e138]:
          - paragraph [ref=e139]: Loading...
          - generic [ref=e140]:
            - button "Grid view" [ref=e141] [cursor=pointer]:
              - img [ref=e142]
            - button "List view" [ref=e144] [cursor=pointer]:
              - img [ref=e145]
    - contentinfo [ref=e207]:
      - generic [ref=e209]:
        - generic [ref=e210]:
          - generic [ref=e211]:
            - link "WealthSpot" [ref=e212] [cursor=pointer]:
              - /url: /
              - img [ref=e213]
              - generic [ref=e215]: WealthSpot
            - paragraph [ref=e216]: India’s trusted fractional real estate investment platform. Build generational wealth, one fraction at a time.
            - generic [ref=e217]:
              - link "hello@wealthspot.in" [ref=e218] [cursor=pointer]:
                - /url: mailto:hello@wealthspot.in
                - img [ref=e219]
                - text: hello@wealthspot.in
              - link "1800-XXX-XXXX" [ref=e222] [cursor=pointer]:
                - /url: tel:+91-1800-XXX-XXXX
                - img [ref=e223]
                - text: 1800-XXX-XXXX
              - generic [ref=e225]:
                - img [ref=e226]
                - generic [ref=e229]: Bengaluru, Karnataka, India
          - generic [ref=e230]:
            - heading "Platform" [level=3] [ref=e231]
            - list [ref=e232]:
              - listitem [ref=e233]:
                - link "How it Works" [ref=e234] [cursor=pointer]:
                  - /url: /#how-it-works
              - listitem [ref=e235]:
                - link "For Builders" [ref=e236] [cursor=pointer]:
                  - /url: /builders
              - listitem [ref=e237]:
                - link "FAQs" [ref=e238] [cursor=pointer]:
                  - /url: /faqs
              - listitem [ref=e239]:
                - link "Investment Guide" [ref=e240] [cursor=pointer]:
                  - /url: /investment-guide
          - generic [ref=e241]:
            - heading "Company" [level=3] [ref=e242]
            - list [ref=e243]:
              - listitem [ref=e244]:
                - link "About Us" [ref=e245] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e246]:
                - link "Careers" [ref=e247] [cursor=pointer]:
                  - /url: /careers
              - listitem [ref=e248]:
                - link "Contact Us" [ref=e249] [cursor=pointer]:
                  - /url: /contact
          - generic [ref=e250]:
            - heading "Legal" [level=3] [ref=e251]
            - list [ref=e252]:
              - listitem [ref=e253]:
                - link "Terms of Service" [ref=e254] [cursor=pointer]:
                  - /url: /legal/terms
              - listitem [ref=e255]:
                - link "Privacy Policy" [ref=e256] [cursor=pointer]:
                  - /url: /legal/privacy
        - generic [ref=e258]:
          - paragraph [ref=e260]: © 2026 WealthSpot Technologies Pvt. Ltd. All rights reserved.
          - generic [ref=e261]:
            - link "Twitter" [ref=e262] [cursor=pointer]:
              - /url: "#"
              - img [ref=e263]
            - link "LinkedIn" [ref=e265] [cursor=pointer]:
              - /url: "#"
              - img [ref=e266]
            - link "Instagram" [ref=e270] [cursor=pointer]:
              - /url: "#"
              - img [ref=e271]
            - link "YouTube" [ref=e274] [cursor=pointer]:
              - /url: "#"
              - img [ref=e275]
        - paragraph [ref=e279]:
          - strong [ref=e280]: "Risk Disclaimer:"
          - text: Investments in fractional real estate are subject to market risks. Past performance does not guarantee future returns. The projected IRR is an estimate and actual returns may vary. Please read all related documents carefully before investing. WealthSpot is a technology platform and does not provide financial advice.
  - button "Open Diagnostics" [ref=e281] [cursor=pointer]:
    - img [ref=e282]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('WealthSpot Shield — marketplace surface', () => {
  4  |   test('hero strip is visible on the marketplace page', async ({ page }) => {
  5  |     await page.goto('/marketplace')
  6  |     // The strip carries a "WealthSpot Shield" wordmark
  7  |     await expect(
  8  |       page.getByText('WealthSpot Shield').first(),
  9  |     ).toBeVisible()
  10 |   })
  11 | 
  12 |   test('clicking a Shield tile opens the info modal', async ({ page }) => {
  13 |     await page.goto('/marketplace')
  14 |     // Tiles render the short category name — "Builder" is the first.
  15 |     await page.getByRole('button', { name: /Builder/i }).first().click()
  16 |     await expect(
  17 |       page.getByText(/7 layers between you/i),
  18 |     ).toBeVisible()
  19 |     // Modal lists every layer
  20 |     await expect(page.getByText('Builder Assessment')).toBeVisible()
  21 |     await expect(page.getByText('Legal Assessment')).toBeVisible()
  22 |     await expect(page.getByText('Exit Assessment')).toBeVisible()
  23 |   })
  24 | 
  25 |   test('"What is Shield Certified?" link opens the modal', async ({ page }) => {
  26 |     await page.goto('/marketplace')
  27 |     await page
  28 |       .getByRole('button', { name: /What is Shield Certified\?/i })
> 29 |       .click()
     |        ^ Error: locator.click: Test timeout of 30000ms exceeded.
  30 |     await expect(
  31 |       page.getByText(/7 layers between you/i),
  32 |     ).toBeVisible()
  33 |   })
  34 | 
  35 |   test('modal closes via the X button', async ({ page }) => {
  36 |     await page.goto('/marketplace')
  37 |     await page
  38 |       .getByRole('button', { name: /What is Shield Certified\?/i })
  39 |       .click()
  40 |     await page.getByRole('button', { name: 'Close' }).click()
  41 |     await expect(
  42 |       page.getByText(/7 layers between you/i),
  43 |     ).not.toBeVisible()
  44 |   })
  45 | })
  46 | 
```