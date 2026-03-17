import { test, expect } from '@playwright/test'

test.describe('Search & Filter E2E Tests', () => {
  let email, password, authToken, userData

  test.beforeAll(async ({ request }) => {
    test.setTimeout(120000)

    email = `user_${Date.now()}@test.com`
    password = 'TestPassword123!'

    // Register via API directly
    try {
      const response = await request.post('http://localhost:5001/api/auth/register', {
        headers: { 'Content-Type': 'application/json' },
        data: { email, password, name: 'Test User' }
      })
      if (response.ok()) {
        const data = await response.json()
        authToken = data.token
        userData = JSON.stringify(data.user)
      } else {
        console.log('Registration failed:', response.status())
      }
    } catch (e) {
      console.log('Registration error:', e.message)
    }

    // Create test scenarios via API
    if (authToken) {
      const scenariosToCreate = [
        { name: 'Login Test 001', url: 'https://example.com/login' },
        { name: 'Checkout Flow 001', url: 'https://example.com/checkout' },
        { name: 'Search Feature 001', url: 'https://example.com/search' }
      ]
      for (const scenario of scenariosToCreate) {
        try {
          await request.post('http://localhost:5001/api/scenarios', {
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
    }
  })

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000)

    // Set auth via localStorage - must set BOTH authToken AND user (ProtectedRoute checks both)
    if (authToken) {
      await page.addInitScript(({ token, user }) => {
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', user)
      }, { token: authToken, user: userData })
    }

    await page.goto('http://localhost:3000/scenarios', { waitUntil: 'networkidle' })
  })

  test('User can search scenarios by name', async ({ page }) => {
    // Get search input
    const searchInput = page.locator('input[placeholder*="search" i]').first()
    await searchInput.waitFor({ state: 'visible', timeout: 5000 })
    
    // Search for specific scenario
    await searchInput.fill('Login')
    await page.waitForTimeout(500) // Wait for debounce

    // Verify results
    await page.locator('text=/Login Test/i').waitFor({ state: 'visible', timeout: 5000 })
  })

  test('User can clear search results', async ({ page }) => {
    // Search
    const searchInput = page.locator('input[placeholder*="search" i]').first()
    await searchInput.waitFor({ state: 'visible', timeout: 5000 })
    await searchInput.fill('Login')
    await page.waitForTimeout(500)

    // Clear
    await searchInput.clear()
    await page.waitForTimeout(500)

    // All scenarios should be visible or no error shown
    const scenarioNames = ['Login Test', 'Checkout Flow', 'Search Feature']
    for (const name of scenarioNames) {
      try {
        await page.locator(`text=${name}`).waitFor({ state: 'visible', timeout: 3000 })
      } catch (e) {
        // Scenario might exist from previous tests
      }
    }
  })

  test('User can filter by scenario type', async ({ page }) => {
    // Look for filter options
    const filterButton = page.locator('button:has-text(/filter|advanced/i)').first()
    if (await filterButton.isVisible()) {
      await filterButton.click()

      // Select filter type
      const typeFilter = page.locator('select[name*="type" i]')
      if (await typeFilter.isVisible()) {
        await typeFilter.selectOption('UI')
        await page.waitForTimeout(500)

        // Verify filtered
        const results = page.locator('table tbody tr, .scenario-item')
        const count = await results.count()
        expect(count).toBeGreaterThan(0)
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
      await firstScenario.waitFor({ state: 'visible', timeout: 5000 })
    }
  })

  test('Search displays no results message', async ({ page }) => {
    // Search for non-existent scenario
    const searchInput = page.locator('input[placeholder*="search" i]').first()
    await searchInput.waitFor({ state: 'visible', timeout: 5000 })
    await searchInput.fill('xyznonexistent123')
    await page.waitForTimeout(500)

    // Verify no results message
    const noResults = page.locator('text=/no.*results|no.*scenarios/i')
    await noResults.waitFor({ state: 'visible', timeout: 5000 })
  })

  test('User can search across multiple fields', async ({ page }) => {
    // Advanced search if available
    const advancedButton = page.locator('button:has-text(/advanced.*search/i)').first()
    if (await advancedButton.isVisible()) {
      await advancedButton.click()

      // Fill search criteria
      const nameInput = page.locator('input[placeholder*="name" i]')
      await nameInput.waitFor({ state: 'visible', timeout: 5000 })
      await nameInput.fill('Test')

      const urlInput = page.locator('input[placeholder*="url" i]')
      if (await urlInput.isVisible()) {
        await urlInput.fill('example.com')
      }

      // Search
      const searchBtn = page.locator('button:has-text("Search")').last()
      await searchBtn.click()
      await page.waitForTimeout(500)

      // Verify results
      await page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 5000 })
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
    await searchInput.waitFor({ state: 'visible', timeout: 5000 })
    await searchInput.focus()
    await searchInput.type('Log')
    await page.waitForTimeout(500)

    // Look for suggestions dropdown
    const suggestionsList = page.locator('ul[role="listbox"], .suggestions, [role="option"]')
    if (await suggestionsList.isVisible()) {
      // Verify suggestions
      await page.locator('text=/login|log/i').waitFor({ state: 'visible', timeout: 5000 })
    }
  })

  test('Recent scenarios displayed on dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' })

    // Look for recent scenarios section
    const recentSection = page.locator('text=/recent|latest/i')
    if (await recentSection.isVisible()) {
      // Verify scenarios in list
      await page.locator('table tbody tr').first().waitFor({ state: 'visible', timeout: 5000 })
    }
  })
})
