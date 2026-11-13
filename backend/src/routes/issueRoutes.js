import { Router } from 'express'
import multer from 'multer'
import { authenticateToken } from '../middleware/auth.js'
import {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  uploadAttachmentsHandler,
  deleteAttachmentHandler,
} from '../controllers/issueController.js'
import { issueShareController } from '../controllers/issueShareController.js'
import { MAX_FILE_BYTES } from '../services/issueAttachmentService.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 8 },
})

router.use(authenticateToken)

router.get('/', listHandler)
router.post('/', createHandler)
router.get('/:issueId', getHandler)
router.patch('/:issueId', updateHandler)

router.post(
  '/:issueId/attachments',
  upload.array('files', 8),
  uploadAttachmentsHandler
)
router.delete('/:issueId/attachments/:attachmentId', deleteAttachmentHandler)

router.post('/:issueId/share', issueShareController.create)
router.get('/:issueId/shares', issueShareController.list)
router.delete('/:issueId/shares/:shareId', issueShareController.revoke)

export default router
