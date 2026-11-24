import fs from 'fs/promises'
import path from 'path'
import { prisma } from '../lib/prisma.js'
import { getScenarioById } from './scenarioService.js'

export const SCENARIO_ATTACHMENTS_DIR = path.resolve(process.cwd(), 'uploads/scenario-attachments')

const MAX_FILES_PER_SCENARIO = 16
const MAX_FILES_PER_STEP = 8
const MAX_FILE_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'application/pdf',
  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
  'text/csv',
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
])
const IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
])
const ALLOWED_EXT = /\.(png|jpe?g|webp|gif|pdf|xlsx?|docx?|odt|ods|csv)$/i

function isAllowedGeneralFile(file) {
  const mime = String(file.mimetype || '').toLowerCase()
  if (ALLOWED_MIME.has(mime)) return true
  // Some browsers send octet-stream for Office files — allow by extension
  if (
    (mime === 'application/octet-stream' || mime === 'binary/octet-stream' || !mime) &&
    ALLOWED_EXT.test(file.originalname || '')
  ) {
    return true
  }
  return false
}

export const ATTACHMENT_KINDS = new Set(['GENERAL', 'EXPECTED_RESULT'])

function safeName(originalName = 'file') {
  return String(originalName)
    .replace(/[^\w.\-()+ ]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120)
}

function normalizeKind(kind) {
  const k = String(kind || 'GENERAL').trim().toUpperCase()
  return ATTACHMENT_KINDS.has(k) ? k : 'GENERAL'
}

export async function ensureScenarioAttachmentDir() {
  await fs.mkdir(SCENARIO_ATTACHMENTS_DIR, { recursive: true })
}

/**
 * @param {string} userId
 * @param {string} scenarioId
 * @param {Express.Multer.File[]} files
 * @param {{ kind?: string, testStepId?: string|null }} [options]
 */
export async function addScenarioAttachments(userId, scenarioId, files = [], options = {}) {
  await getScenarioById(scenarioId, userId)

  const kind = normalizeKind(options.kind)
  const testStepId = options.testStepId || null

  if (testStepId) {
    const step = await prisma.testStep.findFirst({
      where: { id: testStepId, scenarioId },
      select: { id: true },
    })
    if (!step) {
      throw Object.assign(new Error('Test step not found'), { status: 404 })
    }
  }

  const countWhere = testStepId
    ? { scenarioId, testStepId }
    : { scenarioId, testStepId: null }
  const existing = await prisma.scenarioAttachment.count({ where: countWhere })
  const incoming = Array.isArray(files) ? files.filter(Boolean) : []
  if (incoming.length === 0) {
    throw Object.assign(new Error('No files uploaded'), { status: 400 })
  }
  const maxFiles = testStepId ? MAX_FILES_PER_STEP : MAX_FILES_PER_SCENARIO
  if (existing + incoming.length > maxFiles) {
    throw Object.assign(
      new Error(
        testStepId
          ? `Maksimal ${MAX_FILES_PER_STEP} attachment per test step`
          : `Maksimal ${MAX_FILES_PER_SCENARIO} attachment per test case`
      ),
      { status: 400 }
    )
  }

  await ensureScenarioAttachmentDir()
  const scenarioDir = path.join(SCENARIO_ATTACHMENTS_DIR, scenarioId)
  await fs.mkdir(scenarioDir, { recursive: true })

  const created = []
  for (const file of incoming) {
    const mime = String(file.mimetype || '').toLowerCase()
    if (kind === 'EXPECTED_RESULT') {
      if (!IMAGE_MIME.has(mime)) {
        throw Object.assign(
          new Error(`Expected result hanya menerima gambar (PNG/JPG/WEBP/GIF): ${file.originalname}`),
          { status: 400 }
        )
      }
    } else if (!isAllowedGeneralFile(file)) {
      throw Object.assign(
        new Error(
          `Tipe file tidak didukung: ${file.originalname}. Pakai gambar, PDF, Excel (.xls/.xlsx), atau Word (.doc/.docx).`
        ),
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
        testStepId,
        filename: stored,
        originalName: file.originalname || stored,
        mimeType: mime,
        size: file.size || buffer.length,
        url,
        kind: testStepId ? 'GENERAL' : kind,
        uploadedById: userId,
      },
    })
    created.push(row)
  }

  return created
}

export async function listScenarioAttachments(userId, scenarioId, options = {}) {
  await getScenarioById(scenarioId, userId)
  const where = { scenarioId }
  if (options.kind) {
    where.kind = normalizeKind(options.kind)
  }
  if (options.testStepId) {
    where.testStepId = options.testStepId
  } else if (options.includeStepAttachments !== true) {
    // Case Attachments tab: only case-level files
    where.testStepId = null
  }
  return prisma.scenarioAttachment.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  })
}

export async function listStepAttachments(userId, scenarioId, testStepId) {
  return listScenarioAttachments(userId, scenarioId, { testStepId })
}

export async function addStepAttachments(userId, scenarioId, testStepId, files = []) {
  return addScenarioAttachments(userId, scenarioId, files, {
    kind: 'GENERAL',
    testStepId,
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

export {
  MAX_FILES_PER_SCENARIO,
  MAX_FILES_PER_STEP,
  MAX_FILE_BYTES,
  ALLOWED_MIME,
  IMAGE_MIME,
}
