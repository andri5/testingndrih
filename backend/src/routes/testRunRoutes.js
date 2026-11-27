import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  createHandler,
  listHandler,
  getHandler,
  closeHandler,
  updateItemHandler,
  addItemsHandler,
  removeItemHandler,
  startManualHandler,
  exportHandler,
} from '../controllers/testRunController.js'
import { testRunShareController } from '../controllers/testRunShareController.js'

const router = Router()
router.use(authenticateToken)

router.get('/', listHandler)
router.post('/', createHandler)
router.get('/:id/export', exportHandler)
router.post('/:id/share', testRunShareController.create)
router.get('/:id/shares', testRunShareController.list)
router.delete('/:id/shares/:shareId', testRunShareController.revoke)
router.get('/:id', getHandler)
router.post('/:id/close', closeHandler)
router.post('/:id/items', addItemsHandler)
router.patch('/:id/items/:itemId', updateItemHandler)
router.delete('/:id/items/:itemId', removeItemHandler)
router.post('/:id/items/:itemId/start-manual', startManualHandler)

export default router
