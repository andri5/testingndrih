import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { authenticateTokenOrApiKey } from '../middleware/apiTokenAuth.js'
import { agentController } from '../controllers/agentController.js'

const agentRoutes = Router()

agentRoutes.post('/queue/:scenarioId', authenticateToken, agentController.queue)
agentRoutes.get('/stats', authenticateToken, agentController.stats)
agentRoutes.get('/jobs', authenticateToken, agentController.listJobs)
// Static path before :jobId
agentRoutes.get('/jobs/next', authenticateTokenOrApiKey, agentController.nextJob)
agentRoutes.get('/jobs/:jobId', authenticateToken, agentController.getJob)
agentRoutes.post('/jobs/:jobId/complete', authenticateTokenOrApiKey, agentController.complete)
agentRoutes.post('/jobs/:jobId/cancel', authenticateToken, agentController.cancel)

export default agentRoutes
