import { chromium } from 'playwright'
import { prisma } from '../lib/prisma.js'

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
      // Launch browser
      browser = await chromium.launch()
      context = await browser.newContext()
      page = await context.newPage()

      let passedSteps = 0
      let failedSteps = 0

      // Execute each step
      for (const step of scenario.testSteps) {
        const stepStartTime = Date.now()
        let stepStatus = 'PASSED'
        let errorMessage = null

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
          errorMessage = error.message
          failedSteps++
        }

        // Record step result
        const stepDuration = Date.now() - stepStartTime
        await prisma.stepResult.create({
          data: {
            executionId: execution.id,
            testStepId: step.id,
            status: stepStatus,
            errorMessage,
            duration: stepDuration
          }
        })

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
   * Execute NAVIGATE step - Navigate to URL
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

    await page.goto(step.value, { waitUntil: 'networkidle' })
  },

  /**
   * Execute CLICK step - Click on element
   */
  async executeClick(page, step) {
    if (!step.selector) {
      throw new Error('CLICK step requires a selector')
    }

    // Wait for element and click
    await page.locator(step.selector).click()
  },

  /**
   * Execute FILL step - Fill input field
   */
  async executeFill(page, step) {
    if (!step.selector) {
      throw new Error('FILL step requires a selector')
    }
    if (!step.value) {
      throw new Error('FILL step requires a value')
    }

    // Clear and fill input
    await page.locator(step.selector).fill(step.value)
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
      const element = await page.locator(step.selector)
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
        stepResults: true
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
          include: { testStep: true }
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
  }
}
