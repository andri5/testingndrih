import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import { listUsers, updateUserRole } from '../controllers/userController.js'

const router = Router()

router.use(...adminAuth)

router.get('/', listUsers)
router.patch('/:userId/role', updateUserRole)

export default router
