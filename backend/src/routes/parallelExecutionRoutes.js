/**
 * Priority 3.2: Parallel Execution API Routes
 */

import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import { parallelExecutionService } from '../services/parallelExecutionService.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

router.use(...adminAuth)

/**
 * POST /api/parallel/execute - Execute multiple scenarios in parallel
 * Body: { scenarioIds: Array<string>, concurrencyLimit?: number, timeout?: number }
 */
router.post('/execute', async (req, res) => {
  try {
    const { scenarioIds, concurrencyLimit = 3, timeout = 600000 } = req.body

    if (!scenarioIds || !Array.isArray(scenarioIds) || scenarioIds.length === 0) {
      return res.status(400).json({ error: 'scenarioIds array required' })
    }

    // Verify all scenarios exist and belong to user
    const scenarios = await prisma.scenario.findMany({
      where: {
        id: { in: scenarioIds },
        userId: req.user.id
      },
      include: { testSteps: true }
    })

    if (scenarios.length !== scenarioIds.length) {
      return res.status(403).json({ error: 'One or more scenarios not found or unauthorized' })
    }

    const result = await parallelExecutionService.executeParallel(scenarios, {
      concurrencyLimit,
      timeout,
      userId: req.user.id
    })

    res.status(202).json(result)
  } catch (err) {
    console.error('[PARALLEL_ROUTES] Execute failed:', err.message)
    res.status(400).json({ error: err.message })
  }
})

/**
 * GET /api/parallel/batch/:batchId - Get batch details
 */
router.get('/batch/:batchId', async (req, res) => {
  try {
    const batch = await prisma.executionBatch.findUnique({
      where: { id: req.params.batchId }
    })

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' })
    }

    if (batch.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const details = await parallelExecutionService.getBatchDetails(req.params.batchId)

    res.json({ batch: details })
  } catch (err) {
    console.error('[PARALLEL_ROUTES] Get batch failed:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/parallel/batch/:batchId/cancel - Cancel execution batch
 */
router.post('/batch/:batchId/cancel', async (req, res) => {
  try {
    const batch = await prisma.executionBatch.findUnique({
      where: { id: req.params.batchId }
    })

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' })
    }

    if (batch.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await parallelExecutionService.cancelBatch(req.params.batchId)

    res.json({ message: 'Batch cancelled' })
  } catch (err) {
    console.error('[PARALLEL_ROUTES] Cancel failed:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/parallel/queue - Get execution queue status
 */
router.get('/queue', async (req, res) => {
  try {
    const status = parallelExecutionService.getQueueStatus()
    res.json(status)
  } catch (err) {
    console.error('[PARALLEL_ROUTES] Queue status failed:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/parallel/batches - List user's execution batches
 */
router.get('/batches', async (req, res) => {
  try {
    const batches = await prisma.executionBatch.findMany({
      where: { userId: req.user.id },
      orderBy: { startedAt: 'desc' },
      include: {
        executions: {
          select: { id: true, status: true, scenarioId: true }
        }
      }
    })

    res.json({ batches })
  } catch (err) {
    console.error('[PARALLEL_ROUTES] List batches failed:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
