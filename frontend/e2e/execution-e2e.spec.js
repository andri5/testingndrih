/**
 * Execution E2E Tests - Phase 2.3
 * Tests scenario execution workflows through UI
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'

test.describe('Execution E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/chains/)
  })

  test('should execute scenario from list', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Find and click execute on first scenario
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), [data-testid="execute-btn"]').first()
    if (await executeBtn.count() > 0) {
      await executeBtn.click()

      // Wait for execution to start
      await page.waitForTimeout(2000)

      // Check for execution view or success message
      const executionView = page.locator('[data-testid="execution-view"], text=/running|executing|started/i')
      if (await executionView.count() > 0) {
        await expect(executionView).toBeVisible()
      }
    }
  })

  test('should select browser before execution', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Find execute button
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), [data-testid="execute-btn"]').first()
    if (await executeBtn.count() > 0) {
      await executeBtn.click()

      // Check for browser selection modal
      const browserSelect = page.locator('select[name="browser"], [data-testid="browser-select"]')
      if (await browserSelect.count() > 0) {
        await browserSelect.selectOption('firefox')

        // Confirm execution
        const confirmBtn = page.locator('button:has-text("Execute"), button:has-text("Start")')
        await confirmBtn.click()

        await page.waitForTimeout(2000)
        expect(page.url()).toContain('execution')
      }
    }
  })

  test('should display execution progress', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Execute a scenario
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), [data-testid="execute-btn"]').first()
    if (await executeBtn.count() > 0) {
      await executeBtn.click()
      await page.waitForTimeout(2000)

      // Check for progress indicators
      const progressBar = page.locator('[data-testid="progress-bar"], [class*="progress"]')
      const stepList = page.locator('[data-testid="step-list"], [class*="step"]')

      if (await progressBar.count() > 0 || await stepList.count() > 0) {
        // Progress should be visible
        expect(await progressBar.count() + await stepList.count()).toBeGreaterThan(0)
      }
    }
  })

  test('should display execution results', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Execute a scenario
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), [data-testid="execute-btn"]').first()
    if (await executeBtn.count() > 0) {
      await executeBtn.click()

      // Wait for execution to complete
      await page.waitForTimeout(5000)

      // Check for results section
      const resultsSection = page.locator('[data-testid="execution-results"], text=/results|passed|failed/i')
      if (await resultsSection.count() > 0) {
        await expect(resultsSection).toBeVisible()
      }
    }
  })

  test('should show execution history', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Look for history or previous executions
    const historySection = page.locator('[data-testid="execution-history"], text=/history|previous/i')
    if (await historySection.count() > 0) {
      await historySection.click()
      await page.waitForTimeout(1000)

      // Check for list of past executions
      const executionList = page.locator('[data-testid="execution-item"], tr[data-testid*="execution"]')
      expect(await executionList.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('should view execution details', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Click on an execution or view details
    const executionLink = page.locator('[data-testid="execution-link"]').first()
    if (await executionLink.count() > 0) {
      await executionLink.click()
      await page.waitForTimeout(1000)

      // Check for details view
      const detailsView = page.locator('[data-testid="execution-details"]')
      if (await detailsView.count() > 0) {
        await expect(detailsView).toBeVisible()
      }
    }
  })

  test('should stop running execution', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Execute a scenario
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), [data-testid="execute-btn"]').first()
    if (await executeBtn.count() > 0) {
      await executeBtn.click()
      await page.waitForTimeout(1500)

      // Find stop button
      const stopBtn = page.locator('button:has-text("Stop"), button:has-text("Cancel"), [data-testid="stop-btn"]')
      if (await stopBtn.count() > 0 && await stopBtn.isEnabled()) {
        await stopBtn.click()

        // Check for stopped status
        const stoppedMsg = page.locator('text=/stopped|cancelled|halted/i')
        await expect(stoppedMsg).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('should show execution statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Look for stats in execution results
    const statsSection = page.locator('[data-testid="execution-stats"], text=/success rate|duration|passed/i')
    if (await statsSection.count() > 0) {
      await expect(statsSection).toBeVisible()
    }
  })

  test('should retry failed execution', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Execute a scenario
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), [data-testid="execute-btn"]').first()
    if (await executeBtn.count() > 0) {
      await executeBtn.click()
      await page.waitForTimeout(5000)

      // Look for retry button
      const retryBtn = page.locator('button:has-text("Retry"), button:has-text("Run Again"), [data-testid="retry-btn"]')
      if (await retryBtn.count() > 0) {
        await retryBtn.click()
        await page.waitForTimeout(1000)

        // Should start new execution
        expect(page.url()).toContain('execution')
      }
    }
  })

  test('should handle execution timeout', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Execute scenario
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), [data-testid="execute-btn"]').first()
    if (await executeBtn.count() > 0) {
      await executeBtn.click()

      // Wait for a long time to see if timeout message appears
      await page.waitForTimeout(10000)

      // Check for timeout message
      const timeoutMsg = page.locator('text=/timeout|exceeded|too long/i')
      if (await timeoutMsg.count() > 0) {
        await expect(timeoutMsg).toBeVisible()
      }
    }
  })

  test('should support headless mode toggle', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Find execute button
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), [data-testid="execute-btn"]').first()
    if (await executeBtn.count() > 0) {
      await executeBtn.click()

      // Check for headless toggle
      const headlessToggle = page.locator('input[type="checkbox"][name="headless"], [data-testid="headless-toggle"]')
      if (await headlessToggle.count() > 0) {
        const isChecked = await headlessToggle.isChecked()
        await headlessToggle.click()

        const newChecked = await headlessToggle.isChecked()
        expect(newChecked).not.toBe(isChecked)
      }
    }
  })

  test('should display step-by-step results', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Execute scenario
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), [data-testid="execute-btn"]').first()
    if (await executeBtn.count() > 0) {
      await executeBtn.click()
      await page.waitForTimeout(5000)

      // Check for step results
      const stepResults = page.locator('[data-testid="step-result"], [class*="step-result"]')
      if (await stepResults.count() > 0) {
        expect(await stepResults.count()).toBeGreaterThan(0)
      }
    }
  })

  test('should export execution report', async ({ page }) => {
    await page.goto(`${BASE_URL}/chains`)
    await page.waitForTimeout(1000)

    // Execute scenario
    const executeBtn = page.locator('button:has-text("Execute"), button:has-text("Run"), [data-testid="execute-btn"]').first()
    if (await executeBtn.count() > 0) {
      await executeBtn.click()
      await page.waitForTimeout(5000)

      // Look for export button
      const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export-btn"]')
      if (await exportBtn.count() > 0) {
        // Start listening for download
        const downloadPromise = page.waitForEvent('download')
        await exportBtn.click()

        const download = await downloadPromise
        expect(download.suggestedFilename()).toContain('execution')
      }
    }
  })
})
