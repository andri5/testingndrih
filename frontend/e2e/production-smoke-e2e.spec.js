/**
 * Lightweight smoke tests against live production (no auth required).
 */

import { test, expect } from '@playwright/test'
import { probeProductionHealth, gotoWithRetry } from './helpers/productionProbe.js'

const isProductionRun = !!process.env.PLAYWRIGHT_BASE_URL
const baseURL = (process.env.PLAYWRIGHT_BASE_URL || '').replace(/\/$/, '')

test.describe('Production Smoke', () => {
  test.skip(!isProductionRun, 'Set PLAYWRIGHT_BASE_URL to run production smoke tests')

  test.describe.configure({ mode: 'serial' })

  let inMaintenance = false

  test.beforeAll(async ({ request }) => {
    const result = await probeProductionHealth(request, baseURL)
    expect(
      result.ok,
      'Production /health did not respond after extended retries (deploy or outage)'
    ).toBe(true)
    inMaintenance = result.maintenance
  })

  test('health endpoint responds', async ({ request }) => {
    const result = await probeProductionHealth(request, baseURL)
    expect(result.ok).toBe(true)
    if (result.maintenance) {
      expect(result.body.status).toBe('maintenance')
    } else {
      expect(result.body.status).toBe('ok')
    }
  })

  test.describe('browser smoke', () => {
    test.beforeEach(async ({ page }, testInfo) => {
      testInfo.skip(inMaintenance, 'Production in maintenance — browser smoke skipped')

      // Stub /health so ServerHealthMonitor does not redirect during navigation tests.
      await page.addInitScript(() => {
        const originalFetch = window.fetch.bind(window)
        window.fetch = async (input, init) => {
          const url = typeof input === 'string' ? input : input.url
          if (url.includes('/health')) {
            return new Response(JSON.stringify({ status: 'ok' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          return originalFetch(input, init)
        }
      })
    })

    test('login page loads in browser', async ({ page }) => {
      await gotoWithRetry(page, '/login')
      await expect(page.getByRole('heading', { name: 'Test Sambil Ngopi' })).toBeVisible({ timeout: 20000 })
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('unauthenticated dashboard redirects to login', async ({ page }) => {
      await gotoWithRetry(page, '/dashboard')
      await expect(page).toHaveURL(/\/login/, { timeout: 25000 })
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 })
    })
  })
})
