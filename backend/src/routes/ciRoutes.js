import { Router } from 'express'
import { authenticateTokenOrApiKey } from '../middleware/apiTokenAuth.js'
import { runScenarioHandler, healthHandler } from '../controllers/ciController.js'

const router = Router()
router.use(authenticateTokenOrApiKey)

router.get('/health', healthHandler)
router.post('/run/:scenarioId', runScenarioHandler)

export default router
