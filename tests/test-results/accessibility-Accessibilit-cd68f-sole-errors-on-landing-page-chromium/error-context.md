# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.ts >> Accessibility & Responsive >> no console errors on landing page
- Location: tests\web\e2e\accessibility.spec.ts:22:3

# Error details

```
Error: expect(received).toHaveLength(expected)

Expected length: 0
Received length: 2
Received array:  ["Failed to load resource: net::ERR_CONNECTION_RESET", "Failed to load resource: net::ERR_CONNECTION_RESET"]
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
      - generic [ref=e26]:
        - generic [ref=e30]:
          - generic [ref=e31]:
            - generic [ref=e32]:
              - img [ref=e33]
              - text: Curated access • trusted networks • strategic entry
            - heading "Private Access to Exceptional Real Asset Opportunities." [level=1] [ref=e35]
            - paragraph [ref=e36]: A refined platform for discerning investors, strategic partners, and value creators seeking curated entry into early-stage real estate opportunities and relationship-led wealth creation.
            - paragraph [ref=e37]: For those who understand that wealth is not built by chasing visibility, but by entering with clarity, conviction, and the right people around the table.
          - generic [ref=e43]:
            - paragraph [ref=e44]: Investment Journey
            - paragraph [ref=e45]:
              - text: WealthSpot
              - text: Investment Journey
            - paragraph [ref=e47]: Upload or replace the home hero image from Command & Control.
        - generic [ref=e50]:
          - generic [ref=e51]:
            - img [ref=e53]
            - generic [ref=e58]:
              - paragraph [ref=e59]: Platform Members
              - paragraph [ref=e60]: "0"
          - generic [ref=e61]:
            - img [ref=e63]
            - generic [ref=e66]:
              - paragraph [ref=e67]: Capital Deployed
              - paragraph [ref=e68]: ₹0
          - generic [ref=e69]:
            - img [ref=e71]
            - generic [ref=e74]:
              - paragraph [ref=e75]: Live Opportunities
              - paragraph [ref=e76]: "0"
          - generic [ref=e77]:
            - img [ref=e79]
            - generic [ref=e82]:
              - paragraph [ref=e83]: Markets Covered
              - paragraph [ref=e84]: "0"
          - generic [ref=e85]:
            - img [ref=e87]
            - generic [ref=e90]:
              - paragraph [ref=e91]: Verified Investors
              - paragraph [ref=e92]: "0"
      - generic [ref=e95]:
        - generic [ref=e96]:
          - paragraph [ref=e97]: Intro
          - heading "Built for those who think beyond conventional investing." [level=2] [ref=e98]
        - generic [ref=e99]:
          - paragraph [ref=e100]: WealthSpot is built for individuals who value access over noise, curation over clutter, and long-term positioning over short-term excitement.
          - paragraph [ref=e101]: At its core, WealthSpot opens access to select real estate opportunities at earlier stages of value creation, where strategic entry, intrinsic value, and disciplined participation matter most.
          - paragraph [ref=e102]: This is not a marketplace for everyone. It is a platform for serious participation, trusted relationships, and intelligent wealth-building through capital, capability, and connections.
      - generic [ref=e104]:
        - paragraph [ref=e105]: The Vaults
        - heading "Three distinct entry points into the WealthSpot ecosystem." [level=2] [ref=e106]
        - generic [ref=e107]:
          - generic [ref=e110]:
            - generic [ref=e111]:
              - generic [ref=e112]: Flagship
              - generic [ref=e113]: "01"
            - heading "Wealth Vault" [level=3] [ref=e114]
            - paragraph [ref=e115]: A premium gateway to curated real estate opportunities positioned around intrinsic value, timing, and long-term appreciation potential.
            - paragraph [ref=e116]: Designed for investors who believe disciplined entry can shape exceptional outcomes.
          - generic [ref=e119]:
            - generic [ref=e120]:
              - generic [ref=e121]: Collaborative
              - generic [ref=e122]: "02"
            - heading "Community Vault" [level=3] [ref=e123]
            - paragraph [ref=e124]: A trusted environment where co-investors, co-partners, and execution-led collaborators can align around opportunity.
            - paragraph [ref=e125]: It exists to help serious people find one another, structure participation intelligently, and move from interest to closure with confidence.
          - generic [ref=e128]:
            - generic [ref=e129]:
              - generic [ref=e130]: Coming Soon
              - generic [ref=e131]: "03"
            - heading "Safe Vault" [level=3] [ref=e132]
            - paragraph [ref=e133]: A fixed-return layer for those who want predictable income backed by real assets.
            - paragraph [ref=e134]: It is being designed for participants who prefer mortgage-backed security, structured payouts, and lower-volatility opportunities.
      - generic [ref=e136]:
        - paragraph [ref=e137]: Investor Identities
        - heading "Three ways to participate in value creation." [level=2] [ref=e138]
        - generic [ref=e139]:
          - generic [ref=e142]:
            - generic [ref=e143]:
              - heading "Money Investor" [level=3] [ref=e144]
              - generic [ref=e145]: Capital
            - paragraph [ref=e146]: Deploy capital into select opportunities with a clear investment thesis and a disciplined entry mindset.
            - paragraph [ref=e147]: Ideal for those who seek real asset exposure with strategic alignment and stronger filters.
          - generic [ref=e150]:
            - generic [ref=e151]:
              - heading "Time Investor" [level=3] [ref=e152]
              - generic [ref=e153]: Capability
            - paragraph [ref=e154]: Contribute expertise, leadership, execution, or oversight where active involvement creates real value.
            - paragraph [ref=e155]: This path recognizes that serious experience can be as meaningful as capital in the right opportunity.
          - generic [ref=e158]:
            - generic [ref=e159]:
              - heading "Network Investor" [level=3] [ref=e160]
              - generic [ref=e161]: Connections
            - paragraph [ref=e162]: Open doors through trusted relationships.
            - paragraph [ref=e163]: Whether by introducing co-investors, customers, suppliers, or strategic enablers, your network becomes a genuine form of investment.
      - generic [ref=e165]:
        - paragraph [ref=e166]: Closing CTA
        - heading "Where access, judgment, and trust align, wealth has a better place to grow." [level=2] [ref=e167]
        - paragraph [ref=e168]: WealthSpot is being created for those who prefer meaningful entry, selective opportunities, and relationships that compound beyond capital alone.
        - paragraph [ref=e170]:
          - text: For investors, partners, and contributors who take
          - text: opportunity seriously.
        - button "Request Access" [ref=e171] [cursor=pointer]:
          - text: Request Access
          - img [ref=e172]
    - contentinfo [ref=e174]:
      - generic [ref=e176]:
        - generic [ref=e177]:
          - generic [ref=e178]:
            - link "WealthSpot" [ref=e179] [cursor=pointer]:
              - /url: /
              - img [ref=e180]
              - generic [ref=e182]: WealthSpot
            - paragraph [ref=e183]: India’s trusted fractional real estate investment platform. Build generational wealth, one fraction at a time.
            - generic [ref=e184]:
              - link "hello@wealthspot.in" [ref=e185] [cursor=pointer]:
                - /url: mailto:hello@wealthspot.in
                - img [ref=e186]
                - text: hello@wealthspot.in
              - link "1800-XXX-XXXX" [ref=e189] [cursor=pointer]:
                - /url: tel:+91-1800-XXX-XXXX
                - img [ref=e190]
                - text: 1800-XXX-XXXX
              - generic [ref=e192]:
                - img [ref=e193]
                - generic [ref=e196]: Bengaluru, Karnataka, India
          - generic [ref=e197]:
            - heading "Platform" [level=3] [ref=e198]
            - list [ref=e199]:
              - listitem [ref=e200]:
                - link "How it Works" [ref=e201] [cursor=pointer]:
                  - /url: /#how-it-works
              - listitem [ref=e202]:
                - link "For Builders" [ref=e203] [cursor=pointer]:
                  - /url: /builders
              - listitem [ref=e204]:
                - link "FAQs" [ref=e205] [cursor=pointer]:
                  - /url: /faqs
              - listitem [ref=e206]:
                - link "Investment Guide" [ref=e207] [cursor=pointer]:
                  - /url: /investment-guide
          - generic [ref=e208]:
            - heading "Company" [level=3] [ref=e209]
            - list [ref=e210]:
              - listitem [ref=e211]:
                - link "About Us" [ref=e212] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e213]:
                - link "Careers" [ref=e214] [cursor=pointer]:
                  - /url: /careers
              - listitem [ref=e215]:
                - link "Contact Us" [ref=e216] [cursor=pointer]:
                  - /url: /contact
          - generic [ref=e217]:
            - heading "Legal" [level=3] [ref=e218]
            - list [ref=e219]:
              - listitem [ref=e220]:
                - link "Terms of Service" [ref=e221] [cursor=pointer]:
                  - /url: /legal/terms
              - listitem [ref=e222]:
                - link "Privacy Policy" [ref=e223] [cursor=pointer]:
                  - /url: /legal/privacy
        - generic [ref=e225]:
          - paragraph [ref=e227]: © 2026 WealthSpot Technologies Pvt. Ltd. All rights reserved.
          - generic [ref=e228]:
            - link "Twitter" [ref=e229] [cursor=pointer]:
              - /url: "#"
              - img [ref=e230]
            - link "LinkedIn" [ref=e232] [cursor=pointer]:
              - /url: "#"
              - img [ref=e233]
            - link "Instagram" [ref=e237] [cursor=pointer]:
              - /url: "#"
              - img [ref=e238]
            - link "YouTube" [ref=e241] [cursor=pointer]:
              - /url: "#"
              - img [ref=e242]
        - paragraph [ref=e246]:
          - strong [ref=e247]: "Risk Disclaimer:"
          - text: Investments in fractional real estate are subject to market risks. Past performance does not guarantee future returns. The projected IRR is an estimate and actual returns may vary. Please read all related documents carefully before investing. WealthSpot is a technology platform and does not provide financial advice.
  - button "Open Diagnostics" [ref=e248] [cursor=pointer]:
    - img [ref=e249]
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
  12 |     await expect(page.getByText('Filters')).toBeVisible()
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
> 33 |     expect(criticalErrors).toHaveLength(0)
     |                            ^ Error: expect(received).toHaveLength(expected)
  34 |   })
  35 | })
  36 | 
```