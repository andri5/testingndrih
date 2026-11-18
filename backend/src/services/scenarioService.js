import { prisma } from '../lib/prisma.js'
import {
  assertFolderBelongsToUser,
  collectDescendantIds,
} from './scenarioFolderService.js'
import { allocateScenarioCode } from '../utils/scenarioCode.js'

export const STUCK_EXECUTION_MINUTES = 15

export function withLiveStepCount(scenario) {
  const count = scenario._count?.testSteps ?? scenario.steps ?? 0
  const { _count, ...rest } = scenario
  return { ...rest, steps: count, stepCount: count }
}

/**
 * Create a new scenario
 */
function normalizeScenarioUrl(url) {
  const trimmed = String(url || '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

export async function createScenario(userId, data) {
  const { name, description, url, folderId = null, tags } = data

  if (!name?.trim()) {
    throw new Error('Name is required')
  }

  const normalizedUrl = normalizeScenarioUrl(url)

  if (folderId) {
    await assertFolderBelongsToUser(folderId, userId)
  }

  try {
    const siblingCount = await prisma.scenario.count({
      where: { userId, folderId: folderId || null },
    })
    const scenarioCode = await allocateScenarioCode(prisma, name.trim())

    const scenario = await prisma.scenario.create({
      data: {
        name: name.trim(),
        description: description || '',
        url: normalizedUrl,
        userId,
        steps: 0,
        folderId: folderId || null,
        sortOrder: siblingCount,
        scenarioCode,
        ...(tags !== undefined ? { tags: normalizeTags(tags) } : {}),
      }
    })

    return scenario
  } catch (error) {
    throw new Error(`Failed to create scenario: ${error.message}`)
  }
}

/**
 * Get all scenarios for a user
 */
export async function getUserScenarios(userId, options = {}) {
  const {
    skip = 0,
    take = 20,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    favoritesOnly = false,
    tag = null,
    folderId = undefined,
    unfiled = false,
    includeDescendants = false,
  } = options

  try {
    const where = { userId }
    if (favoritesOnly) where.isFavorite = true
    if (tag) where.tags = { has: tag }

    if (unfiled) {
      where.folderId = null
    } else if (folderId) {
      if (includeDescendants) {
        const descendantIds = await collectDescendantIds(folderId, userId)
        where.folderId = { in: [folderId, ...descendantIds] }
      } else {
        where.folderId = folderId
      }
    }

    const orderClause =
      folderId || unfiled
        ? [{ sortOrder: 'asc' }, { name: 'asc' }]
        : [
            { isFavorite: 'desc' },
            { [orderBy]: orderDirection },
          ]

    const scenarios = await prisma.scenario.findMany({
      where,
      skip,
      take,
      orderBy: orderClause,
      select: {
        id: true,
        scenarioCode: true,
        name: true,
        description: true,
        url: true,
        steps: true,
        isFavorite: true,
        tags: true,
        folderId: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        folder: { select: { id: true, name: true } },
        _count: { select: { testSteps: true } },
        executions: {
          orderBy: { startTime: 'desc' },
          take: 1,
          select: { id: true, status: true, startTime: true, createdAt: true, updatedAt: true },
        },
      },
    })

    const total = await prisma.scenario.count({ where })

    return {
      scenarios: scenarios.map((s) => {
        const mapped = withLiveStepCount(s)
        const last = s.executions?.[0] || null
        const { executions, ...rest } = mapped
        return { ...rest, lastResult: last }
      }),
      total,
    }
  } catch (error) {
    throw new Error(`Failed to fetch scenarios: ${error.message}`)
  }
}

/**
 * Get a single scenario by ID
 */
export async function getScenarioById(scenarioId, userId) {
  try {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        testSteps: {
          orderBy: { stepNumber: 'asc' }
        },
        folder: { select: { id: true, name: true, parentId: true } },
      }
    })

    if (!scenario) {
      throw new Error('Scenario not found')
    }

    // Verify ownership
    if (scenario.userId !== userId) {
      throw new Error('Unauthorized access to this scenario')
    }

    return scenario
  } catch (error) {
    throw new Error(`Failed to fetch scenario: ${error.message}`)
  }
}

/**
 * Update a scenario
 */
export async function updateScenario(scenarioId, userId, data) {
  const { name, description, url, tags, folderId, sortOrder } = data

  try {
    // Verify ownership first
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario) {
      throw new Error('Scenario not found')
    }

    if (scenario.userId !== userId) {
      throw new Error('Unauthorized: Cannot update this scenario')
    }

    if (folderId !== undefined && folderId !== null) {
      await assertFolderBelongsToUser(folderId, userId)
    }

    const updated = await prisma.scenario.update({
      where: { id: scenarioId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(url !== undefined && { url: normalizeScenarioUrl(url) }),
        ...(tags !== undefined && { tags: normalizeTags(tags) }),
        ...(folderId !== undefined && { folderId: folderId || null }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) || 0 }),
      }
    })

    return updated
  } catch (error) {
    throw new Error(`Failed to update scenario: ${error.message}`)
  }
}

/**
 * Move one or more scenarios into a folder (or unfiled)
 */
export async function moveScenarios(userId, { ids = [], folderId = null, sortOrders = null }) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('ids array is required')
  }

  if (folderId) {
    await assertFolderBelongsToUser(folderId, userId)
  }

  const owned = await prisma.scenario.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true },
  })
  if (owned.length !== ids.length) {
    throw new Error('One or more scenarios were not found or unauthorized')
  }

  const orderMap = new Map()
  if (Array.isArray(sortOrders)) {
    for (const row of sortOrders) {
      if (row?.id != null) orderMap.set(row.id, Number(row.sortOrder) || 0)
    }
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.scenario.update({
        where: { id },
        data: {
          folderId: folderId || null,
          sortOrder: orderMap.has(id) ? orderMap.get(id) : index,
        },
      })
    )
  )

  return { moved: ids.length, folderId: folderId || null }
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return []
  return [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 20)
}

export async function toggleScenarioFavorite(scenarioId, userId) {
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } })
  if (!scenario) throw new Error('Scenario not found')
  if (scenario.userId !== userId) throw new Error('Unauthorized: Cannot update this scenario')

  return prisma.scenario.update({
    where: { id: scenarioId },
    data: { isFavorite: !scenario.isFavorite },
  })
}

export async function updateScenarioTags(scenarioId, userId, tags) {
  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } })
  if (!scenario) throw new Error('Scenario not found')
  if (scenario.userId !== userId) throw new Error('Unauthorized: Cannot update this scenario')

  return prisma.scenario.update({
    where: { id: scenarioId },
    data: { tags: normalizeTags(tags) },
  })
}

export async function listScenarioTags(userId) {
  const rows = await prisma.scenario.findMany({
    where: { userId },
    select: { tags: true },
  })
  const tagSet = new Set()
  for (const row of rows) {
    for (const tag of row.tags || []) tagSet.add(tag)
  }
  return [...tagSet].sort()
}

/**
 * Delete a scenario
 */
export async function deleteScenario(scenarioId, userId) {
  try {
    // Verify ownership
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario) {
      throw new Error('Scenario not found')
    }

    if (scenario.userId !== userId) {
      throw new Error('Unauthorized: Cannot delete this scenario')
    }

    // Delete all related test steps first
    await prisma.testStep.deleteMany({
      where: { scenarioId }
    })

    // Delete the scenario
    await prisma.scenario.delete({
      where: { id: scenarioId }
    })

    return { message: 'Scenario deleted successfully' }
  } catch (error) {
    throw new Error(`Failed to delete scenario: ${error.message}`)
  }
}

/**
 * Duplicate a scenario
 */
export async function duplicateScenario(scenarioId, userId) {
  try {
    // Get original scenario with all steps
    const original = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        testSteps: true
      }
    })

    if (!original) {
      throw new Error('Scenario not found')
    }

    if (original.userId !== userId) {
      throw new Error('Unauthorized: Cannot duplicate this scenario')
    }

    const copyName = `${original.name} (Copy)`
    const scenarioCode = await allocateScenarioCode(prisma, copyName)

    // Create new scenario (same folder as original)
    const newScenario = await prisma.scenario.create({
      data: {
        name: copyName,
        description: original.description,
        url: original.url,
        userId,
        steps: original.steps,
        tags: original.tags || [],
        isFavorite: false,
        folderId: original.folderId || null,
        sortOrder: original.sortOrder ?? 0,
        scenarioCode,
      }
    })

    // Duplicate all test steps
    if (original.testSteps.length > 0) {
      await prisma.testStep.createMany({
        data: original.testSteps.map((step) => ({
          scenarioId: newScenario.id,
          stepNumber: step.stepNumber,
          type: step.type,
          description: step.description,
          selector: step.selector,
          value: step.value,
          metadata: step.metadata
        }))
      })
    }

    return newScenario
  } catch (error) {
    throw new Error(`Failed to duplicate scenario: ${error.message}`)
  }
}

/**
 * Get scenario statistics
 */
export async function getScenarioStats(scenarioId, userId) {
  try {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: {
        testSteps: true,
        executions: {
          include: {
            _count: true
          }
        }
      }
    })

    if (!scenario) {
      throw new Error('Scenario not found')
    }

    if (scenario.userId !== userId) {
      throw new Error('Unauthorized')
    }

    const totalExecutions = scenario.executions.length
    const passedExecutions = scenario.executions.filter(
      (e) => e.status === 'PASSED'
    ).length

    return {
      scenarioId: scenario.id,
      name: scenario.name,
      scenarioCode: scenario.scenarioCode || null,
      totalSteps: scenario.testSteps.length,
      totalExecutions,
      passedExecutions,
      successRate: totalExecutions > 0 ? (passedExecutions / totalExecutions) * 100 : 0
    }
  } catch (error) {
    throw new Error(`Failed to fetch scenario stats: ${error.message}`)
  }
}

async function ensureScenarioCode(scenario) {
  if (scenario.scenarioCode) return scenario.scenarioCode
  const scenarioCode = await allocateScenarioCode(prisma, scenario.name)
  await prisma.scenario.update({
    where: { id: scenario.id },
    data: { scenarioCode },
  })
  return scenarioCode
}

/**
 * Reminders for unfinished / never-run / stuck scenarios.
 */
export async function getScenarioReminders(userId, { limit = 8 } = {}) {
  const stuckBefore = new Date(Date.now() - STUCK_EXECUTION_MINUTES * 60 * 1000)

  const scenarios = await prisma.scenario.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      scenarioCode: true,
      name: true,
      steps: true,
      updatedAt: true,
      _count: { select: { testSteps: true } },
      executions: {
        orderBy: [{ startTime: 'desc' }, { createdAt: 'desc' }],
        take: 1,
        select: {
          id: true,
          status: true,
          startTime: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  const stuck = []
  const draft = []
  const neverRun = []

  for (const s of scenarios) {
    const stepCount = s._count?.testSteps ?? s.steps ?? 0
    const last = s.executions?.[0] || null
    const scenarioCode = await ensureScenarioCode(s)
    const base = {
      id: s.id,
      name: s.name,
      scenarioCode,
      steps: stepCount,
      updatedAt: s.updatedAt,
    }

    if (stepCount === 0) {
      draft.push({
        ...base,
        type: 'draft',
        executionId: null,
        executionStatus: null,
      })
      continue
    }

    if (!last) {
      neverRun.push({
        ...base,
        type: 'never_run',
        executionId: null,
        executionStatus: null,
      })
      continue
    }

    const stuckStatuses = ['PENDING', 'RUNNING']
    const refTime = last.updatedAt || last.startTime || last.createdAt
    if (
      stuckStatuses.includes(last.status) &&
      refTime &&
      new Date(refTime) < stuckBefore
    ) {
      stuck.push({
        ...base,
        type: 'stuck',
        executionId: last.id,
        executionStatus: last.status,
        stuckSince: refTime,
      })
    }
  }

  const items = [
    ...stuck.slice(0, limit),
    ...draft.slice(0, Math.max(0, limit - stuck.length)),
    ...neverRun.slice(0, Math.max(0, limit - stuck.length - draft.length)),
  ].slice(0, limit)

  return {
    items,
    counts: {
      stuck: stuck.length,
      draft: draft.length,
      neverRun: neverRun.length,
      total: stuck.length + draft.length + neverRun.length,
    },
    stuckAfterMinutes: STUCK_EXECUTION_MINUTES,
  }
}
