import express from 'express'
import { registerUser, loginUser, getCurrentUser } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * Public auth routes
 */
router.post('/register', registerUser)
router.post('/login', loginUser)

/**
 * Protected auth routes
 */
router.get('/me', authenticateToken, getCurrentUser)

export default router
