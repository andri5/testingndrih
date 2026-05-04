import express from 'express'
import multer from 'multer'
import { authenticateToken } from '../middleware/auth.js'
import {
  previewExcelHandler,
  confirmImportHandler,
  downloadTemplateHandler
} from '../controllers/importController.js'

const router = express.Router()

// Configure multer for Excel files
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Please upload Excel file.`))
    }
  }
})

// Apply authentication to all import routes
router.use(authenticateToken)

/**
 * Download template Excel file
 * GET /api/import/template
 */
router.get('/template', downloadTemplateHandler)

/**
 * Preview Excel file
 * POST /api/import/preview
 */
router.post('/preview', upload.single('file'), previewExcelHandler)

/**
 * Confirm and create scenarios from Excel
 * POST /api/import/confirm
 */
router.post('/confirm', confirmImportHandler)

export default router
