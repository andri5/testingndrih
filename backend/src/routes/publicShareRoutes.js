import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { executionShareController } from '../controllers/executionShareController.js'

const publicShareRoutes = Router()

const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
})

publicShareRoutes.get(
  '/shared-runs/:token',
  shareLimiter,
  executionShareController.publicGet
)

export default publicShareRoutes
