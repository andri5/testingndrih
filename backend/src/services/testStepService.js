import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Create a test step for a scenario
 */
export async function createTestStep(scenarioId, userId, data) {
  const { stepNumber, type, description, selector, value, metadata } = data

  try {
    // Verify scenario belongs to user
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario || scenario.userId !== userId) {
      throw new Error('Scenario not found or unauthorized')
    }

    // Validate step data
    if (!type || !description) {
      throw new Error('Step type and description are required')
    }

    // Get the next step number if not provided
    let nextStepNumber = stepNumber
    if (!nextStepNumber) {
      const lastStep = await prisma.testStep.findFirst({
        where: { scenarioId },
        orderBy: { stepNumber: 'desc' }
      })
      nextStepNumber = (lastStep?.stepNumber || 0) + 1
    }

    // Create the step
    const step = await prisma.testStep.create({
      data: {
        scenarioId,
        stepNumber: nextStepNumber,
        type,
        description,
        selector: selector || null,
        value: value || null,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })

    // Update scenario steps count
    const stepCount = await prisma.testStep.count({
      where: { scenarioId }
    })

    await prisma.scenario.update({
      where: { id: scenarioId },
      data: { steps: stepCount }
    })

    return step
  } catch (error) {
    throw new Error(`Failed to create test step: ${error.message}`)
  }
}

/**
 * Get all test steps for a scenario
 */
export async function getTestSteps(scenarioId, userId, options = {}) {
  const { skip = 0, take = 50, orderBy = 'stepNumber', orderDirection = 'asc' } = options

  try {
    // Verify scenario belongs to user
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario || scenario.userId !== userId) {
      throw new Error('Scenario not found or unauthorized')
    }

    const steps = await prisma.testStep.findMany({
      where: { scenarioId },
      orderBy: {
        [orderBy]: orderDirection
      },
      skip,
      take
    })

    const total = await prisma.testStep.count({
      where: { scenarioId }
    })

    return {
      steps,
      total,
      hasMore: skip + take < total
    }
  } catch (error) {
    throw new Error(`Failed to get test steps: ${error.message}`)
  }
}

/**
 * Get a single test step
 */
export async function getTestStep(stepId, userId) {
  try {
    const step = await prisma.testStep.findUnique({
      where: { id: stepId },
      include: {
        scenario: {
          select: { userId: true }
        }
      }
    })

    if (!step || step.scenario.userId !== userId) {
      throw new Error('Test step not found or unauthorized')
    }

    return step
  } catch (error) {
    throw new Error(`Failed to get test step: ${error.message}`)
  }
}

/**
 * Update a test step
 */
export async function updateTestStep(stepId, userId, data) {
  try {
    // Verify ownership
    const step = await prisma.testStep.findUnique({
      where: { id: stepId },
      include: {
        scenario: {
          select: { userId: true }
        }
      }
    })

    if (!step || step.scenario.userId !== userId) {
      throw new Error('Test step not found or unauthorized')
    }

    const updated = await prisma.testStep.update({
      where: { id: stepId },
      data: {
        type: data.type || step.type,
        description: data.description || step.description,
        selector: data.selector ?? step.selector,
        value: data.value ?? step.value,
        metadata: data.metadata || step.metadata
      }
    })

    return updated
  } catch (error) {
    throw new Error(`Failed to update test step: ${error.message}`)
  }
}

/**
 * Delete a test step
 */
export async function deleteTestStep(stepId, userId) {
  try {
    // Verify ownership
    const step = await prisma.testStep.findUnique({
      where: { id: stepId },
      include: {
        scenario: {
          select: { userId: true, id: true }
        }
      }
    })

    if (!step || step.scenario.userId !== userId) {
      throw new Error('Test step not found or unauthorized')
    }

    // Delete the step
    await prisma.testStep.delete({
      where: { id: stepId }
    })

    // Update scenario steps count
    const stepCount = await prisma.testStep.count({
      where: { scenarioId: step.scenarioId }
    })

    await prisma.scenario.update({
      where: { id: step.scenarioId },
      data: { steps: stepCount }
    })

    return { message: 'Test step deleted successfully' }
  } catch (error) {
    throw new Error(`Failed to delete test step: ${error.message}`)
  }
}

/**
 * Reorder test steps within a scenario
 */
export async function reorderSteps(scenarioId, userId, stepOrders) {
  try {
    // Verify scenario belongs to user
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId }
    })

    if (!scenario || scenario.userId !== userId) {
      throw new Error('Scenario not found or unauthorized')
    }

    // Use temporary step numbers to avoid unique constraint violations
    const maxStepNumber = stepOrders.length + 1000 // Start temporary numbers high

    // First pass: assign temporary step numbers
    for (let i = 0; i < stepOrders.length; i++) {
      const { stepId } = stepOrders[i]

      // Verify step belongs to this scenario
      const step = await prisma.testStep.findUnique({
        where: { id: stepId }
      })

      if (!step || step.scenarioId !== scenarioId) {
        throw new Error(`Step ${stepId} not found in scenario`)
      }

      await prisma.testStep.update({
        where: { id: stepId },
        data: { stepNumber: maxStepNumber + i }
      })
    }

    // Second pass: assign final step numbers
    const updated = []
    for (let i = 0; i < stepOrders.length; i++) {
      const { stepId, sequenceNumber } = stepOrders[i]
      const finalStepNumber = sequenceNumber || i + 1

      const updatedStep = await prisma.testStep.update({
        where: { id: stepId },
        data: { stepNumber: finalStepNumber }
      })
      updated.push(updatedStep)
    }

    return updated
  } catch (error) {
    throw new Error(`Failed to reorder steps: ${error.message}`)
  }
}

/**
 * Get step types (predefined action types)
 */
export function getStepTypes() {
  return [
    {
      type: 'NAVIGATE',
      description: 'Navigate to a URL',
      fields: ['url']
    },
    {
      type: 'CLICK',
      description: 'Click on an element',
      fields: ['selector']
    },
    {
      type: 'FILL',
      description: 'Fill a form field',
      fields: ['selector', 'value']
    },
    {
      type: 'WAIT',
      description: 'Wait for a specified time',
      fields: ['duration']
    },
    {
      type: 'ASSERTION',
      description: 'Assert a condition',
      fields: ['selector', 'condition', 'value']
    },
    {
      type: 'SCREENSHOT',
      description: 'Take a screenshot',
      fields: ['filename']
    },
    {
      type: 'API_CALL',
      description: 'Make an API call',
      fields: ['url', 'method', 'body']
    }
  ]
}

/**
 * Validate a step against its type
 */
export function validateStep(stepType, stepData) {
  const types = getStepTypes()
  const typeDefinition = types.find((t) => t.type === stepType)

  if (!typeDefinition) {
    return { valid: false, error: `Invalid step type: ${stepType}` }
  }

  // Check required fields based on type
  if (!stepData.description) {
    return { valid: false, error: 'Description is required' }
  }

  return { valid: true }
}
