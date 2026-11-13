/**
 * Shareable bug/issue links for developers (read-only, no login).
 * Includes failed-step screenshots when linked to an execution.
 */
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { redactObjectSecrets } from '../utils/secretRedaction.js'
import { getIssueById } from './issueService.js'

const TOKEN_PREFIX = 'tsnbug_'
const DEFAULT_EXPIRES_DAYS = 30
const MAX_EXPIRES_DAYS = 90

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateShareToken() {
  return `${TOKEN_PREFIX}${crypto.randomBytes(32).toString('hex')}`
}

function clampExpiresDays(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_EXPIRES_DAYS
  return Math.min(Math.floor(n), MAX_EXPIRES_DAYS)
}

function serializeShareMeta(row) {
  if (!row) return null
  return {
    id: row.id,
    prefix: row.prefix,
    expiresAt: row.expiresAt?.toISOString?.() || row.expiresAt || null,
    revokedAt: row.revokedAt?.toISOString?.() || row.revokedAt || null,
    lastAccessedAt: row.lastAccessedAt?.toISOString?.() || row.lastAccessedAt || null,
    createdAt: row.createdAt?.toISOString?.() || row.createdAt,
    issueId: row.issueId,
  }
}

function truncateError(message, max = 800) {
  if (!message) return null
  const s = String(message)
  let redacted = s
  try {
    const parsed = JSON.parse(s)
    redacted = JSON.stringify(redactObjectSecrets(parsed))
  } catch {
    /* plain text */
  }
  if (redacted.length <= max) return redacted
  return `${redacted.slice(0, max)}…`
}

function toPublicIssueDto(issue, failedSteps = []) {
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description || null,
    status: issue.status,
    severity: issue.severity,
    stepNumber: issue.stepNumber,
    source: issue.source || 'AUTO',
    createdAt: issue.createdAt,
    scenario: issue.scenario
      ? { name: issue.scenario.name, url: issue.scenario.url || null }
      : issue.execution?.scenario
        ? { name: issue.execution.scenario.name, url: issue.execution.scenario.url || null }
        : null,
    execution: issue.execution
      ? {
          id: issue.execution.id,
          status: issue.execution.status,
          browser: issue.execution.browser || null,
          duration: issue.execution.duration,
          passedSteps: issue.execution.passedSteps,
          failedSteps: issue.execution.failedSteps,
          totalSteps: issue.execution.totalSteps,
          errorMessage: truncateError(issue.execution.errorMessage),
          startTime: issue.execution.startTime,
          endTime: issue.execution.endTime,
        }
      : null,
    failedSteps,
    attachments: (issue.attachments || []).map((a) => ({
      id: a.id,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
      url: a.url,
    })),
  }
}

export async function createIssueShare(userId, issueId, { expiresInDays } = {}, baseUrl = '') {
  await getIssueById(userId, issueId)

  const days = clampExpiresDays(expiresInDays)
  const token = generateShareToken()
  const tokenHash = hashToken(token)
  const prefix = `${token.slice(0, 12)}…`
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

  const row = await prisma.issueShareLink.create({
    data: {
      issueId,
      createdByUserId: userId,
      tokenHash,
      prefix,
      expiresAt,
    },
  })

  const origin = String(baseUrl || '').replace(/\/$/, '')
  const sharePath = `/share/bugs/${token}`
  const shareUrl = origin ? `${origin}${sharePath}` : sharePath

  return {
    token,
    shareUrl,
    sharePath,
    share: serializeShareMeta(row),
  }
}

export async function listIssueShares(userId, issueId) {
  await getIssueById(userId, issueId)
  const rows = await prisma.issueShareLink.findMany({
    where: { issueId, createdByUserId: userId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(serializeShareMeta)
}

export async function revokeIssueShare(userId, issueId, shareId) {
  const share = await prisma.issueShareLink.findFirst({
    where: {
      id: shareId,
      issueId,
      createdByUserId: userId,
      revokedAt: null,
    },
  })
  if (!share) {
    const err = new Error('Share link not found')
    err.status = 404
    throw err
  }
  const updated = await prisma.issueShareLink.update({
    where: { id: shareId },
    data: { revokedAt: new Date() },
  })
  return serializeShareMeta(updated)
}

export async function resolvePublicIssueShare(rawToken) {
  if (!rawToken || !String(rawToken).startsWith(TOKEN_PREFIX)) {
    const err = new Error('Invalid or expired share link')
    err.status = 404
    throw err
  }

  const tokenHash = hashToken(String(rawToken))
  const share = await prisma.issueShareLink.findUnique({
    where: { tokenHash },
  })

  if (!share || share.revokedAt) {
    const err = new Error('Invalid or expired share link')
    err.status = 404
    throw err
  }
  if (share.expiresAt && share.expiresAt < new Date()) {
    const err = new Error('This share link has expired')
    err.status = 410
    throw err
  }

  const issue = await prisma.issue.findUnique({
    where: { id: share.issueId },
    include: {
      attachments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          size: true,
          url: true,
        },
      },
      scenario: { select: { name: true, url: true } },
      execution: {
        select: {
          id: true,
          status: true,
          browser: true,
          duration: true,
          passedSteps: true,
          failedSteps: true,
          totalSteps: true,
          errorMessage: true,
          startTime: true,
          endTime: true,
          scenario: { select: { name: true, url: true } },
          stepResults: {
            where: { status: 'FAILED' },
            include: {
              testStep: {
                select: {
                  stepNumber: true,
                  type: true,
                  description: true,
                  selector: true,
                },
              },
              screenshot: { select: { id: true, url: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  if (!issue) {
    const err = new Error('Issue not found')
    err.status = 404
    throw err
  }

  const failedSteps = (issue.execution?.stepResults || []).map((sr) => ({
    id: sr.id,
    status: sr.status,
    duration: sr.duration,
    errorMessage: truncateError(sr.errorMessage),
    stepNumber: sr.testStep?.stepNumber ?? null,
    type: sr.testStep?.type || null,
    description: sr.testStep?.description || null,
    selector: sr.testStep?.selector || null,
    screenshot: sr.screenshot
      ? { id: sr.screenshot.id, url: sr.screenshot.url }
      : null,
  }))

  // Prefer highlighting the issue's stepNumber screenshot first
  if (issue.stepNumber != null) {
    failedSteps.sort((a, b) => {
      const aMatch = a.stepNumber === issue.stepNumber ? 0 : 1
      const bMatch = b.stepNumber === issue.stepNumber ? 0 : 1
      return aMatch - bMatch
    })
  }

  await prisma.issueShareLink
    .update({
      where: { id: share.id },
      data: { lastAccessedAt: new Date() },
    })
    .catch(() => {})

  return {
    share: {
      id: share.id,
      expiresAt: share.expiresAt?.toISOString?.() || share.expiresAt || null,
    },
    issue: toPublicIssueDto(issue, failedSteps),
  }
}
