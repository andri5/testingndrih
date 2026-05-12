import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import * as securityTestController from '../controllers/securityTestController.js'

const router = express.Router()

// All security test endpoints require authentication
router.use(authenticateToken)

/**
 * POST /api/security/scan
 * Start a security scan
 */
router.post('/scan', securityTestController.startSecurityScan)

/**
 * GET /api/security/scans
 * List all security scans
 */
router.get('/scans', securityTestController.listSecurityScans)

/**
 * GET /api/security/scans/:scanId
 * Get detailed scan information
 */
router.get('/scans/:scanId', securityTestController.getSecurityScan)

/**
 * GET /api/security/scans/:scanId/findings
 * Get findings for a scan
 */
router.get('/scans/:scanId/findings', securityTestController.getFindings)

/**
 * POST /api/security/mark/:scenarioId
 * Mark scenario for security testing
 */
router.post('/mark/:scenarioId', securityTestController.markAsSecurityTest)

/**
 * DELETE /api/security/mark/:scenarioId
 * Unmark scenario from security testing
 */
router.delete('/mark/:scenarioId', securityTestController.unmarkAsSecurityTest)

/**
 * GET /api/security/scenarios
 * Get all security scenarios
 */
router.get('/scenarios', securityTestController.getSecurityScenarios)

/**
 * GET /api/security/history/:scenarioId
 * Get scan history for a scenario
 */
router.get('/history/:scenarioId', securityTestController.getHistory)

/**
 * GET /api/security/summary
 * Get security testing summary
 */
router.get('/summary', securityTestController.getSummary)

/**
 * POST /api/security/findings/:findingId/status
 * Update finding status
 */
router.post('/findings/:findingId/status', securityTestController.updateFindingStatus)

export default router
