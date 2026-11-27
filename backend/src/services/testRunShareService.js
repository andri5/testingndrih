/**
 * Shareable Test Run report links (read-only, no login).
 * Works for OPEN (in-progress) and CLOSED runs.
 */
import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'
import { getTestRun } from './testRunService.js'

const TOKEN_PREFIX = 'tsntrun_'
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
    testRunId: row.testRunId,
  }
}

function toPublicRunDto(run) {
  return {
    id: run.id,
    title: run.title,
    description: run.description || null,
    status: run.status,
    closedAt: run.closedAt,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    createdBy: run.createdBy
      ? { name: run.createdBy.name || null, email: run.createdBy.email || null }
      : null,
    progress: run.progress || null,
    items: (run.items || []).map((item) => ({
      id: item.id,
      status: item.status,
      notes: item.notes || null,
      sortOrder: item.sortOrder,
      scenario: item.scenario
        ? {
            name: item.scenario.name,
            scenarioCode: item.scenario.scenarioCode || null,
            priority: item.scenario.priority || null,
            caseType: item.scenario.caseType || null,
            folder: item.scenario.folder
              ? { id: item.scenario.folder.id, name: item.scenario.folder.name }
              : null,
          }
        : null,
      assignee: item.assignee
        ? { name: item.assignee.name || null, email: item.assignee.email || null }
        : null,
    })),
  }
}

export async function createTestRunShare(userId, testRunId, { expiresInDays } = {}, baseUrl = '') {
  await getTestRun(userId, testRunId)

  const days = clampExpiresDays(expiresInDays)
  const token = generateShareToken()
  const tokenHash = hashToken(token)
  const prefix = `${token.slice(0, 12)}…`
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

  const row = await prisma.testRunShareLink.create({
    data: {
      testRunId,
      createdByUserId: userId,
      tokenHash,
      prefix,
      expiresAt,
    },
  })

  const origin = String(baseUrl || '').replace(/\/$/, '')
  const sharePath = `/share/test-runs/${token}`
  const shareUrl = origin ? `${origin}${sharePath}` : sharePath

  return {
    token,
    shareUrl,
    sharePath,
    share: serializeShareMeta(row),
  }
}

export async function listTestRunShares(userId, testRunId) {
  await getTestRun(userId, testRunId)
  const rows = await prisma.testRunShareLink.findMany({
    where: { testRunId, createdByUserId: userId },
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(serializeShareMeta)
}

export async function revokeTestRunShare(userId, testRunId, shareId) {
  const share = await prisma.testRunShareLink.findFirst({
    where: {
      id: shareId,
      testRunId,
      createdByUserId: userId,
      revokedAt: null,
    },
  })
  if (!share) {
    const err = new Error('Share link not found')
    err.status = 404
    throw err
  }
  const updated = await prisma.testRunShareLink.update({
    where: { id: shareId },
    data: { revokedAt: new Date() },
  })
  return serializeShareMeta(updated)
}

export async function resolvePublicTestRunShare(rawToken) {
  if (!rawToken || !String(rawToken).startsWith(TOKEN_PREFIX)) {
    const err = new Error('Invalid or expired share link')
    err.status = 404
    throw err
  }

  const tokenHash = hashToken(String(rawToken))
  const share = await prisma.testRunShareLink.findUnique({
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

  const run = await getTestRun(share.createdByUserId, share.testRunId)

  await prisma.testRunShareLink
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
    run: toPublicRunDto(run),
  }
}
