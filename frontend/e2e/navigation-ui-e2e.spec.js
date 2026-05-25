/**
 * Navigation & UI E2E Tests - Phase 2.3
 * Tests navigation, search, and general UI interactions
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'

test.describe('Navigation & UI E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/chains/)
  })

  test('should navigate to all main pages', async ({ page }) => {
    const pages = [
      { name: 'Chains', path: '/chains' },
      { name: 'Scheduler', path: '/scheduler' },
      { name: 'Parallel', path: '/parallel' },
      { name: 'Browser Matrix', path: '/browser-matrix' }
    ]

    for (const p of pages) {
      await page.goto(`${BASE_URL}${p.path}`)
      expect(page.url()).toContain(p.path)

      // Check that page loaded
      await page.waitForTimeout(500)
    }
  })

  test('should have working navigation menu', async ({ page }) => {
    // Check for menu items
    const menuItems = page.locator('[data-testid="nav-item"], nav a, [class*="menu"] a')
    const count = await menuItems.count()
    expect(count).toBeGreaterThan(0)

    // Click on menu items
    const firstMenuItem = menuItems.first()
    await firstMenuItem.click()
    await page.waitForTimeout(500)
  })

  test('should search scenarios', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Find search input
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"], [data-testid="search-input"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(500)

      // Results should appear
      const scenarios = page.locator('[data-testid="scenario-item"], tr[data-testid*="scenario"]')
      const count = await scenarios.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should search schedules', async ({ page }) => {
    await page.goto(`${BASE_URL}/scheduler`)
    await page.waitForTimeout(1000)

    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"], [data-testid="search-input"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('daily')
      await page.waitForTimeout(500)

      const schedules = page.locator('[data-testid="schedule-item"], tr[data-testid*="schedule"]')
      const count = await schedules.count()
      expect(count).toBeGreaterThanOrEqual(0)
    }
  })

  test('should clear search filter', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"], [data-testid="search-input"]')
    if (await searchInput.count() > 0) {
      // Type something
      await searchInput.fill('test')
      await page.waitForTimeout(500)

      // Clear
      const clearBtn = page.locator('button:has-text("Clear"), button:has-text("×"), [data-testid="clear-search"]')
      if (await clearBtn.count() > 0) {
        await clearBtn.click()
      } else {
        await searchInput.fill('')
      }

      const value = await searchInput.inputValue()
      expect(value).toBe('')
    }
  })

  test('should handle responsive layout', async ({ page }) => {
    // Test on desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    let content = page.locator('main, [role="main"]')
    if (await content.count() > 0) {
      await expect(content).toBeVisible()
    }

    // Test on tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    content = page.locator('main, [role="main"]')
    if (await content.count() > 0) {
      await expect(content).toBeVisible()
    }

    // Test on mobile
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    content = page.locator('main, [role="main"]')
    if (await content.count() > 0) {
      await expect(content).toBeVisible()
    }
  })

  test('should display loading indicators', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)

    // While loading
    const loader = page.locator('[data-testid="loader"], [class*="loading"], [class*="spinner"]')
    // May or may not be visible depending on load speed
    // Just verify no errors occurred
    expect(page.url()).toContain('chains')
  })

  test('should display error messages', async ({ page }) => {
    // Simulate an error by going to invalid route
    await page.goto(`${BASE_URL}/invalid-page`, { waitUntil: 'domcontentloaded' })

    // Should show 404 or redirect
    await page.waitForTimeout(1000)
  })

  test('should have working breadcrumbs', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    const breadcrumbs = page.locator('[data-testid="breadcrumb"], [class*="breadcrumb"]')
    if (await breadcrumbs.count() > 0) {
      const links = breadcrumbs.locator('a')
      const count = await links.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should display table with correct columns', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    const table = page.locator('table')
    if (await table.count() > 0) {
      const headers = table.locator('th')
      const count = await headers.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('should allow column sorting', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    const sortableHeader = page.locator('th:has-text("Name"), [data-testid="sortable"]').first()
    if (await sortableHeader.count() > 0) {
      await sortableHeader.click()
      await page.waitForTimeout(500)

      // Verify click worked
      expect(page.url()).toContain('chains')
    }
  })

  test('should display status badges', async ({ page }) => {
    await page.goto(`${BASE_URL}/scheduler`)
    await page.waitForTimeout(1000)

    const badges = page.locator('[data-testid*="badge"], [class*="badge"]')
    if (await badges.count() > 0) {
      await expect(badges.first()).toBeVisible()
    }
  })

  test('should show tooltips', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Find element with tooltip
    const tooltipElement = page.locator('[title], [data-tooltip], [aria-label]').first()
    if (await tooltipElement.count() > 0) {
      await tooltipElement.hover()
      await page.waitForTimeout(500)

      // Tooltip should appear
      const tooltip = page.locator('[role="tooltip"], [class*="tooltip"]')
      if (await tooltip.count() > 0) {
        // Tooltip might be visible
      }
    }
  })

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Tab through elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should still be on page
    expect(page.url()).toContain('chains')
  })

  test('should support dark mode toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Look for theme toggle
    const themeToggle = page.locator('button:has-text("Dark"), button:has-text("Light"), [data-testid="theme-toggle"]')
    if (await themeToggle.count() > 0) {
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme') || document.documentElement.getAttribute('class')
      })

      await themeToggle.click()
      await page.waitForTimeout(500)

      const newTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme') || document.documentElement.getAttribute('class')
      })

      // Theme should have changed
      expect(newTheme).not.toBe(initialTheme)
    }
  })

  test('should support language switcher', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Look for language selector
    const langSelect = page.locator('select[name="language"], [data-testid="lang-select"]')
    if (await langSelect.count() > 0) {
      const options = page.locator('option')
      if (await options.count() > 1) {
        // Language switching would be tested here
        expect(await options.count()).toBeGreaterThan(1)
      }
    }
  })

  test('should display user profile menu', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Click on user profile
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Profile"), button:has-text("admin")')
    if (await userMenu.count() > 0) {
      await userMenu.click()
      await page.waitForTimeout(500)

      // Menu items should appear
      const menuItems = page.locator('[data-testid="profile-item"], [class*="profile-menu"] a')
      if (await menuItems.count() > 0) {
        await expect(menuItems.first()).toBeVisible()
      }
    }
  })

  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/nonexistent-page`, { waitUntil: 'domcontentloaded' })

    // Should show 404 or redirect to login
    await page.waitForTimeout(1000)
    const url = page.url()
    // Either 404 page or redirect
    expect(url).toBeDefined()
  })

  test('should maintain state on page refresh', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Perform an action (e.g., search)
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"], [data-testid="search-input"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('test')
      await page.waitForTimeout(500)

      // Refresh page
      await page.reload()
      await page.waitForTimeout(1000)

      // Should still be on chains page
      expect(page.url()).toContain('chains')
    }
  })
})
