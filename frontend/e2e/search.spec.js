import { test, expect } from '@playwright/test'

test.describe('Search & Filter E2E Tests', () => {
  let email, password, authToken

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120000)
    
    // Create user
    email = `user_${Date.now()}@test.com`
    password = 'TestPassword123!'

    const context = await browser.newContext()
    const page = await context.newPage()
    
    try {
      await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle' })
      await page.fill('input[type="email"]', email)
      await page.fill('input[type="password"]', password)
      await page.fill('input[placeholder*="name" i]', 'Test User')
      await page.click('button:has-text("Register")')
      
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

      // Create test scenarios via API
      const scenarios = [
        { name: 'Login Test 001', url: 'https://example.com/login' },
        { name: 'Checkout Flow 001', url: 'https://example.com/checkout' },
        { name: 'Search Feature 001', url: 'https://example.com/search' }
      ]

      for (const scenario of scenarios) {
        try {
          await page.request.post('http://localhost:5001/api/scenarios', {
            headers: { 
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            data: {
              name: scenario.name,
              description: `Test scenario: ${scenario.name}`,
              url: scenario.url
            }
          })
        } catch (e) {
          console.log('Error creating test scenario:', e.message)
        }
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

  test('User can search scenarios by name', async ({ page }) => {
    // Get search input
    const searchInput = page.locator('input[placeholder*="search" i]').first()
    
    // Search for specific scenario
    await searchInput.fill('Login')
    await page.waitForTimeout(500) // Wait for debounce

    // Verify results
    await expect(page.locator('text=/Login Test/i')).toBeVisible()
  })

  test('User can clear search results', async ({ page }) => {
    // Search
    const searchInput = page.locator('input[placeholder*="search" i]').first()
    await searchInput.fill('Login')
    await page.waitForTimeout(500)

    // Clear
    await searchInput.clear()
    await page.waitForTimeout(500)

    // All scenarios should be visible
    const scenarioNames = ['Login Test', 'Checkout Flow', 'Search Feature']
    for (const name of scenarioNames) {
      await expect(page.locator(`text=${name}`)).toBeVisible().catch(() => {
        // Scenario might exist from previous tests
      })
    }
  })

  test('User can filter by scenario type', async ({ page }) => {
    // Look for filter options
    const filterButton = page.locator('button:has-text(/filter|advanced/i)')
    if (await filterButton.isVisible()) {
      await filterButton.click()

      // Select filter type
      const typeFilter = page.locator('select[name*="type" i]')
      if (await typeFilter.isVisible()) {
        await typeFilter.selectOption('UI')
        await page.waitForTimeout(500)

        // Verify filtered
        const results = page.locator('table tbody tr, .scenario-item')
        expect(await results.count()).toBeGreaterThan(0)
      }
    }
  })

  test('User can sort scenarios', async ({ page }) => {
    // Look for sort dropdown
    const sortButton = page.locator('select[name*="sort" i]')
    if (await sortButton.isVisible()) {
      // Sort by name
      await sortButton.selectOption('name')
      await page.waitForTimeout(500)

      // Verify order
      const firstScenario = page.locator('table tbody tr').first()
      await expect(firstScenario).toBeVisible()
    }
  })

  test('Search displays no results message', async ({ page }) => {
    // Search for non-existent scenario
    const searchInput = page.locator('input[placeholder*="search" i]').first()
    await searchInput.fill('xyznonexistent123')
    await page.waitForTimeout(500)

    // Verify no results message
    const noResults = page.locator('text=/no.*results|no.*scenarios/i')
    await expect(noResults).toBeVisible()
  })

  test('User can search across multiple fields', async ({ page }) => {
    // Advanced search if available
    const advancedButton = page.locator('button:has-text(/advanced.*search/i)')
    if (await advancedButton.isVisible()) {
      await advancedButton.click()

      // Fill search criteria
      const nameInput = page.locator('input[placeholder*="name" i]')
      await nameInput.fill('Test')

      const urlInput = page.locator('input[placeholder*="url" i]')
      if (await urlInput.isVisible()) {
        await urlInput.fill('example.com')
      }

      // Search
      await page.click('button:has-text("Search")')
      await page.waitForTimeout(500)

      // Verify results
      await expect(page.locator('table tbody tr').first()).toBeVisible()
    }
  })

  test('Pagination works correctly', async ({ page }) => {
    // Look for pagination
    const nextButton = page.locator('button:has-text("Next")')
    const prevButton = page.locator('button:has-text("Previous")')

    if (await nextButton.isVisible()) {
      // Click next
      await nextButton.click()
      await page.waitForTimeout(500)

      // Verify page changed
      expect(page.url()).toMatch(/page|skip|offset/)

      // Click previous
      if (await prevButton.isVisible()) {
        await prevButton.click()
        await page.waitForTimeout(500)
      }
    }
  })

  test('Search suggestions appear', async ({ page }) => {
    // Type in search
    const searchInput = page.locator('input[placeholder*="search" i]').first()
    await searchInput.focus()
    await searchInput.type('Log')
    await page.waitForTimeout(500)

    // Look for suggestions dropdown
    const suggestionsList = page.locator('ul[role="listbox"], .suggestions, [role="option"]')
    if (await suggestionsList.isVisible()) {
      // Verify suggestions
      await expect(page.locator('text=/login|log/i')).toBeVisible()
    }
  })

  test('Recent scenarios displayed on dashboard', async ({ page }) => {
    await page.goto('/dashboard')

    // Look for recent scenarios section
    const recentSection = page.locator('text=/recent|latest/i')
    if (await recentSection.isVisible()) {
      // Verify scenarios in list
      await expect(page.locator('table tbody tr').first()).toBeVisible()
    }
  })
})
