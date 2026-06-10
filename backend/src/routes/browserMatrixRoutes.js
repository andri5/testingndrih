/**
 * Priority 3.3: Browser Matrix Execution API Routes
 */

import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import { browserMatrixService } from '../services/browserMatrixService.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.use(...adminAuth)

/**
 * POST /api/browser-matrix/execute - Execute scenario on multiple browsers
 * Body: { scenarioId, browsers: Array<string>, concurrency?: number }
 */
router.post('/execute', async (req, res) => {
  try {
    const { scenarioId, browsers = ['chromium', 'firefox', 'webkit'], concurrency = 2 } = req.body

    if (!scenarioId) {
      return res.status(400).json({ error: 'scenarioId required' })
    }

    // Verify scenario exists and belongs to user
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' })
    }

    if (scenario.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const result = await browserMatrixService.executeMatrix(scenarioId, browsers, {
      userId: req.user.id,
      concurrency
    })

    res.status(202).json(result)
  } catch (err) {
    console.error('[MATRIX_ROUTES] Execute failed:', err.message)
    res.status(400).json({ error: err.message })
  }
})

/**
 * GET /api/browser-matrix/executions - List user's matrix executions
 */
router.get('/executions', async (req, res) => {
  try {
    const executions = await prisma.matrixExecution.findMany({
      where: { userId: req.user.id },
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: {
        scenario: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({ executions })
  } catch (err) {
    console.error('[MATRIX_ROUTES] List failed:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/browser-matrix/scenario/:scenarioId/report - Get compatibility report for scenario
 */
router.get('/scenario/:scenarioId/report', async (req, res) => {
  try {
    // Verify scenario belongs to user
    const scenario = await prisma.scenario.findUnique({
      where: { id: req.params.scenarioId }
    })

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' })
    }

    if (scenario.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const report = await browserMatrixService.getCompatibilityReport(req.params.scenarioId)

    res.json(report)
  } catch (err) {
    console.error('[MATRIX_ROUTES] Report failed:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/browser-matrix/:matrixId - Get matrix execution details
 */
router.get('/:matrixId', async (req, res) => {
  try {
    const matrix = await prisma.matrixExecution.findUnique({
      where: { id: req.params.matrixId }
    })

    if (!matrix) {
      return res.status(404).json({ error: 'Matrix execution not found' })
    }

    if (matrix.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const details = await browserMatrixService.getMatrixDetails(req.params.matrixId)

    res.json({ matrix: details })
  } catch (err) {
    console.error('[MATRIX_ROUTES] Get failed:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
