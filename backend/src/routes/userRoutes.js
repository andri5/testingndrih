import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
import { rejectSqlInjection } from '../middleware/sqlInjectionGuard.js'
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateUserRole,
  setUserActive,
  deleteUser,
  updateUserMenus,
  getUserActivitySummary,
  getUserActivityLog,
  getMenuDefaults,
  updateMenuDefaults,
} from '../controllers/userController.js'

const router = Router()

router.use(...adminAuth)

router.get('/', listUsers)
router.get('/activity/summary', getUserActivitySummary)
router.get('/menus/defaults', getMenuDefaults)
router.put('/menus/defaults', updateMenuDefaults)
router.post('/', rejectSqlInjection({ body: ['email', 'name'] }), createUser)
router.get('/:userId/activity', getUserActivityLog)
router.get('/:userId', getUser)
router.patch('/:userId', rejectSqlInjection({ body: ['email', 'name'] }), updateUser)
router.patch('/:userId/role', updateUserRole)
router.patch('/:userId/active', setUserActive)
router.patch('/:userId/menus', updateUserMenus)
router.delete('/:userId', deleteUser)

export default router
