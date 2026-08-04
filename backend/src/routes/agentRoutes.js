import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authenticateTokenOrApiKey } from '../middleware/apiTokenAuth.js'
import { agentController } from '../controllers/agentController.js'

const agentRoutes = Router()

agentRoutes.post('/queue/:scenarioId', authenticateToken, agentController.queue)
agentRoutes.get('/stats', authenticateToken, agentController.stats)
agentRoutes.get('/jobs/next', authenticateTokenOrApiKey, agentController.nextJob)
agentRoutes.post('/jobs/:jobId/complete', authenticateTokenOrApiKey, agentController.complete)

export default agentRoutes
