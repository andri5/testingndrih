/**
 * Auth E2E Tests - Phase 2.3
 * Tests authentication workflows through the UI
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'
const API_URL = 'http://localhost:5001/api'

test.describe('Auth E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
  })

  test('should register new user', async ({ page }) => {
    // Navigate to register page or click register link
    const registerLink = page.locator('a:has-text("Register")')
    if (await registerLink.count() > 0) {
      await registerLink.click()
    } else {
      await page.goto(`${BASE_URL}/register`)
    }

    // Fill registration form
    const uniqueEmail = `user-${Date.now()}@testingndrih.local`
    await page.fill('input[type="email"]', uniqueEmail)
    await page.fill('input[type="password"]', 'TestPass123!@')
    await page.fill('input[name="name"]', 'E2E Test User')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard or success message
    await page.waitForURL(/\/(dashboard|home|chains)/)
    expect(page.url()).toContain('chains')
  })

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'AdminPass123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL(/\/(dashboard|home|chains)/, { timeout: 5000 })
    expect(page.url()).toContain('chains')
  })

  test('should show error on invalid credentials', async ({ page }) => {
    // Fill login form with wrong password
    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'WrongPassword123')

    // Submit form
    await page.click('button[type="submit"]')

    // Check for error message
    const errorMsg = page.locator('text=/invalid|incorrect|failed/i')
    await errorMsg.waitFor({ state: 'visible', timeout: 5000 })
    expect(await errorMsg.isVisible()).toBe(true)
  })

  test('should show error on empty fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.click('button[type="submit"]')

    // Check for validation messages
    const validationMsg = page.locator('text=/required|empty/i')
    await expect(validationMsg).toBeVisible()
  })

  test('should show error on invalid email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'not-an-email')
    await page.fill('input[type="password"]', 'TestPass123!@')
    await page.click('button[type="submit"]')

    const errorMsg = page.locator('text=/invalid|email/i')
    await expect(errorMsg).toBeVisible()
  })

  test('should allow password reset request', async ({ page }) => {
    const forgotLink = page.locator('a:has-text("Forgot Password")')
    if (await forgotLink.count() > 0) {
      await forgotLink.click()
      await page.waitForURL(/forgot-password/)

      await page.fill('input[type="email"]', 'admin@testingndrih.local')
      await page.click('button[type="submit"]')

      const successMsg = page.locator('text=/check your email|sent/i')
      await expect(successMsg).toBeVisible()
    }
  })

  test('should persist login session', async ({ page, context }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/chains/)

    // Navigate away and back
    await page.goto(`${BASE_URL}/scheduler`)
    expect(page.url()).toContain('scheduler')

    // Should still be logged in
    const logoutBtn = page.locator('button:has-text("Logout")')
    await expect(logoutBtn).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/chains/)

    // Click logout
    const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout")')
    await logoutBtn.click()

    // Should redirect to login
    await page.waitForURL(/login/)
    expect(page.url()).toContain('login')
  })

  test('should prevent access to protected pages without login', async ({ page }) => {
    // Try to access chains page without logging in
    await page.goto(`${BASE_URL}/chains`)

    // Should redirect to login
    await page.waitForURL(/login/, { timeout: 5000 })
    expect(page.url()).toContain('login')
  })

  test('should display user profile after login', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/chains/)

    // Check for user menu or profile info
    const userMenu = page.locator('text=admin@testingndrih.local, [data-testid="user-menu"]')
    await expect(userMenu).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true)

    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')

    // Should show error message
    const errorMsg = page.locator('text=/network|connection|offline/i')
    await expect(errorMsg).toBeVisible({ timeout: 5000 })

    // Restore connection
    await page.context().setOffline(false)
  })
})
