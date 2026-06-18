import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as siteController from '../controllers/siteController.js'
import { adminAuth } from '../middleware/adminAuth.js'

const router = Router()

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
})

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many feedback submissions, please try later' },
})

router.post('/track', publicLimiter, siteController.trackPageView)
router.post('/feedback', feedbackLimiter, siteController.submitFeedback)

router.get('/feedback', ...adminAuth, siteController.listFeedback)
router.get('/analytics', ...adminAuth, siteController.getAnalytics)

export default router
