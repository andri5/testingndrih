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

    console.log(`[PARALLEL] 🚀 Starting parallel execution of ${scenarios.length} scenarios`)
    console.log(`[PARALLEL] Concurrency limit: ${concurrencyLimit}`)

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
    const activePromises = []

    // Process scenarios with concurrency control
    for (const scenario of scenarios) {
      // If at concurrency limit, wait for one to complete
      if (activePromises.length >= concurrencyLimit) {
        await Promise.race(activePromises)
        // Remove completed promise
        activePromises.splice(
          activePromises.findIndex(p => p.state === 'completed'),
          1
        )
      }

      // Start scenario execution
      const executionPromise = this._executeScenarioWithTimeout(
        scenario,
        timeout,
        executionBatch.id
      )

      activePromises.push(executionPromise)

      // Track execution
      executionPromise.then(result => {
        executions.push(result)
        console.log(`[PARALLEL] ✅ Scenario ${scenario.id} completed (${executions.length}/${scenarios.length})`)
      }).catch(error => {
        console.log(`[PARALLEL] ❌ Scenario ${scenario.id} failed: ${error.message}`)
        executions.push({
          scenarioId: scenario.id,
          executionId: null,
          status: 'FAILED',
          error: error.message
        })
      })
    }

    // Wait for all remaining executions
    console.log(`[PARALLEL] ⏳ Waiting for ${activePromises.length} remaining executions...`)
    const results = await Promise.allSettled(activePromises)

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

    console.log(`[PARALLEL] ✨ Parallel batch complete: ${passedCount} passed, ${failedCount} failed`)

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

      console.log(`[PARALLEL] Starting scenario: ${scenarioData.name}`)

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
        console.log(`[PARALLEL] ⏱️ Execution timeout for scenario ${scenario.id}`)
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
    console.log(`[PARALLEL] 📋 Scenario queued. Queue size: ${this.executionQueue.length}`)
    return { queued: true, queueSize: this.executionQueue.length }
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
   * Cancel execution batch (stop all running scenarios)
   * @param {string} batchId
   */
  async cancelBatch(batchId) {
    console.log(`[PARALLEL] ⛔ Cancelling batch ${batchId}...`)

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
    await prisma.executionBatch.update({
      where: { id: batchId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date()
      }
    })

    console.log(`[PARALLEL] ✅ Batch cancelled`)
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
    console.log(`[PARALLEL] Processing queued scenario: ${queueItem.scenarioId}`)

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
      console.error(`[PARALLEL] Error processing queue: ${error.message}`)
    }
  }
}
