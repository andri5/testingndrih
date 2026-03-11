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
      const emailInput = page.locator('#email')
      await emailInput.waitFor({ state: 'visible', timeout: 5000 })
      await emailInput.fill(email)
      const passwordInput = page.locator('#password')
      await passwordInput.waitFor({ state: 'visible', timeout: 5000 })
      await passwordInput.fill(password)
      const nameInput = page.locator('#name')
      await nameInput.waitFor({ state: 'visible', timeout: 5000 })
      await nameInput.fill('Test User')
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
    test.setTimeout(30000)
    
    // Click create scenario button
    const createButton = page.locator('button:has-text("Create Scenario")')
    await createButton.click()

    // Fill form using more reliable selectors
    const scenarioName = `Test Scenario ${Date.now()}`
    
    // Wait for form to appear
    await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
    
    // Fill fields
    await page.locator('input[name="name"]').fill(scenarioName)
    await page.locator('input[name="url"]').fill('https://example.com')
    await page.locator('textarea[name="description"]').fill('Test scenario description')

    // Wait for submit button and click
    const submitButton = page.locator('button:has-text("Create")')
    await submitButton.click()

    // Wait for scenario to appear in list
    try {
      await page.locator(`text=${scenarioName}`).waitFor({ state: 'visible', timeout: 10000 })
      expect(page.url()).toContain('/scenarios')
    } catch (error) {
      console.log('Timeout waiting for scenario to appear. Current URL:', page.url())
      throw error
    }
  })

  test('User can view scenario details', async ({ page }) => {
    // Create scenario first
    const createButton = page.locator('button:has-text("Create Scenario")')
    await createButton.click()
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('input[name="name"]').fill(scenarioName)
    await page.locator('input[name="url"]').fill('https://example.com')
    await page.locator('button:has-text("Create")').click()
    await page.locator(`text=${scenarioName}`).waitFor({ state: 'visible', timeout: 10000 })

    // Click scenario to view details
    await page.locator(`text=${scenarioName}`).click()
    await page.waitForURL('**/scenarios/**')

    // Verify details page loaded
    await expect(page.locator(`text=${scenarioName}`)).toBeVisible()
  })

  test('User can add test steps to scenario', async ({ page }) => {
    // Create scenario
    const createButton = page.locator('button:has-text("Create Scenario")')
    await createButton.click()
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('input[name="name"]').fill(scenarioName)
    await page.locator('input[name="url"]').fill('https://example.com')
    await page.locator('button:has-text("Create")').click()
    await page.locator(`text=${scenarioName}`).waitFor({ state: 'visible', timeout: 10000 })

    // Open scenario
    await page.locator(`text=${scenarioName}`).click()
    await page.waitForURL('**/scenarios/**')

    // Add a step
    const addStepButton = page.locator('button:has-text("Add Step")')
    await addStepButton.click()
    await page.locator('select').selectOption('NAVIGATE')
    await page.locator('input[name="description"]').fill('Navigate to page')
    const saveButton = page.locator('button:has-text("Save")')
    await saveButton.click()

    // Verify step added
    await page.locator('text=Navigate to page').waitFor({ state: 'visible', timeout: 10000 })
  })

  test('User can update scenario', async ({ page }) => {
    // Create scenario
    const createButton = page.locator('button:has-text("Create Scenario")')
    await createButton.click()
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('input[name="name"]').fill(scenarioName)
    await page.locator('input[name="url"]').fill('https://example.com')
    await page.locator('button:has-text("Create")').click()
    await page.locator(`text=${scenarioName}`).waitFor({ state: 'visible', timeout: 10000 })

    // Click edit
    const editButton = page.locator('button:has-text("Edit")').first()
    await editButton.click()

    // Update name
    const updatedName = `Updated ${scenarioName}`
    const nameInput = page.locator('input[name="name"]')
    await nameInput.clear()
    await nameInput.fill(updatedName)
    await page.locator('button:has-text("Save")').click()

    // Verify update
    await page.locator(`text=${updatedName}`).waitFor({ state: 'visible', timeout: 10000 })
  })

  test('User can delete scenario', async ({ page }) => {
    // Create scenario
    const createButton = page.locator('button:has-text("Create Scenario")')
    await createButton.click()
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('input[name="name"]').fill(scenarioName)
    await page.locator('input[name="url"]').fill('https://example.com')
    await page.locator('button:has-text("Create")').click()
    await page.locator(`text=${scenarioName}`).waitFor({ state: 'visible', timeout: 10000 })

    // Delete scenario
    const deleteButton = page.locator('button[title*="delete" i]').first()
    await deleteButton.click()

    // Confirm delete
    await page.locator('button:has-text("Delete")').click()

    // Verify deleted
    await expect(page.locator(`text=${scenarioName}`)).not.toBeVisible()
  })

  test('User can search scenarios', async ({ page }) => {
    // Create scenario
    const createButton = page.locator('button:has-text("Create Scenario")')
    await createButton.click()
    const scenario1 = `LoginTest ${Date.now()}`
    await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('input[name="name"]').fill(scenario1)
    await page.locator('input[name="url"]').fill('https://example.com')
    await page.locator('button:has-text("Create")').click()
    await page.locator(`text=${scenario1}`).waitFor({ state: 'visible', timeout: 10000 })

    // Search for scenario
    const searchInput = page.locator('input[placeholder*="search" i]').first()
    await searchInput.waitFor({ state: 'visible', timeout: 5000 })
    await searchInput.fill('LoginTest')

    // Verify search results
    await page.locator(`text=${scenario1}`).waitFor({ state: 'visible', timeout: 10000 })
  })

  test('User can duplicate scenario', async ({ page }) => {
    // Create scenario
    const createButton = page.locator('button:has-text("Create Scenario")')
    await createButton.click()
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('input[name="name"]').fill(scenarioName)
    await page.locator('input[name="url"]').fill('https://example.com')
    await page.locator('button:has-text("Create")').click()
    await page.locator(`text=${scenarioName}`).waitFor({ state: 'visible', timeout: 10000 })

    // Duplicate scenario
    const duplicateButton = page.locator('button:has-text("Duplicate")').first()
    await duplicateButton.click()

    // Verify duplicate created
    await page.locator(`text=/.*${scenarioName}.*Copy.*/`).waitFor({ state: 'visible', timeout: 10000 })
  })
})
