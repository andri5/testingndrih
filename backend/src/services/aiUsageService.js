/**
 * Per-user AI quota — keeps usage within free-tier provider limits.
 * In-memory (resets on server restart; sufficient for dev/small deployments).
 */

export class AiQuotaError extends Error {
  constructor(message, code = 'AI_QUOTA_EXCEEDED') {
    super(message)
    this.name = 'AiQuotaError'
    this.status = 429
    this.code = code
  }
}

const usageByUser = new Map()
let globalDailyCount = 0
let globalDailyDate = todayKey()
let providerCooldownUntil = 0

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function hourKey() {
  return new Date().toISOString().slice(0, 13)
}

function getLimits() {
  return {
    dailyPerUser: parseInt(process.env.AI_DAILY_LIMIT_PER_USER || '15', 10),
    hourlyPerUser: parseInt(process.env.AI_HOURLY_LIMIT_PER_USER || '8', 10),
    globalDaily: parseInt(process.env.AI_GLOBAL_DAILY_LIMIT || '80', 10),
  }
}

function getUserRecord(userId) {
  const day = todayKey()
  const hour = hourKey()
  let rec = usageByUser.get(userId)
  if (!rec || rec.day !== day) {
    rec = { day, hour, dailyCount: 0, hourlyCount: 0 }
    usageByUser.set(userId, rec)
  }
  if (rec.hour !== hour) {
    rec.hour = hour
    rec.hourlyCount = 0
  }
  return rec
}

function resetGlobalIfNewDay() {
  const day = todayKey()
  if (globalDailyDate !== day) {
    globalDailyDate = day
    globalDailyCount = 0
  }
}

function nextMidnightUtc() {
  const d = new Date()
  d.setUTCHours(24, 0, 0, 0)
  return d.toISOString()
}

export function isProviderInCooldown() {
  return Date.now() < providerCooldownUntil
}

export function markProviderCooldown(ms = 60_000) {
  providerCooldownUntil = Date.now() + ms
}

export function getAiQuotaStatus(userId) {
  const limits = getLimits()
  const rec = getUserRecord(userId)
  resetGlobalIfNewDay()

  const dailyRemaining = Math.max(0, limits.dailyPerUser - rec.dailyCount)
  const hourlyRemaining = Math.max(0, limits.hourlyPerUser - rec.hourlyCount)
  const globalRemaining = Math.max(0, limits.globalDaily - globalDailyCount)

  const effectiveRemaining = Math.min(dailyRemaining, hourlyRemaining, globalRemaining)

  let blockedReason = null
  if (!isAiConfigured()) {
    blockedReason = 'not_configured'
  } else if (isProviderInCooldown()) {
    blockedReason = 'provider_cooldown'
  } else if (globalRemaining <= 0) {
    blockedReason = 'global_daily'
  } else if (dailyRemaining <= 0) {
    blockedReason = 'user_daily'
  } else if (hourlyRemaining <= 0) {
    blockedReason = 'user_hourly'
  }

  return {
    dailyLimit: limits.dailyPerUser,
    hourlyLimit: limits.hourlyPerUser,
    globalDailyLimit: limits.globalDaily,
    dailyUsed: rec.dailyCount,
    hourlyUsed: rec.hourlyCount,
    dailyRemaining,
    hourlyRemaining,
    globalRemaining,
    remaining: effectiveRemaining,
    canUse: blockedReason === null,
    blockedReason,
    resetsAt: nextMidnightUtc(),
    providerCooldown: isProviderInCooldown(),
  }
}

function isAiConfigured() {
  return process.env.AI_ENABLED === 'true' && Boolean(process.env.OPENAI_API_KEY?.trim())
}

export function assertAiQuota(userId) {
  const status = getAiQuotaStatus(userId)

  if (!isAiConfigured()) {
    throw new AiQuotaError(
      'Fitur AI belum dikonfigurasi di server.',
      'AI_NOT_CONFIGURED'
    )
  }

  if (status.providerCooldown) {
    throw new AiQuotaError(
      'Layanan AI sementara sibuk (limit provider). Coba lagi dalam 1–2 menit.',
      'AI_PROVIDER_COOLDOWN'
    )
  }

  if (status.blockedReason === 'global_daily') {
    throw new AiQuotaError(
      `Kuota AI server untuk hari ini sudah habis (${status.globalDailyLimit}/hari). Coba lagi besok setelah reset.`,
      'AI_GLOBAL_DAILY_LIMIT'
    )
  }

  if (status.blockedReason === 'user_daily') {
    throw new AiQuotaError(
      `Kuota AI harian Anda sudah habis (${status.dailyLimit} permintaan/hari). Reset: ${formatReset(status.resetsAt)}.`,
      'AI_USER_DAILY_LIMIT'
    )
  }

  if (status.blockedReason === 'user_hourly') {
    throw new AiQuotaError(
      `Kuota AI per jam Anda sudah habis (${status.hourlyLimit}/jam). Tunggu ~1 jam lalu coba lagi.`,
      'AI_USER_HOURLY_LIMIT'
    )
  }

  return status
}

export function recordAiUsage(userId) {
  resetGlobalIfNewDay()
  const rec = getUserRecord(userId)
  rec.dailyCount += 1
  rec.hourlyCount += 1
  globalDailyCount += 1
}

function formatReset(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return 'besok'
  }
}

export function clearAiUsageCache() {
  usageByUser.clear()
  globalDailyCount = 0
}
