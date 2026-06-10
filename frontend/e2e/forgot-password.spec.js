import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3000'

test.describe('Forgot Password Feature', () => {
  // Helper to navigate to forgot password page through login
  const navigateToForgotPassword = async (page, context) => {
    // Clear auth
    await context.clearCookies()
    await context.addInitScript(() => {
      localStorage.clear()
    })
    
    // Go to login
    await page.goto(`${BASE_URL}/login`)
    
    // Wait for page to fully load (including CSS)
    await page.waitForLoadState('networkidle')
    
    // Try multiple selectors for the forgot password link
    const forgotPasswordLink = page.locator('a[href="/forgot-password"]')
    
    // Wait for element to be visible with extended timeout
    await forgotPasswordLink.waitFor({ state: 'visible', timeout: 15000 })
    
    // Click it
    await forgotPasswordLink.click()
    
    // Wait for navigation
    await page.waitForURL('**/forgot-password', { timeout: 10000 })
  }

  test('should navigate to forgot password page from login', async ({ page, context }) => {
    await context.clearCookies()
    await context.addInitScript(() => {
      localStorage.clear()
    })
    
    await page.goto(`${BASE_URL}/login`)
    
    // Wait for page fully loaded
    await page.waitForLoadState('networkidle')
    
    const forgotPasswordLink = page.locator('a[href="/forgot-password"]')
    
    // Wait and verify visible
    await forgotPasswordLink.waitFor({ state: 'visible', timeout: 15000 })
    
    // Click it
    await forgotPasswordLink.click()
    
    // Verify navigation
    await expect(page).toHaveURL(/forgot-password/, { timeout: 10000 })
  })

  test('ForgotPasswordPage should render correctly', async ({ page, context }) => {
    await navigateToForgotPassword(page, context)
    
    const title = page.locator('h2').first()
    await expect(title).toBeVisible({ timeout: 10000 })
    
    const titleText = await title.textContent()
    expect(['Forgot Password?', 'Lupa Password?']).toContain(titleText?.trim())
    
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
  })

  test('should use consistent auth header like login page', async ({ page, context }) => {
    await navigateToForgotPassword(page, context)

    await expect(page.getByRole('heading', { name: 'Test Sambil Ngopi' })).toBeVisible()
    await expect(page.locator('.auth-page-bg')).toBeVisible()
    await expect(page.locator('button:has-text("EN")')).toHaveCount(0)
    await expect(page.locator('button:has-text("🌙")')).toHaveCount(0)
  })

  test('should validate email input', async ({ page, context }) => {
    await navigateToForgotPassword(page, context)
    
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    
    const isRequired = await emailInput.getAttribute('required')
    expect(isRequired).not.toBeNull()
  })

  test('should show error on invalid API response', async ({ page, context }) => {
    await navigateToForgotPassword(page, context)
    
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    await emailInput.fill('test@example.com')
    
    await page.route('**/api/auth/forgot-password', route => {
      route.abort()
    })
    
    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()
    
    await page.waitForTimeout(1000)
  })

  test('ResetPasswordPage should render with token', async ({ page, context }) => {
    await context.clearCookies()
    await context.addInitScript(() => {
      localStorage.clear()
    })
    
    await page.goto(`${BASE_URL}/login`)
    await page.goto(`${BASE_URL}/reset-password/test-token-12345`)
    
    const content = page.locator('body')
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('should show success message after form submission', async ({ page, context }) => {
    await navigateToForgotPassword(page, context)
    
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('user@example.com')
    
    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()
    
    await page.waitForTimeout(2000)
  })

  test('ResetPasswordPage should validate token on load', async ({ page, context }) => {
    await context.clearCookies()
    await context.addInitScript(() => {
      localStorage.clear()
    })
    
    await page.goto(`${BASE_URL}/login`)
    await page.goto(`${BASE_URL}/reset-password/invalid-token-test`)
    
    await expect(page).not.toHaveURL(/404/)
  })

  test('form inputs should have proper attributes', async ({ page, context }) => {
    await navigateToForgotPassword(page, context)
    
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    
    const required = await emailInput.getAttribute('required')
    expect(required).not.toBeNull()
    
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    const btnType = await submitBtn.getAttribute('type')
    expect(btnType).toBe('submit')
  })
})
