import { firefox } from 'playwright'
import { prisma } from '../lib/prisma.js'
import fs from 'fs'
import path from 'path'
import { EventEmitter } from 'events'
import { suggestAlternativeLocators } from './locatorSuggestionService.js'
import locatorRepairService from './locatorRepairService.js'
import screenshotComparisonService from './screenshotComparisonService.js'
import { retryEngineService } from './retryEngineService.js'

/* Phase 2.1: Self Healing Selector configuration */
const ENABLE_SELF_HEALING = true
const SELF_HEALING_TIMEOUT = 5000

/* Phase 2.2: Screenshot on Failure configuration */
const ENABLE_SCREENSHOT_COMPARISON = true

/**
 * Event bus for live execution streaming (SSE)
 * Events: 'step-start', 'step-done', 'execution-done'
 */
export const executionEvents = new EventEmitter()
executionEvents.setMaxListeners(50)

/**
 * Store active Playwright pages during execution
 * Maps executionId -> { page, context, browser }
 * Used for live selector testing feature
 */
const activePages = new Map()

/**
 * Control signals for live viewer pause/stop
 * cancelledExecutions: set of executionIds requested to stop
 * pausedExecutions: set of executionIds currently paused
 */
export const cancelledExecutions = new Set()
export const pausedExecutions = new Set()

/**
 * Comprehensive execution service using Playwright
 * Handles test scenario execution and step-by-step automation
 */

export const executionService = {
  /**
   * Get active page for selector testing during live execution
   */
  getActivePage(executionId) {
    return activePages.get(executionId)?.page || null
  },

  /**
   * Test a selector on the active page and get element info
   * Returns: { found, text, tagName, className, boundingBox, preview }
   */
  async testSelector(executionId, selector) {
    const pageData = activePages.get(executionId)
    if (!pageData) {
      throw new Error('Execution not running or page not available')
    }

    const { page } = pageData

    try {
      // Try to find element with the selector
      const element = await page.$(selector)
      if (!element) {
        return { found: false, selector, error: 'Element not found' }
      }

      // Element found — get details
      const info = await page.evaluate((sel) => {
        const el = document.querySelector(sel)
        if (!el) return null
        
        const rect = el.getBoundingClientRect()
        return {
          tagName: el.tagName,
          text: el.textContent?.substring(0, 100) || '',
          className: el.className,
          id: el.id,
          boundingBox: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          isVisible: rect.width > 0 && rect.height > 0
        }
      }, selector)

      if (!info) {
        return { found: false, selector, error: 'Element found but cannot access properties' }
      }

      // Highlight element in browser
      await page.evaluate((sel) => {
        const el = document.querySelector(sel)
        if (el && el.style) {
          el.style.outline = '3px solid #10B981'
          el.dataset.testingndrihHighlight = 'true'
        }
      }, selector)

      return {
        found: true,
        selector,
        ...info
      }
    } catch (err) {
      return {
        found: false,
        selector,
        error: err.message
      }
    }
  },

  /**
   * Clear highlight from page
   */
  async clearHighlight(executionId) {
    const pageData = activePages.get(executionId)
    if (!pageData) return

    const { page } = pageData
    try {
      await page.evaluate(() => {
        document.querySelectorAll('[data-testingndrih-highlight]').forEach(el => {
          el.style.outline = ''
          delete el.dataset.testingndrihHighlight
        })
      })
    } catch { /* ignore */ }
  },

  /**
   * Execute a complete test scenario
   */
  async executeScenario(userId, scenarioId, options = {}) {
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
        browser: options.browser || 'chromium',
        headless: options.headless ?? false,
        startTime: new Date()
      },
      include: { stepResults: true }
    })

    let browser = null
    let context = null
    let page = null

    try {
      // Headed mode: we have Xvfb virtual display in Docker, so always run headed
      // This produces better video recordings and more realistic test execution
      const useHeadless = options.headless === true
      const slowMo = options.slowMo ?? (useHeadless ? 0 : 300)

      // Mobile device emulation: look up Playwright device descriptor if requested
      const { chromium: chromiumBrowser, firefox, webkit, devices: playwrightDevices } = await import('playwright')
      const browserEngines = { chromium: chromiumBrowser, firefox, webkit }

      let deviceDescriptor = null
      if (options.device) {
        const { MOBILE_DEVICES } = await import('./browserService.js')
        const mobilePreset = MOBILE_DEVICES.find(d => d.key === options.device)
        if (mobilePreset && playwrightDevices[mobilePreset.playwrightDevice]) {
          deviceDescriptor = playwrightDevices[mobilePreset.playwrightDevice]
          // Use the engine required by the device (webkit for iPhone/iPad, chromium for Android)
          options.browser = mobilePreset.engine
        }
      }

      const selectedBrowserName = options.browser && browserEngines[options.browser] ? options.browser : 'chromium'
      const browserEngine = browserEngines[selectedBrowserName]

      browser = await browserEngine.launch({
        headless: useHeadless,
        args: selectedBrowserName === 'chromium' ? ['--no-sandbox'] : [],
        slowMo
      })

      // Video recording setup
      const videoDir = path.resolve('./uploads/videos')
      if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, { recursive: true })
      }

      const contextOptions = deviceDescriptor
        ? { ...deviceDescriptor, recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } } }
        : { viewport: null, recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } } }

      context = await browser.newContext(contextOptions)
      page = await context.newPage()

      // Store page for live selector testing
      activePages.set(execution.id, { page, context, browser })

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
      let stopped = false

      // Execute each step
      for (const step of scenario.testSteps) {
        // Check for stop signal from live viewer before starting step
        if (cancelledExecutions.has(execution.id)) {
          cancelledExecutions.delete(execution.id)
          stopped = true
          break
        }

        const stepStartTime = Date.now()
        let stepStatus = 'PASSED'
        let errorMessage = null

        // Emit step-start event for live viewer
        executionEvents.emit(`exec:${execution.id}`, {
          event: 'step-start',
          stepNumber: step.stepNumber,
          totalSteps: scenario.testSteps.length,
          type: step.type,
          description: step.description,
          selector: step.selector
        })

        // Clear per-step diagnostics
        pageErrors.length = 0
        failedRequests.length = 0

        // Parse per-step retry config from metadata (e.g. {"maxRetries":2})
        let maxRetries = 0
        try {
          if (step.metadata) {
            const meta = JSON.parse(step.metadata)
            if (typeof meta.maxRetries === 'number' && meta.maxRetries > 0) {
              maxRetries = Math.min(meta.maxRetries, 5) // cap at 5
            }
          }
        } catch { /* ignore bad metadata JSON */ }

        const executeStepOnce = async () => {
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

            case 'HOVER':
              await this.executeHover(page, step)
              break

            case 'SCROLL':
              await this.executeScroll(page, step)
              break

            case 'FILE_UPLOAD':
              await this.executeFileUpload(page, step)
              break

            case 'DRAG':
              await this.executeDrag(page, step)
              break

            case 'MOCK_ROUTE':
              await this.executeMockRoute(page, step)
              break

            default:
              throw new Error(`Unknown step type: ${step.type}`)
          }
        }

        try {
          // Priority 3.1: Smart Retry Engine for CLICK and FILL steps
          // Use intelligent failure classification and retry strategies
          if (['CLICK', 'FILL'].includes(step.type)) {
            const stepExecutor = async (params) => {
              if (step.type === 'CLICK') {
                await this.executeClick(params.page, step)
              } else if (step.type === 'FILL') {
                await this.executeFill(params.page, step)
              }
            }

            try {
              const retryResult = await retryEngineService.attemptRetry(stepExecutor, {
                page,
                step,
                stepType: step.type
              })

              if (!retryResult?.success) {
                throw retryResult?.error || new Error('Step execution failed')
              }
            } catch (err) {
              // If retry engine doesn't handle it, at least log the failure type
              const failureType = retryEngineService.classifyFailure(err, {
                step,
                stepType: step.type,
                errorMessage: err.message
              })
              console.log(`[RETRY] Step ${step.stepNumber} (${step.type}): ${failureType}`)
              throw err
            }
          } else {
            // Other step types: basic retry loop
            let lastErr = null
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
              try {
                await executeStepOnce()
                lastErr = null
                break // success
              } catch (err) {
                lastErr = err
                if (attempt < maxRetries) {
                  console.warn(`Step ${step.stepNumber} attempt ${attempt + 1} failed, retrying...`)
                  await new Promise(r => setTimeout(r, 1000)) // 1s wait between retries
                }
              }
            }
            if (lastErr) throw lastErr
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

          // Smart Locator Suggestions — analyze DOM for alternatives (no AI needed)
          if (step.selector && ['CLICK', 'FILL', 'ASSERTION'].includes(step.type)) {
            try {
              const suggestions = await suggestAlternativeLocators(
                page, step.selector, step.type, step.description, step.value
              )
              if (suggestions.length > 0) {
                errorDetail.locatorSuggestions = suggestions
              }
            } catch (suggestErr) {
              console.error('Locator suggestion generation failed:', suggestErr.message)
            }
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

            // Jika step gagal, ambil fullPage screenshot untuk lebih banyak konteks
            if (stepStatus === 'FAILED') {
              // Inject error overlay pada halaman sebelum screenshot
              try {
                const errMsg = errorMessage ? JSON.parse(errorMessage).message : 'Unknown error'
                await page.evaluate((info) => {
                  const ov = document.createElement('div')
                  ov.id = '__err_overlay'
                  ov.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:rgba(220,38,38,0.95);color:white;font:13px/1.4 sans-serif;padding:12px 16px;box-shadow:0 -2px 8px rgba(0,0,0,0.3)'
                  ov.innerHTML = '<b>❌ Step ' + info.stepNum + ' FAILED:</b> ' + info.type + ' — ' + info.errMsg.substring(0, 200)
                  + (info.selector ? '<br><b>Selector:</b> ' + info.selector : '')
                  document.body.appendChild(ov)
                }, { stepNum: step.stepNumber, type: step.type, errMsg: errMsg, selector: step.selector || '' })
              } catch { /* ignore overlay injection errors */ }

              await page.screenshot({ path: filepath, fullPage: true })

              // Phase 2.2: Screenshot Comparison on Failure
              if (ENABLE_SCREENSHOT_COMPARISON) {
                try {
                  const errMsg = errorMessage ? JSON.parse(errorMessage).message : 'Unknown error'
                  const comparisonResult = await screenshotComparisonService.saveFailureScreenshot(
                    page,
                    execution.id,
                    execution.scenarioId,
                    step.stepNumber,
                    step.description || step.type,
                    errMsg
                  )
                  if (comparisonResult.success && comparisonResult.comparison) {
                    // Attach comparison to error detail for API response
                    try {
                      const errorDetail = JSON.parse(errorMessage)
                      errorDetail.screenshotComparison = comparisonResult.comparison
                      errorMessage = JSON.stringify(errorDetail)
                    } catch { /* keep original error message */ }
                  }
                } catch (compErr) {
                  console.log(`[SCREENSHOT] Comparison failed: ${compErr.message}`)
                }
              }

              // Hapus overlay setelah screenshot
              try { await page.evaluate(() => { const el = document.getElementById('__err_overlay'); if (el) el.remove() }) } catch {}
            } else {
              await page.screenshot({ path: filepath, fullPage: false })

              // Phase 2.2: Save successful screenshot for future comparison
              if (ENABLE_SCREENSHOT_COMPARISON) {
                try {
                  await screenshotComparisonService.saveSuccessfulScreenshot(
                    page,
                    execution.scenarioId,
                    step.stepNumber,
                    step.description || step.type
                  )
                } catch (successScreenErr) {
                  console.log(`[SCREENSHOT] Success screenshot save failed: ${successScreenErr.message}`)
                }
              }
            }

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

        // Emit step-done event for live viewer
        executionEvents.emit(`exec:${execution.id}`, {
          event: 'step-done',
          stepNumber: step.stepNumber,
          totalSteps: scenario.testSteps.length,
          status: stepStatus,
          type: step.type,
          description: step.description,
          duration: Date.now() - stepStartTime,
          screenshotUrl: `/api/screenshots/exec-${execution.id}-step-${step.stepNumber}.png`,
          errorMessage: stepStatus === 'FAILED' ? (errorMessage || null) : null,
          passedSteps,
          failedSteps
        })

        // Stop execution if step failed
        if (stepStatus === 'FAILED') {
          break
        }

        // Check for pause signal from live viewer
        if (pausedExecutions.has(execution.id)) {
          executionEvents.emit(`exec:${execution.id}`, {
            event: 'execution-paused',
            stepNumber: step.stepNumber
          })
          while (pausedExecutions.has(execution.id)) {
            if (cancelledExecutions.has(execution.id)) {
              pausedExecutions.delete(execution.id)
              cancelledExecutions.delete(execution.id)
              stopped = true
              break
            }
            await new Promise(r => setTimeout(r, 300))
          }
          if (stopped) break
          executionEvents.emit(`exec:${execution.id}`, {
            event: 'execution-resumed',
            stepNumber: step.stepNumber
          })
        }

        // Check stop again after potential pause exit
        if (cancelledExecutions.has(execution.id)) {
          cancelledExecutions.delete(execution.id)
          stopped = true
          break
        }
      }

      // Update execution record
      const endTime = new Date()
      const duration = endTime - execution.startTime

      // Retrieve video path if recorded
      let videoPath = null
      try {
        const video = page.video()
        if (video) {
          const rawPath = await video.path()
          if (rawPath) {
            const videoFilename = `exec-${execution.id}.webm`
            const destPath = path.join(path.resolve('./uploads/videos'), videoFilename)
            fs.renameSync(rawPath, destPath)
            videoPath = `/api/videos/${videoFilename}`
          }
        }
      } catch (videoErr) {
        console.error('Video save failed:', videoErr.message)
      }

      const finalStatus = stopped ? 'FAILED' : (failedSteps > 0 ? 'FAILED' : 'PASSED')
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: finalStatus,
          endTime,
          duration,
          passedSteps,
          failedSteps,
          videoPath,
          ...(stopped ? { errorMessage: 'Execution stopped by user' } : {})
        }
      })

      // Emit execution-done event for live viewer
      executionEvents.emit(`exec:${execution.id}`, {
        event: 'execution-done',
        status: finalStatus,
        passedSteps,
        failedSteps,
        totalSteps: scenario.testSteps.length,
        duration,
        videoPath
      })

      return {
        execution: {
          id: execution.id,
          status: finalStatus,
          passedSteps,
          failedSteps,
          totalSteps: scenario.testSteps.length,
          duration,
          startTime: execution.startTime,
          endTime,
          videoPath
        }
      }
    } catch (error) {
      // Emit execution-error event
      executionEvents.emit(`exec:${execution.id}`, {
        event: 'execution-done',
        status: 'FAILED',
        errorMessage: error.message
      })

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
      // Remove from active pages for selector testing
      activePages.delete(execution.id)

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
   * Execute CLICK step - Click on element with smart wait and retry + self-healing fallback
   * Phase 2.1: Self Healing if selector fails
   */
  async executeClick(page, step) {
    if (!step.selector) {
      throw new Error('CLICK step requires a selector')
    }

    let locator = this.resolveLocator(page, step.selector)

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
      try {
        await locator.click({ timeout: 10000 })
      } catch (secondErr) {
        // Phase 2.1: Self Healing Selector fallback
        if (ENABLE_SELF_HEALING) {
          console.log(`[SELF_HEAL] Primary click failed, attempting repair for: ${step.selector}`)
          try {
            const repairedSelector = await locatorRepairService.repairLocator(page, step.selector, {
              type: 'CLICK',
              description: step.description,
              value: step.value
            })
            if (repairedSelector) {
              console.log(`[SELF_HEAL] ✅ Repaired selector: ${repairedSelector}`)
              locator = this.resolveLocator(page, repairedSelector)
              await locator.click({ timeout: 10000 })
              // Update step with repaired selector for future use
              step.selector = repairedSelector
              return
            }
          } catch (repairErr) {
            console.log(`[SELF_HEAL] Repair failed: ${repairErr.message}`)
          }
        }
        throw secondErr
      }
    }

    // After click: wait for potential navigation or network activity to settle
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  },

  /**
   * Execute FILL step - Fill input field with self-healing fallback
   * Handles checkbox/radio, contenteditable, and select elements
   * Phase 2.1: Self Healing if selector fails
   */
  async executeFill(page, step) {
    if (!step.selector) {
      throw new Error('FILL step requires a selector')
    }

    const value = step.value ?? ''
    let locator = this.resolveLocator(page, step.selector)

    // Smart wait: try visible, fallback to attached
    try {
      await locator.waitFor({ state: 'visible', timeout: 10000 })
    } catch (waitErr) {
      try {
        await locator.waitFor({ state: 'attached', timeout: 5000 })
        await locator.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {})
      } catch (attachErr) {
        // Phase 2.1: Self Healing Selector - Element not found
        if (ENABLE_SELF_HEALING) {
          console.log(`[SELF_HEAL] FILL locator not found, attempting repair for: ${step.selector}`)
          try {
            const repairedSelector = await locatorRepairService.repairLocator(page, step.selector, {
              type: 'FILL',
              description: step.description,
              value: step.value
            })
            if (repairedSelector) {
              console.log(`[SELF_HEAL] ✅ Repaired selector: ${repairedSelector}`)
              locator = this.resolveLocator(page, repairedSelector)
              await locator.waitFor({ state: 'visible', timeout: 10000 }).catch(() =>
                locator.waitFor({ state: 'attached', timeout: 5000 })
              )
              step.selector = repairedSelector
            } else {
              throw attachErr
            }
          } catch (repairErr) {
            console.log(`[SELF_HEAL] Repair failed: ${repairErr.message}`)
            throw attachErr
          }
        } else {
          throw attachErr
        }
      }
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
   * Supports:
   *   count:N         — expect exactly N elements matching selector
   *   visible         — element must be visible
   *   hidden          — element must be hidden/not visible
   *   not-exists      — element must NOT exist on page
   *   regex:/pattern/ — element text must match regex
   *   <plain text>    — element contains text (existing behaviour)
   */
  async executeAssertion(page, step) {
    if (!step.selector && !step.value) {
      throw new Error('ASSERTION step requires selector or value')
    }

    const assertValue = (step.value || '').trim()

    if (step.selector) {
      const element = this.resolveLocator(page, step.selector)

      // not-exists: element must be absent
      if (assertValue === 'not-exists') {
        const count = await element.count()
        if (count > 0) {
          throw new Error(`Expected element to NOT exist but found ${count}: ${step.selector}`)
        }
        return
      }

      // count:N — exact element count
      const countMatch = assertValue.match(/^count:(\d+)$/)
      if (countMatch) {
        const expected = parseInt(countMatch[1])
        const actual = await element.count()
        if (actual !== expected) {
          throw new Error(`Expected ${expected} element(s) but found ${actual}: ${step.selector}`)
        }
        return
      }

      // visible — element must be in DOM and visible
      if (assertValue === 'visible' || assertValue === '') {
        const count = await element.count()
        if (count === 0) {
          throw new Error(`Element not found: ${step.selector}`)
        }
        const isVisible = await element.first().isVisible()
        if (!isVisible) {
          throw new Error(`Element exists but is not visible: ${step.selector}`)
        }
        return
      }

      // hidden — element must be hidden or not visible
      if (assertValue === 'hidden') {
        const count = await element.count()
        if (count > 0) {
          const isVisible = await element.first().isVisible()
          if (isVisible) {
            throw new Error(`Expected element to be hidden but it is visible: ${step.selector}`)
          }
        }
        return
      }

      // Check element exists first for remaining assertions
      const count = await element.count()
      if (count === 0) {
        throw new Error(`Element not found: ${step.selector}`)
      }

      const content = await element.first().textContent().catch(() => '')

      // regex:/pattern/[flags] — text must match regex
      const regexMatch = assertValue.match(/^regex:\/(.+)\/([gimsuy]*)$/)
      if (regexMatch) {
        const [, pattern, flags] = regexMatch
        const re = new RegExp(pattern, flags)
        if (!re.test(content || '')) {
          throw new Error(
            `Regex /${pattern}/${flags} did not match element text "${(content || '').substring(0, 100)}"`
          )
        }
        return
      }

      // Plain text — element must contain the value as substring
      if (!content || !content.includes(assertValue)) {
        throw new Error(
          `Expected text "${assertValue}" not found in element "${step.selector}". Actual: "${(content || '').substring(0, 100)}"`
        )
      }
    } else if (assertValue) {
      // No selector — check page-level text
      // regex:/pattern/ in page text
      const regexMatch = assertValue.match(/^regex:\/(.+)\/([gimsuy]*)$/)
      if (regexMatch) {
        const [, pattern, flags] = regexMatch
        const re = new RegExp(pattern, flags)
        const pageText = await page.evaluate(() => document.documentElement.innerText || '')
        if (!re.test(pageText)) {
          throw new Error(`Regex /${pattern}/${flags} did not match page text`)
        }
        return
      }

      const hasText = await page.getByText(assertValue).count()
      if (hasText === 0) {
        throw new Error(`Text not found on page: ${assertValue}`)
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
   * Execute HOVER step - Hover over element
   */
  async executeHover(page, step) {
    if (!step.selector) {
      throw new Error('HOVER step requires a selector')
    }
    const locator = this.resolveLocator(page, step.selector)
    try {
      await locator.waitFor({ state: 'visible', timeout: 10000 })
    } catch {
      await locator.waitFor({ state: 'attached', timeout: 5000 })
      await locator.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {})
    }
    await locator.hover({ timeout: 10000 })
    // Small pause so tooltips / hover menus appear before next step
    await page.waitForTimeout(300)
  },

  /**
   * Execute SCROLL step - Scroll page or element
   * value: pixel delta (positive = down, negative = up)
   * selector: optional — if provided, scrolls inside that element
   */
  async executeScroll(page, step) {
    const delta = parseInt(step.value) || 300
    if (step.selector) {
      // Scroll to element into view
      const locator = this.resolveLocator(page, step.selector)
      await locator.scrollIntoViewIfNeeded({ timeout: 10000 }).catch(() => {})
    } else {
      // Scroll the main page by delta
      await page.evaluate((d) => { window.scrollBy(0, d) }, delta)
    }
    await page.waitForTimeout(200)
  },

  /**
   * Execute FILE_UPLOAD step - Set files on a file input
   * value: pipe-separated file names OR a single path/glob
   * In CI/test mode, we skip if files are not present on disk
   */
  async executeFileUpload(page, step) {
    if (!step.selector) {
      throw new Error('FILE_UPLOAD step requires a selector')
    }
    if (!step.value) {
      throw new Error('FILE_UPLOAD step requires file paths in value field')
    }

    const locator = this.resolveLocator(page, step.selector)
    try {
      await locator.waitFor({ state: 'attached', timeout: 10000 })
    } catch {
      throw new Error(`File input not found: ${step.selector}`)
    }

    // File paths stored as pipe-separated list
    const filePaths = step.value.split('|').map(f => f.trim()).filter(Boolean)

    // Filter to only existing files; skip if none exist (allows replay without real files)
    const existingFiles = filePaths.filter(f => {
      try { return fs.existsSync(f) } catch { return false }
    })
    if (existingFiles.length === 0) {
      console.warn(`FILE_UPLOAD: none of [${filePaths.join(', ')}] found on disk — step skipped`)
      return
    }

    await locator.setInputFiles(existingFiles, { timeout: 10000 })
  },

  /**
   * Execute a DRAG step: drag source element onto target element using Playwright's dragTo API.
   * step.selector = source CSS/XPath selector
   * step.value    = target CSS/XPath selector
   */
  async executeDrag(page, step) {
    if (!step.selector || !step.value) {
      throw new Error('DRAG step requires a source selector and a target selector in the value field')
    }
    const source = this.resolveLocator(page, step.selector)
    const target = this.resolveLocator(page, step.value)
    await source.waitFor({ state: 'visible', timeout: 10000 })
    await target.waitFor({ state: 'visible', timeout: 10000 })
    await source.dragTo(target, { timeout: 15000 })
    await page.waitForTimeout(300)
  },

  /**
   * Execute a MOCK_ROUTE step: intercept network requests matching a URL glob/regex.
   * step.value    = URL glob pattern (e.g. "**\/api\/users*")
   * step.metadata = JSON string with override options:
   *   { status, body, contentType, headers, passthrough }
   *   passthrough:true → forward to real server unchanged
   */
  async executeMockRoute(page, step) {
    if (!step.value) {
      throw new Error('MOCK_ROUTE step requires a URL pattern in the value field')
    }
    let meta = {}
    if (step.metadata) {
      try { meta = JSON.parse(step.metadata) } catch { meta = {} }
    }
    const status = meta.status ?? 200
    const body   = meta.body ?? {}
    const contentType = meta.contentType || 'application/json'
    const headers     = meta.headers     || {}
    await page.route(step.value, async (route) => {
      if (meta.passthrough) {
        await route.continue()
        return
      }
      await route.fulfill({
        status,
        contentType,
        headers,
        body: typeof body === 'string' ? body : JSON.stringify(body)
      })
    })
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
        return page.getByRole('button', { name: text, exact: false })
      }
      if (tag === 'a') {
        return page.getByRole('link', { name: text, exact: false })
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

    // Signal the running loop to stop immediately
    cancelledExecutions.add(executionId)

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
   * Signal a running execution to stop (from live viewer, no auth required)
   */
  viewerStop(executionId) {
    cancelledExecutions.add(executionId)
    return { message: 'Stop signal sent' }
  },

  /**
   * Signal a running execution to pause (from live viewer, no auth required)
   */
  viewerPause(executionId) {
    pausedExecutions.add(executionId)
    return { message: 'Pause signal sent' }
  },

  /**
   * Resume a paused execution (from live viewer, no auth required)
   */
  viewerResume(executionId) {
    pausedExecutions.delete(executionId)
    return { message: 'Resume signal sent' }
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
