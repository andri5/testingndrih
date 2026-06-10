import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
} from '../controllers/userController.js'

const router = Router()

router.use(...adminAuth)

router.get('/', listUsers)
router.post('/', createUser)
router.get('/:userId', getUser)
router.patch('/:userId', updateUser)
router.patch('/:userId/role', updateUserRole)
router.delete('/:userId', deleteUser)

export default router
