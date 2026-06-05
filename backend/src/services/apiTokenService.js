import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'

const TOKEN_PREFIX = 'tsn_'

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function generateApiToken() {
  const raw = crypto.randomBytes(32).toString('hex')
  return `${TOKEN_PREFIX}${raw}`
}

export async function createApiToken(userId, name, expiresInDays = null) {
  const token = generateApiToken()
  const tokenHash = hashToken(token)
  const prefix = token.slice(0, 12) + '...'
  let expiresAt = null
  if (expiresInDays && expiresInDays > 0) {
    expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
  }
  const record = await prisma.apiToken.create({
    data: { userId, name, tokenHash, prefix, expiresAt }
  })
  return { ...record, token }
}

export async function listApiTokens(userId) {
  return prisma.apiToken.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      createdAt: true,
      expiresAt: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function revokeApiToken(userId, tokenId) {
  const record = await prisma.apiToken.findFirst({ where: { id: tokenId, userId } })
  if (!record) {
    throw Object.assign(new Error('Token not found'), { status: 404 })
  }
  await prisma.apiToken.delete({ where: { id: tokenId } })
  return { success: true }
}

export async function resolveUserFromApiToken(bearerToken) {
  if (!bearerToken || !bearerToken.startsWith(TOKEN_PREFIX)) return null
  const tokenHash = hashToken(bearerToken)
  const record = await prisma.apiToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true } } }
  })
  if (!record) return null
  if (record.expiresAt && record.expiresAt < new Date()) return null
  await prisma.apiToken.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() }
  })
  return { id: record.user.id, email: record.user.email }
}
