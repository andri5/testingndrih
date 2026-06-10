import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import { getSettingsHandler, updateSettingsHandler } from '../controllers/notificationController.js'

const router = Router()
router.use(...adminAuth)

router.get('/settings', getSettingsHandler)
router.put('/settings', updateSettingsHandler)

export default router
