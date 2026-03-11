import {
  createTestStep,
  getTestSteps,
  getTestStep,
  updateTestStep,
  deleteTestStep,
  reorderSteps,
  getStepTypes,
  validateStep
} from '../services/testStepService.js'

/**
 * Create a test step
 * POST /api/scenarios/:scenarioId/steps
 */
export async function createTestStepHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { scenarioId } = req.params
    const { stepNumber, type, description, selector, value, metadata } = req.body

    if (!type || !description) {
      return res.status(400).json({
        error: 'Type and description are required'
      })
    }

    const step = await createTestStep(scenarioId, userId, {
      stepNumber,
      type,
      description,
      selector,
      value,
      metadata
    })

    res.status(201).json(step)
  } catch (error) {
    next(error)
  }
}

/**
 * Get all test steps for a scenario
 * GET /api/scenarios/:scenarioId/steps
 */
export async function getTestStepsHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { scenarioId } = req.params
    const { skip = '0', take = '50', orderBy = 'stepNumber', orderDirection = 'asc' } = req.query

    const options = {
      skip: Math.max(0, parseInt(skip) || 0),
      take: Math.min(100, Math.max(1, parseInt(take) || 50)),
      orderBy: ['stepNumber', 'createdAt'].includes(orderBy) ? orderBy : 'stepNumber',
      orderDirection: ['asc', 'desc'].includes(orderDirection) ? orderDirection : 'asc'
    }

    const result = await getTestSteps(scenarioId, userId, options)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Get a single test step
 * GET /api/scenarios/:scenarioId/steps/:stepId
 */
export async function getTestStepHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { stepId } = req.params

    const step = await getTestStep(stepId, userId)
    res.json(step)
  } catch (error) {
    next(error)
  }
}

/**
 * Update a test step
 * PUT /api/scenarios/:scenarioId/steps/:stepId
 */
export async function updateTestStepHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { stepId } = req.params
    const { type, description, selector, value, metadata } = req.body

    const step = await updateTestStep(stepId, userId, {
      type,
      description,
      selector,
      value,
      metadata
    })

    res.json(step)
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a test step
 * DELETE /api/scenarios/:scenarioId/steps/:stepId
 */
export async function deleteTestStepHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { stepId } = req.params

    const result = await deleteTestStep(stepId, userId)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Reorder test steps
 * PUT /api/scenarios/:scenarioId/steps/reorder
 */
export async function reorderStepsHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { scenarioId } = req.params
    const { stepOrders } = req.body

    if (!Array.isArray(stepOrders) || stepOrders.length === 0) {
      return res.status(400).json({
        error: 'stepOrders array is required'
      })
    }

    const result = await reorderSteps(scenarioId, userId, stepOrders)
    res.json({ steps: result })
  } catch (error) {
    next(error)
  }
}

/**
 * Get available step types
 * GET /api/step-types
 */
export async function getStepTypesHandler(req, res, next) {
  try {
    const types = getStepTypes()
    res.json({ types })
  } catch (error) {
    next(error)
  }
}

/**
 * Validate a step
 * POST /api/step-types/validate
 */
export async function validateStepHandler(req, res, next) {
  try {
    const { type, description } = req.body

    if (!type || !description) {
      return res.status(400).json({
        error: 'Type and description are required'
      })
    }

    const validation = validateStep(type, { description })
    res.json(validation)
  } catch (error) {
    next(error)
  }
}
