/**
 * Priority 3.2: Parallel Execution Engine
 * Run multiple scenarios concurrently with resource pooling and failure isolation
 * 
 * Features:
 * - Configurable concurrency limit (max parallel executions)
 * - Queue management for scenarios exceeding concurrency limit
 * - Isolated failure handling (one scenario failure doesn't stop others)
 * - Per-scenario timeout
 * - Real-time progress tracking
 */

import { executionService } from './executionService.js'
import { prisma } from '../lib/prisma.js'

const DEFAULT_CONCURRENCY_LIMIT = 3
const DEFAULT_EXECUTION_TIMEOUT = 600000 // 10 minutes per scenario

export const parallelExecutionService = {
  // Track active executions
  activeExecutions: new Map(),
  executionQueue: [],

  /**
   * Execute multiple scenarios in parallel
   * @param {Array<Object>} scenarios - Array of { id, steps?, userId } objects
   * @param {Object} options - { concurrencyLimit, timeout, userId }
   * @returns {Object} - { executionBatchId, executions: Array<{scenarioId, executionId}> }
   */
  async executeParallel(scenarios, options = {}) {
    const {
      concurrencyLimit = DEFAULT_CONCURRENCY_LIMIT,
      timeout = DEFAULT_EXECUTION_TIMEOUT,
      userId
    } = options

    if (!scenarios || scenarios.length === 0) {
      throw new Error('No scenarios provided')
    }

    // Create execution batch record
    const executionBatch = await prisma.executionBatch.create({
      data: {
        userId,
        scenarioCount: scenarios.length,
        status: 'RUNNING',
        startedAt: new Date()
      }
    })

    const executions = []
    const executionPromises = [] // Track promises

    // Process scenarios with concurrency control
    for (let index = 0; index < scenarios.length; index++) {
      const scenario = scenarios[index]

      // If at concurrency limit, wait for one to complete
      if (executionPromises.length >= concurrencyLimit) {
        // Wait for the first promise to complete
        await Promise.race(executionPromises)
        // Remove one promise from the list
        executionPromises.splice(0, 1)
      }

      // Start scenario execution
      const executionPromise = this._executeScenarioWithTimeout(
        scenario,
        timeout,
        executionBatch.id
      )

      // Store promise for tracking
      executionPromises.push(executionPromise)

      // Non-blocking: handle result when ready (don't await here)
      executionPromise
        .then(result => {
          executions.push(result)
        })
        .catch(error => {
          executions.push({
            scenarioId: scenario.id,
            executionId: null,
            status: 'FAILED',
            error: error.message
          })
        })
    }

    // Wait for all remaining executions
    await Promise.allSettled(executionPromises)

    // Update batch status
    const failedCount = executions.filter(e => e.status === 'FAILED').length
    const passedCount = executions.filter(e => e.status === 'PASSED').length

    await prisma.executionBatch.update({
      where: { id: executionBatch.id },
      data: {
        status: failedCount > 0 ? 'PARTIAL_FAILURE' : 'SUCCESS',
        completedAt: new Date(),
        successCount: passedCount,
        failureCount: failedCount
      }
    })

    return {
      executionBatchId: executionBatch.id,
      executions,
      summary: {
        total: scenarios.length,
        passed: passedCount,
        failed: failedCount,
        passRate: ((passedCount / scenarios.length) * 100).toFixed(2) + '%'
      }
    }
  },

  /**
   * Execute scenario with timeout protection
   * @private
   */
  async _executeScenarioWithTimeout(scenario, timeout, batchId) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const scenarioData = await prisma.scenario.findUnique({
        where: { id: scenario.id },
        include: { steps: true }
      })

      if (!scenarioData) {
        throw new Error(`Scenario ${scenario.id} not found`)
      }

      const execution = await executionService.executeScenario(
        scenario.id,
        scenarioData.steps,
        null,
        { batchId, signal: controller.signal }
      )

      clearTimeout(timeoutId)

      return {
        scenarioId: scenario.id,
        scenarioName: scenarioData.name,
        executionId: execution.id,
        status: execution.status,
        duration: execution.duration,
        passedSteps: execution.passedSteps || 0,
        failedSteps: execution.failedSteps || 0
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error(`Execution timeout after ${timeout}ms`)
      }

      throw error
    }
  },

  /**
   * Queue scenario for parallel execution when limit is reached
   * @param {string} scenarioId
   * @param {Object} options
   */
  async queueScenario(scenarioId, options = {}) {
    this.executionQueue.push({ scenarioId, options, queuedAt: new Date() })
    return { queued: true, queueSize: this.executionQueue.length }
  },

  /**
   * Get execution batch status (alias for getBatchDetails)
   * @param {string} batchId
   */
  async getExecutionBatchStatus(batchId) {
    return this.getBatchDetails(batchId)
  },

  /**
   * Get parallel execution batch details
   * @param {string} batchId
   */
  async getBatchDetails(batchId) {
    const batch = await prisma.executionBatch.findUnique({
      where: { id: batchId },
      include: {
        executions: {
          select: {
            id: true,
            scenarioId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            passedSteps: true,
            failedSteps: true
          },
          orderBy: { startedAt: 'desc' }
        }
      }
    })

    if (!batch) {
      throw new Error('Batch not found')
    }

    return {
      ...batch,
      duration: batch.completedAt
        ? (batch.completedAt - batch.startedAt) / 1000 + 's'
        : 'In progress'
    }
  },

  /**
   * Cancel/Stop execution batch (stop all running scenarios)
   * @param {string} batchId
   */
  async stopBatch(batchId) {
    // Update all running executions in batch
    await prisma.execution.updateMany({
      where: {
        executionBatchId: batchId,
        status: 'RUNNING'
      },
      data: {
        status: 'CANCELLED',
        completedAt: new Date()
      }
    })

    // Update batch status
    const result = await prisma.executionBatch.update({
      where: { id: batchId },
      data: {
        status: 'STOPPED',
        completedAt: new Date()
      }
    })

    return result
  },

  /**
   * @deprecated Use stopBatch instead
   */
  async cancelBatch(batchId) {
    return this.stopBatch(batchId)
  },

  /**
   * Get execution queue status
   */
  getQueueStatus() {
    return {
      queueSize: this.executionQueue.length,
      activeExecutions: this.activeExecutions.size,
      queue: this.executionQueue.map(item => ({
        scenarioId: item.scenarioId,
        queuedAt: item.queuedAt,
        waitTime: (Date.now() - item.queuedAt) / 1000 + 's'
      }))
    }
  },

  /**
   * Process next queued scenario
   * @private
   */
  async _processQueue() {
    if (this.executionQueue.length === 0 || this.activeExecutions.size >= DEFAULT_CONCURRENCY_LIMIT) {
      return
    }

    const queueItem = this.executionQueue.shift()

    try {
      const scenario = await prisma.scenario.findUnique({
        where: { id: queueItem.scenarioId },
        include: { steps: true }
      })

      const execution = await executionService.executeScenario(
        queueItem.scenarioId,
        scenario.steps,
        null
      )

      this.activeExecutions.set(execution.id, execution)
    } catch (error) {
      // Error handling for queue processing - silently continue
    }
  },

  /**
   * Aggregate results from parallel executions
   * @param {Array<Object>} executions - Array of execution results
   * @returns {Object} - Aggregated statistics
   */
  aggregateResults(executions) {
    if (!executions || executions.length === 0) {
      return {
        totalExecutions: 0,
        passedCount: 0,
        failedCount: 0,
        averageDuration: 0,
        successRate: 0
      }
    }

    const passedCount = executions.filter(e => e.status === 'PASSED').length
    const failedCount = executions.filter(e => e.status === 'FAILED').length
    const totalDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0)
    const averageDuration = executions.length > 0 ? totalDuration / executions.length : 0
    const successRate = executions.length > 0 
      ? parseFloat(((passedCount / executions.length) * 100).toFixed(2))
      : 0

    return {
      totalExecutions: executions.length,
      passedCount,
      failedCount,
      averageDuration: Math.round(averageDuration),
      successRate
    }
  }
}
