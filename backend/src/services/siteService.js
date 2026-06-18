import crypto from 'crypto'
import { prisma } from '../lib/prisma.js'

const MAX_MESSAGE = 2000
const MAX_NAME = 120
const MAX_EMAIL = 254
const TRACK_PATH_MAX = 500

function normalizePath(path) {
  if (!path || typeof path !== 'string') return '/'
  const trimmed = path.trim().slice(0, TRACK_PATH_MAX)
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export async function submitLandingFeedback({ name, email, message, page, lang }) {
  const text = (message || '').trim()
  if (!text || text.length < 10) {
    throw Object.assign(new Error('Message must be at least 10 characters'), { status: 400 })
  }
  if (text.length > MAX_MESSAGE) {
    throw Object.assign(new Error(`Message must be at most ${MAX_MESSAGE} characters`), {
      status: 400,
    })
  }

  const safeName = name ? String(name).trim().slice(0, MAX_NAME) : null
  const safeEmail = email ? String(email).trim().slice(0, MAX_EMAIL) : null
  const safePage = page ? String(page).trim().slice(0, TRACK_PATH_MAX) : null
  const safeLang = lang === 'en' ? 'en' : 'id'

  return prisma.landingFeedback.create({
    data: {
      name: safeName || null,
      email: safeEmail || null,
      message: text,
      page: safePage,
      lang: safeLang,
    },
    select: {
      id: true,
      createdAt: true,
    },
  })
}

export async function listLandingFeedback({ limit = 50, skip = 0 } = {}) {
  const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100)
  const offset = Math.max(parseInt(skip, 10) || 0, 0)

  const [items, total] = await Promise.all([
    prisma.landingFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      skip: offset,
    }),
    prisma.landingFeedback.count(),
  ])

  return { items, total, limit: take, skip: offset }
}

export function createVisitorId() {
  return crypto.randomUUID()
}

export async function trackPageView({ path, lang, visitorId, userAgent, referer }) {
  const safePath = normalizePath(path)
  const safeLang = lang === 'en' ? 'en' : lang === 'id' ? 'id' : null
  const safeVisitor =
    visitorId && String(visitorId).length <= 64 ? String(visitorId) : null

  return prisma.sitePageView.create({
    data: {
      path: safePath,
      lang: safeLang,
      visitorId: safeVisitor,
      userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
      referer: referer ? String(referer).slice(0, 500) : null,
    },
  })
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function getSiteAnalytics({ days = 30 } = {}) {
  const dayCount = Math.min(Math.max(parseInt(days, 10) || 30, 1), 365)
  const since = new Date()
  since.setDate(since.getDate() - dayCount)
  since.setHours(0, 0, 0, 0)

  const where = { createdAt: { gte: since } }

  const [totalViews, pathGroups, visitorGroups, recentViews] = await Promise.all([
    prisma.sitePageView.count({ where }),
    prisma.sitePageView.groupBy({
      by: ['path'],
      where,
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 20,
    }),
    prisma.sitePageView.groupBy({
      by: ['visitorId'],
      where: { ...where, visitorId: { not: null } },
    }),
    prisma.sitePageView.findMany({
      where,
      select: { createdAt: true, visitorId: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const uniqueVisitors = visitorGroups.length

  const dailyMap = new Map()
  for (let i = 0; i < dayCount; i += 1) {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    const key = startOfDay(d).toISOString().slice(0, 10)
    dailyMap.set(key, { date: key, views: 0, visitors: new Set() })
  }

  for (const row of recentViews) {
    const key = startOfDay(row.createdAt).toISOString().slice(0, 10)
    if (!dailyMap.has(key)) continue
    const bucket = dailyMap.get(key)
    bucket.views += 1
    if (row.visitorId) bucket.visitors.add(row.visitorId)
  }

  const daily = [...dailyMap.values()].map((b) => ({
    date: b.date,
    views: b.views,
    uniqueVisitors: b.visitors.size,
  }))

  return {
    periodDays: dayCount,
    since: since.toISOString(),
    totalViews,
    uniqueVisitors,
    topPaths: pathGroups.map((p) => ({
      path: p.path,
      views: p._count.path,
    })),
    daily,
  }
}
