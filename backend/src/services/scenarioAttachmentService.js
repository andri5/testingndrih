import fs from 'fs/promises'
import path from 'path'
import { prisma } from '../lib/prisma.js'
import { getScenarioById } from './scenarioService.js'

export const SCENARIO_ATTACHMENTS_DIR = path.resolve(process.cwd(), 'uploads/scenario-attachments')

const MAX_FILES_PER_SCENARIO = 12
const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/pdf',
])

function safeName(originalName = 'file') {
  return String(originalName)
    .replace(/[^\w.\-()+ ]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120)
}

export async function ensureScenarioAttachmentDir() {
  await fs.mkdir(SCENARIO_ATTACHMENTS_DIR, { recursive: true })
}

/**
 * @param {string} userId
 * @param {string} scenarioId
 * @param {Express.Multer.File[]} files
 */
export async function addScenarioAttachments(userId, scenarioId, files = []) {
  await getScenarioById(scenarioId, userId)

  const existing = await prisma.scenarioAttachment.count({ where: { scenarioId } })
  const incoming = Array.isArray(files) ? files.filter(Boolean) : []
  if (incoming.length === 0) {
    throw Object.assign(new Error('No files uploaded'), { status: 400 })
  }
  if (existing + incoming.length > MAX_FILES_PER_SCENARIO) {
    throw Object.assign(
      new Error(`Maksimal ${MAX_FILES_PER_SCENARIO} attachment per test case`),
      { status: 400 }
    )
  }

  await ensureScenarioAttachmentDir()
  const scenarioDir = path.join(SCENARIO_ATTACHMENTS_DIR, scenarioId)
  await fs.mkdir(scenarioDir, { recursive: true })

  const created = []
  for (const file of incoming) {
    const mime = String(file.mimetype || '').toLowerCase()
    if (!ALLOWED_MIME.has(mime)) {
      throw Object.assign(
        new Error(`Tipe file tidak didukung: ${file.originalname}. Pakai PNG/JPG/WEBP/GIF/PDF.`),
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_BYTES) {
      throw Object.assign(
        new Error(`File terlalu besar (max 8MB): ${file.originalname}`),
        { status: 400 }
      )
    }

    const stored = `${Date.now()}-${safeName(file.originalname)}`
    const diskPath = path.join(scenarioDir, stored)
    const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null)
    if (!buffer) {
      throw Object.assign(new Error('Upload buffer kosong'), { status: 400 })
    }
    await fs.writeFile(diskPath, buffer)

    const url = `/api/scenario-attachments/${scenarioId}/${encodeURIComponent(stored)}`
    const row = await prisma.scenarioAttachment.create({
      data: {
        scenarioId,
        filename: stored,
        originalName: file.originalname || stored,
        mimeType: mime,
        size: file.size || buffer.length,
        url,
        uploadedById: userId,
      },
    })
    created.push(row)
  }

  return created
}

export async function listScenarioAttachments(userId, scenarioId) {
  await getScenarioById(scenarioId, userId)
  return prisma.scenarioAttachment.findMany({
    where: { scenarioId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function deleteScenarioAttachment(userId, scenarioId, attachmentId) {
  await getScenarioById(scenarioId, userId)
  const row = await prisma.scenarioAttachment.findFirst({
    where: { id: attachmentId, scenarioId },
  })
  if (!row) {
    throw Object.assign(new Error('Attachment not found'), { status: 404 })
  }

  const diskPath = path.join(SCENARIO_ATTACHMENTS_DIR, scenarioId, row.filename)
  await fs.unlink(diskPath).catch(() => {})
  await prisma.scenarioAttachment.delete({ where: { id: attachmentId } })
  return { ok: true }
}

export { MAX_FILES_PER_SCENARIO, MAX_FILE_BYTES, ALLOWED_MIME }
