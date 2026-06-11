/**
 * Lightweight smoke tests against live production (no auth required).
 */

import { test, expect } from '@playwright/test'

const isProductionRun = !!process.env.PLAYWRIGHT_BASE_URL

test.describe('Production Smoke', () => {
  test.skip(!isProductionRun, 'Set PLAYWRIGHT_BASE_URL to run production smoke tests')

  test('login page is reachable', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Test Sambil Ngopi' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/sign in to your workspace/i)).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /^login$/i })).toBeVisible()
  })

  test('unauthenticated dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  })

  test('health endpoint responds', async ({ request }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL.replace(/\/$/, '')
    const res = await request.get(`${baseURL}/health`)
    expect(res.ok()).toBeTruthy()
  })
})
