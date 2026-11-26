import express from 'express'
import multer from 'multer'
import {
  createScenarioHandler,
  getScenarioListHandler,
  getScenarioHandler,
  getScenarioRunsHandler,
  updateScenarioHandler,
  deleteScenarioHandler,
  duplicateScenarioHandler,
  getScenarioStatsHandler,
  listScenarioTagsHandler,
  toggleFavoriteHandler,
  updateTagsHandler,
  moveScenariosHandler,
  getScenarioRemindersHandler,
  uploadScenarioAttachmentsHandler,
  listScenarioAttachmentsHandler,
  deleteScenarioAttachmentHandler,
  getScenarioHistoryHandler,
  bulkAssignOwnerHandler,
} from '../controllers/scenarioController.js'
import { authenticateToken } from '../middleware/auth.js'
import { rejectSqlInjection } from '../middleware/sqlInjectionGuard.js'
import { MAX_FILE_BYTES } from '../services/scenarioAttachmentService.js'
import testStepRoutes from './testStepRoutes.js'

const router = express.Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 12 },
})

// All routes require authentication
router.use(authenticateToken)

/**
 * POST /api/scenarios
 * Create a new scenario
 */
router.post('/', rejectSqlInjection({ body: ['name', 'description', 'url'] }), createScenarioHandler)

/**
 * GET /api/scenarios
 * Get all scenarios for authenticated user
 */
router.get('/', rejectSqlInjection({ query: ['search', 'query', 'q', 'tag'] }), getScenarioListHandler)

/**
 * POST /api/scenarios/move
 * Move scenarios between folders
 */
router.post('/move', moveScenariosHandler)

/**
 * POST /api/scenarios/bulk-assign-owner
 * Bulk set PIC / owner on selected cases
 */
router.post('/bulk-assign-owner', bulkAssignOwnerHandler)

/**
 * GET /api/scenarios/tags
 * List unique tags for authenticated user
 */
router.get('/tags', listScenarioTagsHandler)

/**
 * GET /api/scenarios/reminders
 * Never-run / stuck / empty-draft reminders
 */
router.get('/reminders', getScenarioRemindersHandler)

/**
 * GET /api/scenarios/:id
 * Get a specific scenario
 */
router.get('/:id', getScenarioHandler)

/**
 * GET /api/scenarios/:id/runs
 * Runs history for this test case
 */
router.get('/:id/runs', getScenarioRunsHandler)

router.get('/:id/attachments', listScenarioAttachmentsHandler)
router.post(
  '/:id/attachments',
  upload.array('files', 12),
  uploadScenarioAttachmentsHandler
)
router.delete('/:id/attachments/:attachmentId', deleteScenarioAttachmentHandler)
router.get('/:id/history', getScenarioHistoryHandler)

/**
 * PUT /api/scenarios/:id
 * Update a scenario
 */
router.put('/:id', rejectSqlInjection({ body: ['name', 'description', 'url'] }), updateScenarioHandler)

router.patch('/:id/favorite', toggleFavoriteHandler)
router.patch('/:id/tags', updateTagsHandler)

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
