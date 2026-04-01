import { chromium } from 'playwright'
import { prisma } from '../lib/prisma.js'
import fs from 'fs'
import path from 'path'

/**
 * Comprehensive execution service using Playwright
 * Handles test scenario execution and step-by-step automation
 */

export const executionService = {
  /**
   * Execute a complete test scenario
   */
  async executeScenario(userId, scenarioId) {
    // Validate scenario exists and belongs to user
    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId, userId },
      include: { testSteps: { orderBy: { stepNumber: 'asc' } } }
    })

    if (!scenario) {
      throw new Error('Scenario not found')
    }

    if (scenario.testSteps.length === 0) {
      throw new Error('Scenario has no test steps')
    }

    // Create execution record
    const execution = await prisma.execution.create({
      data: {
        userId,
        scenarioId,
        status: 'RUNNING',
        totalSteps: scenario.testSteps.length,
        startTime: new Date()
      },
      include: { stepResults: true }
    })

    let browser = null
    let context = null
    let page = null

    try {
      // Launch browser in headed mode so user can watch execution in real-time
      browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized'],
        slowMo: 400  // slow down actions so user can follow each step
      })
      context = await browser.newContext({ viewport: null })
      page = await context.newPage()

      // ═══ DIALOG HANDLING — auto-accept alert/confirm/prompt ═══
      page.on('dialog', async (dialog) => {
        try {
          const type = dialog.type() // 'alert', 'confirm', 'prompt', 'beforeunload'
          if (type === 'prompt') {
            await dialog.accept('') // Accept with empty string
          } else {
            await dialog.accept()
          }
        } catch { /* dialog may already be dismissed */ }
      })

      // ═══ NEW TAB/POPUP HANDLING — track pages opened via target="_blank" or window.open ═══
      const allPages = [page]
      context.on('page', async (newPage) => {
        allPages.push(newPage)
        // Auto-dismiss dialogs on new tabs too
        newPage.on('dialog', async (dialog) => {
          try { await dialog.accept() } catch {}
        })
      })

      // Collect page console errors for diagnostics
      const pageErrors = []
      page.on('pageerror', (err) => {
        pageErrors.push({ type: 'PAGE_ERROR', message: err.message, timestamp: new Date().toISOString() })
      })
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          pageErrors.push({ type: 'CONSOLE_ERROR', message: msg.text(), timestamp: new Date().toISOString() })
        }
      })

      // Collect failed network requests for diagnostics
      const failedRequests = []
      page.on('requestfailed', (request) => {
        failedRequests.push({
          url: request.url(),
          method: request.method(),
          failure: request.failure()?.errorText || 'unknown',
          timestamp: new Date().toISOString()
        })
      })

      let passedSteps = 0
      let failedSteps = 0

      // Execute each step
      for (const step of scenario.testSteps) {
        const stepStartTime = Date.now()
        let stepStatus = 'PASSED'
        let errorMessage = null

        // Clear per-step diagnostics
        pageErrors.length = 0
        failedRequests.length = 0

        try {
          // Execute step based on type
          switch (step.type) {
            case 'NAVIGATE':
              await this.executeNavigate(page, step)
              break

            case 'CLICK':
              await this.executeClick(page, step)
              break

            case 'FILL':
              await this.executeFill(page, step)
              break

            case 'WAIT':
              await this.executeWait(step)
              break

            case 'ASSERTION':
              await this.executeAssertion(page, step)
              break

            case 'SCREENSHOT':
              await this.executeScreenshot(page, execution.id, step)
              break

            case 'API_CALL':
              await this.executeApiCall(step)
              break

            default:
              throw new Error(`Unknown step type: ${step.type}`)
          }

          passedSteps++
        } catch (error) {
          stepStatus = 'FAILED'

          // Build rich error detail
          let currentUrl = ''
          try { currentUrl = page.url() } catch (_) {}

          const errorDetail = {
            message: error.message,
            step: {
              number: step.stepNumber,
              type: step.type,
              selector: step.selector || null,
              value: step.type === 'FILL' ? step.value : (step.type === 'NAVIGATE' ? step.value : null),
              description: step.description
            },
            page: {
              url: currentUrl
            },
            consoleErrors: pageErrors.slice(-5),
            failedRequests: failedRequests.slice(-5)
          }

          errorMessage = JSON.stringify(errorDetail)
          failedSteps++
        }

        // Record step result
        const stepDuration = Date.now() - stepStartTime
        const stepResult = await prisma.stepResult.create({
          data: {
            executionId: execution.id,
            testStepId: step.id,
            status: stepStatus,
            errorMessage,
            duration: stepDuration
          }
        })

        // Capture screenshot after every step (except WAIT and API_CALL which have no page state change worth capturing)
        if (page && step.type !== 'API_CALL') {
          try {
            const screenshotDir = path.resolve('./uploads/screenshots')
            if (!fs.existsSync(screenshotDir)) {
              fs.mkdirSync(screenshotDir, { recursive: true })
            }
            const filename = `exec-${execution.id}-step-${step.stepNumber}.png`
            const filepath = path.join(screenshotDir, filename)
            await page.screenshot({ path: filepath, fullPage: false })

            await prisma.screenshot.create({
              data: {
                url: `/api/screenshots/${filename}`,
                executionId: execution.id,
                stepResultId: stepResult.id
              }
            })
          } catch (screenshotErr) {
            console.error(`Screenshot capture failed for step ${step.stepNumber}:`, screenshotErr.message)
          }
        }

        // Stop execution if step failed
        if (stepStatus === 'FAILED') {
          break
        }
      }

      // Update execution record
      const endTime = new Date()
      const duration = endTime - execution.startTime

      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: failedSteps > 0 ? 'FAILED' : 'PASSED',
          endTime,
          duration,
          passedSteps,
          failedSteps
        }
      })

      return {
        execution: {
          id: execution.id,
          status: failedSteps > 0 ? 'FAILED' : 'PASSED',
          passedSteps,
          failedSteps,
          totalSteps: scenario.testSteps.length,
          duration,
          startTime: execution.startTime,
          endTime
        }
      }
    } catch (error) {
      // Mark execution as failed
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          endTime: new Date()
        }
      })

      error.executionId = execution.id
      throw error
    } finally {
      // Cleanup
      if (page) {
        await page.close().catch(() => {})
      }
      if (context) {
        await context.close().catch(() => {})
      }
      if (browser) {
        await browser.close().catch(() => {})
      }
    }
  },

  /**
   * Execute NAVIGATE step - Navigate to URL with smart wait
   */
  async executeNavigate(page, step) {
    if (!step.value) {
      throw new Error('NAVIGATE step requires a URL in value field')
    }

    try {
      new URL(step.value) // Validate URL
    } catch (error) {
      throw new Error(`Invalid URL: ${step.value}`)
    }

    await page.goto(step.value, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // Smart wait: wait for load + networkidle (with fallback timeout)
    await page.waitForLoadState('load').catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    // Extra: wait for any SPA framework to finish rendering
    await page.waitForTimeout(300)
  },

  /**
   * Execute CLICK step - Click on element with smart wait and retry
   */
  async executeClick(page, step) {
    if (!step.selector) {
      throw new Error('CLICK step requires a selector')
    }

    const locator = this.resolveLocator(page, step.selector)

    // Smart wait: try visible first, fallback to attached (for off-screen elements)
    try {
      await locator.waitFor({ state: 'visible', timeout: 10000 })
    } catch {
      // Element might exist but not be visible yet — wait for it to attach, then scroll
      await locator.waitFor({ state: 'attached', timeout: 5000 })
      await locator.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {})
    }

    // Retry click once on failure (handles detached element / re-render race)
    try {
      await locator.click({ timeout: 10000 })
    } catch (firstErr) {
      // Wait a beat for any re-render to settle, then retry
      await page.waitForTimeout(500)
      await locator.click({ timeout: 10000 })
    }

    // After click: wait for potential navigation or network activity to settle
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  },

  /**
   * Execute FILL step - Fill input field
   * Handles checkbox/radio, contenteditable, and select elements
   */
  async executeFill(page, step) {
    if (!step.selector) {
      throw new Error('FILL step requires a selector')
    }

    const value = step.value ?? ''
    const locator = this.resolveLocator(page, step.selector)

    // Smart wait: try visible, fallback to attached
    try {
      await locator.waitFor({ state: 'visible', timeout: 10000 })
    } catch {
      await locator.waitFor({ state: 'attached', timeout: 5000 })
      await locator.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {})
    }

    // Detect element properties
    const tagName = await locator.evaluate(el => el.tagName.toLowerCase()).catch(() => '')
    const inputType = await locator.getAttribute('type').catch(() => null)
    const isEditable = await locator.evaluate(el => el.isContentEditable).catch(() => false)

    // Checkbox
    if (inputType === 'checkbox') {
      const isChecked = await locator.isChecked()
      if (value === 'false' || value === 'uncheck') {
        if (isChecked) await locator.uncheck({ timeout: 10000 })
      } else {
        if (!isChecked) await locator.check({ timeout: 10000 })
      }
      return
    }

    // Radio
    if (inputType === 'radio') {
      await locator.check({ timeout: 10000 })
      return
    }

    // Select dropdown
    if (tagName === 'select') {
      await locator.selectOption(value, { timeout: 10000 })
      return
    }

    // Contenteditable (rich text editors: CKEditor, Quill, ProseMirror, etc.)
    if (isEditable) {
      await locator.click({ timeout: 5000 }) // Focus the editor
      await locator.evaluate((el, val) => {
        el.innerHTML = ''
        el.focus()
      }, value)
      await page.keyboard.type(value, { delay: 30 })
      return
    }

    // Standard input/textarea — try fill, fallback to type
    try {
      await locator.fill(value, { timeout: 10000 })
    } catch (fillErr) {
      // Some custom input components block .fill() — fallback to click + keyboard
      await locator.click({ timeout: 5000 })
      await locator.evaluate(el => { if (el.select) el.select(); }) // Select all existing text
      await page.keyboard.type(value, { delay: 30 })
    }
  },

  /**
   * Execute WAIT step - Wait for time
   */
  async executeWait(step) {
    let waitTime = 1000 // Default 1 second

    if (step.value && !isNaN(step.value)) {
      waitTime = parseInt(step.value)
    }

    if (waitTime < 0 || waitTime > 60000) {
      throw new Error('Wait time must be between 0 and 60000 ms')
    }

    await new Promise(resolve => setTimeout(resolve, waitTime))
  },

  /**
   * Execute ASSERTION step - Verify element or text
   */
  async executeAssertion(page, step) {
    if (!step.selector && !step.value) {
      throw new Error('ASSERTION step requires selector or value')
    }

    // If selector is provided, check if element exists
    if (step.selector) {
      const element = this.resolveLocator(page, step.selector)
      const count = await element.count()

      if (count === 0) {
        throw new Error(`Element not found: ${step.selector}`)
      }

      // If value is provided, check element content/value
      if (step.value) {
        const content = await element.first().textContent()
        if (!content || !content.includes(step.value)) {
          throw new Error(
            `Expected text "${step.value}" not found in element "${step.selector}"`
          )
        }
      }
    } else if (step.value) {
      // Check if text exists anywhere on page
      const hasText = await page.getByText(step.value).count()
      if (hasText === 0) {
        throw new Error(`Text not found on page: ${step.value}`)
      }
    }
  },

  /**
   * Execute SCREENSHOT step - Capture screenshot
   */
  async executeScreenshot(page, executionId, step) {
    const filename = `execution-${executionId}-step-${step.stepNumber}.png`
    const filepath = `./uploads/screenshots/${filename}`

    // Take screenshot
    const screenshot = await page.screenshot({ path: filepath })

    // Store screenshot metadata
    // (in real implementation, would save to database)

    return filepath
  },

  /**
   * Execute API_CALL step - Make HTTP request
   */
  async executeApiCall(step) {
    if (!step.value) {
      throw new Error('API_CALL step requires URL in value field')
    }

    const metadata = step.metadata ? JSON.parse(step.metadata) : {}
    const method = metadata.method || 'GET'
    const headers = metadata.headers || {}
    const body = metadata.body

    try {
      const url = new URL(step.value)
      const response = await fetch(step.value, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined
      })

      if (!response.ok) {
        throw new Error(
          `API call failed: ${response.status} ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`)
    }
  },

  /**
   * Resolve a selector string into a Playwright locator.
   * Handles: Shadow DOM (>>>), XPath, :has-text, CSS selectors
   */
  resolveLocator(page, selector) {
    if (!selector) throw new Error('Selector is empty')

    // Handle Shadow DOM piercing with >>> combinator
    if (selector.includes(' >>> ')) {
      const segments = selector.split(' >>> ')
      let locator = page.locator(segments[0])
      for (let i = 1; i < segments.length; i++) {
        locator = locator.locator(segments[i])
      }
      return locator
    }

    // Handle XPath selectors (starts with / or //)
    if (selector.startsWith('/') || selector.startsWith('//')) {
      return page.locator(`xpath=${selector}`)
    }

    // Handle explicit xpath= prefix
    if (selector.startsWith('xpath=')) {
      return page.locator(selector)
    }

    // Handle button:has-text("text") or a:has-text("text")
    const hasTextMatch = selector.match(/^(\w+):has-text\("(.+)"\)$/)
    if (hasTextMatch) {
      const [, tag, text] = hasTextMatch
      if (tag === 'button') {
        return page.getByRole('button', { name: text, exact: true })
      }
      if (tag === 'a') {
        return page.getByRole('link', { name: text, exact: true })
      }
      return page.locator(tag, { hasText: text })
    }

    // Handle generic :has-text("text") anywhere in selector
    if (selector.includes(':has-text(')) {
      const parts = selector.match(/^(.*):has-text\("(.+)"\)$/)
      if (parts) {
        const [, base, text] = parts
        const baseSelector = base.trim() || '*'
        return page.locator(baseSelector, { hasText: text })
      }
    }

    // Standard CSS selector
    return page.locator(selector)
  },

  /**
   * Get execution history
   */
  async getExecutionHistory(userId, scenarioId = null, limit = 20, offset = 0) {
    const where = { userId }
    if (scenarioId) {
      where.scenarioId = scenarioId
    }

    const executions = await prisma.execution.findMany({
      where,
      include: {
        scenario: { select: { name: true } },
        stepResults: {
          include: { screenshot: true, testStep: true },
          orderBy: { testStep: { stepNumber: 'asc' } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.execution.count({ where })

    return {
      executions,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  },

  /**
   * Get execution details
   */
  async getExecutionDetails(userId, executionId) {
    const execution = await prisma.execution.findFirst({
      where: { id: executionId, userId },
      include: {
        scenario: { select: { name: true, url: true } },
        stepResults: {
          include: { testStep: true, screenshot: true },
          orderBy: { testStep: { stepNumber: 'asc' } }
        }
      }
    })

    if (!execution) {
      throw new Error('Execution not found')
    }

    return execution
  },

  /**
   * Cancel running execution
   */
  async cancelExecution(userId, executionId) {
    const execution = await prisma.execution.findFirst({
      where: { id: executionId, userId }
    })

    if (!execution) {
      throw new Error('Execution not found')
    }

    if (execution.status !== 'RUNNING') {
      throw new Error('Cannot cancel completed execution')
    }

    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        errorMessage: 'Execution cancelled by user',
        endTime: new Date()
      }
    })

    return { message: 'Execution cancelled' }
  },

  /**
   * Delete execution
   */
  async deleteExecution(userId, executionId) {
    const execution = await prisma.execution.findFirst({
      where: { id: executionId, userId }
    })

    if (!execution) {
      throw new Error('Execution not found')
    }

    await prisma.execution.delete({
      where: { id: executionId }
    })

    return { message: 'Execution deleted' }
  },

  /**
   * Get execution statistics
   */
  async getExecutionStats(userId, scenarioId = null) {
    const where = { userId }
    if (scenarioId) {
      where.scenarioId = scenarioId
    }

    const executions = await prisma.execution.findMany({
      where,
      select: {
        status: true,
        duration: true,
        passedSteps: true,
        failedSteps: true
      }
    })

    const total = executions.length
    const passed = executions.filter(e => e.status === 'PASSED').length
    const failed = executions.filter(e => e.status === 'FAILED').length
    const avgDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0) / total || 0

    return {
      total,
      passed,
      failed,
      successRate: total > 0 ? (passed / total * 100).toFixed(2) : 0,
      averageDuration: Math.round(avgDuration),
      totalSteps: executions.reduce((sum, e) => sum + (e.passedSteps + e.failedSteps), 0)
    }
  },

  /**
   * Get single execution (alias for getExecutionDetails)
   */
  async getExecution(userId, executionId) {
    return this.getExecutionDetails(userId, executionId)
  },

  /**
   * Get multiple executions (alias for getExecutionHistory)
   */
  async getExecutions(userId, scenarioId = null, limit = 20, offset = 0) {
    return this.getExecutionHistory(userId, scenarioId, limit, offset)
  }
}
