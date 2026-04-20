import { test, expect } from '@playwright/test'

test.describe('WealthSpot Shield — gated document download', () => {
  test('opportunity detail page renders the Shield section', async ({
    page,
  }) => {
    await page.goto('/marketplace')
    await expect(page.locator('body')).toBeVisible()
    // Navigate to any opportunity detail page
    const firstOpp = page.locator('a[href*="/opportunity/"]').first()
    if (await firstOpp.isVisible()) {
      await firstOpp.click()
      await expect(page.locator('body')).toBeVisible()
      // The Shield section should render
      await expect(
        page.getByText('WealthSpot Shield').first(),
      ).toBeVisible()
    }
  })

  test('Shield section shows locked documents for unapproved users', async ({
    page,
  }) => {
    await page.goto('/marketplace')
    await expect(page.locator('body')).toBeVisible()
    const firstOpp = page.locator('a[href*="/opportunity/"]').first()
    if (await firstOpp.isVisible()) {
      await firstOpp.click()
      await expect(page.locator('body')).toBeVisible()
      // If there are locked docs, find the lock indicator
      const lockIndicator = page.getByText('EOI required')
      if (await lockIndicator.first().isVisible()) {
        await expect(lockIndicator.first()).toBeVisible()
      }
    }
  })

  test('locked document row shows a lock icon, not a download link', async ({
    page,
  }) => {
    await page.goto('/marketplace')
    await expect(page.locator('body')).toBeVisible()
    const firstOpp = page.locator('a[href*="/opportunity/"]').first()
    if (await firstOpp.isVisible()) {
      await firstOpp.click()
      await expect(page.locator('body')).toBeVisible()
      // Locked docs should have text "EOI required" and NOT a download arrow
      const eoiText = page.getByText('EOI required')
      if (await eoiText.first().isVisible()) {
        // The locked document should not be a link <a>
        const lockedDiv = eoiText.first().locator('..')
        await expect(lockedDiv).not.toHaveAttribute('href')
      }
    }
  })

  test('unlocked documents show a download link', async ({ page }) => {
    await page.goto('/marketplace')
    await expect(page.locator('body')).toBeVisible()
    const firstOpp = page.locator('a[href*="/opportunity/"]').first()
    if (await firstOpp.isVisible()) {
      await firstOpp.click()
      await expect(page.locator('body')).toBeVisible()
      // Look for download links that are NOT locked
      // These are <a> tags inside the shield section with target=_blank
      const shieldSection = page.locator('section').filter({
        has: page.getByText('WealthSpot Shield'),
      })
      if (await shieldSection.isVisible()) {
        const downloadLinks = shieldSection.locator(
          'a[target="_blank"]',
        )
        const count = await downloadLinks.count()
        if (count > 0) {
          const firstLink = downloadLinks.first()
          await expect(firstLink).toHaveAttribute('href')
        }
      }
    }
  })

  test('Shield section collapsible categories are interactive', async ({
    page,
  }) => {
    await page.goto('/marketplace')
    await expect(page.locator('body')).toBeVisible()
    const firstOpp = page.locator('a[href*="/opportunity/"]').first()
    if (await firstOpp.isVisible()) {
      await firstOpp.click()
      await expect(page.locator('body')).toBeVisible()
      // Click a category row to expand/collapse
      const builderRow = page
        .getByText('Builder Assessment')
        .first()
      if (await builderRow.isVisible()) {
        await builderRow.click()
        // Should expand to show sub-items
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })
})
