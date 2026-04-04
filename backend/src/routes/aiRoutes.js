import express from 'express'
import { fixLocator } from '../controllers/aiController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Fix locator using AI
// POST /api/ai/fix-locator
router.post('/fix-locator', authenticateToken, fixLocator)

export default router
