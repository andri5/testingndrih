import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { getSettingsHandler, updateSettingsHandler } from '../controllers/notificationController.js'

const router = Router()
router.use(authenticateToken)

router.get('/settings', getSettingsHandler)
router.put('/settings', updateSettingsHandler)

export default router
