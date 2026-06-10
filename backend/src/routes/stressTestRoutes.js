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
  unmarkStressTest,
  debugScenario
} from '../controllers/stressTestController.js'
import { adminAuth } from '../middleware/adminAuth.js'

const router = express.Router()

router.use(...adminAuth)

router.post('/', startStressTest)
router.post('/run-all', runAllStressTests)
router.get('/summary', getStressTestSummary)
router.get('/scenarios', getStressScenarios)
router.get('/history/:scenarioId', getStressTestHistory)
router.post('/mark/:scenarioId', markStressTest)
router.delete('/mark/:scenarioId', unmarkStressTest)
router.get('/debug/:scenarioId', debugScenario)

export default router
