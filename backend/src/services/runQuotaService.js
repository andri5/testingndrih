/**
 * Soft concurrency quota for cloud executions (scalability MVP).
 */
const activeByUser = new Map()

export function getMaxConcurrentRuns() {
  const n = Number(process.env.MAX_CONCURRENT_RUNS_PER_USER || 2)
  return Number.isFinite(n) && n > 0 ? n : 2
}

export function beginUserRun(userId) {
  const max = getMaxConcurrentRuns()
  const current = activeByUser.get(userId) || 0
  if (current >= max) {
    const err = new Error(
      `Batas run paralel tercapai (${max}). Tunggu eksekusi selesai atau naikkan MAX_CONCURRENT_RUNS_PER_USER.`
    )
    err.code = 'RUN_QUOTA'
    throw err
  }
  activeByUser.set(userId, current + 1)
  return () => endUserRun(userId)
}

export function endUserRun(userId) {
  const current = activeByUser.get(userId) || 0
  if (current <= 1) activeByUser.delete(userId)
  else activeByUser.set(userId, current - 1)
}

export function getActiveRunCount(userId) {
  return activeByUser.get(userId) || 0
}
