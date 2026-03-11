import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getStepTypesHandler, validateStepHandler } from '../controllers/testStepController.js'

const router = express.Router()

/**
 * Get available step types
 * GET /api/step-types
 */
router.get('/', getStepTypesHandler)

/**
 * Validate a step
 * POST /api/step-types/validate
 */
router.post('/validate', validateStepHandler)

export default router
