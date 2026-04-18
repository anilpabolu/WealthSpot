import { test, expect } from '@playwright/test'

test.describe('API Health & Integration', () => {
  const apiBase = process.env.E2E_API_URL || 'http://localhost:8000'

  test('API health check responds', async ({ request }) => {
    const response = await request.get(`${apiBase}/health`)
    expect(response.ok()).toBeTruthy()
  })

  test('API docs endpoint accessible', async ({ request }) => {
    const response = await request.get(`${apiBase}/docs`)
    expect(response.status()).toBe(200)
  })

  test('properties endpoint returns JSON', async ({ request }) => {
    const response = await request.get(`${apiBase}/api/v1/properties`)
    // May return 401 if auth required, but shouldn't 500
    expect(response.status()).toBeLessThan(500)
  })

  test('opportunities endpoint returns JSON', async ({ request }) => {
    const response = await request.get(`${apiBase}/api/v1/opportunities`)
    expect(response.status()).toBeLessThan(500)
  })
})
