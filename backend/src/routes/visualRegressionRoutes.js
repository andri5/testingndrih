import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import {
  captureHandler,
  runHandler,
  listBaselinesHandler,
  listComparisonsHandler,
  approveHandler,
  deleteBaselineHandler
} from '../controllers/visualRegressionController.js'

const router = Router()
router.use(...adminAuth)

router.get('/baselines', listBaselinesHandler)
router.get('/comparisons', listComparisonsHandler)
router.post('/capture/:scenarioId', captureHandler)
router.post('/run/:scenarioId', runHandler)
router.post('/comparisons/:comparisonId/approve', approveHandler)
router.delete('/baselines/:baselineId', deleteBaselineHandler)

export default router
