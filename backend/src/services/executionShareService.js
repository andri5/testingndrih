/**
 * Shareable execution run links (P3).
 * Raw token returned once on create; only SHA-256 hash is stored.
 */
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { redactObjectSecrets } from '../utils/secretRedaction.js'

const TOKEN_PREFIX = 'tsnshare_'
const DEFAULT_EXPIRES_DAYS = 30
const MAX_EXPIRES_DAYS = 90

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateShareToken() {
  const raw = crypto.randomBytes(32).toString('hex')
  return `${TOKEN_PREFIX}${raw}`
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
    executionId: row.executionId,
  }
}

function truncateError(message, max = 500) {
  if (!message) return null
  const s = String(message)
  const redacted = typeof redactObjectSecrets === 'function'
    ? (() => {
        try {
          const parsed = JSON.parse(s)
          return JSON.stringify(redactObjectSecrets(parsed))
        } catch {
          return s
        }
      })()
    : s
  if (redacted.length <= max) return redacted
  return `${redacted.slice(0, max)}…`
}

/**
 * Redacted DTO for public viewers — never include step values / metadata / owner.
 */
export function toPublicExecutionDto(execution) {
  if (!execution) return null
  return {
    id: execution.id,
    status: execution.status,
    startTime: execution.startTime,
    endTime: execution.endTime,
    duration: execution.duration,
    passedSteps: execution.passedSteps,
    failedSteps: execution.failedSteps,
    totalSteps: execution.totalSteps,
    browser: execution.browser,
    testType: execution.testType,
    errorMessage: truncateError(execution.errorMessage),
    videoPath: execution.videoPath || null,
    createdAt: execution.createdAt,
    scenario: execution.scenario
      ? { name: execution.scenario.name }
      : null,
    stepResults: (execution.stepResults || []).map((sr) => ({
      id: sr.id,
      status: sr.status,
      duration: sr.duration,
      errorMessage: truncateError(sr.errorMessage),
      testStep: sr.testStep
        ? {
            id: sr.testStep.id,
            stepNumber: sr.testStep.stepNumber,
            type: sr.testStep.type,
            description: sr.testStep.description,
            // omit value + metadata + selector detail for privacy
          }
        : null,
      screenshot: sr.screenshot
        ? { id: sr.screenshot.id, url: sr.screenshot.url }
        : null,
    })),
  }
}

export async function createShare(userId, executionId, { expiresInDays } = {}, baseUrl = '') {
  const execution = await prisma.execution.findFirst({
    where: { id: executionId, userId },
    select: { id: true, status: true },
  })
  if (!execution) {
    const err = new Error('Execution not found')
    err.status = 404
    throw err
  }

  const days = clampExpiresDays(expiresInDays)
  const token = generateShareToken()
  const tokenHash = hashToken(token)
  const prefix = `${token.slice(0, 12)}…`
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

  const row = await prisma.executionShareLink.create({
    data: {
      executionId,
      createdByUserId: userId,
      tokenHash,
      prefix,
      expiresAt,
    },
  })

  const origin = String(baseUrl || '').replace(/\/$/, '')
  const sharePath = `/share/runs/${token}`
  const shareUrl = origin ? `${origin}${sharePath}` : sharePath

  return {
    token,
    shareUrl,
    sharePath,
    share: serializeShareMeta(row),
  }
}

export async function listShares(userId, executionId) {
  const execution = await prisma.execution.findFirst({
    where: { id: executionId, userId },
    select: { id: true },
  })
  if (!execution) {
    const err = new Error('Execution not found')
    err.status = 404
    throw err
  }

  const rows = await prisma.executionShareLink.findMany({
    where: { executionId, createdByUserId: userId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(serializeShareMeta)
}

export async function revokeShare(userId, executionId, shareId) {
  const share = await prisma.executionShareLink.findFirst({
    where: {
      id: shareId,
      executionId,
      createdByUserId: userId,
      revokedAt: null,
    },
  })
  if (!share) {
    const err = new Error('Share link not found')
    err.status = 404
    throw err
  }

  const updated = await prisma.executionShareLink.update({
    where: { id: shareId },
    data: { revokedAt: new Date() },
  })
  return serializeShareMeta(updated)
}

export async function resolvePublicShare(rawToken) {
  if (!rawToken || !String(rawToken).startsWith(TOKEN_PREFIX)) {
    const err = new Error('Invalid or expired share link')
    err.status = 404
    throw err
  }

  const tokenHash = hashToken(String(rawToken))
  const share = await prisma.executionShareLink.findUnique({
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

  const execution = await prisma.execution.findUnique({
    where: { id: share.executionId },
    include: {
      scenario: { select: { name: true } },
      stepResults: {
        include: {
          testStep: {
            select: {
              id: true,
              stepNumber: true,
              type: true,
              description: true,
            },
          },
          screenshot: { select: { id: true, url: true } },
        },
        orderBy: { testStep: { stepNumber: 'asc' } },
      },
    },
  })

  if (!execution) {
    const err = new Error('Execution not found')
    err.status = 404
    throw err
  }

  await prisma.executionShareLink.update({
    where: { id: share.id },
    data: { lastAccessedAt: new Date() },
  }).catch(() => {})

  return {
    share: {
      id: share.id,
      expiresAt: share.expiresAt?.toISOString?.() || share.expiresAt || null,
    },
    execution: toPublicExecutionDto(execution),
  }
}
