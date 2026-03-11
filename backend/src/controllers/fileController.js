import {
  saveUploadedFile,
  getUploadedFile,
  deleteUploadedFile,
  listUserFiles,
  createScenarioTemplate,
  getScenarioTemplate,
  listScenarioTemplates,
  deleteScenarioTemplate
} from '../services/fileService.js'

/**
 * Upload file
 * POST /api/files/upload
 */
export async function uploadFileHandler(req, res, next) {
  try {
    const userId = req.user.id

    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided'
      })
    }

    const fileInfo = await saveUploadedFile(req.file, userId)
    res.status(201).json(fileInfo)
  } catch (error) {
    next(error)
  }
}

/**
 * Download file
 * GET /api/files/download/:filename
 */
export async function downloadFileHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { filename } = req.params

    const content = await getUploadedFile(filename, userId)

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(content)
  } catch (error) {
    next(error)
  }
}

/**
 * Get file metadata
 * GET /api/files/:filename
 */
export async function getFileHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { filename } = req.params

    // Just verify the file exists in user's directory
    await getUploadedFile(filename, userId)

    res.json({ message: 'File exists', filename })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete file
 * DELETE /api/files/:filename
 */
export async function deleteFileHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { filename } = req.params

    const result = await deleteUploadedFile(filename, userId)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * List user files
 * GET /api/files
 */
export async function listFilesHandler(req, res, next) {
  try {
    const userId = req.user.id

    const files = await listUserFiles(userId)
    res.json({ files })
  } catch (error) {
    next(error)
  }
}

/**
 * Create scenario template
 * POST /api/templates
 */
export async function createTemplateHandler(req, res, next) {
  try {
    const { name, description, steps } = req.body

    if (!name) {
      return res.status(400).json({
        error: 'Template name is required'
      })
    }

    const template = await createScenarioTemplate(name, description, { steps: steps || [] })
    res.status(201).json(template)
  } catch (error) {
    next(error)
  }
}

/**
 * Get scenario template
 * GET /api/templates/:templateId
 */
export async function getTemplateHandler(req, res, next) {
  try {
    const { templateId } = req.params

    const template = await getScenarioTemplate(templateId)
    res.json(template)
  } catch (error) {
    next(error)
  }
}

/**
 * List scenario templates
 * GET /api/templates
 */
export async function listTemplatesHandler(req, res, next) {
  try {
    const templates = await listScenarioTemplates()
    res.json({ templates })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete scenario template
 * DELETE /api/templates/:templateId
 */
export async function deleteTemplateHandler(req, res, next) {
  try {
    const { templateId } = req.params

    const result = await deleteScenarioTemplate(templateId)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
