/**
 * In-memory queue for hybrid local-agent jobs (P2 MVP).
 * Jobs are claimed by a machine on the same LAN/VPN as private targets.
 */

const jobs = new Map()

function makeId() {
  return `agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function enqueueAgentJob({ userId, scenarioId, options = {} }) {
  const id = makeId()
  const job = {
    id,
    userId,
    scenarioId,
    options: {
      browser: options.browser || 'chromium',
      headless: options.headless !== false,
      environmentId: options.environmentId || null,
    },
    status: 'QUEUED',
    createdAt: new Date().toISOString(),
    claimedAt: null,
    completedAt: null,
    result: null,
    error: null,
  }
  jobs.set(id, job)
  return job
}

export function listQueuedJobsForUser(userId) {
  return [...jobs.values()]
    .filter((j) => j.userId === userId && j.status === 'QUEUED')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function claimNextJob(userId) {
  const next = listQueuedJobsForUser(userId)[0]
  if (!next) return null
  next.status = 'CLAIMED'
  next.claimedAt = new Date().toISOString()
  jobs.set(next.id, next)
  return next
}

export function getJob(jobId, userId) {
  const job = jobs.get(jobId)
  if (!job || job.userId !== userId) return null
  return job
}

export function completeJob(jobId, userId, payload = {}) {
  const job = getJob(jobId, userId)
  if (!job) return null
  job.status = payload.success === false ? 'FAILED' : 'COMPLETED'
  job.completedAt = new Date().toISOString()
  job.result = payload.result || null
  job.error = payload.error || null
  jobs.set(jobId, job)
  return job
}

export function getAgentJobStats(userId) {
  const mine = [...jobs.values()].filter((j) => j.userId === userId)
  return {
    queued: mine.filter((j) => j.status === 'QUEUED').length,
    claimed: mine.filter((j) => j.status === 'CLAIMED').length,
    completed: mine.filter((j) => j.status === 'COMPLETED').length,
    failed: mine.filter((j) => j.status === 'FAILED').length,
  }
}
