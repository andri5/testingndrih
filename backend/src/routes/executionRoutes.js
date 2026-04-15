import { Router } from 'express'
import { executionController } from '../controllers/executionController.js'
import { authenticateToken } from '../middleware/auth.js'

const executionRoutes = Router()

// Live execution viewer & SSE stream — no auth (served to popup window)
executionRoutes.get('/:executionId/live-view', executionController.liveView)
executionRoutes.get('/:executionId/live-stream', executionController.liveStream)

// All remaining routes require authentication
executionRoutes.use(authenticateToken)

/**
 * @swagger
 * /api/executions/scenarios/{scenarioId}:
 *   post:
 *     summary: Execute a test scenario
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: scenarioId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               browser:
 *                 type: string
 *                 enum: [chromium, firefox, webkit]
 *                 default: chromium
 *               headless:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Execution completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 execution:
 *                   $ref: '#/components/schemas/Execution'
 *       400:
 *         description: Execution failed
 *       404:
 *         description: Scenario not found
 */
executionRoutes.post('/scenarios/:scenarioId', executionController.executeScenario)

/**
 * @swagger
 * /api/executions:
 *   get:
 *     summary: Get execution history
 *     tags: [Execution]
 *     parameters:
 *       - in: query
 *         name: scenarioId
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: offset
 *         schema: { type: integer, default: 0 }
 *     responses:
 *       200:
 *         description: List of executions
 */
executionRoutes.get('/', executionController.getExecutionHistory)

/**
 * @swagger
 * /api/executions/stats/summary:
 *   get:
 *     summary: Get execution statistics
 *     tags: [Execution]
 *     parameters:
 *       - in: query
 *         name: scenarioId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Aggregated stats (total, passed, failed, successRate)
 */
executionRoutes.get('/stats/summary', executionController.getExecutionStats)

/**
 * @swagger
 * /api/executions/{executionId}:
 *   get:
 *     summary: Get execution details with step results
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Execution with step results and screenshots
 */
executionRoutes.get('/:executionId', executionController.getExecutionDetails)

/**
 * @swagger
 * /api/executions/{executionId}/cancel:
 *   post:
 *     summary: Cancel a running execution
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Execution cancelled
 */
executionRoutes.post('/:executionId/cancel', executionController.cancelExecution)

/**
 * @swagger
 * /api/executions/{executionId}:
 *   delete:
 *     summary: Delete an execution record
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Execution deleted
 */
executionRoutes.delete('/:executionId', executionController.deleteExecution)

/**
 * @swagger
 * /api/executions/{executionId}/export:
 *   get:
 *     summary: Export execution report as HTML or PDF
 *     tags: [Execution]
 *     parameters:
 *       - in: path
 *         name: executionId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [html, pdf]
 *           default: html
 *         description: "Output format: html (default) or pdf"
 *     responses:
 *       200:
 *         description: Report file (HTML or PDF)
 *         content:
 *           text/html:
 *             schema: { type: string }
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       400:
 *         description: Invalid format or execution not found
 */
executionRoutes.get('/:executionId/export', executionController.exportReport)

export default executionRoutes
