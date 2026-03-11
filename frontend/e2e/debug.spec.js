import { test, expect } from '@playwright/test'

test('Debug: Check API error on registration', async ({ page }) => {
  test.setTimeout(30000)
  
  // Listen for API responses
  const responses = []
  page.on('response', async (response) => {
    if (response.url().includes('/api/auth/register')) {
      const status = response.status()
      const text = await response.text()
      responses.push({ status, text, url: response.url() })
      console.log(`API Response: ${status} - ${text}`)
    }
  })

  await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' })

  const email = `user_${Date.now()}@test.com`
  const password = 'TestPassword123!'
  const name = 'Test User'

  // Fill the form
  const nameInput = page.locator('#name')
  await nameInput.waitFor({ state: 'visible', timeout: 5000 })
  await nameInput.fill(name)

  const emailInput = page.locator('#email')
  await emailInput.waitFor({ state: 'visible', timeout: 5000 })
  await emailInput.fill(email)

  const passwordInput = page.locator('#password')
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 })
  await passwordInput.fill(password)

  const confirmInput = page.locator('#confirmPassword')
  await confirmInput.waitFor({ state: 'visible', timeout: 5000 })
  await confirmInput.fill(password)

  // Click submit and wait for API response
  const submitButton = page.locator('button:has-text("Create Account")')
  await submitButton.click()
  
  // Wait a bit for API response
  await page.waitForTimeout(5000)
  
  console.log('All API responses:')
  responses.forEach(r => console.log(`  ${r.url}: ${r.status} - ${r.text}`))
  
  // Check current page
  console.log('Current URL:', page.url())
  
  // Check for error message
  const errorElement = page.locator('[role="alert"], .error, [class*="error"]').first()
  try {
    await errorElement.waitFor({ state: 'visible', timeout: 3000 })
    const errorMsg = await errorElement.textContent()
    console.log('Error message on page:', errorMsg)
  } catch (e) {
    console.log('No error message displayed')
  }
})
