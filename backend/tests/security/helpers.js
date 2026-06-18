/**
 * Shared auth for security integration tests (live API on :5001).
 * Captcha bypass token only works when NODE_ENV !== production.
 */

import fetch from 'node-fetch'

export const BASE_URL = process.env.SECURITY_TEST_API_URL || 'http://localhost:5001/api'
export const TEST_USER_EMAIL = process.env.SECURITY_TEST_EMAIL || 'admin@testingndrih.local'
export const TEST_USER_PASSWORD = process.env.SECURITY_TEST_PASSWORD || 'AdminPass123!'
const CAPTCHA_BYPASS = 'security-test-bypass'

export function scenarioPayload(overrides = {}) {
  return {
    name: `Security test ${Date.now()}`,
    description: 'Security test scenario',
    url: 'https://example.com',
    ...overrides,
  }
}

let cachedAuth = null

export async function loginForSecurityTests() {
  if (global.__SECURITY_TEST_AUTH__?.token) {
    return global.__SECURITY_TEST_AUTH__
  }
  if (cachedAuth?.token) {
    return cachedAuth
  }

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      captchaToken: CAPTCHA_BYPASS,
    }),
  })

  let data = {}
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok || !data.token) {
    throw new Error(
      [
        `Security test login failed (HTTP ${response.status}): ${data.message || 'no token'}`,
        'Checklist:',
        '  1. Backend running: npm run dev (port 5001)',
        '  2. Seed user: $env:SEED_EMAIL="admin@testingndrih.local"; $env:SEED_PASSWORD="AdminPass123!"; npm run db:seed',
      ].join('\n')
    )
  }

  cachedAuth = {
    token: data.token,
    userId: data.user?.id ?? data.userId ?? null,
    user: data.user,
  }
  global.__SECURITY_TEST_AUTH__ = cachedAuth
  return cachedAuth
}
