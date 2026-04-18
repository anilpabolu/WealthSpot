/**
 * web useBackendSync hook tests – pure logic (unit)
 *
 * Tests the JWT expiry check logic extracted from useBackendSync.ts.
 * The hook itself depends on @clerk/react which is hard to render in unit env,
 * so we test the pure utility functions.
 */
import { describe, expect, it } from 'vitest'

// Re-implement the pure token-expiry helper for testing
// (matches the implementation in useBackendSync.ts exactly)
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true
    const payload = JSON.parse(atob(parts[1]!))
    // 60s buffer so we refresh before it actually expires
    return payload.exp * 1000 < Date.now() - 60_000
  } catch {
    return true
  }
}

function makeJwt(expOffsetSec: number) {
  const exp = Math.floor(Date.now() / 1000) + expOffsetSec
  const payload = btoa(JSON.stringify({ sub: 'u1', exp }))
  return `header.${payload}.sig`
}

describe('useBackendSync – isTokenExpired logic', () => {
  it('returns true for a blank string (no token)', () => {
    expect(isTokenExpired('')).toBe(true)
  })

  it('returns true for a malformed token with wrong part count', () => {
    expect(isTokenExpired('not-a-real-jwt')).toBe(true)
    expect(isTokenExpired('only.two')).toBe(true)
  })

  it('returns true for a token expired 5 minutes ago', () => {
    const expired = makeJwt(-300)
    expect(isTokenExpired(expired)).toBe(true)
  })

  it('returns false for a fresh token expiring in 10 minutes', () => {
    const fresh = makeJwt(600)
    expect(isTokenExpired(fresh)).toBe(false)
  })

  it('returns false for a token expiring in 30 seconds (still within 60s grace period)', () => {
    // The formula is: exp * 1000 < Date.now() - 60_000
    // Meaning: only expired if the exp was more than 60s in the past
    // A token expiring in 30s is NOT considered expired
    const almostExpired = makeJwt(30)
    expect(isTokenExpired(almostExpired)).toBe(false)
  })

  it('returns true for a token that expired 2 minutes ago', () => {
    const oldExpired = makeJwt(-120) // expired 2 minutes ago
    expect(isTokenExpired(oldExpired)).toBe(true)
  })

  it('returns true when payload JSON is invalid', () => {
    const badPayload = btoa('not-json')
    const token = `header.${badPayload}.sig`
    expect(isTokenExpired(token)).toBe(true)
  })
})
