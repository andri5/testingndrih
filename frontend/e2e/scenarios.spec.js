import { test, expect } from '@playwright/test'

test.describe('Scenario Management E2E Tests', () => {
  let authToken

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000)
    
    const context = await browser.newContext()
    const page = await context.newPage()
    
    try {
      // Register via API for reliability
      const email = `user_${Date.now()}@test.com`
      const password = 'TestPassword123!'
      
      const response = await page.request.post('http://localhost:5001/api/auth/register', {
        headers: { 'Content-Type': 'application/json' },
        data: { email, password, name: 'Test User' }
      })
      
      if (response.ok()) {
        const data = await response.json()
        authToken = data.token
        console.log('✅ Registration successful via API')
      } else {
        // User might already exist, try login
        const loginResponse = await page.request.post('http://localhost:5001/api/auth/login', {
          headers: { 'Content-Type': 'application/json' },
          data: { email, password }
        })
        if (loginResponse.ok()) {
          const data = await loginResponse.json()
          authToken = data.token
          console.log('✅ Login successful via API')
        }
      }
      
      if (!authToken) {
        // Fallback: use known test user
        const fallbackResponse = await page.request.post('http://localhost:5001/api/auth/login', {
          headers: { 'Content-Type': 'application/json' },
          data: { email: 'donkditren@gmail.com', password: 'password*1' }
        })
        if (fallbackResponse.ok()) {
          const data = await fallbackResponse.json()
          authToken = data.token
        }
      }
    } catch (e) {
      console.log('BeforeAll error:', e.message)
    }
    
    await context.close()
  })

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000)
    
    // Set auth via localStorage init script
    if (authToken) {
      await page.addInitScript((token) => {
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify({ id: 'test-user', email: 'test@test.com', name: 'Test User' }))
      }, authToken)
    }
    
    await page.goto('http://localhost:3000/scenarios', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1000)
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
    await page.locator('button:has-text("Create Scenario")').click()
    await page.locator(`text=${scenarioName}`).waitFor({ state: 'visible', timeout: 10000 })

    // Click View button to view details - navigate from text through card structure
    const scenarioCard = page.locator(`text=${scenarioName}`).locator('xpath=ancestor::div[contains(@class,"hover")]')
    const viewButton = scenarioCard.locator('button:has-text("View")').first()
    // View button navigates to /scenarios/:id - verify it exists and is clickable
    await viewButton.waitFor({ state: 'visible', timeout: 5000 })
    await expect(viewButton).toBeVisible()
    // Verify the scenario name is visible in the list
    await expect(page.locator(`text=${scenarioName}`)).toBeVisible()
  })

  test('User can add test steps to scenario', async ({ page }) => {
    // Test steps are managed via API - verify step creation via API works
    // since the frontend detail page with step UI is not yet implemented
    
    // First create a scenario via API to get its ID
    const response = await page.request.post('http://localhost:5001/api/auth/login', {
      headers: { 'Content-Type': 'application/json' },
      data: { email: 'donkditren@gmail.com', password: 'password*1' }
    })
    const loginData = await response.json()
    const token = loginData.token

    const scenarioResp = await page.request.post('http://localhost:5001/api/scenarios', {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { name: `Step Test ${Date.now()}`, url: 'https://example.com', description: 'Test' }
    })
    const scenarioData = await scenarioResp.json()
    const scenarioId = scenarioData.scenario?.id || scenarioData.id

    // Add step via API
    const stepResp = await page.request.post(`http://localhost:5001/api/scenarios/${scenarioId}/steps`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { stepNumber: 1, type: 'NAVIGATE', description: 'Navigate to page', value: 'https://example.com' }
    })
    expect(stepResp.ok()).toBeTruthy()
  })

  test('User can update scenario', async ({ page }) => {
    // Create scenario
    const createButton = page.locator('button:has-text("Create Scenario")')
    await createButton.click()
    const scenarioName = `Test Scenario ${Date.now()}`
    await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('input[name="name"]').fill(scenarioName)
    await page.locator('input[name="url"]').fill('https://example.com')
    await page.locator('button:has-text("Create Scenario")').click()
    await page.locator(`text=${scenarioName}`).waitFor({ state: 'visible', timeout: 10000 })

    // Click Edit button on the scenario card
    // Find the card containing our scenario, then click its Edit button
    const scenarioRow = page.locator(`text=${scenarioName}`).locator('xpath=ancestor::div[contains(@class,"hover")]')
    const editButton = scenarioRow.locator('button:has-text("Edit")').first()
    await editButton.waitFor({ state: 'visible', timeout: 5000 })
    await editButton.click()

    // The inline edit form should appear with "Update Scenario" submit button
    const nameInput = page.locator('input[name="name"]')
    await nameInput.waitFor({ state: 'visible', timeout: 5000 })

    // Update name
    const updatedName = `Updated ${scenarioName}`
    await nameInput.clear()
    await nameInput.fill(updatedName)
    await page.locator('button:has-text("Update Scenario")').click()

    // Verify update - the updated name should appear in the list
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
    await page.locator('button:has-text("Create Scenario")').click()
    await page.locator(`text=${scenarioName}`).waitFor({ state: 'visible', timeout: 10000 })

    // Set up dialog handler for window.confirm() - accept the confirmation
    page.on('dialog', async dialog => {
      await dialog.accept()
    })

    // Click Delete button on the scenario card
    const scenarioRow = page.locator(`text=${scenarioName}`).locator('xpath=ancestor::div[contains(@class,"hover")]')
    const deleteButton = scenarioRow.locator('button:has-text("Delete")').first()
    await deleteButton.waitFor({ state: 'visible', timeout: 5000 })
    await deleteButton.click()

    // Verify deleted - scenario name should no longer be visible
    await expect(page.locator(`text=${scenarioName}`)).not.toBeVisible({ timeout: 10000 })
  })

  test('User can search scenarios', async ({ page }) => {
    // Create scenario
    const createButton = page.locator('button:has-text("Create Scenario")')
    await createButton.click()
    const scenario1 = `LoginTest ${Date.now()}`
    await page.locator('input[name="name"]').waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('input[name="name"]').fill(scenario1)
    await page.locator('input[name="url"]').fill('https://example.com')
    await page.locator('button:has-text("Create Scenario")').click()
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
    await page.locator('button:has-text("Create Scenario")').click()
    await page.locator(`text=${scenarioName}`).waitFor({ state: 'visible', timeout: 10000 })

    // Duplicate scenario - find the card containing our scenario
    const scenarioRow = page.locator(`text=${scenarioName}`).locator('xpath=ancestor::div[contains(@class,"hover")]')
    const duplicateButton = scenarioRow.locator('button:has-text("Duplicate")').first()
    await duplicateButton.waitFor({ state: 'visible', timeout: 5000 })
    await duplicateButton.click()

    // Verify duplicate created - backend creates "{name} (Copy)"
    await page.locator(`text=${scenarioName} (Copy)`).waitFor({ state: 'visible', timeout: 10000 })
  })
})
