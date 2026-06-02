/**
 * Priority 3.3: Browser Matrix Execution
 * Execute same scenario across multiple browsers and versions
 * 
 * Supported browsers:
 * - chromium (Chromium/Chrome)
 * - firefox (Mozilla Firefox)
 * - webkit (Safari)
 * - edge (Microsoft Edge)
 * 
 * Features:
 * - Simultaneous execution on multiple browsers
 * - Cross-browser compatibility matrix
 * - Per-browser failure isolation
 * - Visual regression detection across browsers
 */

import { chromium, firefox, webkit } from 'playwright'
import { executionService } from './executionService.js'
import screenshotComparisonService from './screenshotComparisonService.js'
import { prisma } from '../lib/prisma.js'
import { logger } from '../lib/logger.js'
import browserLauncher from '../lib/browserLauncher.js'
import path from 'path'
import fs from 'fs'

const BROWSER_CONFIGS = {
  chromium: {
    name: 'Chromium',
    browserType: chromium,
    headless: true,  // Changed to true for server compatibility
    defaultViewport: { width: 1920, height: 1080 }
  },
  firefox: {
    name: 'Firefox',
    browserType: firefox,
    headless: true,  // Changed to true for server compatibility
    defaultViewport: { width: 1920, height: 1080 }
  },
  webkit: {
    name: 'WebKit (Safari)',
    browserType: webkit,
    headless: true,  // Changed to true for server compatibility
    defaultViewport: { width: 1920, height: 1080 }
  },
  edge: {
    name: 'Edge',
    browserType: chromium,
    headless: true,  // Changed to true for server compatibility
    channel: 'msedge',
    defaultViewport: { width: 1920, height: 1080 }
  }
}

export const browserMatrixService = {
  /**
   * Execute scenario on multiple browsers
   * @param {string} scenarioId
   * @param {Array<string>} browsers - ['chromium', 'firefox', 'webkit', 'edge']
   * @param {Object} options - { userId, concurrency }
   * @returns {Object} - { matrixExecutionId, results: Array }
   */
  async executeMatrix(scenarioId, browsers = ['chromium', 'firefox', 'webkit'], options = {}) {
    const { userId, concurrency = 2 } = options

    // Validate scenario exists
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: { steps: true }
    })

    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`)
    }

    // Validate browsers
    const validBrowsers = browsers.filter(b => BROWSER_CONFIGS[b])
    if (validBrowsers.length === 0) {
      throw new Error('No valid browsers specified')
    }

    // Create matrix execution record
    const matrixExecution = await prisma.matrixExecution.create({
      data: {
        userId,
        scenarioId,
        browsers: validBrowsers,
        status: 'RUNNING',
        startedAt: new Date()
      }
    })

    // Execute on each browser
    const results = []
    const browserPromises = validBrowsers.map((browserName, index) =>
      this._executeOnBrowser(scenario, browserName, matrixExecution.id, userId)
    )

    // Execute with concurrency limit
    const browserResults = await this._executeWithConcurrency(browserPromises, concurrency)
    results.push(...browserResults)

    // Calculate compatibility matrix
    const compatibilityMatrix = this._analyzeCompatibility(results)

    // Update matrix execution status
    const failureCount = results.filter(r => r.status === 'FAILED').length
    await prisma.matrixExecution.update({
      where: { id: matrixExecution.id },
      data: {
        status: failureCount > 0 ? 'PARTIAL_FAILURE' : 'SUCCESS',
        completedAt: new Date(),
        results: JSON.stringify(compatibilityMatrix)
      }
    })

    return {
      matrixExecutionId: matrixExecution.id,
      scenario: scenario.name,
      browsers: validBrowsers,
      results,
      compatibilityMatrix
    }
  },

  /**
   * Execute scenario on single browser
   * @private
   */
  async _executeOnBrowser(scenario, browserName, matrixExecutionId, userId) {
    const config = BROWSER_CONFIGS[browserName]
    const executionStartTime = Date.now()

    let browser = null
    let context = null
    let page = null

    try {
      // Launch browser with environment-aware settings
      const launchOptions = { headless: true }
      if (browserLauncher && browserLauncher.getBrowserLaunchOptions) {
        launchOptions = browserLauncher.getBrowserLaunchOptions(config.browserType, {
          headless: config.headless,
          channel: config.channel
        })
      }
      
      browser = await config.browserType.launch(launchOptions)

      // Create context and page
      context = await browser.createBrowserContext()
      page = await context.newPage()
      await page.setViewportSize(config.defaultViewport)

      const stepResults = []
      let lastError = null

      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i]

        try {
          const result = await this._executeStep(page, step, config.name)
          stepResults.push({ stepIndex: i, status: 'PASSED', result })
        } catch (error) {
          lastError = error

          // Save failure screenshot
          const screenshotPath = `uploads/matrix/${matrixExecutionId}/${browserName}/step-${i}-failure.png`
          try {
            await this._ensureDir(path.dirname(screenshotPath))
            await page.screenshot({ path: screenshotPath })
          } catch (screenshotErr) {
            logger.debug('browserMatrixService', `Failed to save screenshot: ${screenshotErr.message}`)
          }

          stepResults.push({
            stepIndex: i,
            status: 'FAILED',
            error: error.message
          })

          // Continue to next step (don't stop on first failure)
        }
      }

      // Calculate pass rate
      const passedCount = stepResults.filter(r => r.status === 'PASSED').length
      const passRate = ((passedCount / scenario.steps.length) * 100).toFixed(2)

      logger.debug('browserMatrixService', `${config.name} complete: ${passedCount}/${scenario.steps.length} passed (${passRate}%)`)

      return {
        browser: browserName,
        browserName: config.name,
        status: lastError ? 'FAILED' : 'PASSED',
        passedSteps: passedCount,
        totalSteps: scenario.steps.length,
        passRate: parseFloat(passRate),
        duration: (Date.now() - executionStartTime) / 1000,
        error: lastError?.message || null
      }
    } catch (error) {
      return {
        browser: browserName,
        browserName: config.name,
        status: 'FAILED',
        passedSteps: 0,
        totalSteps: scenario.steps.length,
        passRate: 0,
        duration: (Date.now() - executionStartTime) / 1000,
        error: error.message
      }
    } finally {
      // Cleanup
      if (page) await page.close().catch(() => {})
      if (context) await context.close().catch(() => {})
      if (browser) await browser.close().catch(() => {})
    }
  },

  /**
   * Execute single step on browser page
   * @private
   */
  async _executeStep(page, step, browserName) {
    const { type, selector, value, waitMs, timeout = 10000 } = step

    switch (type) {
      case 'NAVIGATE':
        logger.debug('browserMatrixService', `NAVIGATE: ${value}`)
        await page.goto(value, { waitUntil: 'networkidle' })
        break

      case 'CLICK':
        logger.debug('browserMatrixService', `CLICK: ${selector}`)
        const clickLocator = page.locator(selector)
        await clickLocator.waitFor({ state: 'visible', timeout })
        await clickLocator.click()
        break

      case 'FILL':
        logger.debug('browserMatrixService', `FILL: ${selector} = ${value}`)
        const fillLocator = page.locator(selector)
        await fillLocator.waitFor({ state: 'visible', timeout })
        await fillLocator.clear()
        await fillLocator.fill(value)
        break

      case 'WAIT':
        logger.debug('browserMatrixService', `WAIT: ${waitMs}ms`)
        await page.waitForTimeout(waitMs)
        break

      case 'SCREENSHOT':
        logger.debug('browserMatrixService', `SCREENSHOT`)
        await page.screenshot({ fullPage: true })
        break

      case 'ASSERTION':
        logger.debug('browserMatrixService', `ASSERTION: ${value}`)
        const assertionLocator = page.locator(selector)
        const assertionText = await assertionLocator.textContent()
        if (!assertionText?.includes(value)) {
          throw new Error(`Assertion failed: "${value}" not found in element text`)
        }
        break

      case 'SCROLL':
        logger.debug('browserMatrixService', `SCROLL`)
        await page.locator(selector).scrollIntoViewIfNeeded()
        break

      case 'HOVER':
        logger.debug('browserMatrixService', `HOVER: ${selector}`)
        await page.locator(selector).hover()
        break

      default:
        logger.warn('browserMatrixService', `Unknown step type: ${type}`)
    }
  },

  /**
   * Analyze compatibility across browsers
   * @private
   */
  _analyzeCompatibility(results) {
    const matrix = {
      summary: {
        totalBrowsers: results.length,
        fullyCrossCompatible: results.every(r => r.status === 'PASSED'),
        partiallyCompatible: results.some(r => r.status === 'PASSED'),
        incompatible: results.every(r => r.status === 'FAILED')
      },
      details: {},
      averagePassRate: 0
    }

    let totalPassRate = 0

    results.forEach(result => {
      matrix.details[result.browser] = {
        name: result.browserName,
        status: result.status,
        passRate: result.passRate,
        duration: result.duration,
        error: result.error
      }
      totalPassRate += result.passRate
    })

    matrix.averagePassRate = (totalPassRate / results.length).toFixed(2)

    return matrix
  },

  /**
   * Execute promises with concurrency limit
   * @private
   */
  async _executeWithConcurrency(promises, concurrency) {
    const results = []
    const executing = []

    for (const [index, promise] of promises.entries()) {
      const p = Promise.resolve(promise).then(res => {
        executing.splice(executing.indexOf(p), 1)
        return res
      })

      results.push(p)
      executing.push(p)

      if (executing.length >= concurrency) {
        await Promise.race(executing)
      }
    }

    return Promise.all(results)
  },

  /**
   * Ensure directory exists
   * @private
   */
  async _ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  },

  /**
   * Get matrix execution details
   * @param {string} matrixExecutionId
   */
  async getMatrixDetails(matrixExecutionId) {
    const matrix = await prisma.matrixExecution.findUnique({
      where: { id: matrixExecutionId },
      include: {
        scenario: {
          select: { id: true, name: true }
        }
      }
    })

    if (!matrix) {
      throw new Error('Matrix execution not found')
    }

    return {
      ...matrix,
      results: JSON.parse(matrix.results || '{}')
    }
  },

  /**
   * Get browser compatibility report
   * @param {string} scenarioId
   */
  async getCompatibilityReport(scenarioId) {
    const matrixExecutions = await prisma.matrixExecution.findMany({
      where: { scenarioId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: {
        scenario: {
          select: { name: true }
        }
      }
    })

    return {
      scenario: matrixExecutions[0]?.scenario.name || 'Unknown',
      recentExecutions: matrixExecutions.map(m => ({
        id: m.id,
        browsers: m.browsers,
        status: m.status,
        startedAt: m.startedAt,
        results: JSON.parse(m.results || '{}')
      }))
    }
  }
}
