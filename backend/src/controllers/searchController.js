import {
  searchScenarios,
  getScenariosByDate,
  getRecentScenarios,
  getMostExecutedScenarios,
  filterScenarios
} from '../services/searchService.js'

/**
 * Search scenarios with filters
 * GET /api/search/scenarios?query=test&orderBy=name&orderDirection=asc&skip=0&take=20
 */
export async function searchScenariosHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { query, orderBy = 'createdAt', orderDirection = 'desc', skip = '0', take = '20', startDate, endDate } = req.query

    const options = {
      query: query || '',
      skip: Math.max(0, parseInt(skip) || 0),
      take: Math.min(100, Math.max(1, parseInt(take) || 20)),
      orderBy: ['createdAt', 'name', 'updatedAt'].includes(orderBy) ? orderBy : 'createdAt',
      orderDirection: ['asc', 'desc'].includes(orderDirection) ? orderDirection : 'desc',
      startDate,
      endDate
    }

    const result = await searchScenarios(userId, options)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * Get scenarios grouped by date
 * GET /api/search/by-date
 */
export async function getScenariosByDateHandler(req, res, next) {
  try {
    const userId = req.user.id
    const grouped = await getScenariosByDate(userId)
    res.json({ grouped })
  } catch (error) {
    next(error)
  }
}

/**
 * Get recent scenarios
 * GET /api/search/recent?limit=5
 */
export async function getRecentScenariosHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { limit = '5' } = req.query
    const scenarios = await getRecentScenarios(userId, Math.min(50, parseInt(limit) || 5))
    res.json({ scenarios })
  } catch (error) {
    next(error)
  }
}

/**
 * Get most executed scenarios
 * GET /api/search/most-executed?limit=10
 */
export async function getMostExecutedScenariosHandler(req, res, next) {
  try {
    const userId = req.user.id
    const { limit = '10' } = req.query
    const scenarios = await getMostExecutedScenarios(userId, Math.min(100, parseInt(limit) || 10))
    res.json({ scenarios })
  } catch (error) {
    next(error)
  }
}

/**
 * Advanced filter scenarios
 * GET /api/search/filter?minSteps=1&maxSteps=10&minExecutions=5&searchText=login&skip=0&take=20
 */
export async function filterScenariosHandler(req, res, next) {
  try {
    const userId = req.user.id
    const {
      minSteps = '0',
      maxSteps = '1000',
      minExecutions = '0',
      searchText = '',
      skip = '0',
      take = '20'
    } = req.query

    const options = {
      minSteps: Math.max(0, parseInt(minSteps) || 0),
      maxSteps: Math.max(1, parseInt(maxSteps) || 1000),
      minExecutions: Math.max(0, parseInt(minExecutions) || 0),
      searchText: searchText || '',
      skip: Math.max(0, parseInt(skip) || 0),
      take: Math.min(100, Math.max(1, parseInt(take) || 20))
    }

    const result = await filterScenarios(userId, options)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
