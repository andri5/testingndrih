import { prisma } from '../lib/prisma.js'
import { executionService } from '../services/executionService.js'

/**
 * POST /api/ci/run/:scenarioId
 * Run scenario headless for CI pipelines (API token auth)
 */
export async function runScenarioHandler(req, res, next) {
  try {
    const { scenarioId } = req.params
    const userId = req.user.id
    const { browser = 'chromium', headless = true, environmentId } = req.body || {}

    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId, userId },
      include: { testSteps: { orderBy: { stepNumber: 'asc' } } }
    })

    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found' })
    }
    if (!scenario.testSteps.length) {
      return res.status(400).json({ success: false, message: 'Scenario has no test steps' })
    }

    const result = await executionService.executeScenario(userId, scenarioId, {
      browser,
      headless: headless !== false,
      environmentId: environmentId || null
    })

    const status = result.execution.status
    const exitCode = status === 'PASSED' ? 0 : 1

    res.status(status === 'PASSED' ? 200 : 422).json({
      success: status === 'PASSED',
      exitCode,
      execution: result.execution
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/ci/health
 */
export async function healthHandler(req, res) {
  res.json({
    success: true,
    status: 'ok',
    authenticatedAs: req.user.email,
    timestamp: new Date().toISOString()
  })
}
