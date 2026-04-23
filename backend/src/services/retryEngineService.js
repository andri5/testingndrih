/**
 * Priority 3.1: Smart Retry Engine
 * Intelligent retry logic for failed steps with failure-type-specific strategies
 * 
 * Strategies:
 * - NETWORK_ERROR: exponential backoff (1s, 2s, 4s)
 * - SELECTOR_NOT_FOUND: repair + retry + fallback selector
 * - TIMEOUT: increase wait time + retry
 * - ASSERTION_FAILED: no retry (logic issue)
 * - NAVIGATION_FAILED: retry with browser reload
 */

import locatorRepairService from './locatorRepairService.js'

const DEFAULT_MAX_RETRIES = 3
const RETRY_CONFIG = {
  NETWORK_ERROR: {
    maxRetries: 3,
    backoffMs: [1000, 2000, 4000],
    description: 'Network timeout or connection error'
  },
  SELECTOR_NOT_FOUND: {
    maxRetries: 2,
    backoffMs: [500, 1000],
    description: 'Element not found, attempting repair'
  },
  TIMEOUT: {
    maxRetries: 2,
    backoffMs: [1000, 2000],
    description: 'Action timed out, retrying with longer wait'
  },
  ASSERTION_FAILED: {
    maxRetries: 0,
    backoffMs: [],
    description: 'Assertion failed, no retry (logic error)'
  },
  NAVIGATION_FAILED: {
    maxRetries: 2,
    backoffMs: [1000, 2000],
    description: 'Navigation failed, retrying'
  },
  UNKNOWN_ERROR: {
    maxRetries: 1,
    backoffMs: [500],
    description: 'Unknown error, attempting single retry'
  }
}

export const retryEngineService = {
  /**
   * Classify failure type from error message/context
   * @param {Error} error - The error object
   * @param {Object} context - { step, stepType, errorMessage }
   * @returns {string} - Failure type key
   */
  classifyFailure(error, context = {}) {
    const { stepType, errorMessage = '' } = context
    const errMsg = (error?.message || errorMessage).toLowerCase()

    // Network errors
    if (errMsg.includes('econnrefused') || errMsg.includes('network') || errMsg.includes('timeout')) {
      return 'NETWORK_ERROR'
    }

    // Selector/locator errors
    if (errMsg.includes('not found') || errMsg.includes('no element') || errMsg.includes('locator')) {
      return 'SELECTOR_NOT_FOUND'
    }

    // Timeout errors
    if (errMsg.includes('timeout') || errMsg.includes('timed out')) {
      return 'TIMEOUT'
    }

    // Assertion errors
    if (errMsg.includes('assert') || stepType === 'ASSERTION') {
      return 'ASSERTION_FAILED'
    }

    // Navigation errors
    if (errMsg.includes('navigation') || errMsg.includes('navigate')) {
      return 'NAVIGATION_FAILED'
    }

    return 'UNKNOWN_ERROR'
  },

  /**
   * Get retry strategy for failure type
   * @param {string} failureType
   * @returns {Object} - { maxRetries, backoffMs, description }
   */
  getRetryStrategy(failureType) {
    return RETRY_CONFIG[failureType] || RETRY_CONFIG.UNKNOWN_ERROR
  },

  /**
   * Wait with exponential backoff
   * @param {number} retryAttempt - 0-based retry attempt number
   * @param {Array<number>} backoffMs - Backoff times in ms
   */
  async waitBackoff(retryAttempt, backoffMs) {
    if (retryAttempt >= backoffMs.length) {
      retryAttempt = backoffMs.length - 1
    }
    const waitTime = backoffMs[retryAttempt]
    console.log(`[RETRY] Waiting ${waitTime}ms before retry...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  },

  /**
   * Attempt retry with intelligent strategy
   * @param {Function} executeStep - Async function that executes the step
   * @param {Object} params - { page, step, stepType, failureType, errorContext }
   * @returns {Object} - { success, result, attempt, error }
   */
  async attemptRetry(executeStep, params = {}) {
    const { failureType = 'UNKNOWN_ERROR' } = params
    const strategy = this.getRetryStrategy(failureType)

    console.log(`[RETRY] 🔄 Failure Type: ${failureType}`)
    console.log(`[RETRY] Strategy: ${strategy.description}`)
    console.log(`[RETRY] Max Retries: ${strategy.maxRetries}`)

    let lastError = null
    let result = null

    for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retry (except first attempt)
          await this.waitBackoff(attempt - 1, strategy.backoffMs)
        }

        console.log(`[RETRY] Attempt ${attempt + 1}/${strategy.maxRetries + 1}`)

        // Apply failure-specific pre-retry logic
        if (attempt > 0 && failureType === 'SELECTOR_NOT_FOUND' && params.page && params.step) {
          await this._applySelectorRepair(params.page, params.step)
        }

        if (attempt > 0 && failureType === 'TIMEOUT' && params.page) {
          // Increase timeout on retry
          params.enhancedTimeout = true
        }

        // Execute step
        result = await executeStep(params)

        console.log(`[RETRY] ✅ Retry successful on attempt ${attempt + 1}`)
        return { success: true, result, attempt }
      } catch (error) {
        lastError = error
        console.log(`[RETRY] ❌ Attempt ${attempt + 1} failed: ${error.message}`)

        // Stop retrying if this is an assertion failure
        if (failureType === 'ASSERTION_FAILED') {
          return { success: false, error, attempt }
        }

        // Continue to next retry if more retries available
        if (attempt < strategy.maxRetries) {
          continue
        }
      }
    }

    return { success: false, error: lastError, attempt: strategy.maxRetries }
  },

  /**
   * Apply selector repair for SELECTOR_NOT_FOUND failures
   * @private
   */
  async _applySelectorRepair(page, step) {
    try {
      console.log(`[RETRY_REPAIR] 🔧 Attempting selector repair...`)
      const repairedSelector = await locatorRepairService.repairLocator(page, step.selector, {
        type: step.type,
        description: step.description,
        value: step.value
      })

      if (repairedSelector) {
        console.log(`[RETRY_REPAIR] ✅ Selector repaired: ${step.selector} → ${repairedSelector}`)
        step.selector = repairedSelector
        return true
      }
    } catch (err) {
      console.log(`[RETRY_REPAIR] ⚠️ Repair failed: ${err.message}`)
    }
    return false
  },

  /**
   * Generate retry metadata for execution result
   * @param {Object} retryResult - Result from attemptRetry()
   * @returns {Object} - Metadata object
   */
  generateRetryMetadata(retryResult) {
    return {
      wasRetried: retryResult.attempt > 0,
      retryAttempts: retryResult.attempt,
      retrySuccess: retryResult.success,
      error: retryResult.error?.message || null
    }
  },

  /**
   * Create smart retry executor function
   * Wraps a step execution with automatic retry logic
   * 
   * Usage:
   *   const executor = retryEngineService.createRetryExecutor(
   *     async (params) => {
   *       // step execution code
   *       return result
   *     },
   *     { step, page, stepType }
   *   )
   *   const result = await executor()
   */
  createRetryExecutor(stepExecutor, baseParams = {}) {
    return async function executeWithRetry() {
      try {
        // First attempt without retry logic
        const result = await stepExecutor(baseParams)
        return { success: true, result, retryAttempts: 0 }
      } catch (error) {
        // Classify failure and retry
        const failureType = retryEngineService.classifyFailure(error, {
          step: baseParams.step,
          stepType: baseParams.stepType,
          errorMessage: error.message
        })

        const retryResult = await retryEngineService.attemptRetry(stepExecutor, {
          ...baseParams,
          failureType
        })

        if (retryResult.success) {
          return { success: true, result: retryResult.result, retryAttempts: retryResult.attempt }
        } else {
          throw retryResult.error
        }
      }
    }
  }
}
