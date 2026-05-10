# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.ts >> Accessibility & Responsive >> marketplace page has accessible filter controls
- Location: tests\web\e2e\accessibility.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Filters')
Expected: visible
Error: strict mode violation: getByText('Filters') resolved to 2 elements:
    1) <h3 class="font-semibold text-theme-primary mb-4 flex items-center gap-2">…</h3> aka getByRole('heading', { name: 'Filters' })
    2) <button class="btn-ghost text-sm w-full">Reset All Filters</button> aka getByRole('button', { name: 'Reset All Filters' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Filters')

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
              - generic [ref=e72]:
                - generic [ref=e73]:
                  - img [ref=e75]
                  - generic [ref=e78]: Builder Assessment
                - paragraph [ref=e79]: Grade, tenure, cashflows & team capability of the builder
                - paragraph [ref=e80]: We grade every builder on delivery history, balance-sheet health, and the people behind the project before a single rupee goes on the platform.
                - generic [ref=e81]: Verified by WealthSpot Team
            - generic [ref=e82]:
              - generic [ref=e83]:
                - img [ref=e84]
                - text: Category Grade
              - generic [ref=e87]:
                - img [ref=e88]
                - text: Tenure & Sqft Delivered
              - generic [ref=e91]:
                - img [ref=e92]
                - text: Proprietor Profile
              - generic [ref=e95]:
                - img [ref=e96]
                - text: Cash Flows
              - generic [ref=e99]:
                - img [ref=e100]
                - text: Team Capabilities
          - generic [ref=e103]:
            - button "View Builder Assessment" [ref=e104] [cursor=pointer]
            - button "View Legal Assessment" [ref=e105] [cursor=pointer]
            - button "View Valuation Assessment" [ref=e106] [cursor=pointer]
            - button "View Location Assessment" [ref=e107] [cursor=pointer]
            - button "View Property Assessment" [ref=e108] [cursor=pointer]
            - button "View Security Assessment" [ref=e109] [cursor=pointer]
            - button "View Exit Assessment" [ref=e110] [cursor=pointer]
      - generic [ref=e113]:
        - complementary [ref=e114]:
          - generic [ref=e115]:
            - heading "Filters" [level=3] [ref=e116]:
              - img [ref=e117]
              - text: Filters
            - generic [ref=e118]:
              - generic [ref=e119]:
                - generic [ref=e120]: City
                - button "All Cities" [ref=e122] [cursor=pointer]:
                  - generic [ref=e123]: All Cities
                  - img [ref=e124]
              - generic [ref=e126]:
                - generic [ref=e127]: Asset Type
                - button "All Types" [ref=e129] [cursor=pointer]:
                  - generic [ref=e130]: All Types
                  - img [ref=e131]
              - generic [ref=e133]:
                - generic [ref=e134]: Status
                - generic [ref=e135]:
                  - button "All" [ref=e136] [cursor=pointer]
                  - button "Upcoming" [ref=e137] [cursor=pointer]
                  - button "Live" [ref=e138] [cursor=pointer]
                  - button "Fully Funded" [ref=e139] [cursor=pointer]
                  - button "Deal Closed" [ref=e140] [cursor=pointer]
              - generic [ref=e141]:
                - generic [ref=e142]: Sort By
                - button "Newest First" [ref=e144] [cursor=pointer]:
                  - generic [ref=e145]: Newest First
                  - img [ref=e146]
              - button "Reset All Filters" [ref=e148] [cursor=pointer]
        - generic [ref=e150]:
          - paragraph [ref=e151]: Loading...
          - generic [ref=e152]:
            - button "Grid view" [ref=e153] [cursor=pointer]:
              - img [ref=e154]
            - button "List view" [ref=e156] [cursor=pointer]:
              - img [ref=e157]
    - contentinfo [ref=e219]:
      - generic [ref=e221]:
        - generic [ref=e222]:
          - generic [ref=e223]:
            - link "WealthSpot" [ref=e224] [cursor=pointer]:
              - /url: /
              - img [ref=e225]
              - generic [ref=e227]: WealthSpot
            - paragraph [ref=e228]: India’s trusted fractional real estate investment platform. Build generational wealth, one fraction at a time.
            - generic [ref=e229]:
              - link "hello@wealthspot.in" [ref=e230] [cursor=pointer]:
                - /url: mailto:hello@wealthspot.in
                - img [ref=e231]
                - text: hello@wealthspot.in
              - link "1800-XXX-XXXX" [ref=e234] [cursor=pointer]:
                - /url: tel:+91-1800-XXX-XXXX
                - img [ref=e235]
                - text: 1800-XXX-XXXX
              - generic [ref=e237]:
                - img [ref=e238]
                - generic [ref=e241]: Bengaluru, Karnataka, India
          - generic [ref=e242]:
            - heading "Platform" [level=3] [ref=e243]
            - list [ref=e244]:
              - listitem [ref=e245]:
                - link "How it Works" [ref=e246] [cursor=pointer]:
                  - /url: /#how-it-works
              - listitem [ref=e247]:
                - link "For Builders" [ref=e248] [cursor=pointer]:
                  - /url: /builders
              - listitem [ref=e249]:
                - link "FAQs" [ref=e250] [cursor=pointer]:
                  - /url: /faqs
              - listitem [ref=e251]:
                - link "Investment Guide" [ref=e252] [cursor=pointer]:
                  - /url: /investment-guide
          - generic [ref=e253]:
            - heading "Company" [level=3] [ref=e254]
            - list [ref=e255]:
              - listitem [ref=e256]:
                - link "About Us" [ref=e257] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e258]:
                - link "Careers" [ref=e259] [cursor=pointer]:
                  - /url: /careers
              - listitem [ref=e260]:
                - link "Contact Us" [ref=e261] [cursor=pointer]:
                  - /url: /contact
          - generic [ref=e262]:
            - heading "Legal" [level=3] [ref=e263]
            - list [ref=e264]:
              - listitem [ref=e265]:
                - link "Terms of Service" [ref=e266] [cursor=pointer]:
                  - /url: /legal/terms
              - listitem [ref=e267]:
                - link "Privacy Policy" [ref=e268] [cursor=pointer]:
                  - /url: /legal/privacy
        - generic [ref=e270]:
          - paragraph [ref=e272]: © 2026 WealthSpot Technologies Pvt. Ltd. All rights reserved.
          - generic [ref=e273]:
            - link "Twitter" [ref=e274] [cursor=pointer]:
              - /url: "#"
              - img [ref=e275]
            - link "LinkedIn" [ref=e277] [cursor=pointer]:
              - /url: "#"
              - img [ref=e278]
            - link "Instagram" [ref=e282] [cursor=pointer]:
              - /url: "#"
              - img [ref=e283]
            - link "YouTube" [ref=e286] [cursor=pointer]:
              - /url: "#"
              - img [ref=e287]
        - paragraph [ref=e291]:
          - strong [ref=e292]: "Risk Disclaimer:"
          - text: Investments in fractional real estate are subject to market risks. Past performance does not guarantee future returns. The projected IRR is an estimate and actual returns may vary. Please read all related documents carefully before investing. WealthSpot is a technology platform and does not provide financial advice.
  - button "Open Diagnostics" [ref=e293] [cursor=pointer]:
    - img [ref=e294]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test.describe('Accessibility & Responsive', () => {
  4  |   test('landing page has proper heading hierarchy', async ({ page }) => {
  5  |     await page.goto('/')
  6  |     const h1 = page.locator('h1')
  7  |     await expect(h1.first()).toBeVisible()
  8  |   })
  9  | 
  10 |   test('marketplace page has accessible filter controls', async ({ page }) => {
  11 |     await page.goto('/marketplace')
> 12 |     await expect(page.getByText('Filters')).toBeVisible()
     |                                             ^ Error: expect(locator).toBeVisible() failed
  13 |   })
  14 | 
  15 |   test('mobile viewport shows hamburger menu or filter button', async ({ page }) => {
  16 |     await page.setViewportSize({ width: 375, height: 667 })
  17 |     await page.goto('/marketplace')
  18 |     // Mobile filter button should be visible
  19 |     await expect(page.locator('body')).toBeVisible()
  20 |   })
  21 | 
  22 |   test('no console errors on landing page', async ({ page }) => {
  23 |     const errors: string[] = []
  24 |     page.on('console', (msg) => {
  25 |       if (msg.type() === 'error') errors.push(msg.text())
  26 |     })
  27 |     await page.goto('/')
  28 |     await page.waitForTimeout(2000)
  29 |     // Filter out known React warnings and Clerk auth errors (expected in non-auth env)
  30 |     const criticalErrors = errors.filter(
  31 |       (e) => !e.includes('React') && !e.includes('Clerk') && !e.includes('Failed to fetch') && !e.includes('ERR_CONNECTION_REFUSED'),
  32 |     )
  33 |     expect(criticalErrors).toHaveLength(0)
  34 |   })
  35 | })
  36 | 
```