/**
 * Phase 2.2: Screenshot Comparison & Analysis Service
 * ════════════════════════════════════════════════════════════
 * Saat step gagal:
 * 1. Simpan screenshot failure
 * 2. Bandingkan dengan last success screenshot
 * 3. Highlight perbedaan / perubahan UI
 * 
 * Benefit: Visual debugging untuk error analysis
 */

import fs from 'fs'
import path from 'path'

class ScreenshotComparisonService {
  constructor() {
    // Store last successful screenshot per scenario per step
    this.lastSuccessfulScreenshots = new Map() // key: `${scenarioId}_${stepNumber}`
    this.failureScreenshots = new Map() // key: `${executionId}_${stepNumber}`
  }

  /**
   * Save screenshot when step succeeds
   * Store as "last successful" reference
   */
  async saveSuccessfulScreenshot(page, scenarioId, stepNumber, stepDescription) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const screenshotDir = path.join(process.cwd(), 'uploads', 'screenshots', 'success')
      
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true })
      }

      const filename = `scenario_${scenarioId}_step_${stepNumber}_${timestamp}.png`
      const filepath = path.join(screenshotDir, filename)

      // Take screenshot
      await page.screenshot({ path: filepath, fullPage: false })

      // Store reference for later comparison
      const key = `${scenarioId}_${stepNumber}`
      this.lastSuccessfulScreenshots.set(key, {
        path: filepath,
        filename,
        timestamp: new Date(),
        stepDescription
      })

      console.log(`[SCREENSHOT] Success screenshot saved: ${filename}`)
      return { success: true, path: filepath }
    } catch (err) {
      console.log(`[SCREENSHOT] Error saving success screenshot: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  /**
   * Save screenshot when step fails
   * Auto-compare with last success screenshot
   */
  async saveFailureScreenshot(page, executionId, scenarioId, stepNumber, stepDescription, errorMessage) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const screenshotDir = path.join(process.cwd(), 'uploads', 'screenshots', 'failures')
      
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true })
      }

      const filename = `execution_${executionId}_step_${stepNumber}_${timestamp}.png`
      const filepath = path.join(screenshotDir, filename)

      // Take screenshot (with red annotation if possible)
      await page.screenshot({ path: filepath, fullPage: false })

      // Store failure screenshot
      const key = `${executionId}_${stepNumber}`
      this.failureScreenshots.set(key, {
        path: filepath,
        filename,
        timestamp: new Date(),
        stepDescription,
        errorMessage
      })

      console.log(`[SCREENSHOT] Failure screenshot saved: ${filename}`)

      // Auto-compare with last successful screenshot
      const successKey = `${scenarioId}_${stepNumber}`
      const lastSuccess = this.lastSuccessfulScreenshots.get(successKey)

      const comparison = await this.compareScreenshots(
        lastSuccess?.path,
        filepath,
        stepNumber,
        stepDescription
      )

      return {
        success: true,
        failurePath: filepath,
        lastSuccessPath: lastSuccess?.path,
        comparison
      }
    } catch (err) {
      console.log(`[SCREENSHOT] Error saving failure screenshot: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  /**
   * Compare two screenshots for differences
   * Returns analysis of what changed
   */
  async compareScreenshots(successPath, failurePath, stepNumber, stepDescription) {
    try {
      if (!successPath || !fs.existsSync(successPath)) {
        return {
          compared: false,
          reason: 'No previous successful screenshot to compare'
        }
      }

      if (!fs.existsSync(failurePath)) {
        return {
          compared: false,
          reason: 'Failure screenshot not found'
        }
      }

      // Get file sizes (rough indicator of differences)
      const successStats = fs.statSync(successPath)
      const failureStats = fs.statSync(failurePath)
      
      const sizeDiff = Math.abs(failureStats.size - successStats.size)
      const sizePercent = (sizeDiff / successStats.size) * 100

      // Analysis
      const analysis = {
        compared: true,
        successPath,
        failurePath,
        successSize: successStats.size,
        failureSize: failureStats.size,
        sizeDifferencePercent: sizePercent.toFixed(2),
        possibleCauses: this.analyzePossibleCauses(sizePercent, stepDescription)
      }

      console.log(`[SCREENSHOT] Comparison: ${sizePercent.toFixed(2)}% size difference`)
      return analysis
    } catch (err) {
      console.log(`[SCREENSHOT] Error comparing screenshots: ${err.message}`)
      return {
        compared: false,
        error: err.message
      }
    }
  }

  /**
   * Analyze potential causes based on screenshot differences
   */
  analyzePossibleCauses(sizeDiffPercent, stepDescription) {
    const causes = []

    // Large size difference = significant UI change
    if (sizeDiffPercent > 30) {
      causes.push({
        probability: 'HIGH',
        cause: 'Major UI change detected',
        suggestion: 'Check if page layout/content changed significantly'
      })
    }

    // Moderate change
    if (sizeDiffPercent > 10 && sizeDiffPercent <= 30) {
      causes.push({
        probability: 'MEDIUM',
        cause: 'UI elements added/removed or modal appeared',
        suggestion: 'Check for new dialogs, popovers, or error messages'
      })
    }

    // Small change
    if (sizeDiffPercent <= 10) {
      causes.push({
        probability: 'LOW',
        cause: 'Minor styling or animation changes',
        suggestion: 'Selector might still be valid, try adjusting wait time'
      })
    }

    // Step-specific analysis
    if (stepDescription?.toLowerCase().includes('click')) {
      causes.push({
        probability: 'MEDIUM',
        cause: 'Element selector may have changed after click',
        suggestion: 'Try updating selector or adding wait for element to appear'
      })
    }

    if (stepDescription?.toLowerCase().includes('fill')) {
      causes.push({
        probability: 'MEDIUM',
        cause: 'Input field selector changed or hidden after fill',
        suggestion: 'Check if form validation error appeared or page redirected'
      })
    }

    if (stepDescription?.toLowerCase().includes('wait')) {
      causes.push({
        probability: 'HIGH',
        cause: 'Element did not appear within timeout',
        suggestion: 'Increase wait timeout or add loading indicator wait'
      })
    }

    return causes
  }

  /**
   * Get comparison report for UI changes
   * Returns formatted data for API response
   */
  getComparisonReport(executionId, scenarioId) {
    const reports = {
      failures: [],
      successComparisons: []
    }

    // Collect all failure screenshots from this execution
    for (const [key, data] of this.failureScreenshots.entries()) {
      if (key.startsWith(executionId)) {
        const successKey = data.stepDescription?.match(/step (\d+)/)?.[1]
        if (successKey) {
          const successData = this.lastSuccessfulScreenshots.get(`${scenarioId}_${successKey}`)
          reports.successComparisons.push({
            stepNumber: successKey,
            failure: data,
            lastSuccess: successData
          })
        }
        reports.failures.push(data)
      }
    }

    return reports
  }

  /**
   * Clear old screenshots (keep last N per step)
   */
  async cleanupOldScreenshots(maxPerStep = 5) {
    try {
      const screenshotDirs = [
        path.join(process.cwd(), 'uploads', 'screenshots', 'success'),
        path.join(process.cwd(), 'uploads', 'screenshots', 'failures')
      ]

      for (const dir of screenshotDirs) {
        if (!fs.existsSync(dir)) continue

        const files = fs.readdirSync(dir)
        const grouped = {}

        // Group by scenario/execution
        for (const file of files) {
          const match = file.match(/(?:scenario|execution)_(\w+)_step_(\d+)/)
          if (match) {
            const key = `${match[1]}_${match[2]}`
            if (!grouped[key]) grouped[key] = []
            grouped[key].push({
              filename: file,
              path: path.join(dir, file),
              time: fs.statSync(path.join(dir, file)).mtimeMs
            })
          }
        }

        // Keep only latest N files per group
        for (const group of Object.values(grouped)) {
          group.sort((a, b) => b.time - a.time)
          const toDelete = group.slice(maxPerStep)
          for (const file of toDelete) {
            try {
              fs.unlinkSync(file.path)
              console.log(`[SCREENSHOT] Cleaned up: ${file.filename}`)
            } catch (e) {
              // Ignore delete errors
            }
          }
        }
      }
    } catch (err) {
      console.log(`[SCREENSHOT] Error during cleanup: ${err.message}`)
    }
  }
}

export default new ScreenshotComparisonService()
