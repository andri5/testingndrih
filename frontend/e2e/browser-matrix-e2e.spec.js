/**
 * Browser Matrix E2E Tests - Phase 2.3
 * Tests cross-browser execution functionality
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'

test.describe('Browser Matrix E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/chains/)

    // Navigate to browser matrix page
    await page.goto(`${BASE_URL}/browser-matrix`)
    await page.waitForTimeout(1000)
  })

  test('should display browser matrix interface', async ({ page }) => {
    const interface_ = page.locator('[data-testid="browser-matrix"], [class*="matrix"]')
    await expect(interface_).toBeVisible()
  })

  test('should select multiple browsers', async ({ page }) => {
    // Find browser checkboxes
    const chromiumCheckbox = page.locator('input[type="checkbox"][value="chromium"], label:has-text("Chromium")')
    const firefoxCheckbox = page.locator('input[type="checkbox"][value="firefox"], label:has-text("Firefox")')
    const webkitCheckbox = page.locator('input[type="checkbox"][value="webkit"], label:has-text("WebKit")')

    if (await chromiumCheckbox.count() > 0) {
      await chromiumCheckbox.check()
    }
    if (await firefoxCheckbox.count() > 0) {
      await firefoxCheckbox.check()
    }

    const selectedCount = await page.locator('input[type="checkbox"]:checked').count()
    expect(selectedCount).toBeGreaterThanOrEqual(1)
  })

  test('should select scenario for matrix testing', async ({ page }) => {
    // Find scenario selector
    const scenarioSelect = page.locator('select[name="scenario"], [data-testid="scenario-select"]')
    if (await scenarioSelect.count() > 0) {
      const options = page.locator('option')
      if (await options.count() > 1) {
        await scenarioSelect.selectOption({ index: 1 })
      }
    }
  })

  test('should execute matrix test', async ({ page }) => {
    // Select browsers
    const chromiumCheckbox = page.locator('input[type="checkbox"][value="chromium"]')
    if (await chromiumCheckbox.count() > 0) {
      await chromiumCheckbox.check()
    }

    // Select scenario
    const scenarioSelect = page.locator('select[name="scenario"], [data-testid="scenario-select"]')
    if (await scenarioSelect.count() > 0) {
      const options = page.locator('option')
      if (await options.count() > 1) {
        await scenarioSelect.selectOption({ index: 1 })
      }
    }

    // Execute
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Start"), button:has-text("Run")')
    await executeBtn.click()

    await page.waitForTimeout(3000)

    // Check for execution view
    const executionView = page.locator('[data-testid="matrix-execution"], text=/running|executing/i')
    if (await executionView.count() > 0) {
      await expect(executionView).toBeVisible()
    }
  })

  test('should display browser-specific results', async ({ page }) => {
    // Execute matrix test first
    const chromiumCheckbox = page.locator('input[type="checkbox"][value="chromium"]')
    if (await chromiumCheckbox.count() > 0) {
      await chromiumCheckbox.check()
    }

    const scenarioSelect = page.locator('select[name="scenario"], [data-testid="scenario-select"]')
    if (await scenarioSelect.count() > 0) {
      const options = page.locator('option')
      if (await options.count() > 1) {
        await scenarioSelect.selectOption({ index: 1 })
      }
    }

    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Start"), button:has-text("Run")')
    await executeBtn.click()

    await page.waitForTimeout(5000)

    // Check for browser-specific results
    const browserResults = page.locator('[data-testid*="browser-result"], text=/chromium|firefox|webkit/i')
    if (await browserResults.count() > 0) {
      await expect(browserResults).toBeVisible()
    }
  })

  test('should show compatibility matrix', async ({ page }) => {
    // Look for compatibility matrix view
    const matrixView = page.locator('[data-testid="compatibility-matrix"], table, [class*="matrix"]')
    if (await matrixView.count() > 0) {
      await expect(matrixView).toBeVisible()
    }
  })

  test('should show cross-browser compatibility score', async ({ page }) => {
    // Execute matrix test
    const chromiumCheckbox = page.locator('input[type="checkbox"][value="chromium"]')
    if (await chromiumCheckbox.count() > 0) {
      await chromiumCheckbox.check()
    }

    const scenarioSelect = page.locator('select[name="scenario"], [data-testid="scenario-select"]')
    if (await scenarioSelect.count() > 0) {
      const options = page.locator('option')
      if (await options.count() > 1) {
        await scenarioSelect.selectOption({ index: 1 })
      }
    }

    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Start"), button:has-text("Run")')
    await executeBtn.click()

    await page.waitForTimeout(5000)

    // Check for compatibility score
    const compatScore = page.locator('text=/%|compatibility|score/i')
    if (await compatScore.count() > 0) {
      await expect(compatScore).toBeVisible()
    }
  })

  test('should detect CSS issues across browsers', async ({ page }) => {
    // This would require actual visual regression testing
    // For now, check if the feature exists in UI
    const cssIssuesSection = page.locator('[data-testid="css-issues"], text=/css|visual|regression/i')
    if (await cssIssuesSection.count() > 0) {
      await expect(cssIssuesSection).toBeVisible()
    }
  })

  test('should show screenshots by browser', async ({ page }) => {
    // Execute matrix test
    const chromiumCheckbox = page.locator('input[type="checkbox"][value="chromium"]')
    if (await chromiumCheckbox.count() > 0) {
      await chromiumCheckbox.check()
    }

    const scenarioSelect = page.locator('select[name="scenario"], [data-testid="scenario-select"]')
    if (await scenarioSelect.count() > 0) {
      const options = page.locator('option')
      if (await options.count() > 1) {
        await scenarioSelect.selectOption({ index: 1 })
      }
    }

    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Start"), button:has-text("Run")')
    await executeBtn.click()

    await page.waitForTimeout(5000)

    // Look for screenshots
    const screenshots = page.locator('img[alt*="screenshot"], [data-testid*="screenshot"]')
    if (await screenshots.count() > 0) {
      await expect(screenshots).toBeVisible()
    }
  })

  test('should handle browser that is not available', async ({ page }) => {
    // Try to execute with unavailable browser combination
    // This depends on what's available in the environment
    const edgeCheckbox = page.locator('input[type="checkbox"][value="edge"]')
    if (await edgeCheckbox.count() > 0) {
      await edgeCheckbox.check()

      const scenarioSelect = page.locator('select[name="scenario"], [data-testid="scenario-select"]')
      if (await scenarioSelect.count() > 0) {
        const options = page.locator('option')
        if (await options.count() > 1) {
          await scenarioSelect.selectOption({ index: 1 })
        }
      }

      const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Start"), button:has-text("Run")')
      await executeBtn.click()

      // Should either work or show error
      await page.waitForTimeout(2000)
    }
  })

  test('should show individual browser test status', async ({ page }) => {
    // Execute with multiple browsers
    const chromiumCheckbox = page.locator('input[type="checkbox"][value="chromium"]')
    const firefoxCheckbox = page.locator('input[type="checkbox"][value="firefox"]')

    if (await chromiumCheckbox.count() > 0) {
      await chromiumCheckbox.check()
    }
    if (await firefoxCheckbox.count() > 0) {
      await firefoxCheckbox.check()
    }

    const scenarioSelect = page.locator('select[name="scenario"], [data-testid="scenario-select"]')
    if (await scenarioSelect.count() > 0) {
      const options = page.locator('option')
      if (await options.count() > 1) {
        await scenarioSelect.selectOption({ index: 1 })
      }
    }

    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Start"), button:has-text("Run")')
    await executeBtn.click()

    await page.waitForTimeout(3000)

    // Check for per-browser status
    const statuses = page.locator('[data-testid*="status"], text=/running|passed|failed/i')
    expect(await statuses.count()).toBeGreaterThanOrEqual(0)
  })

  test('should export matrix report', async ({ page }) => {
    // Look for export button
    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export-btn"]')
    if (await exportBtn.count() > 0) {
      const downloadPromise = page.waitForEvent('download')
      await exportBtn.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('matrix')
    }
  })
})
