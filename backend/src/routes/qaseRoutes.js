import { Router } from 'express'
import { qaseController } from '../controllers/qaseController.js'
import { authenticateToken } from '../middleware/auth.js'

const qaseRoutes = Router()

// All routes require authentication
qaseRoutes.use(authenticateToken)

/**
 * Connect to Qase
 * POST /api/qase/connect
 */
qaseRoutes.post('/connect', qaseController.connectQase)

/**
 * Get Qase integration status
 * GET /api/qase/status
 */
qaseRoutes.get('/status', qaseController.getQaseStatus)

/**
 * Sync test cases from Qase
 * POST /api/qase/sync
 */
qaseRoutes.post('/sync', qaseController.syncCasesFromQase)

/**
 * Get synced test cases
 * GET /api/qase/cases
 */
qaseRoutes.get('/cases', qaseController.getSyncedCases)

/**
 * Get Qase project details
 * GET /api/qase/project
 */
qaseRoutes.get('/project', qaseController.getProjectDetails)

/**
 * Push execution result to Qase
 * POST /api/qase/push/:executionId
 */
qaseRoutes.post('/push/:executionId', qaseController.pushExecutionToQase)

/**
 * Push all executions to Qase
 * POST /api/qase/push-all?scenarioId=xxx
 */
qaseRoutes.post('/push-all', qaseController.pushAllExecutionsToQase)

/**
 * Create scenario from Qase case
 * POST /api/qase/create-scenario/:qaseCaseId
 */
qaseRoutes.post('/create-scenario/:qaseCaseId', qaseController.createScenarioFromQaseCase)

/**
 * Disconnect Qase integration
 * POST /api/qase/disconnect
 */
qaseRoutes.post('/disconnect', qaseController.disconnectQase)

export default qaseRoutes
