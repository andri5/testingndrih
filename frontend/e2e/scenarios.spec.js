import { test, expect } from '@playwright/test'

test.describe('Scenario Management E2E Tests', () => {
  let email, password, authToken

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000)
    
    // Create user for all tests
    email = `user_${Date.now()}@test.com`
    password = 'TestPassword123!'

    const context = await browser.newContext()
    const page = await context.newPage()
    
    try {
      await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' })
      await page.fill('input[name="email"]', email)
      await page.fill('input[name="password"]', password)
      await page.fill('input[name="name"]', 'Test User')
      await page.click('button:has-text("Create Account")')
      
      try {
        await page.waitForURL('**/dashboard', { timeout: 15000 })
        const cookies = await context.cookies()
        const tokenCookie = cookies.find(c => c.name === 'authToken' || c.name === 'token')
        authToken = tokenCookie?.value || `test_token_${Date.now()}`
      } catch (e) {
        console.log('Registration navigation timeout')
        const cookies = await context.cookies()
        const tokenCookie = cookies.find(c => c.name === 'authToken' || c.name === 'token')
        authToken = tokenCookie?.value || `test_token_${Date.now()}`
      }
    } catch (e) {
      console.log('BeforeAll error:', e.message)
      authToken = `test_token_${Date.now()}`
    }
    
    await context.close()
  })

  test.beforeEach(async ({ page, context }) => {
    test.setTimeout(60000)
    
    // Set auth via cookies
    if (authToken) {
      await context.addCookies([
        {
          name: 'authToken',
          value: authToken,
          url: 'http://localhost:3000'
        }
      ])
    }
    
    await page.goto('http://localhost:3000/scenarios', { waitUntil: 'networkidle' })
  })

  test('User can create a new scenario', async ({ page }) => {
    // Click create scenario
    await page.click('text=/create.*scenario/i')

    // Fill form using name attributes
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.fill('input[name="name"]', scenarioName)
    await page.fill('input[name="url"]', 'https://example.com')
    await page.fill('textarea[name="description"]', 'Test scenario description')

    // Submit
    await page.click('button:has-text("Create")')

    // Verify scenario appears in list
    await expect(page.locator(`text="${scenarioName}"`)).toBeVisible()
  })

  test('User can view scenario details', async ({ page }) => {
    // Create scenario first
    await page.click('text=/create.*scenario/i')
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.fill('input[name="name"]', scenarioName)
    await page.fill('input[name="url"]', 'https://example.com')
    await page.click('button:has-text("Create")')
    await expect(page.locator(`text="${scenarioName}"`)).toBeVisible()

    // Click scenario to view details
    await page.click(`text="${scenarioName}"`)
    await page.waitForURL('**/scenarios/**')

    // Verify details page loaded
    await expect(page.locator(`text="${scenarioName}"`)).toBeVisible()
  })

  test('User can add test steps to scenario', async ({ page }) => {
    // Create scenario
    await page.click('text=/create.*scenario/i')
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.fill('input[name="name"]', scenarioName)
    await page.fill('input[name="url"]', 'https://example.com')
    await page.click('button:has-text("Create")')
    await expect(page.locator(`text="${scenarioName}"`)).toBeVisible()

    // Open scenario
    await page.click(`text="${scenarioName}"`)
    await page.waitForURL('**/scenarios/**')

    // Add a step
    await page.click('button:has-text("Add Step")')
    await page.selectOption('select', 'NAVIGATE')
    await page.fill('input[name="description"]', 'Navigate to page')
    await page.click('button:has-text("Save")')

    // Verify step added
    await expect(page.locator('text="Navigate to page"')).toBeVisible()
  })

  test('User can update scenario', async ({ page }) => {
    // Create scenario
    await page.click('text=/create.*scenario/i')
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.fill('input[name="name"]', scenarioName)
    await page.fill('input[name="url"]', 'https://example.com')
    await page.click('button:has-text("Create")')

    // Click edit
    const editButton = page.locator('button:has-text("Edit")').first()
    await editButton.click()

    // Update name
    const updatedName = `Updated ${scenarioName}`
    const nameInput = page.locator('input[name="name"]')
    await nameInput.fill(updatedName)
    await page.click('button:has-text("Save")')

    // Verify update
    await expect(page.locator(`text="${updatedName}"`)).toBeVisible()
  })

  test('User can delete scenario', async ({ page }) => {
    // Create scenario
    await page.click('text=/create.*scenario/i')
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.fill('input[name="name"]', scenarioName)
    await page.fill('input[name="url"]', 'https://example.com')
    await page.click('button:has-text("Create")')
    await expect(page.locator(`text="${scenarioName}"`)).toBeVisible()

    // Delete scenario
    const deleteButton = page.locator('button[title*="delete" i]').first()
    await deleteButton.click()

    // Confirm delete
    await page.click('button:has-text("Delete")')

    // Verify deleted
    await expect(page.locator(`text="${scenarioName}"`)).not.toBeVisible()
  })

  test('User can search scenarios', async ({ page }) => {
    // Create two scenarios
    await page.click('text=/create.*scenario/i')
    const scenario1 = `LoginTest ${Date.now()}`
    await page.fill('input[placeholder*="name" i]', scenario1)
    await page.fill('input[placeholder*="url" i]', 'https://example.com')
    await page.click('button:has-text("Create")')

    // Search for scenario
    const searchInput = page.locator('input[placeholder*="search" i]').first()
    await searchInput.fill('LoginTest')

    // Verify search results
    await expect(page.locator(`text="${scenario1}"`)).toBeVisible()
  })

  test('User can duplicate scenario', async ({ page }) => {
    // Create scenario
    await page.click('text=/create.*scenario/i')
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.fill('input[placeholder*="name" i]', scenarioName)
    await page.fill('input[placeholder*="url" i]', 'https://example.com')
    await page.click('button:has-text("Create")')

    // Duplicate scenario
    const duplicateButton = page.locator('button:has-text("Duplicate")').first()
    await duplicateButton.click()

    // Verify duplicate created
    await expect(page.locator(`text="${scenarioName} (Copy)"`)).toBeVisible()
  })
})
