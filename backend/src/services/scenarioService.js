import { prisma } from '../lib/prisma.js'

/**
 * Create a new scenario
 */
export async function createScenario(userId, data) {
  const { name, description, url } = data

  // Validation
  if (!name || !url) {
    throw new Error('Name and URL are required')
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('URL must start with http:// or https://')
  }

  try {
    const scenario = await prisma.scenario.create({
      data: {
        name,
        description: description || '',
        url,
        userId,
        steps: 0
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
  const { skip = 0, take = 20, orderBy = 'createdAt', orderDirection = 'desc' } = options

  try {
    const scenarios = await prisma.scenario.findMany({
      where: { userId },
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
        updatedAt: true
      }
    })

    const total = await prisma.scenario.count({
      where: { userId }
    })

    return { scenarios, total }
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
        }
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
  const { name, description, url } = data

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

    // Validate URL if provided
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('URL must start with http:// or https://')
    }

    const updated = await prisma.scenario.update({
      where: { id: scenarioId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(url && { url })
      }
    })

    return updated
  } catch (error) {
    throw new Error(`Failed to update scenario: ${error.message}`)
  }
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

    // Create new scenario
    const newScenario = await prisma.scenario.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        url: original.url,
        userId,
        steps: original.steps
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
      totalSteps: scenario.testSteps.length,
      totalExecutions,
      passedExecutions,
      successRate: totalExecutions > 0 ? (passedExecutions / totalExecutions) * 100 : 0
    }
  } catch (error) {
    throw new Error(`Failed to fetch scenario stats: ${error.message}`)
  }
}
