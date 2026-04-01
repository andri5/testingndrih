import { Router } from 'express'
import { recorderController } from '../controllers/recorderController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

router.use(authenticateToken)

router.post('/start', recorderController.startRecording)
router.post('/stop', recorderController.stopRecording)
router.get('/status/:scenarioId', recorderController.getStatus)
router.post('/save/:scenarioId', recorderController.saveSteps)

export default router
