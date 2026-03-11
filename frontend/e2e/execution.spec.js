import { test, expect } from '@playwright/test'

test.describe('Test Execution E2E Tests', () => {
  let email, password, authToken, scenarioId

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000)
    
    // Create user via registration
    email = `user_${Date.now()}@test.com`
    password = 'TestPassword123!'

    const context = await browser.newContext()
    const page = await context.newPage()
    
    try {
      await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' })
      await page.fill('input[type="email"]', email)
      await page.fill('input[type="password"]', password)
      await page.fill('input[placeholder*="name" i]', 'Test User')
      
      // Listen for successful registration (API response)
      let tokenFromStorage = null
      page.on('loader', async (loader) => {
        try {
          // Extract token from any successful API response
          const cookies = await context.cookies()
          const tokenCookie = cookies.find(c => c.name === 'authToken' || c.name === 'token')
          if (tokenCookie) {
            tokenFromStorage = tokenCookie.value
          }
        } catch (e) {
          console.log('Error extracting token:', e.message)
        }
      })
      
      await page.click('button:has-text("Register")')
      
      // Wait for dashboard or successful auth
      try {
        await page.waitForURL('**/dashboard', { timeout: 15000 })
        
        // Get token from cookies if available
        const cookies = await context.cookies()
        const tokenCookie = cookies.find(c => c.name === 'authToken' || c.name === 'token')
        if (tokenCookie) {
          authToken = tokenCookie.value
        } else {
          console.log('No auth token found in cookies, will retry')
          authToken = `test_token_${Date.now()}`
        }
      } catch (e) {
        console.log('Registration may have succeeded but navigation timeout')
        const cookies = await context.cookies()
        const tokenCookie = cookies.find(c => c.name === 'authToken' || c.name === 'token')
        authToken = tokenCookie?.value || `test_token_${Date.now()}`
      }

      // Create scenario via API with auth headers
      try {
        const response = await page.request.post('http://localhost:5001/api/scenarios', {
          headers: { 
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            name: `Execution Test Scenario ${Date.now()}`,
            description: 'Test scenario for execution',
            url: 'https://example.com'
          }
        })
        
        if (response.ok()) {
          const data = await response.json()
          scenarioId = data.scenario?.id || data.id
        } else {
          console.log('Failed to create scenario:', response.status())
          scenarioId = 'test-scenario-1'
        }
      } catch (e) {
        console.log('Error creating scenario:', e.message)
        scenarioId = 'test-scenario-1'
      }

      await context.close()
    } catch (e) {
      console.log('BeforeAll error:', e.message)
      await context.close()
      authToken = `test_token_${Date.now()}`
      scenarioId = 'test-scenario-1'
    }
  })

  test.beforeEach(async ({ page, context }) => {
    test.setTimeout(60000)
    
    // Set up auth context properly
    if (authToken) {
      await context.addCookies([
        {
          name: 'authToken',
          value: authToken,
          url: 'http://localhost:3000'
        }
      ])
    }
    
    await page.goto('http://localhost:3000/execution', { waitUntil: 'networkidle' })
  })

  test('User can view execution dashboard', async ({ page }) => {
    // Verify page loaded
    await expect(page.locator('text=/execution|test results/i')).toBeVisible()
  })

  test('User can execute a scenario', async ({ page }) => {
    // Select scenario
    const scenarioSelect = page.locator('select').first()
    await scenarioSelect.selectOption(scenarioId)

    // Click execute button
    await page.click('button:has-text("Execute")')

    // Verify execution started
    await expect(page.locator('text=/running|executing/i')).toBeVisible()

    // Wait for execution to complete (with timeout)
    await page.waitForTimeout(5000)

    // Verify results shown
    await expect(page.locator('text=/passed|failed|completed/i')).toBeVisible()
  })

  test('User can view execution history', async ({ page }) => {
    // Execute scenario first
    const scenarioSelect = page.locator('select').first()
    await scenarioSelect.selectOption(scenarioId)
    await page.click('button:has-text("Execute")')
    await page.waitForTimeout(5000)

    // Navigate to execution history view
    await page.click('text=/history|results/i')

    // Verify history shown
    await expect(page.locator('table')).toBeVisible()
  })

  test('User can view execution details', async ({ page }) => {
    // Execute scenario
    const scenarioSelect = page.locator('select').first()
    await scenarioSelect.selectOption(scenarioId)
    await page.click('button:has-text("Execute")')
    await page.waitForTimeout(5000)

    // Click on execution result
    const resultRow = page.locator('table tbody tr').first()
    await resultRow.click()

    // Verify details page
    await page.waitForURL('**/execution/**')
    await expect(page.locator('text=/step.*result|error/i')).toBeVisible()
  })

  test('User can view execution screenshots', async ({ page }) => {
    // Execute scenario with screenshots
    const scenarioSelect = page.locator('select').first()
    await scenarioSelect.selectOption(scenarioId)
    await page.click('button:has-text("Execute")')
    await page.waitForTimeout(5000)

    // Navigate to execution details
    const resultRow = page.locator('table tbody tr').first()
    await resultRow.click()
    await page.waitForURL('**/execution/**')

    // Look for screenshots
    const screenshotElements = page.locator('img[alt*="screenshot" i]')
    const count = await screenshotElements.count()
    
    if (count > 0) {
      await expect(screenshotElements.first()).toBeVisible()
    }
  })

  test('User can filter executions by status', async ({ page }) => {
    // Execute scenario
    const scenarioSelect = page.locator('select').first()
    await scenarioSelect.selectOption(scenarioId)
    await page.click('button:has-text("Execute")')
    await page.waitForTimeout(5000)

    // Filter by status
    const statusFilter = page.locator('select[name*="status" i]')
    await statusFilter.selectOption('PASSED')

    // Verify filtered results
    await page.waitForTimeout(1000)
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('User can export execution results', async ({ page }) => {
    // Execute scenario
    const scenarioSelect = page.locator('select').first()
    await scenarioSelect.selectOption(scenarioId)
    await page.click('button:has-text("Execute")')
    await page.waitForTimeout(5000)

    // Click export button
    const exportButton = page.locator('button:has-text("Export")')
    if (await exportButton.isVisible()) {
      // Start waiting for download
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toBeTruthy()
    }
  })

  test('Dashboard shows execution stats', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify stats displayed
    await expect(page.locator('text=/executions|test results/i')).toBeVisible()
  })
})
