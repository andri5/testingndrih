import {
  parseExcelFile,
  createScenariosFromParsedData,
  generateTemplateExcel
} from '../services/excelImportService.js'

/**
 * Preview Excel file content before import
 * POST /api/import/preview
 * Body: { file: multipart }
 */
export async function previewExcelHandler(req, res, next) {
  try {
    const userId = req.user.id

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      })
    }

    // Parse and validate Excel
    const parsedData = await parseExcelFile(req.file.buffer)

    res.json({
      success: true,
      preview: parsedData
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
}

/**
 * Confirm and create scenarios from parsed data
 * POST /api/import/confirm
 * Body: { scenarios: [...] } (from preview)
 */
export async function confirmImportHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { scenarios } = req.body

    if (!scenarios || !Array.isArray(scenarios)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scenarios data'
      })
    }

    // Create scenarios and steps
    const result = await createScenariosFromParsedData(userId, { scenarios })

    res.status(201).json({
      success: true,
      ...result
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Download template Excel file
 * GET /api/import/template
 */
export async function downloadTemplateHandler(req, res, next) {
  try {
    const buffer = generateTemplateExcel()

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="test-scenarios-template.xlsx"')
    res.send(buffer)
  } catch (error) {
    next(error)
  }
}
