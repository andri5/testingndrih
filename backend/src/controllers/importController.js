import {
  importScenarioFromCSV,
  importScenarioFromTemplate,
  validateCSVFormat,
  exportScenarioToCSV,
  bulkImportScenarios
} from '../services/importService.js'

/**
 * Import scenario from CSV upload
 * POST /api/import/csv
 */
export async function importCSVHandler(req, res, next) {
  try {
    const userId = req.user.id

    if (!req.file) {
      return res.status(400).json({
        error: 'No CSV file provided'
      })
    }

    if (!req.file.mimetype.includes('text/csv') && !req.file.originalname.endsWith('.csv')) {
      return res.status(400).json({
        error: 'File must be a CSV file'
      })
    }

    const { scenarioName, description, url } = req.body

    // Save file temporarily
    const tmpFile = `/tmp/${Date.now()}-${req.file.originalname}`
    const fs = await import('fs/promises')
    await fs.writeFile(tmpFile, req.file.buffer)

    try {
      const result = await importScenarioFromCSV(tmpFile, userId, {
        name: scenarioName,
        description,
        url
      })

      // Clean up temp file
      await fs.unlink(tmpFile)

      res.status(201).json({
        success: true,
        message: 'Scenario imported from CSV successfully',
        scenario: result.scenario,
        stepsCreated: result.stepsCreated
      })
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tmpFile)
      } catch {}
      throw error
    }
  } catch (error) {
    next(error)
  }
}

/**
 * Import scenario from template
 * POST /api/import/template/:templateId
 */
export async function importTemplateHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { templateId } = req.params
    const { scenarioName } = req.body

    const scenario = await importScenarioFromTemplate(templateId, userId, scenarioName)

    res.status(201).json({
      success: true,
      message: 'Scenario imported from template successfully',
      scenario
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Validate CSV format
 * POST /api/import/validate
 */
export async function validateCSVHandler(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided'
      })
    }

    const content = req.file.buffer.toString('utf-8')
    const validation = validateCSVFormat(content)

    res.json(validation)
  } catch (error) {
    next(error)
  }
}

/**
 * Export scenario as CSV
 * GET /api/import/export/:scenarioId
 */
export async function exportScenarioHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { scenarioId } = req.params

    const csv = await exportScenarioToCSV(scenarioId, userId)

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="scenario-${scenarioId}.csv"`)
    res.send(csv)
  } catch (error) {
    next(error)
  }
}

/**
 * Bulk import scenarios
 * POST /api/import/bulk
 */
export async function bulkImportHandler(req, res, next) {
  try {
    const userId = req.user.id

    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided'
      })
    }

    const tmpFile = `/tmp/${Date.now()}-${req.file.originalname}`
    const fs = await import('fs/promises')
    await fs.writeFile(tmpFile, req.file.buffer)

    try {
      const results = await bulkImportScenarios(tmpFile, userId, req.body)
      await fs.unlink(tmpFile)

      res.status(201).json({
        success: true,
        message: 'Bulk import completed',
        results
      })
    } catch (error) {
      try {
        await fs.unlink(tmpFile)
      } catch {}
      throw error
    }
  } catch (error) {
    next(error)
  }
}
