import express from 'express'
import multer from 'multer'
import { authenticateToken } from '../middleware/auth.js'
import {
  importCSVHandler,
  importTemplateHandler,
  validateCSVHandler,
  exportScenarioHandler,
  bulkImportHandler
} from '../controllers/importController.js'

const router = express.Router()

// Configure multer for CSV uploads
const csvUpload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['text/csv', 'application/json']
    const allowedExtensions = ['.csv', '.json']

    const hasAllowedMime = allowedMimes.includes(file.mimetype)
    const hasAllowedExt = allowedExtensions.some((ext) => file.originalname.endsWith(ext))

    if (hasAllowedMime || hasAllowedExt) {
      cb(null, true)
    } else {
      cb(new Error(`File type not supported. Please upload CSV or JSON files.`))
    }
  }
})

// Apply authentication to all routes
router.use(authenticateToken)

/**
 * Import scenario from CSV file
 * POST /api/import/csv
 */
router.post('/csv', csvUpload.single('file'), importCSVHandler)

/**
 * Validate CSV format
 * POST /api/import/validate
 */
router.post('/validate', csvUpload.single('file'), validateCSVHandler)

/**
 * Import scenario from template
 * POST /api/import/template/:templateId
 */
router.post('/template/:templateId', importTemplateHandler)

/**
 * Export scenario as CSV
 * GET /api/import/export/:scenarioId
 */
router.get('/export/:scenarioId', exportScenarioHandler)

/**
 * Bulk import scenarios
 * POST /api/import/bulk
 */
router.post('/bulk', csvUpload.single('file'), bulkImportHandler)

export default router
