/**
 * Stress Test Controller
 * Handle stress test API requests
 */

import {
  runStressTest as runStressTestService,
  runAllStressTests as runAllStressTestsService,
  getStressTestHistory as getStressTestHistoryService,
  getStressTestSummary as getStressTestSummaryService,
  getStressScenarios as getStressScenariosService,
  markAsStress,
  STRESS_PROFILES
} from '../services/stressTestService.js'
import { prisma } from '../lib/prisma.js'

/**
 * Start a stress test on a specific scenario
 * POST /api/stress
 */
export const startStressTest = async (req, res) => {
  try {
    const { scenarioId, profile } = req.body
    const userId = req.user.id

    if (!scenarioId || !profile) {
      return res.status(400).json({ error: 'scenarioId and profile are required' })
    }

    if (!STRESS_PROFILES[profile.toUpperCase()]) {
      return res.status(400).json({
        error: 'Invalid stress profile',
        validProfiles: Object.keys(STRESS_PROFILES)
      })
    }

    // Validate scenario exists
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' })
    }

    // Check user owns the scenario (since role field doesn't exist yet, only check ownership)
    if (scenario.userId !== userId) {
      return res
        .status(403)
        .json({ error: 'You do not have access to this scenario' })
    }

    console.log(
      `[STRESS TEST API] Starting stress test for scenario: ${scenarioId}, profile: ${profile}`
    )

    // Run stress test asynchronously (returns immediately)
    const result = await runStressTestService(scenarioId, {
      profile,
      userId
    })

    res.json({
      success: true,
      message: 'Stress test started',
      data: result
    })
  } catch (error) {
    console.error(`[STRESS TEST API ERROR] ${error.message}`)
    console.error(`[STRESS TEST API ERROR] Stack:`, error.stack)
    
    // Provide detailed error information
    let detailedMessage = error.message
    if (error.message.includes('Scenario has no test steps')) {
      detailedMessage = 'Scenario has no test steps. Please add at least one step to the scenario before running stress tests.'
    } else if (error.message.includes('Scenario not found')) {
      detailedMessage = 'Scenario not found or you do not have access to it.'
    }
    
    res.status(500).json({
      error: 'Failed to start stress test',
      message: detailedMessage,
      details: error.message
    })
  }
}

/**
 * Run all stress tests for marked scenarios
 * POST /api/stress/run-all
 */
export const runAllStressTests = async (req, res) => {
  try {
    const { profile } = req.body
    const userId = req.user.id

    if (!profile) {
      return res.status(400).json({ error: 'profile is required' })
    }

    console.log(
      `[STRESS TEST API] Running all stress tests initiated by user: ${userId}`
    )

    // Run all stress tests
    const result = await runAllStressTestsService({
      profile,
      userId
    })

    res.json({
      success: true,
      message: 'All stress tests completed',
      data: result
    })
  } catch (error) {
    console.error(`[STRESS TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to run stress tests',
      message: error.message
    })
  }
}

/**
 * Get stress test history for a scenario
 * GET /api/stress/history/:scenarioId
 */
export const getStressTestHistory = async (req, res) => {
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

    const history = await getStressTestHistoryService(
      scenarioId,
      limit
    )

    res.json({
      success: true,
      count: history.length,
      data: history
    })
  } catch (error) {
    console.error(`[STRESS TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to get stress test history',
      message: error.message
    })
  }
}

/**
 * Get stress test summary (dashboard)
 * GET /api/stress/summary
 */
export const getStressTestSummary = async (req, res) => {
  try {
    const summary = await getStressTestSummaryService()

    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error(`[STRESS TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to get stress test summary',
      message: error.message
    })
  }
}

/**
 * Mark scenario as stress test
 * POST /api/stress/mark/:scenarioId
 */
export const markStressTest = async (req, res) => {
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

    const updated = await markAsStress(scenarioId)

    res.json({
      success: true,
      message: 'Scenario marked as stress test',
      data: updated
    })
  } catch (error) {
    console.error(`[STRESS TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to mark stress test',
      message: error.message
    })
  }
}

/**
 * Get all stress test scenarios
 * GET /api/stress/scenarios
 */
export const getStressScenarios = async (req, res) => {
  try {
    const scenarios = await getStressScenariosService()

    res.json({
      success: true,
      count: scenarios.length,
      data: scenarios
    })
  } catch (error) {
    console.error(`[STRESS TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to get stress scenarios',
      message: error.message
    })
  }
}

/**
 * Unmark scenario as stress test
 * DELETE /api/stress/mark/:scenarioId
 */
export const unmarkStressTest = async (req, res) => {
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
      data: { isStress: false }
    })

    res.json({
      success: true,
      message: 'Scenario unmarked as stress test',
      data: updated
    })
  } catch (error) {
    console.error(`[STRESS TEST API ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Failed to unmark stress test',
      message: error.message
    })
  }
}

/**
 * Debug endpoint: GET /api/stress/debug/:scenarioId
 * Returns scenario details with test steps for debugging
 */
export const debugScenario = async (req, res) => {
  try {
    const { scenarioId } = req.params
    const userId = req.user.id

    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: { testSteps: { orderBy: { stepNumber: 'asc' } } }
    })

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' })
    }

    if (scenario.userId !== userId) {
      return res.status(403).json({ error: 'You do not have access to this scenario' })
    }

    res.json({
      success: true,
      scenario: {
        id: scenario.id,
        name: scenario.name,
        url: scenario.url,
        stepsCount: scenario.testSteps.length,
        steps: scenario.testSteps.map(s => ({
          stepNumber: s.stepNumber,
          type: s.type,
          description: s.description,
          selector: s.selector,
          value: s.value
        }))
      },
      debug: {
        message: scenario.testSteps.length === 0 
          ? 'ERROR: Scenario has no test steps. Add steps before running stress test.'
          : `OK: Scenario has ${scenario.testSteps.length} steps`
      }
    })
  } catch (error) {
    console.error(`[STRESS TEST DEBUG ERROR] ${error.message}`)
    res.status(500).json({
      error: 'Debug endpoint error',
      message: error.message
    })
  }
}
