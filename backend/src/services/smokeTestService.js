/**
 * Smoke Test Service
 * Purpose: Run quick smoke tests for rapid deployment validation
 * Smoke tests run critical paths only (2-5 minutes total)
 */

import { prisma } from '../lib/prisma.js'
import { executionService } from './executionService.js'
import { reportService } from './reportService.js'
import { notifyTestFailure } from './notificationService.js'

/**
 * Run smoke test on a scenario
 * Smoke tests run in fast mode with minimal validation
 * @param {string} scenarioId - Scenario to test
 * @param {object} options - Execution options
 * @returns {object} Execution result
 */
export async function runSmokeTest(scenarioId, options = {}) {
  try {
    console.log(`[SMOKE TEST] Starting smoke test for scenario: ${scenarioId}`)

    // Get scenario details
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        testSteps: { orderBy: { stepNumber: 'asc' } },
        user: true
      }
    })

    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`)
    }

    // Mark as smoke test
    const smokeExecutionOptions = {
      ...options,
      testType: 'SMOKE',
      isSmokeTest: true,
      // Smoke tests use these settings:
      headless: true, // Always headless for speed
      timeout: 300000, // 5 minute max timeout
      fastMode: true, // Skip detailed logging
      screenshotOnError: true,
      videoRecording: false // Skip video recording for speed
    }

    // Run the test using existing execution service
    const result = await executionService.executeScenario(
      scenario.userId,
      scenarioId,
      smokeExecutionOptions
    )
    const execution = result.execution

    // Mark execution as smoke test
    await prisma.execution.update({
      where: { id: execution.id },
      data: {
        testType: 'SMOKE',
        isSmokeTest: true
      }
    })

    // Analyze results
    const smokeResult = analyzeSmokeTestResult(execution)

    // Generate smoke report
    const report = await generateSmokeReport(execution, smokeResult)

    // Notify on failure (uses per-user Settings → Integrations preferences)
    await sendSmokeTestNotification(scenario, smokeResult, report)

    return {
      executionId: execution.id,
      status: smokeResult.status,
      passed: smokeResult.passed,
      failed: smokeResult.failed,
      duration: execution.duration,
      timestamp: execution.createdAt,
      report: report
    }
  } catch (error) {
    console.error(`[SMOKE TEST ERROR] ${error.message}`)
    throw error
  }
}

/**
 * Analyze smoke test result
 * Determines if smoke test PASSED or FAILED
 * @param {object} execution - Execution object
 * @returns {object} Analysis result
 */
export function analyzeSmokeTestResult(execution) {
  const passed = execution.passedSteps || 0
  const failed = execution.failedSteps || 0
  const total = execution.totalSteps || 0

  // Smoke tests are PASS only if 100% steps pass
  const status = failed === 0 && passed === total ? 'SMOKE_PASSED' : 'SMOKE_FAILED'
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0

  return {
    status,
    passed,
    failed,
    total,
    passRate,
    duration: execution.duration,
    failureDetails: execution.failureDetails || []
  }
}

/**
 * Get smoke test critical paths for a scenario
 * Critical paths are the most important user flows
 * @param {string} scenarioId - Scenario ID
 * @returns {array} Critical test steps
 */
export async function getSmokeCriticalPaths(scenarioId) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    include: {
      testSteps: {
        orderBy: { stepNumber: 'asc' }
      }
    }
  })

  if (!scenario) {
    throw new Error(`Scenario not found: ${scenarioId}`)
  }

  return scenario.testSteps
}

/**
 * Mark a scenario as smoke test
 * These scenarios run automatically on deployment
 * @param {string} scenarioId - Scenario ID
 * @returns {object} Updated scenario
 */
export async function markAsSmoke(scenarioId) {
  const scenario = await prisma.scenario.update({
    where: { id: scenarioId },
    data: { isSmoke: true }
  })

  console.log(`[SMOKE TEST] Marked scenario as smoke test: ${scenarioId}`)
  return scenario
}

/**
 * Get all smoke test scenarios
 * @returns {array} List of smoke test scenarios
 */
export async function getSmokeScenarios() {
  return await prisma.scenario.findMany({
    where: { isSmoke: true },
    include: {
      testSteps: { orderBy: { stepNumber: 'asc' } },
      user: { select: { id: true, email: true, name: true } }
    }
  })
}

/**
 * Run all smoke tests
 * This is typically called on each deployment
 * @param {object} options - Execution options
 * @returns {object} Summary of all smoke test results
 */
export async function runAllSmokeTests(options = {}) {
  try {
    console.log(`[SMOKE TEST] Running all smoke tests...`)

    const smokeScenarios = await getSmokeScenarios()

    if (smokeScenarios.length === 0) {
      console.log(`[SMOKE TEST] No smoke test scenarios configured`)
      return {
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        results: []
      }
    }

    const results = []
    let passedCount = 0
    let failedCount = 0
    const startTime = Date.now()

    console.log(`[SMOKE TEST] Running ${smokeScenarios.length} smoke tests...`)

    // Run tests sequentially to avoid overwhelming the system
    for (const scenario of smokeScenarios) {
      try {
        const result = await runSmokeTest(scenario.id, options)
        results.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          ...result
        })

        if (result.status === 'SMOKE_PASSED') {
          passedCount++
        } else {
          failedCount++
        }

        console.log(
          `[SMOKE TEST] ✅ ${scenario.name}: ${result.status} (${result.duration}ms)`
        )
      } catch (error) {
        failedCount++
        results.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          status: 'SMOKE_FAILED',
          error: error.message
        })

        console.error(
          `[SMOKE TEST] ❌ ${scenario.name}: FAILED - ${error.message}`
        )
      }
    }

    const duration = Date.now() - startTime

    const summary = {
      totalTests: smokeScenarios.length,
      passed: passedCount,
      failed: failedCount,
      passRate: smokeScenarios.length > 0
        ? ((passedCount / smokeScenarios.length) * 100).toFixed(2)
        : 0,
      duration: duration,
      results: results,
      timestamp: new Date()
    }

    // Send summary notification if configured
    if (options.notifyOnComplete) {
      await sendSmokeTestSummary(summary)
    }

    return summary
  } catch (error) {
    console.error(`[SMOKE TEST ERROR] ${error.message}`)
    throw error
  }
}

/**
 * Generate smoke test report
 * @param {object} execution - Execution record
 * @param {object} smokeResult - Analysis result
 * @returns {object} Report
 */
export async function generateSmokeReport(execution, smokeResult) {
  const report = {
    executionId: execution.id,
    status: smokeResult.status,
    passed: smokeResult.passed,
    failed: smokeResult.failed,
    total: smokeResult.total,
    passRate: smokeResult.passRate,
    duration: smokeResult.duration,
    durationFormatted: formatDuration(smokeResult.duration),
    timestamp: new Date(),
    summary: `Smoke test ${smokeResult.status}: ${smokeResult.passed}/${smokeResult.total} steps passed`,
    failures: smokeResult.failureDetails || []
  }

  return report
}

/**
 * Get smoke test history
 * @param {string} scenarioId - Scenario ID
 * @param {number} limit - Number of recent tests to return
 * @returns {array} History of smoke tests
 */
export async function getSmokeTestHistory(scenarioId, limit = 10) {
  return await prisma.execution.findMany({
    where: {
      scenarioId,
      testType: 'SMOKE'
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      status: true,
      passedSteps: true,
      failedSteps: true,
      totalSteps: true,
      duration: true,
      createdAt: true
    }
  })
}

/**
 * Get smoke test summary
 * Overall statistics for smoke tests
 * @returns {object} Summary statistics
 */
export async function getSmokeTestSummary() {
  const executions = await prisma.execution.findMany({
    where: { testType: 'SMOKE' },
    select: {
      id: true,
      status: true,
      duration: true,
      createdAt: true
    }
  })

  const passed = executions.filter(e => e.status === 'SMOKE_PASSED').length
  const failed = executions.filter(e => e.status === 'SMOKE_FAILED').length
  const total = executions.length

  const avgDuration = total > 0
    ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / total
    : 0

  return {
    totalTests: total,
    passed,
    failed,
    passRate: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
    avgDuration: Math.round(avgDuration),
    recentTests: executions.slice(0, 10)
  }
}

/**
 * Send smoke test notification
 * @param {object} scenario - Scenario details
 * @param {object} smokeResult - Test result
 * @param {object} report - Test report
 */
export async function sendSmokeTestNotification(scenario, smokeResult, report) {
  try {
    if (smokeResult.status !== 'SMOKE_PASSED' && scenario.userId) {
      await notifyTestFailure({
        userId: scenario.userId,
        type: 'smoke',
        scenarioName: scenario.name,
        status: smokeResult.status,
        executionId: report?.executionId,
        errorMessage: smokeResult.failureDetails?.join('; '),
        passedSteps: smokeResult.passed,
        totalSteps: smokeResult.total
      })
    }
    console.log(`[SMOKE TEST] Test complete for ${scenario.user?.email || scenario.userId}`)
  } catch (error) {
    console.error(`[SMOKE TEST] Failed to send notification: ${error.message}`)
  }
}

/**
 * Send smoke test summary notification
 * @param {object} summary - Test summary
 */
export async function sendSmokeTestSummary(summary) {
  try {
    const subject = `Smoke Test Summary: ${summary.passed}/${summary.totalTests} Passed`

    const emailBody = `
Smoke Test Run Summary

Total Tests: ${summary.totalTests}
Passed: ${summary.passed}
Failed: ${summary.failed}
Pass Rate: ${summary.passRate}%
Total Duration: ${formatDuration(summary.duration)}

Results:
${summary.results
  .map(
    r =>
      `- ${r.scenarioName}: ${r.status} (${r.duration}ms)`
  )
  .join('\n')}
    `

    // TODO: Send to notification system or Slack
    console.log(`[SMOKE TEST SUMMARY]\n${emailBody}`)
  } catch (error) {
    console.error(`[SMOKE TEST] Failed to send summary: ${error.message}`)
  }
}

/**
 * Format duration in milliseconds to readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
  if (!ms) return '0ms'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
