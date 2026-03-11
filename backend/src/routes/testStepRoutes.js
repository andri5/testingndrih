import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  createTestStepHandler,
  getTestStepsHandler,
  getTestStepHandler,
  updateTestStepHandler,
  deleteTestStepHandler,
  reorderStepsHandler,
  getStepTypesHandler,
  validateStepHandler
} from '../controllers/testStepController.js'

const router = express.Router({ mergeParams: true })

// Apply authentication middleware to all routes
router.use(authenticateToken)

/**
 * Create a test step
 * POST /api/scenarios/:scenarioId/steps
 */
router.post('/', createTestStepHandler)

/**
 * Get all test steps for a scenario
 * GET /api/scenarios/:scenarioId/steps
 */
router.get('/', getTestStepsHandler)

/**
 * Reorder test steps (MUST BE BEFORE /:stepId routes)
 * PUT /api/scenarios/:scenarioId/steps/reorder
 */
router.put('/reorder', reorderStepsHandler)

/**
 * Get a single test step
 * GET /api/scenarios/:scenarioId/steps/:stepId
 */
router.get('/:stepId', getTestStepHandler)

/**
 * Update a test step
 * PUT /api/scenarios/:scenarioId/steps/:stepId
 */
router.put('/:stepId', updateTestStepHandler)

/**
 * Delete a test step
 * DELETE /api/scenarios/:scenarioId/steps/:stepId
 */
router.delete('/:stepId', deleteTestStepHandler)

export default router
