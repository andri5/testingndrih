import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../lib/prisma.js'
import { getIssueById } from './issueService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ISSUE_ATTACHMENTS_DIR = path.resolve(__dirname, '../../uploads/issue-attachments')

const MAX_FILES_PER_ISSUE = 8
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

export async function ensureIssueAttachmentDir() {
  await fs.mkdir(ISSUE_ATTACHMENTS_DIR, { recursive: true })
}

/**
 * Save uploaded multer files onto an issue the user owns.
 * @param {string} userId
 * @param {string} issueId
 * @param {Express.Multer.File[]} files
 */
export async function addIssueAttachments(userId, issueId, files = []) {
  await getIssueById(userId, issueId)

  const existing = await prisma.issueAttachment.count({ where: { issueId } })
  const incoming = Array.isArray(files) ? files.filter(Boolean) : []
  if (incoming.length === 0) {
    throw Object.assign(new Error('No files uploaded'), { status: 400 })
  }
  if (existing + incoming.length > MAX_FILES_PER_ISSUE) {
    throw Object.assign(
      new Error(`Maksimal ${MAX_FILES_PER_ISSUE} attachment per bug`),
      { status: 400 }
    )
  }

  await ensureIssueAttachmentDir()
  const issueDir = path.join(ISSUE_ATTACHMENTS_DIR, issueId)
  await fs.mkdir(issueDir, { recursive: true })

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
    const diskPath = path.join(issueDir, stored)
    const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null)
    if (!buffer) {
      throw Object.assign(new Error('Upload buffer kosong'), { status: 400 })
    }
    await fs.writeFile(diskPath, buffer)

    const url = `/api/issue-attachments/${issueId}/${encodeURIComponent(stored)}`
    const row = await prisma.issueAttachment.create({
      data: {
        issueId,
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

export async function deleteIssueAttachment(userId, issueId, attachmentId) {
  await getIssueById(userId, issueId)
  const row = await prisma.issueAttachment.findFirst({
    where: { id: attachmentId, issueId },
  })
  if (!row) {
    throw Object.assign(new Error('Attachment not found'), { status: 404 })
  }

  const diskPath = path.join(ISSUE_ATTACHMENTS_DIR, issueId, row.filename)
  await fs.unlink(diskPath).catch(() => {})
  await prisma.issueAttachment.delete({ where: { id: attachmentId } })
  return { ok: true }
}

export { MAX_FILES_PER_ISSUE, MAX_FILE_BYTES, ALLOWED_MIME }
