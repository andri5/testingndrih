import express from 'express'
import {
  createScenarioHandler,
  getScenarioListHandler,
  getScenarioHandler,
  updateScenarioHandler,
  deleteScenarioHandler,
  duplicateScenarioHandler,
  getScenarioStatsHandler
} from '../controllers/scenarioController.js'
import { authenticateToken } from '../middleware/auth.js'
import testStepRoutes from './testStepRoutes.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

/**
 * POST /api/scenarios
 * Create a new scenario
 */
router.post('/', createScenarioHandler)

/**
 * GET /api/scenarios
 * Get all scenarios for authenticated user
 */
router.get('/', getScenarioListHandler)

/**
 * GET /api/scenarios/:id
 * Get a specific scenario
 */
router.get('/:id', getScenarioHandler)

/**
 * PUT /api/scenarios/:id
 * Update a scenario
 */
router.put('/:id', updateScenarioHandler)

/**
 * DELETE /api/scenarios/:id
 * Delete a scenario
 */
router.delete('/:id', deleteScenarioHandler)

/**
 * POST /api/scenarios/:id/duplicate
 * Duplicate a scenario
 */
router.post('/:id/duplicate', duplicateScenarioHandler)

/**
 * GET /api/scenarios/:id/stats
 * Get scenario statistics
 */
router.get('/:id/stats', getScenarioStatsHandler)

/**
 * Test step routes
 * /api/scenarios/:scenarioId/steps
 */
router.use('/:scenarioId/steps', testStepRoutes)

export default router
