import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { listHandler, getHandler, updateHandler } from '../controllers/issueController.js'

const router = Router()
router.use(authenticateToken)

router.get('/', listHandler)
router.get('/:issueId', getHandler)
router.patch('/:issueId', updateHandler)

export default router
