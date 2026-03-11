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
  await page.locator('#name').fill(name)
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('#confirmPassword').fill(password)

  // Click submit and wait for API response
  await page.locator('button:has-text("Create Account")').click()
  
  // Wait a bit for API response
  await page.waitForTimeout(5000)
  
  console.log('All API responses:')
  responses.forEach(r => console.log(`  ${r.url}: ${r.status} - ${r.text}`))
  
  // Check current page
  console.log('Current URL:', page.url())
  
  // Check for error message
  const errorMsg = await page.locator('[role="alert"], .error, [class*="error"]').first().textContent().catch(() => null)
  console.log('Error message on page:', errorMsg)
})
