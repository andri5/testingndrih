import express from 'express'
import multer from 'multer'
import { authenticateToken } from '../middleware/auth.js'
import {
  uploadFileHandler,
  downloadFileHandler,
  getFileHandler,
  deleteFileHandler,
  listFilesHandler,
  createTemplateHandler,
  getTemplateHandler,
  listTemplatesHandler,
  deleteTemplateHandler
} from '../controllers/fileController.js'

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'text/csv',
      'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ]

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`))
    }
  }
})

// Apply authentication to all routes
router.use(authenticateToken)

/**
 * Template routes (MUST BE BEFORE catch-all /:filename routes)
 */

/**
 * Create scenario template
 * POST /api/files/templates
 */
router.post('/templates', createTemplateHandler)

/**
 * List scenario templates
 * GET /api/files/templates
 */
router.get('/templates', listTemplatesHandler)

/**
 * Get scenario template
 * GET /api/files/templates/:templateId
 */
router.get('/templates/:templateId', getTemplateHandler)

/**
 * Delete scenario template
 * DELETE /api/files/templates/:templateId
 */
router.delete('/templates/:templateId', deleteTemplateHandler)

/**
 * File routes (AFTER template routes)
 */

/**
 * File upload
 * POST /api/files/upload
 */
router.post('/upload', upload.single('file'), uploadFileHandler)

/**
 * Download file
 * GET /api/files/download/:filename
 */
router.get('/download/:filename', downloadFileHandler)

/**
 * List user files
 * GET /api/files
 */
router.get('/', listFilesHandler)

/**
 * Get file metadata
 * GET /api/files/:filename
 */
router.get('/:filename', getFileHandler)

/**
 * Delete file
 * DELETE /api/files/:filename
 */
router.delete('/:filename', deleteFileHandler)

export default router
