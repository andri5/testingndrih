import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { listHandler, createHandler, revokeHandler } from '../controllers/apiTokenController.js'

const router = Router()
router.use(authenticateToken)

router.get('/', listHandler)
router.post('/', createHandler)
router.delete('/:tokenId', revokeHandler)

export default router
