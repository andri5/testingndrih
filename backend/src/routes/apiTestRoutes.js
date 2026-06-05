import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  listHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  runHandler,
  resultsHandler
} from '../controllers/apiTestController.js'

const router = Router()
router.use(authenticateToken)

router.get('/scenarios/:scenarioId', listHandler)
router.post('/scenarios/:scenarioId', createHandler)
router.put('/:apiTestId', updateHandler)
router.delete('/:apiTestId', deleteHandler)
router.post('/:apiTestId/run', runHandler)
router.get('/:apiTestId/results', resultsHandler)

export default router
