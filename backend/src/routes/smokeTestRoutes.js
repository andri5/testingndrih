/**
 * Smoke Test Routes
 * API endpoints for smoke test functionality
 */

import express from 'express'
import * as smokeTestController from '../controllers/smokeTestController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

/**
 * POST /api/smoke
 * Start smoke test on a specific scenario
 */
router.post('/', smokeTestController.startSmokeTest)

/**
 * POST /api/smoke/run-all
 * Run all marked smoke test scenarios
 */
router.post('/run-all', smokeTestController.runAllSmokeTests)

/**
 * GET /api/smoke/summary
 * Get overall smoke test summary statistics
 */
router.get('/summary', smokeTestController.getSmokeTestSummary)

/**
 * GET /api/smoke/scenarios
 * Get all scenarios marked as smoke tests
 */
router.get('/scenarios', smokeTestController.getSmokeScenarios)

/**
 * GET /api/smoke/history/:scenarioId
 * Get history of smoke test runs for a scenario
 */
router.get('/history/:scenarioId', smokeTestController.getSmokeTestHistory)

/**
 * POST /api/smoke/mark/:scenarioId
 * Mark a scenario as smoke test
 */
router.post('/mark/:scenarioId', smokeTestController.markSmokeTest)

/**
 * DELETE /api/smoke/mark/:scenarioId
 * Unmark a scenario as smoke test
 */
router.delete('/mark/:scenarioId', smokeTestController.unmarkSmokeTest)

/**
 * GET /api/smoke/:executionId
 * Get status of a smoke test execution (MUST BE LAST - matches all paths)
 */
router.get('/:executionId', smokeTestController.getSmokeTestStatus)

export default router
