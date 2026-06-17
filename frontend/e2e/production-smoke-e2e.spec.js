/**
 * Lightweight smoke tests against live production (no auth required).
 */

import { test, expect } from '@playwright/test'

const isProductionRun = !!process.env.PLAYWRIGHT_BASE_URL
const baseURL = (process.env.PLAYWRIGHT_BASE_URL || '').replace(/\/$/, '')

test.describe('Production Smoke', () => {
  test.skip(!isProductionRun, 'Set PLAYWRIGHT_BASE_URL to run production smoke tests')

  test.describe.configure({ mode: 'serial' })

  // Stub /health in the browser so client-side ServerHealthMonitor (any deployed version)
  // does not redirect to /maintenance during smoke navigation tests.
  test.beforeEach(async ({ page }) => {
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

  test('health endpoint responds', async ({ request }) => {
    const res = await request.get(`${baseURL}/health`, { timeout: 20000 })
    expect(res.ok() || res.status() === 503).toBeTruthy()
    const body = await res.json()
    expect(['ok', 'maintenance']).toContain(body.status)
  })

  test('login page loads in browser', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await expect(page.getByRole('heading', { name: 'Test Sambil Ngopi' })).toBeVisible({ timeout: 20000 })
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('unauthenticated dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await expect(page).toHaveURL(/\/login/, { timeout: 25000 })
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 15000 })
  })
})
