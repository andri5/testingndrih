/**
 * Stress Test Routes
 * API routes for stress testing functionality
 */

import express from 'express'
import {
  startStressTest,
  runAllStressTests,
  getStressTestHistory,
  getStressTestSummary,
  getStressScenarios,
  markStressTest,
  unmarkStressTest
} from '../controllers/stressTestController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * POST /api/stress - Start stress test on a single scenario
 * Body: { scenarioId, profile: "LIGHT|MEDIUM|HEAVY|EXTREME" }
 */
router.post('/', authenticateToken, startStressTest)

/**
 * POST /api/stress/run-all - Run all marked stress test scenarios
 * Body: { profile: "LIGHT|MEDIUM|HEAVY|EXTREME" }
 */
router.post('/run-all', authenticateToken, runAllStressTests)

/**
 * GET /api/stress/summary - Get stress test dashboard summary
 */
router.get('/summary', authenticateToken, getStressTestSummary)

/**
 * GET /api/stress/scenarios - Get all scenarios marked as stress tests
 */
router.get('/scenarios', authenticateToken, getStressScenarios)

/**
 * GET /api/stress/history/:scenarioId - Get stress test history for a scenario
 * Query: limit (default 10)
 */
router.get('/history/:scenarioId', authenticateToken, getStressTestHistory)

/**
 * POST /api/stress/mark/:scenarioId - Mark scenario as stress test
 */
router.post('/mark/:scenarioId', authenticateToken, markStressTest)

/**
 * DELETE /api/stress/mark/:scenarioId - Unmark scenario as stress test
 */
router.delete('/mark/:scenarioId', authenticateToken, unmarkStressTest)

export default router
