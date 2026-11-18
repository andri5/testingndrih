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
} from '../controllers/testRunController.js'

const router = Router()
router.use(authenticateToken)

router.get('/', listHandler)
router.post('/', createHandler)
router.get('/:id', getHandler)
router.post('/:id/close', closeHandler)
router.post('/:id/items', addItemsHandler)
router.patch('/:id/items/:itemId', updateItemHandler)
router.delete('/:id/items/:itemId', removeItemHandler)
router.post('/:id/items/:itemId/start-manual', startManualHandler)

export default router
