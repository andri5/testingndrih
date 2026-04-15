import { Router } from 'express'
import { recorderController } from '../controllers/recorderController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

// Proxy page — no auth (recorder script inside uses localStorage token)
router.get('/proxy', recorderController.proxyPage)

router.use(authenticateToken)

router.post('/start', recorderController.startRecording)
router.post('/stop', recorderController.stopRecording)
router.get('/status/:scenarioId', recorderController.getStatus)
router.post('/save/:scenarioId', recorderController.saveSteps)
router.post('/step/:scenarioId', recorderController.receiveStep)

export default router
