/**
 * E2E — Platform features (API Testing, Issues, Environments, Visual Regression)
 * Uses mocked API so pages can be tested without a running backend.
 */

import { test, expect } from '@playwright/test'

const mockUser = {
  id: 'user-1',
  email: 'admin@testingndrih.local',
  name: 'Admin',
  role: 'ADMIN',
}
const mockToken = 'mock-jwt-token-platform-e2e'
const mockScenario = { id: 'scenario-1', name: 'Demo Scenario', url: 'https://example.com' }

function setupAuth(page) {
  return page.addInitScript(({ token, user }) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('user', JSON.stringify(user))
  }, { token: mockToken, user: mockUser })
}

function mockPlatformApis(page) {
  return page.route('**/api/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()

    if (url.includes('/api/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: mockUser }),
      })
    }

    if (url.includes('/api/executions/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stats: { total: 5, successRate: 80, passed: 4, failed: 1, averageDuration: 1200 }
        })
      })
    }

    if (url.includes('/api/analytics/summary')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalExecutions: 5,
          totalScenarios: 1,
          passRate: 80,
          failedExecutions: 1,
          passedExecutions: 4
        })
      })
    }

    if (url.includes('/api/search/recent')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ scenarios: [mockScenario] })
      })
    }

    if (url.includes('/api/executions') && method === 'GET' && !url.includes('/stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ executions: [], total: 0, limit: 20, offset: 0 })
      })
    }

    if (url.includes('/api/scenarios') && method === 'GET' && !url.includes('/steps')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ scenarios: [mockScenario], pagination: { total: 1, skip: 0, take: 100 } })
      })
    }

    if (url.includes('/api/api-tests/scenarios/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ apiTests: [] }) })
    }

    if (url.includes('/api/issues')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          issues: [{
            id: 'issue-1',
            title: 'Step failed: click button',
            status: 'OPEN',
            severity: 'HIGH',
            scenarioId: 'scenario-1',
            scenario: { name: 'Demo Scenario' },
            stepNumber: 2,
            createdAt: new Date().toISOString()
          }],
          total: 1
        })
      })
    }

    if (url.includes('/api/environments')) {
      if (url.includes('/resolved')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ baseUrl: 'https://staging.example.com', apiKey: '***' })
        })
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          environments: [{
            id: 'env-1',
            name: 'Development',
            description: 'Local dev',
            baseUrl: 'http://localhost:3001',
            isDefault: true,
            _count: { variables: 2 }
          }]
        })
      })
    }

    if (url.includes('/api/visual-regression/baselines')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ baselines: [] }) })
    }

    if (url.includes('/api/visual-regression/comparisons')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ comparisons: [] }) })
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
  })
}

test.describe('Platform Features E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page)
    await mockPlatformApis(page)
  })

  test('API Testing page loads with title and scenario selector', async ({ page }) => {
    await page.goto('/api-testing')
    await expect(page.locator('h1').filter({ hasText: /API Testing|Pengujian API/i })).toBeVisible()
    await expect(page.getByText(/HTTP request|request HTTP/i)).toBeVisible()
    await expect(page.locator('select').first()).toBeVisible()
  })

  test('Issues page loads and shows issue list', async ({ page }) => {
    await page.goto('/issues')
    await expect(page.locator('h1').filter({ hasText: /Test Issues|Issue Pengujian/i })).toBeVisible()
    await expect(page.getByText(/Step failed: click button/i)).toBeVisible()
    await expect(page.getByText('HIGH').first()).toBeVisible()
  })

  test('Environments page loads with environment card', async ({ page }) => {
    await page.goto('/environments')
    await expect(page.locator('h1').filter({ hasText: /^Environments$|^Environment$/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Development' })).toBeVisible()
    await expect(page.getByText(/{{variableName}}|{{namaVariabel}}/i)).toBeVisible()
  })

  test('Visual Regression page loads with action buttons', async ({ page }) => {
    await page.goto('/visual-regression')
    await expect(page.locator('h1').filter({ hasText: /Visual Regression|Regresi Visual/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Capture Baselines|Ambil Baseline/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Run Visual Test|Jalankan Tes Visual/i })).toBeVisible()
  })

  test('Sidebar navigation links reach platform pages', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })

    // API Testing & Issues live under Main (not admin-only Tools)
    await page.getByRole('link', { name: /^API Testing$/i }).click()
    await expect(page).toHaveURL(/\/api-testing/)
    await page.getByRole('link', { name: /^Issues$/i }).first().click()
    await expect(page).toHaveURL(/\/issues/)
  })

  test('Admin Tools menu reaches scheduler page', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByText(/^Tools$/i).click()
    await page.getByRole('link', { name: /^Scheduler$/i }).click()
    await expect(page).toHaveURL(/\/scheduler/)
  })
})
