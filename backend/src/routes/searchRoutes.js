import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import {
  searchScenariosHandler,
  getScenariosByDateHandler,
  getRecentScenariosHandler,
  getMostExecutedScenariosHandler,
  filterScenariosHandler
} from '../controllers/searchController.js'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(authenticateToken)

/**
 * Search scenarios with filters
 * GET /api/search?query=test&orderBy=name&orderDirection=asc&skip=0&take=20&startDate=2024-01-01&endDate=2024-12-31
 */
router.get('/', searchScenariosHandler)

/**
 * Get scenarios grouped by date
 * GET /api/search/by-date
 */
router.get('/by-date', getScenariosByDateHandler)

/**
 * Get recent scenarios
 * GET /api/search/recent?limit=5
 */
router.get('/recent', getRecentScenariosHandler)

/**
 * Get most executed scenarios
 * GET /api/search/most-executed?limit=10
 */
router.get('/most-executed', getMostExecutedScenariosHandler)

/**
 * Advanced filter scenarios
 * GET /api/search/filter?minSteps=1&maxSteps=10&minExecutions=5&searchText=login&skip=0&take=20
 */
router.get('/filter', filterScenariosHandler)

export default router
