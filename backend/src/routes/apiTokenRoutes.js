import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import { listHandler, createHandler, revokeHandler } from '../controllers/apiTokenController.js'

const router = Router()
router.use(...adminAuth)

router.get('/', listHandler)
router.post('/', createHandler)
router.delete('/:tokenId', revokeHandler)

export default router
