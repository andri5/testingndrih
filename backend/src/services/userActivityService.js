import { prisma } from '../lib/prisma.js'

const DEFAULT_LIMIT = 50
const SUMMARY_DAYS = 7

function daysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function toActivityEvent(item) {
  return item
}

export function buildExecutionActivity(execution) {
  const scenarioName = execution.scenario?.name || 'Unknown scenario'
  return toActivityEvent({
    id: `execution-${execution.id}`,
    type: 'EXECUTION',
    action: `Ran scenario "${scenarioName}"`,
    detail: `Status: ${execution.status}${execution.testType ? ` · ${execution.testType}` : ''}`,
    status: execution.status,
    createdAt: execution.createdAt,
    resourceId: execution.id,
  })
}

export function buildScenarioActivity(scenario) {
  const isNew =
    Math.abs(new Date(scenario.updatedAt) - new Date(scenario.createdAt)) < 60_000
  return toActivityEvent({
    id: `scenario-${scenario.id}-${scenario.updatedAt.toISOString()}`,
    type: isNew ? 'SCENARIO_CREATED' : 'SCENARIO_UPDATED',
    action: isNew
      ? `Created scenario "${scenario.name}"`
      : `Updated scenario "${scenario.name}"`,
    detail: scenario.url || '',
    status: null,
    createdAt: isNew ? scenario.createdAt : scenario.updatedAt,
    resourceId: scenario.id,
  })
}

export function buildChainActivity(chainExecution) {
  const chainName = chainExecution.chain?.name || 'Unknown chain'
  return toActivityEvent({
    id: `chain-${chainExecution.id}`,
    type: 'CHAIN_EXECUTION',
    action: `Ran chain "${chainName}"`,
    detail: `Status: ${chainExecution.status}`,
    status: chainExecution.status,
    createdAt: chainExecution.createdAt,
    resourceId: chainExecution.id,
  })
}

export function buildSecurityScanActivity(scan) {
  const scenarioName = scan.scenario?.name || 'Unknown scenario'
  return toActivityEvent({
    id: `security-${scan.id}`,
    type: 'SECURITY_SCAN',
    action: `Security scan on "${scenarioName}"`,
    detail: `Status: ${scan.status} · ${scan.findingsCount} finding(s)`,
    status: scan.status,
    createdAt: scan.completedAt || scan.startedAt || scan.createdAt,
    resourceId: scan.id,
  })
}

function pickLatestActivity(events) {
  if (!events.length) return null
  return events.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
}

async function loadRecentEventsForUser(userId, perSource = 15) {
  const [executions, scenarios, chainExecutions, securityScans] = await Promise.all([
    prisma.execution.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      select: {
        id: true,
        status: true,
        testType: true,
        createdAt: true,
        scenario: { select: { name: true } },
      },
    }),
    prisma.scenario.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: perSource,
      select: {
        id: true,
        name: true,
        url: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.chainExecution.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      select: {
        id: true,
        status: true,
        createdAt: true,
        chain: { select: { name: true } },
      },
    }),
    prisma.securityScan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: perSource,
      select: {
        id: true,
        status: true,
        findingsCount: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        scenario: { select: { name: true } },
      },
    }),
  ])

  return [
    ...executions.map(buildExecutionActivity),
    ...scenarios.map(buildScenarioActivity),
    ...chainExecutions.map(buildChainActivity),
    ...securityScans.map(buildSecurityScanActivity),
  ]
}

export async function getUserActivitySummary() {
  const since = daysAgo(SUMMARY_DAYS)

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const summaries = await Promise.all(
    users.map(async (user) => {
      const [events, scenarioCount, executionCount, executionsLast7Days] =
        await Promise.all([
          loadRecentEventsForUser(user.id, 5),
          prisma.scenario.count({ where: { userId: user.id } }),
          prisma.execution.count({ where: { userId: user.id } }),
          prisma.execution.count({
            where: { userId: user.id, createdAt: { gte: since } },
          }),
        ])

      const lastActivity = pickLatestActivity(events)

      return {
        ...user,
        lastActivity,
        stats: {
          scenarios: scenarioCount,
          executions: executionCount,
          executionsLast7Days,
        },
      }
    })
  )

  return summaries.sort((a, b) => {
    const aTime = a.lastActivity?.createdAt
      ? new Date(a.lastActivity.createdAt).getTime()
      : 0
    const bTime = b.lastActivity?.createdAt
      ? new Date(b.lastActivity.createdAt).getTime()
      : 0
    return bTime - aTime
  })
}

export async function getUserActivityLog(userId, limit = DEFAULT_LIMIT) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  })

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 })
  }

  if (user.role !== 'USER') {
    throw Object.assign(
      new Error('Activity logs are only available for USER role accounts'),
      { status: 400 }
    )
  }

  const events = await loadRecentEventsForUser(userId, limit)
  const sorted = events
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)

  return { user, activities: sorted }
}
