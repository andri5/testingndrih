/**
 * Stress Test Service
 * Purpose: Run stress tests with load profiles and performance metrics
 * Validates system behavior under stress (concurrency + iterations)
 */

import { prisma } from '../lib/prisma.js'
import { executionService } from './executionService.js'
import { reportService } from './reportService.js'

// Load profile configurations
export const STRESS_PROFILES = {
  LIGHT: {
    name: 'Light',
    concurrency: 2,
    iterations: 3,
    timeout: 600000 // 10 minutes
  },
  MEDIUM: {
    name: 'Medium',
    concurrency: 5,
    iterations: 5,
    timeout: 900000 // 15 minutes
  },
  HEAVY: {
    name: 'Heavy',
    concurrency: 10,
    iterations: 10,
    timeout: 1200000 // 20 minutes
  },
  EXTREME: {
    name: 'Extreme',
    concurrency: 20,
    iterations: 20,
    timeout: 1800000 // 30 minutes
  }
}

/**
 * Run stress test on a scenario with selected profile
 * Executes test concurrently and repeatedly to measure performance
 * @param {string} scenarioId - Scenario to stress test
 * @param {object} options - Execution options with profile selection
 * @returns {object} Stress test result with metrics
 */
export async function runStressTest(scenarioId, options = {}) {
  try {
    console.log(`[STRESS TEST] Starting stress test for scenario: ${scenarioId}`)

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

    if (!scenario.testSteps || scenario.testSteps.length === 0) {
      throw new Error('Scenario has no test steps')
    }

    // Get stress profile configuration
    const profile = STRESS_PROFILES[options.profile?.toUpperCase()] || STRESS_PROFILES.LIGHT
    console.log(`[STRESS TEST] Using profile: ${profile.name}`)
    console.log(`[STRESS TEST] Concurrency: ${profile.concurrency}, Iterations: ${profile.iterations}`)

    // Prepare stress execution options
    const stressExecutionOptions = {
      ...options,
      testType: 'STRESS',
      isStressTest: true,
      stressProfile: options.profile || 'LIGHT',
      concurrencyLevel: profile.concurrency,
      iterationCount: profile.iterations,
      headless: true,
      timeout: profile.timeout,
      fastMode: true,
      screenshotOnError: false,
      videoRecording: false
    }

    // Execute concurrent stress tests
    const executionStartTime = Date.now()
    const executions = []
    const executionMetrics = []

    console.log(`[STRESS TEST] Launching ${profile.concurrency} parallel executions, ${profile.iterations} iterations each`)

    // Start all concurrent executions
    for (let concurrencyIndex = 0; concurrencyIndex < profile.concurrency; concurrencyIndex++) {
      for (let iterationIndex = 0; iterationIndex < profile.iterations; iterationIndex++) {
        try {
          // Launch execution asynchronously (don't wait for completion)
          const executionPromise = executionService.executeScenario(
            scenario.userId,
            scenarioId,
            stressExecutionOptions
          )
          
          // Collect execution promise for later tracking
          executionMetrics.push({
            concurrencyIndex,
            iterationIndex,
            promise: executionPromise,
            startTime: Date.now()
          })

          // Small delay between launch to avoid resource spike
          if ((concurrencyIndex + 1) % 5 === 0) {
            await new Promise(r => setTimeout(r, 100))
          }
        } catch (err) {
          console.error(`[STRESS TEST] Failed to launch execution ${concurrencyIndex}-${iterationIndex}: ${err.message}`)
        }
      }
    }

    // Wait for all executions to complete (with timeout)
    console.log(`[STRESS TEST] Waiting for ${executionMetrics.length} executions to complete...`)
    
    const results = await Promise.allSettled(
      executionMetrics.map(m => m.promise)
    )

    // Process results and collect metrics
    let passedCount = 0
    let failedCount = 0
    const responseTimes = []
    let totalPassedSteps = 0
    let totalFailedSteps = 0

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const metric = executionMetrics[i]
      const duration = Date.now() - metric.startTime

      responseTimes.push(duration)

      if (result.status === 'fulfilled') {
        const execution = result.value?.execution
        if (execution?.status === 'PASSED') {
          passedCount++
          totalPassedSteps += execution.passedSteps || 0
        } else {
          failedCount++
          totalFailedSteps += execution?.failedSteps || 0
        }
      } else {
        failedCount++
        console.error(`[STRESS TEST] Execution rejected: ${result.reason?.message}`)
      }
    }

    // Calculate performance metrics
    const totalDuration = Date.now() - executionStartTime
    const metrics = calculatePerformanceMetrics(
      responseTimes,
      passedCount,
      failedCount,
      totalDuration,
      profile
    )

    console.log(`[STRESS TEST] Complete - Passed: ${passedCount}, Failed: ${failedCount}`)
    console.log(`[STRESS TEST] Avg Response Time: ${metrics.responseTimeAvg}ms, P95: ${metrics.responseTimeP95}ms`)
    console.log(`[STRESS TEST] Throughput: ${metrics.throughput.toFixed(2)} executions/sec`)

    // Create execution record for stress test
    const execution = await prisma.execution.create({
      data: {
        userId: scenario.userId,
        scenarioId,
        status: failedCount === 0 ? 'PASSED' : (passedCount > 0 ? 'FAILED' : 'FAILED'),
        testType: 'STRESS',
        isStressTest: true,
        stressProfile: options.profile || 'LIGHT',
        concurrencyLevel: profile.concurrency,
        iterationCount: profile.iterations,
        startTime: new Date(executionStartTime),
        endTime: new Date(),
        duration: totalDuration,
        passedSteps: totalPassedSteps,
        failedSteps: totalFailedSteps,
        totalSteps: (totalPassedSteps + totalFailedSteps) || 1,
        browser: 'chromium',
        headless: true
      }
    })

    // Create stress metrics record
    await prisma.stressMetrics.create({
      data: {
        executionId: execution.id,
        responseTimeMin: metrics.responseTimeMin,
        responseTimeAvg: metrics.responseTimeAvg,
        responseTimeMax: metrics.responseTimeMax,
        responseTimeP50: metrics.responseTimeP50,
        responseTimeP95: metrics.responseTimeP95,
        responseTimeP99: metrics.responseTimeP99,
        throughput: metrics.throughput,
        errorRate: metrics.errorRate,
        failedStepsCount: totalFailedSteps,
        passedStepsCount: totalPassedSteps,
        totalStepsCount: totalPassedSteps + totalFailedSteps,
        concurrency: profile.concurrency,
        iterations: profile.iterations,
        duration: totalDuration
      }
    })

    return {
      executionId: execution.id,
      status: execution.status,
      profile: options.profile || 'LIGHT',
      totalExecutions: executionMetrics.length,
      passedCount,
      failedCount,
      duration: totalDuration,
      metrics,
      timestamp: new Date()
    }
  } catch (error) {
    console.error(`[STRESS TEST ERROR] ${error.message}`)
    throw error
  }
}

/**
 * Calculate performance metrics from stress test results
 * @param {array} responseTimes - Array of response times in ms
 * @param {number} passedCount - Number of passed executions
 * @param {number} failedCount - Number of failed executions
 * @param {number} totalDuration - Total test duration in ms
 * @param {object} profile - Stress profile configuration
 * @returns {object} Performance metrics
 */
function calculatePerformanceMetrics(responseTimes, passedCount, failedCount, totalDuration, profile) {
  // Sort response times for percentile calculation
  const sorted = responseTimes.sort((a, b) => a - b)
  
  // Calculate basic statistics
  const min = Math.min(...sorted)
  const max = Math.max(...sorted)
  const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)

  // Calculate percentiles
  const p50Index = Math.floor(sorted.length * 0.5)
  const p95Index = Math.floor(sorted.length * 0.95)
  const p99Index = Math.floor(sorted.length * 0.99)

  const p50 = sorted[p50Index] || 0
  const p95 = sorted[p95Index] || 0
  const p99 = sorted[p99Index] || 0

  // Calculate throughput (executions per second)
  const throughput = (responseTimes.length / totalDuration) * 1000

  // Calculate error rate
  const totalExecutions = passedCount + failedCount
  const errorRate = totalExecutions > 0 ? (failedCount / totalExecutions) * 100 : 0

  return {
    responseTimeMin: Math.round(min),
    responseTimeAvg: avg,
    responseTimeMax: Math.round(max),
    responseTimeP50: Math.round(p50),
    responseTimeP95: Math.round(p95),
    responseTimeP99: Math.round(p99),
    throughput,
    errorRate
  }
}

/**
 * Mark scenario as stress test
 * @param {string} scenarioId - Scenario to mark
 * @returns {object} Updated scenario
 */
export async function markAsStress(scenarioId) {
  const scenario = await prisma.scenario.update({
    where: { id: scenarioId },
    data: { isStress: true }
  })
  console.log(`[STRESS TEST] Scenario marked as stress test: ${scenarioId}`)
  return scenario
}

/**
 * Get all stress test scenarios
 * @returns {array} Stress test scenarios
 */
export async function getStressScenarios() {
  return await prisma.scenario.findMany({
    where: { isStress: true },
    include: {
      testSteps: { orderBy: { stepNumber: 'asc' } },
      user: { select: { id: true, email: true, name: true } }
    }
  })
}

/**
 * Get stress test history for a scenario
 * @param {string} scenarioId - Scenario ID
 * @param {number} limit - Number of results to return
 * @returns {array} Historical stress test results
 */
export async function getStressTestHistory(scenarioId, limit = 10) {
  const executions = await prisma.execution.findMany({
    where: { scenarioId, isStressTest: true },
    include: { stressMetrics: true },
    orderBy: { createdAt: 'desc' },
    take: limit
  })

  return executions.map(exec => ({
    id: exec.id,
    status: exec.status,
    profile: exec.stressProfile,
    concurrency: exec.concurrencyLevel,
    iterations: exec.iterationCount,
    duration: exec.duration,
    passedSteps: exec.passedSteps,
    failedSteps: exec.failedSteps,
    metrics: exec.stressMetrics ? {
      responseTimeAvg: exec.stressMetrics.responseTimeAvg,
      responseTimeP95: exec.stressMetrics.responseTimeP95,
      throughput: exec.stressMetrics.throughput,
      errorRate: exec.stressMetrics.errorRate
    } : null,
    createdAt: exec.createdAt
  }))
}

/**
 * Get stress test summary (dashboard stats)
 * @returns {object} Summary statistics
 */
export async function getStressTestSummary() {
  const [totalTests, passedTests, failedTests] = await Promise.all([
    prisma.execution.count({ where: { isStressTest: true } }),
    prisma.execution.count({ where: { isStressTest: true, status: 'PASSED' } }),
    prisma.execution.count({ where: { isStressTest: true, status: 'FAILED' } })
  ])

  // Get average metrics from all stress tests
  const metrics = await prisma.stressMetrics.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' }
  })

  const avgMetrics = metrics.length > 0 ? {
    avgResponseTime: Math.round(metrics.reduce((a, m) => a + m.responseTimeAvg, 0) / metrics.length),
    avgThroughput: (metrics.reduce((a, m) => a + m.throughput, 0) / metrics.length).toFixed(2),
    avgErrorRate: (metrics.reduce((a, m) => a + m.errorRate, 0) / metrics.length).toFixed(2)
  } : {
    avgResponseTime: 0,
    avgThroughput: '0',
    avgErrorRate: '0'
  }

  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0

  return {
    totalTests,
    passedTests,
    failedTests,
    passRate,
    metrics: avgMetrics
  }
}

/**
 * Run all stress tests for marked scenarios
 * @param {object} options - Execution options
 * @returns {object} Summary of all results
 */
export async function runAllStressTests(options = {}) {
  try {
    console.log(`[STRESS TEST] Running all stress tests...`)

    const stressScenarios = await getStressScenarios()

    if (stressScenarios.length === 0) {
      console.log(`[STRESS TEST] No stress test scenarios configured`)
      return {
        totalTests: 0,
        passed: 0,
        failed: 0,
        results: []
      }
    }

    const results = []

    for (const scenario of stressScenarios) {
      try {
        const result = await runStressTest(scenario.id, options)
        results.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          ...result
        })
      } catch (error) {
        console.error(`[STRESS TEST] Failed to run stress test for ${scenario.name}: ${error.message}`)
        results.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          status: 'ERROR',
          error: error.message
        })
      }
    }

    const passed = results.filter(r => r.status === 'PASSED').length
    const failed = results.filter(r => r.status === 'FAILED').length

    return {
      totalTests: stressScenarios.length,
      passed,
      failed,
      results
    }
  } catch (error) {
    console.error(`[STRESS TEST ERROR] ${error.message}`)
    throw error
  }
}

export default {
  runStressTest,
  markAsStress,
  getStressScenarios,
  getStressTestHistory,
  getStressTestSummary,
  runAllStressTests,
  STRESS_PROFILES
}
