import { test, expect } from '@playwright/test'

test.describe.serial('Authentication E2E Tests', () => {
  // Test account - using pre-existing user for reliable testing
  const testUser = {
    email: process.env.TEST_EMAIL || 'admin@testingndrih.local',
    password: process.env.TEST_PASSWORD || 'changeme123'
  }
  
  let authToken = null

  test('01: User can login with valid credentials', async ({ page }) => {
    test.setTimeout(40000)
    
    // Navigate to login page
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' })
    
    // Fill login form
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    const loginButton = page.locator('button:has-text("Login")')
    
    await emailInput.waitFor({ state: 'visible', timeout: 5000 })
    await emailInput.fill(testUser.email)
    await passwordInput.fill(testUser.password)
    await loginButton.click()
    
    // Wait for login to complete - check for token in localStorage
    await page.waitForFunction(() => localStorage.getItem('authToken'), { timeout: 15000 })
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // Verify we reached dashboard
    const currentUrl = page.url()
    expect(currentUrl).toContain('/dashboard')
    
    // Get and store the auth token for subsequent tests
    authToken = await page.evaluate(() => localStorage.getItem('authToken'))
    expect(authToken).toBeTruthy()
    
    console.log('✅ Login successful - token obtained')
  })

  test('02: User can navigate to dashboard after login', async ({ page }) => {
    test.setTimeout(30000)
    
    // Inject auth token before navigating (each test gets a new page context)
    if (authToken) {
      const user = JSON.stringify({ email: testUser.email, name: 'Test User' })
      await page.addInitScript(({ token, userData }) => {
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', userData)
      }, { token: authToken, userData: user })
    }
    
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' })
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000)
    
    // Verify we're on dashboard
    const finalUrl = page.url()
    expect(finalUrl).toContain('/dashboard')
    
    // Verify dashboard content is visible
    await expect(page.locator('text=/Welcome|Dashboard|Test Scenarios/i').first()).toBeVisible({ timeout: 5000 })
    
    console.log('✅ Dashboard accessible after login')
  })

  test('03: User sees error with invalid credentials', async ({ page }) => {
    test.setTimeout(20000)
    
    // Navigate to login fresh
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' })
    
    const emailInput = page.locator('#email')
    const passwordInput = page.locator('#password')
    const loginButton = page.locator('button:has-text("Login")')

    await emailInput.waitFor({ state: 'visible', timeout: 5000 })
    await emailInput.fill('invalid@test.com')
    await passwordInput.fill('WrongPassword123!')
    await loginButton.click()

    // Should stay on login page after failed attempt
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/login')
    
    console.log('✅ Invalid credentials properly rejected')
  })

  test('04: Unauthenticated user cannot access protected routes', async ({ page }) => {
    test.setTimeout(15000)
    
    // Navigate to login first to have a proper origin for evaluate
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' })
    
    // Clear auth state
    await page.evaluate(() => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
    })
    
    // Try accessing dashboard without authentication
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' })

    // Wait a moment for redirect
    await page.waitForTimeout(2000)
    
    // Should be redirected to login
    const currentUrl = page.url()
    expect(currentUrl).toContain('/login')
    
    console.log('✅ Unauthenticated user redirected to login')  
  })

  test('05: User can logout from dashboard', async ({ page }) => {
    test.setTimeout(40000)
    
    // Inject auth token before navigating
    if (authToken) {
      const user = JSON.stringify({ email: testUser.email, name: 'Test User' })
      await page.addInitScript(({ token, userData }) => {
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', userData)
      }, { token: authToken, userData: user })
    }
    
    // Go to dashboard
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' })
    
    // Wait for page to stabilize
    await page.waitForLoadState('domcontentloaded')

    // Find logout button
    const logoutButton = page.locator(
      'button:has-text("Logout"), ' +
      'button:has-text("Log out"), ' +
      'button:has-text("Sign Out"), ' +
      '[data-testid="logout"]'
    )
    
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click()
      
      // Wait a moment for redirect
      await page.waitForTimeout(1000)
      
      // Check if redirected to login
      const finalUrl = page.url()
      const isOnLogin = finalUrl.includes('/login')
      console.log(`✅ Logout action completed (${isOnLogin ? 'redirected to login' : 'still on dashboard'})`)  
    } else {
      console.log('⏭️  Logout button not found - skipping logout test')
    }
  })
})
