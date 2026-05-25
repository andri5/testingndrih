/**
 * Smoke Test Controller
 * Handle smoke test API requests
 */

import {
  runSmokeTest as runSmokeTestService,
  runAllSmokeTests as runAllSmokeTestsService,
  getSmokeTestHistory as getSmokeTestHistoryService,
  getSmokeTestSummary as getSmokeTestSummaryService,
  getSmokeScenarios as getSmokeScenarioService,
  markAsSmoke
} from '../services/smokeTestService.js'
import { prisma } from '../lib/prisma.js'

/**
 * Start a smoke test on a specific scenario
 * POST /api/smoke
 */
export const startSmokeTest = async (req, res) => {
  try {
    const { scenarioId, notifyOnComplete } = req.body
    const userId = req.user.id

    // Validate scenario exists
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' })
    }

    // Check user has access to this scenario
    if (scenario.userId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have access to this scenario' })
    }

    console.log(
      `[SMOKE TEST API] Starting smoke test for scenario: ${scenarioId}`
    )

    // Run smoke test
    const result = await runSmokeTestService(scenarioId, {
      notifyOnComplete,
      userId
    })

    res.json({
      success: true,
      message: 'Smoke test started',
      data: result
    })
  } catch (error) {
    console.error(`[SMOKE TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to start smoke test',
      message: error.message
    })
  }
}

/**
 * Start smoke test on all marked scenarios
 * POST /api/smoke/run-all
 */
export const runAllSmokeTests = async (req, res) => {
  try {
    const { notifyOnComplete } = req.body
    const userId = req.user.id

    console.log(
      `[SMOKE TEST API] Running all smoke tests initiated by user: ${userId}`
    )

    // Run all smoke tests
    const result = await runAllSmokeTestsService({
      notifyOnComplete,
      userId
    })

    res.json({
      success: true,
      message: 'All smoke tests completed',
      data: result
    })
  } catch (error) {
    console.error(`[SMOKE TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to run smoke tests',
      message: error.message
    })
  }
}

/**
 * Get smoke test status
 * GET /api/smoke/:executionId
 */
export const getSmokeTestStatus = async (req, res) => {
  try {
    const { executionId } = req.params
    const userId = req.user.id

    const execution = await prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        scenario: true,
        user: { select: { id: true, email: true, name: true } }
      }
    })

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' })
    }

    // Check user owns the execution
    if (execution.userId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have access to this execution' })
    }

    // Check it's a smoke test
    if (execution.testType !== 'SMOKE') {
      return res.status(400).json({ error: 'This is not a smoke test' })
    }

    res.json({
      success: true,
      data: {
        id: execution.id,
        status: execution.status,
        testType: execution.testType,
        scenarioName: execution.scenario.name,
        passedSteps: execution.passedSteps,
        failedSteps: execution.failedSteps,
        totalSteps: execution.totalSteps,
        duration: execution.duration,
        createdAt: execution.createdAt,
        completedAt: execution.completedAt
      }
    })
  } catch (error) {
    console.error(`[SMOKE TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to get smoke test status',
      message: error.message
    })
  }
}

/**
 * Get smoke test history
 * GET /api/smoke/history/:scenarioId
 */
export const getSmokeTestHistory = async (req, res) => {
  try {
    const { scenarioId } = req.params
    const userId = req.user.id
    const limit = parseInt(req.query.limit) || 10

    // Check user has access to scenario
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' })
    }

    if (scenario.userId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have access to this scenario' })
    }

    const history = await getSmokeTestHistoryService(
      scenarioId,
      limit
    )

    res.json({
      success: true,
      count: history.length,
      data: history
    })
  } catch (error) {
    console.error(`[SMOKE TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to get smoke test history',
      message: error.message
    })
  }
}

/**
 * Get smoke test summary
 * GET /api/smoke/summary
 */
export const getSmokeTestSummary = async (req, res) => {
  try {
    const summary = await getSmokeTestSummaryService()

    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error(`[SMOKE TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to get smoke test summary',
      message: error.message
    })
  }
}

/**
 * Mark scenario as smoke test
 * POST /api/smoke/mark/:scenarioId
 */
export const markSmokeTest = async (req, res) => {
  try {
    const { scenarioId } = req.params
    const userId = req.user.id

    // Check authorization
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' })
    }

    if (scenario.userId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have access to this scenario' })
    }

    const updated = await markAsSmoke(scenarioId)

    res.json({
      success: true,
      message: 'Scenario marked as smoke test',
      data: updated
    })
  } catch (error) {
    console.error(`[SMOKE TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to mark smoke test',
      message: error.message
    })
  }
}

/**
 * Get all smoke test scenarios
 * GET /api/smoke/scenarios
 */
export const getSmokeScenarios = async (req, res) => {
  try {
    const scenarios = await getSmokeScenarioService()

    res.json({
      success: true,
      count: scenarios.length,
      data: scenarios
    })
  } catch (error) {
    console.error(`[SMOKE TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to get smoke scenarios',
      message: error.message
    })
  }
}

/**
 * Unmark scenario as smoke test
 * DELETE /api/smoke/mark/:scenarioId
 */
export const unmarkSmokeTest = async (req, res) => {
  try {
    const { scenarioId } = req.params
    const userId = req.user.id

    // Check authorization
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' })
    }

    if (scenario.userId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have access to this scenario' })
    }

    const updated = await prisma.scenario.update({
      where: { id: scenarioId },
      data: { isSmoke: false }
    })

    res.json({
      success: true,
      message: 'Scenario unmarked as smoke test',
      data: updated
    })
  } catch (error) {
    console.error(`[SMOKE TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to unmark smoke test',
      message: error.message
    })
  }
}
