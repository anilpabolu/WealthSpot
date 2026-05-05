/**
 * API Contract Tests — Mobile
 *
 * Mirrors the web contract tests. Validates that mobile hooks use the same
 * endpoint strings as the web hooks, ensuring feature parity at the API layer.
 *
 * Strategy: read hook source files as raw strings and assert endpoint paths.
 * No network calls, no React Native rendering.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Helper ────────────────────────────────────────────────────────────────────

function readHookSource(relativePath: string): string {
  const abs = resolve(__dirname, '../../../../apps/mobile/src', relativePath)
  return readFileSync(abs, 'utf-8')
}

// ── Properties endpoints ──────────────────────────────────────────────────────

describe('API contract: /properties endpoints (mobile)', () => {
  let src: string

  beforeAll(() => {
    src = readHookSource('hooks/useProperties.ts')
  })

  it('fetches property list at /properties', () => {
    expect(src).toContain("'/properties'")
  })

  it('fetches individual property at /properties/${slug}', () => {
    expect(src).toContain('`/properties/${slug}`')
  })

  it('fetches cities at /properties/cities', () => {
    expect(src).toContain("'/properties/cities'")
  })

  it('fetches autocomplete at /properties/autocomplete', () => {
    expect(src).toContain("'/properties/autocomplete'")
  })
})

// ── Portfolio endpoints ───────────────────────────────────────────────────────

describe('API contract: /portfolio endpoints (mobile)', () => {
  let src: string

  beforeAll(() => {
    src = readHookSource('hooks/usePortfolio.ts')
  })

  it('fetches summary at /portfolio/summary', () => {
    expect(src).toContain("'/portfolio/summary'")
  })

  it('fetches properties at /portfolio/properties', () => {
    expect(src).toContain("'/portfolio/properties'")
  })

  it('fetches transactions at /portfolio/transactions', () => {
    expect(src).toContain("'/portfolio/transactions'")
  })

  it('fetches vault-wise data at /portfolio/vault-wise', () => {
    expect(src).toContain("'/portfolio/vault-wise'")
  })
})

// ── Referrals endpoints ───────────────────────────────────────────────────────

describe('API contract: /referrals endpoints (mobile)', () => {
  let src: string

  beforeAll(() => {
    src = readHookSource('hooks/useReferrals.ts')
  })

  it('fetches referral stats at /referrals/stats', () => {
    expect(src).toContain("'/referrals/stats'")
  })

  it('fetches referral history at /referrals/history', () => {
    expect(src).toContain("'/referrals/history'")
  })
})

// ── Cross-platform parity ─────────────────────────────────────────────────────

describe('API contract: cross-platform endpoint parity', () => {
  const endpoints = [
    "'/properties'",
    "'/properties/cities'",
    "'/properties/autocomplete'",
    "'/portfolio/summary'",
    "'/portfolio/properties'",
    "'/portfolio/transactions'",
    "'/portfolio/vault-wise'",
    "'/referrals/stats'",
    "'/referrals/history'",
  ]

  let webPropertySrc: string
  let webPortfolioSrc: string
  let webReferralSrc: string
  let mobilePropertySrc: string
  let mobilePortfolioSrc: string
  let mobileReferralSrc: string

  beforeAll(() => {
    const webRoot = resolve(__dirname, '../../../../apps/web/src/hooks')
    const mobileRoot = resolve(__dirname, '../../../../apps/mobile/src/hooks')

    webPropertySrc = readFileSync(resolve(webRoot, 'useProperties.ts'), 'utf-8')
    webPortfolioSrc = readFileSync(resolve(webRoot, 'usePortfolio.ts'), 'utf-8')
    webReferralSrc = readFileSync(resolve(webRoot, 'useReferrals.ts'), 'utf-8')

    mobilePropertySrc = readFileSync(resolve(mobileRoot, 'useProperties.ts'), 'utf-8')
    mobilePortfolioSrc = readFileSync(resolve(mobileRoot, 'usePortfolio.ts'), 'utf-8')
    mobileReferralSrc = readFileSync(resolve(mobileRoot, 'useReferrals.ts'), 'utf-8')
  })

  it('both platforms call /properties list endpoint', () => {
    expect(webPropertySrc).toContain("'/properties'")
    expect(mobilePropertySrc).toContain("'/properties'")
  })

  it('both platforms call /properties/cities', () => {
    expect(webPropertySrc).toContain("'/properties/cities'")
    expect(mobilePropertySrc).toContain("'/properties/cities'")
  })

  it('both platforms call /portfolio/summary', () => {
    expect(webPortfolioSrc).toContain("'/portfolio/summary'")
    expect(mobilePortfolioSrc).toContain("'/portfolio/summary'")
  })

  it('both platforms call /portfolio/vault-wise', () => {
    expect(webPortfolioSrc).toContain("'/portfolio/vault-wise'")
    expect(mobilePortfolioSrc).toContain("'/portfolio/vault-wise'")
  })

  it('both platforms call /referrals/stats', () => {
    expect(webReferralSrc).toContain("'/referrals/stats'")
    expect(mobileReferralSrc).toContain("'/referrals/stats'")
  })

  it('both platforms call /referrals/history', () => {
    expect(webReferralSrc).toContain("'/referrals/history'")
    expect(mobileReferralSrc).toContain("'/referrals/history'")
  })
})

// ── API_BASE_URL configuration ────────────────────────────────────────────────

describe('API contract: base URL configuration (mobile)', () => {
  let src: string

  beforeAll(() => {
    src = readHookSource('lib/constants.ts')
  })

  it('default API_BASE_URL includes /api/v1', () => {
    expect(src).toContain('/api/v1')
  })

  it('exposes API_BASE_URL as a named export', () => {
    expect(src).toContain('export const API_BASE_URL')
  })
})
