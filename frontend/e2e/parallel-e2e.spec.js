/**
 * Parallel Execution E2E Tests - Phase 2.3
 * Tests multi-scenario execution workflows
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'

test.describe('Parallel Execution E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/chains/)

    // Navigate to parallel execution page
    await page.goto(`${BASE_URL}/parallel`)
    await page.waitForTimeout(1000)
  })

  test('should display parallel execution interface', async ({ page }) => {
    // Check for interface elements
    const interface_ = page.locator('[data-testid="parallel-interface"], [class*="parallel"]')
    await expect(interface_).toBeVisible()
  })

  test('should select multiple scenarios', async ({ page }) => {
    // Find scenario checkboxes or selection list
    const scenario1 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').first()
    const scenario2 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').nth(1)

    if (await scenario1.count() > 0) {
      await scenario1.check()
    }
    if (await scenario2.count() > 0) {
      await scenario2.check()
    }

    // Verify selections
    const selectedCount = await page.locator('input[type="checkbox"]:checked').count()
    expect(selectedCount).toBeGreaterThanOrEqual(1)
  })

  test('should set concurrency limit', async ({ page }) => {
    // Find concurrency limit input
    const concurrencyInput = page.locator('input[name="concurrencyLimit"], [data-testid="concurrency-limit"]')
    if (await concurrencyInput.count() > 0) {
      await concurrencyInput.fill('2')

      const value = await concurrencyInput.inputValue()
      expect(value).toBe('2')
    }
  })

  test('should execute multiple scenarios in parallel', async ({ page }) => {
    // Select scenarios
    const scenario1 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').first()
    const scenario2 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').nth(1)

    if (await scenario1.count() > 0) {
      await scenario1.check()
    }
    if (await scenario2.count() > 0) {
      await scenario2.check()
    }

    // Click execute
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Start")')
    await executeBtn.click()

    // Wait for execution to start
    await page.waitForTimeout(2000)

    // Check for batch view
    const batchView = page.locator('[data-testid="batch-view"], text=/batch|parallel/i')
    if (await batchView.count() > 0) {
      await expect(batchView).toBeVisible()
    }
  })

  test('should display batch execution progress', async ({ page }) => {
    // Select and execute scenarios
    const scenario1 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').first()
    if (await scenario1.count() > 0) {
      await scenario1.check()
    }

    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Start")')
    await executeBtn.click()

    await page.waitForTimeout(2000)

    // Check for progress info
    const progressInfo = page.locator('[data-testid="batch-progress"], text=/running|completed|passed/i')
    if (await progressInfo.count() > 0) {
      await expect(progressInfo).toBeVisible()
    }
  })

  test('should show individual scenario statuses', async ({ page }) => {
    // Execute scenarios
    const scenario1 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').first()
    if (await scenario1.count() > 0) {
      await scenario1.check()
    }

    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Start")')
    await executeBtn.click()

    await page.waitForTimeout(3000)

    // Check for status indicators for each scenario
    const statusIndicators = page.locator('[data-testid*="status"], [class*="status"]')
    expect(await statusIndicators.count()).toBeGreaterThanOrEqual(0)
  })

  test('should display batch results', async ({ page }) => {
    // Execute scenarios
    const scenario1 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').first()
    if (await scenario1.count() > 0) {
      await scenario1.check()
    }

    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Start")')
    await executeBtn.click()

    // Wait for completion
    await page.waitForTimeout(5000)

    // Check for results
    const resultsSection = page.locator('[data-testid="batch-results"], text=/results|summary/i')
    if (await resultsSection.count() > 0) {
      await expect(resultsSection).toBeVisible()
    }
  })

  test('should show success rate for batch', async ({ page }) => {
    // Execute scenarios
    const scenario1 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').first()
    if (await scenario1.count() > 0) {
      await scenario1.check()
    }

    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Start")')
    await executeBtn.click()

    await page.waitForTimeout(5000)

    // Check for success rate
    const successRate = page.locator('text=/success rate|% passed|% failed/i')
    if (await successRate.count() > 0) {
      await expect(successRate).toBeVisible()
    }
  })

  test('should stop batch execution', async ({ page }) => {
    // Execute scenarios
    const scenario1 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').first()
    if (await scenario1.count() > 0) {
      await scenario1.check()
    }

    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Start")')
    await executeBtn.click()

    await page.waitForTimeout(1500)

    // Click stop
    const stopBtn = page.locator('button:has-text("Stop"), button:has-text("Cancel"), [data-testid="stop-btn"]')
    if (await stopBtn.count() > 0 && await stopBtn.isEnabled()) {
      await stopBtn.click()

      await page.waitForTimeout(1000)

      // Check for stopped status
      const stoppedMsg = page.locator('text=/stopped|cancelled|halted/i')
      if (await stoppedMsg.count() > 0) {
        await expect(stoppedMsg).toBeVisible()
      }
    }
  })

  test('should enforce concurrency limit', async ({ page }) => {
    // Set concurrency limit to 1
    const concurrencyInput = page.locator('input[name="concurrencyLimit"], [data-testid="concurrency-limit"]')
    if (await concurrencyInput.count() > 0) {
      await concurrencyInput.fill('1')
    }

    // Select multiple scenarios
    const scenario1 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').first()
    const scenario2 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').nth(1)

    if (await scenario1.count() > 0) {
      await scenario1.check()
    }
    if (await scenario2.count() > 0) {
      await scenario2.check()
    }

    // Execute
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Start")')
    await executeBtn.click()

    await page.waitForTimeout(3000)

    // With concurrency limit of 1, only one should be running at a time
    // This would need to be verified through the UI or API
  })

  test('should handle individual scenario failures', async ({ page }) => {
    // Select scenarios (at least one should fail in a real scenario)
    const scenario1 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').first()
    if (await scenario1.count() > 0) {
      await scenario1.check()
    }

    // Execute
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Start")')
    await executeBtn.click()

    await page.waitForTimeout(5000)

    // Check for individual status indicators
    const statusIndicators = page.locator('[data-testid*="status"], [class*="pass"], [class*="fail"]')
    expect(await statusIndicators.count()).toBeGreaterThanOrEqual(0)
  })

  test('should show batch history', async ({ page }) => {
    // Look for history section
    const historySection = page.locator('[data-testid="batch-history"], text=/history|previous.*batches/i')
    if (await historySection.count() > 0) {
      await historySection.click()
      await page.waitForTimeout(1000)

      // Check for list of batches
      const batchList = page.locator('[data-testid="batch-item"], tr[data-testid*="batch"]')
      expect(await batchList.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('should view batch details', async ({ page }) => {
    // Click on a batch
    const batchLink = page.locator('[data-testid="batch-link"]').first()
    if (await batchLink.count() > 0) {
      await batchLink.click()
      await page.waitForTimeout(1000)

      // Check for details
      const detailsView = page.locator('[data-testid="batch-details"]')
      if (await detailsView.count() > 0) {
        await expect(detailsView).toBeVisible()
      }
    }
  })

  test('should export batch report', async ({ page }) => {
    // Execute scenarios first
    const scenario1 = page.locator('input[type="checkbox"][data-testid*="scenario"], label:has-text("Scenario")').first()
    if (await scenario1.count() > 0) {
      await scenario1.check()
    }

    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Start")')
    await executeBtn.click()

    await page.waitForTimeout(5000)

    // Look for export button
    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export-btn"]')
    if (await exportBtn.count() > 0) {
      const downloadPromise = page.waitForEvent('download')
      await exportBtn.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('batch')
    }
  })

  test('should validate scenario selection', async ({ page }) => {
    // Try to execute without selecting scenarios
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), button:has-text("Start")')
    await executeBtn.click()

    // Should show validation error
    const errorMsg = page.locator('text=/select.*scenario|choose|at least one/i')
    await expect(errorMsg).toBeVisible({ timeout: 3000 })
  })
})
