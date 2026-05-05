/**
 * API Contract Tests — Web
 *
 * These tests validate that the endpoint strings used by web hooks match the
 * expected API contract. They are static (no network) but serve as a regression
 * guard: if a hook starts calling a wrong endpoint, a test here will fail.
 *
 * Strategy: import the source hook file as a module, then search its source
 * string for the exact endpoint paths we expect. This avoids runtime execution
 * while still catching accidental endpoint renames.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Helper ────────────────────────────────────────────────────────────────────

/** Read a hook file's raw source so we can assert endpoint strings. */
function readHookSource(relativePath: string): string {
  const abs = resolve(__dirname, '../../../../apps/web/src', relativePath)
  return readFileSync(abs, 'utf-8')
}

// ── Properties endpoints ──────────────────────────────────────────────────────

describe('API contract: /properties endpoints (web)', () => {
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

  it('fetches builder profile at /properties/builders/${builderId}', () => {
    expect(src).toContain('`/properties/builders/${builderId}`')
  })
})

// ── Portfolio endpoints ───────────────────────────────────────────────────────

describe('API contract: /portfolio endpoints (web)', () => {
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

  it('fetches holdings at /portfolio/holdings', () => {
    expect(src).toContain("'/portfolio/holdings'")
  })
})

// ── Referrals endpoints ───────────────────────────────────────────────────────

describe('API contract: /referrals endpoints (web)', () => {
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

// ── KYC & Bank endpoints ──────────────────────────────────────────────────────

describe('API contract: /kyc and /bank endpoints (web)', () => {
  let src: string

  beforeAll(() => {
    src = readHookSource('hooks/useKycBank.ts')
  })

  it('fetches KYC status at /kyc/status', () => {
    expect(src).toContain("'/kyc/status'")
  })

  it('fetches KYC details at /kyc/details', () => {
    expect(src).toContain("'/kyc/details'")
  })

  it('fetches KYC documents at /kyc/documents', () => {
    expect(src).toContain("'/kyc/documents'")
  })

  it('submits KYC for review at /kyc/submit-for-review', () => {
    expect(src).toContain("'/kyc/submit-for-review'")
  })

  it('fetches bank accounts at /bank', () => {
    expect(src).toContain("'/bank'")
  })
})

// ── API_BASE_URL includes /api/v1 ─────────────────────────────────────────────

describe('API contract: base URL configuration (web)', () => {
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
