import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  listFoldersHandler,
  createFolderHandler,
  updateFolderHandler,
  deleteFolderHandler,
} from '../controllers/scenarioFolderController.js'

const router = express.Router()

router.use(authenticateToken)

router.get('/', listFoldersHandler)
router.post('/', createFolderHandler)
router.patch('/:id', updateFolderHandler)
router.delete('/:id', deleteFolderHandler)

export default router
