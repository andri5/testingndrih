import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Search scenarios with filters
 */
export async function searchScenarios(userId, options = {}) {
  const {
    query = '',
    skip = 0,
    take = 20,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    startDate = null,
    endDate = null
  } = options

  try {
    const where = {
      userId,
      OR: query
        ? [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { url: { contains: query, mode: 'insensitive' } }
          ]
        : undefined
    }

    // Add date filtering if provided
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Clean up undefined OR clause
    if (!query && where.OR) {
      delete where.OR
    }

    const scenarios = await prisma.scenario.findMany({
      where,
      skip,
      take,
      orderBy: {
        [orderBy]: orderDirection
      },
      select: {
        id: true,
        name: true,
        description: true,
        url: true,
        steps: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { executions: true }
        }
      }
    })

    const total = await prisma.scenario.count({ where })

    return {
      scenarios: scenarios.map((s) => ({
        ...s,
        executionCount: s._count.executions
      })),
      total,
      hasMore: skip + take < total
    }
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`)
  }
}

/**
 * Get scenarios grouped by date
 */
export async function getScenariosByDate(userId) {
  try {
    const scenarios = await prisma.scenario.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    })

    // Group by date
    const grouped = {}
    scenarios.forEach((scenario) => {
      const date = scenario.createdAt.toLocaleDateString()
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(scenario)
    })

    return grouped
  } catch (error) {
    throw new Error(`Failed to get scenarios by date: ${error.message}`)
  }
}

/**
 * Get recent scenarios
 */
export async function getRecentScenarios(userId, limit = 5) {
  try {
    return await prisma.scenario.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        url: true,
        steps: true,
        updatedAt: true
      }
    })
  } catch (error) {
    throw new Error(`Failed to get recent scenarios: ${error.message}`)
  }
}

/**
 * Get most executed scenarios
 */
export async function getMostExecutedScenarios(userId, limit = 10) {
  try {
    const scenarios = await prisma.scenario.findMany({
      where: { userId },
      include: {
        executions: true
      },
      orderBy: {
        executions: {
          _count: 'desc'
        }
      },
      take: limit
    })

    return scenarios.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      steps: s.steps,
      executionCount: s.executions.length,
      passedCount: s.executions.filter((e) => e.status === 'PASSED').length,
      failedCount: s.executions.filter((e) => e.status === 'FAILED').length
    }))
  } catch (error) {
    throw new Error(`Failed to get most executed scenarios: ${error.message}`)
  }
}

/**
 * Advanced filter scenarios
 */
export async function filterScenarios(userId, options = {}) {
  const {
    minSteps = 0,
    maxSteps = Infinity,
    minExecutions = 0,
    searchText = '',
    skip = 0,
    take = 20
  } = options

  try {
    // This requires a more complex query with execution counting
    const scenarios = await prisma.scenario.findMany({
      where: {
        userId,
        steps: {
          gte: minSteps,
          lte: maxSteps
        },
        ...(searchText && {
          OR: [
            { name: { contains: searchText, mode: 'insensitive' } },
            { description: { contains: searchText, mode: 'insensitive' } }
          ]
        })
      },
      include: {
        executions: {
          select: { status: true }
        }
      },
      skip,
      take
    })

    // Filter by minimum executions
    const filtered = scenarios.filter((s) => s.executions.length >= minExecutions)

    const total = await prisma.scenario.count({
      where: {
        userId,
        steps: {
          gte: minSteps,
          lte: maxSteps
        }
      }
    })

    return {
      scenarios: filtered.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        url: s.url,
        steps: s.steps,
        executionCount: s.executions.length,
        successRate:
          s.executions.length > 0
            ? (s.executions.filter((e) => e.status === 'PASSED').length /
                s.executions.length) *
              100
            : 0
      })),
      total,
      hasMore: skip + take < total
    }
  } catch (error) {
    throw new Error(`Advanced filter failed: ${error.message}`)
  }
}
