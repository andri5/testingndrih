import {
  createScenario,
  getUserScenarios,
  getScenarioById,
  updateScenario,
  deleteScenario,
  duplicateScenario,
  getScenarioStats
} from '../services/scenarioService.js'

/**
 * POST /api/scenarios
 * Create a new scenario
 */
export async function createScenarioHandler(req, res, next) {
  try {
    const { name, description, url } = req.body
    const userId = req.user.id

    const scenario = await createScenario(userId, { name, description, url })

    res.status(201).json({
      success: true,
      message: 'Scenario created successfully',
      scenario
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/scenarios
 * Get all scenarios for authenticated user
 */
export async function getScenarioListHandler(req, res, next) {
  try {
    const userId = req.user.id
    const skip = parseInt(req.query.skip) || 0
    const take = parseInt(req.query.take) || 20
    const orderBy = req.query.orderBy || 'createdAt'
    const orderDirection = req.query.orderDirection || 'desc'

    // Validate pagination
    if (skip < 0 || take < 1 || take > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      })
    }

    const { scenarios, total } = await getUserScenarios(userId, {
      skip,
      take,
      orderBy,
      orderDirection
    })

    res.json({
      success: true,
      scenarios,
      pagination: {
        skip,
        take,
        total,
        hasMore: skip + take < total
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/scenarios/:id
 * Get a specific scenario with its test steps
 */
export async function getScenarioHandler(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    const scenario = await getScenarioById(id, userId)

    res.json({
      success: true,
      scenario
    })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/scenarios/:id
 * Update a scenario
 */
export async function updateScenarioHandler(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { name, description, url } = req.body

    const scenario = await updateScenario(id, userId, { name, description, url })

    res.json({
      success: true,
      message: 'Scenario updated successfully',
      scenario
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/scenarios/:id
 * Delete a scenario
 */
export async function deleteScenarioHandler(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    await deleteScenario(id, userId)

    res.json({
      success: true,
      message: 'Scenario deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/scenarios/:id/duplicate
 * Duplicate a scenario
 */
export async function duplicateScenarioHandler(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    const newScenario = await duplicateScenario(id, userId)

    res.status(201).json({
      success: true,
      message: 'Scenario duplicated successfully',
      scenario: newScenario
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/scenarios/:id/stats
 * Get scenario statistics
 */
export async function getScenarioStatsHandler(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    const stats = await getScenarioStats(id, userId)

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    next(error)
  }
}
