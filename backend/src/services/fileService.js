import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.join(__dirname, '../../uploads')
const TEMPLATES_DIR = path.join(__dirname, '../../templates')

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.mkdir(TEMPLATES_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create directories:', error.message)
  }
}

ensureDirectories()

/**
 * Save uploaded file
 */
export async function saveUploadedFile(file, userId) {
  try {
    if (!file) {
      throw new Error('No file provided')
    }

    const userUploadDir = path.join(UPLOAD_DIR, userId)
    await fs.mkdir(userUploadDir, { recursive: true })

    const filename = `${Date.now()}-${file.originalname}`
    const filepath = path.join(userUploadDir, filename)

    // Save file
    await fs.writeFile(filepath, file.buffer)

    return {
      filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date(),
      filepath: `/uploads/${userId}/${filename}`
    }
  } catch (error) {
    throw new Error(`Failed to save file: ${error.message}`)
  }
}

/**
 * Get uploaded file
 */
export async function getUploadedFile(filename, userId) {
  try {
    const filepath = path.join(UPLOAD_DIR, userId, filename)

    // Security: ensure filepath is within user's directory
    const realPath = await fs.realpath(filepath)
    const userDir = await fs.realpath(path.join(UPLOAD_DIR, userId))

    if (!realPath.startsWith(userDir)) {
      throw new Error('Unauthorized access to file')
    }

    const content = await fs.readFile(filepath)
    return content
  } catch (error) {
    throw new Error(`Failed to retrieve file: ${error.message}`)
  }
}

/**
 * Delete uploaded file
 */
export async function deleteUploadedFile(filename, userId) {
  try {
    const filepath = path.join(UPLOAD_DIR, userId, filename)

    // Security check
    const realPath = await fs.realpath(filepath)
    const userDir = await fs.realpath(path.join(UPLOAD_DIR, userId))

    if (!realPath.startsWith(userDir)) {
      throw new Error('Unauthorized access to file')
    }

    await fs.unlink(filepath)
    return { message: 'File deleted successfully' }
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * List user's uploaded files
 */
export async function listUserFiles(userId) {
  try {
    const userUploadDir = path.join(UPLOAD_DIR, userId)

    // Check if directory exists
    try {
      await fs.access(userUploadDir)
    } catch {
      return []
    }

    const files = await fs.readdir(userUploadDir, { withFileTypes: true })
    const fileList = []

    for (const file of files) {
      if (file.isFile()) {
        const filepath = path.join(userUploadDir, file.name)
        const stats = await fs.stat(filepath)
        fileList.push({
          filename: file.name,
          size: stats.size,
          uploadedAt: stats.birthtime,
          modifiedAt: stats.mtime
        })
      }
    }

    return fileList.sort((a, b) => b.uploadedAt - a.uploadedAt)
  } catch (error) {
    throw new Error(`Failed to list files: ${error.message}`)
  }
}

/**
 * Get or create scenario template
 */
export async function createScenarioTemplate(name, description, templateData) {
  try {
    const templateId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const templateFile = path.join(TEMPLATES_DIR, `${templateId}.json`)

    const template = {
      id: templateId,
      name,
      description,
      steps: templateData.steps || [],
      createdAt: new Date(),
      version: '1.0'
    }

    await fs.writeFile(templateFile, JSON.stringify(template, null, 2))

    return template
  } catch (error) {
    throw new Error(`Failed to create template: ${error.message}`)
  }
}

/**
 * Get scenario template
 */
export async function getScenarioTemplate(templateId) {
  try {
    const templateFile = path.join(TEMPLATES_DIR, `${templateId}.json`)

    // Security: ensure file is in templates directory
    const realPath = await fs.realpath(templateFile)
    const templatesDir = await fs.realpath(TEMPLATES_DIR)

    if (!realPath.startsWith(templatesDir)) {
      throw new Error('Unauthorized access to template')
    }

    const content = await fs.readFile(templateFile, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to retrieve template: ${error.message}`)
  }
}

/**
 * List available templates
 */
export async function listScenarioTemplates() {
  try {
    const files = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true })
    const templates = []

    for (const file of files) {
      if (file.isFile() && file.name.endsWith('.json')) {
        const content = await fs.readFile(path.join(TEMPLATES_DIR, file.name), 'utf-8')
        templates.push(JSON.parse(content))
      }
    }

    return templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch (error) {
    throw new Error(`Failed to list templates: ${error.message}`)
  }
}

/**
 * Delete scenario template
 */
export async function deleteScenarioTemplate(templateId) {
  try {
    const templateFile = path.join(TEMPLATES_DIR, `${templateId}.json`)

    // Security check
    const realPath = await fs.realpath(templateFile)
    const templatesDir = await fs.realpath(TEMPLATES_DIR)

    if (!realPath.startsWith(templatesDir)) {
      throw new Error('Unauthorized access to template')
    }

    await fs.unlink(templateFile)
    return { message: 'Template deleted successfully' }
  } catch (error) {
    throw new Error(`Failed to delete template: ${error.message}`)
  }
}

/**
 * Export directories for middleware
 */
export { UPLOAD_DIR, TEMPLATES_DIR }
