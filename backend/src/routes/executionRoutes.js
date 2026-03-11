import { Router } from 'express'
import { executionController } from '../controllers/executionController.js'
import { authenticateToken } from '../middleware/auth.js'

const executionRoutes = Router()

// All routes require authentication
executionRoutes.use(authenticateToken)

/**
 * Execute a scenario
 * POST /api/executions/scenarios/:scenarioId
 */
executionRoutes.post('/scenarios/:scenarioId', executionController.executeScenario)

/**
 * Get execution history
 * GET /api/executions?scenarioId=xxx&limit=20&offset=0
 */
executionRoutes.get('/', executionController.getExecutionHistory)

/**
 * Get execution statistics
 * GET /api/executions/stats/summary?scenarioId=xxx
 */
executionRoutes.get('/stats/summary', executionController.getExecutionStats)

/**
 * Get execution details
 * GET /api/executions/:executionId
 */
executionRoutes.get('/:executionId', executionController.getExecutionDetails)

/**
 * Cancel execution
 * POST /api/executions/:executionId/cancel
 */
executionRoutes.post('/:executionId/cancel', executionController.cancelExecution)

/**
 * Delete execution
 * DELETE /api/executions/:executionId
 */
executionRoutes.delete('/:executionId', executionController.deleteExecution)

export default executionRoutes
