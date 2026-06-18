import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authenticateToken } from '../middleware/auth.js'
import {
  aiStatusHandler,
  explainFailureHandler,
  generateScenarioHandler,
  suggestLocatorHandler,
} from '../controllers/aiController.js'

const router = Router()

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    success: false,
    code: 'AI_USER_HOURLY_LIMIT',
    message: 'Terlalu banyak permintaan AI per jam. Tunggu sebentar lalu coba lagi.',
  },
})

router.use(authenticateToken)
router.use(aiLimiter)

router.get('/status', aiStatusHandler)
router.post('/explain-failure', explainFailureHandler)
router.post('/generate-scenario', generateScenarioHandler)
router.post('/suggest-locator', suggestLocatorHandler)

export default router
