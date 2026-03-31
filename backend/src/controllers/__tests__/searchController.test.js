import * as searchService from '../../services/searchService.js'
import {
  searchScenariosHandler,
  getScenariosByDateHandler,
  getRecentScenariosHandler,
  getMostExecutedScenariosHandler,
  filterScenariosHandler
} from '../searchController.js'

jest.mock('../../services/searchService.js')

describe('SearchController', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      user: { id: 'user-1' },
      query: {},
      params: {}
    }
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    }
    next = jest.fn()
  })

  describe('searchScenariosHandler', () => {
    it('should search scenarios with default options', async () => {
      const mockResult = { scenarios: [], total: 0, hasMore: false }
      searchService.searchScenarios.mockResolvedValue(mockResult)

      await searchScenariosHandler(req, res, next)

      expect(searchService.searchScenarios).toHaveBeenCalledWith('user-1', expect.any(Object))
      expect(res.json).toHaveBeenCalledWith(mockResult)
    })

    it('should pass query parameters to service', async () => {
      req.query = { query: 'login', orderBy: 'name', orderDirection: 'asc', skip: '10', take: '5' }
      searchService.searchScenarios.mockResolvedValue({ scenarios: [], total: 0 })

      await searchScenariosHandler(req, res, next)

      expect(searchService.searchScenarios).toHaveBeenCalledWith('user-1', expect.objectContaining({
        query: 'login',
        orderBy: 'name',
        orderDirection: 'asc',
        skip: 10,
        take: 5
      }))
    })

    it('should sanitize invalid orderBy', async () => {
      req.query = { orderBy: 'malicious_field' }
      searchService.searchScenarios.mockResolvedValue({ scenarios: [] })

      await searchScenariosHandler(req, res, next)

      expect(searchService.searchScenarios).toHaveBeenCalledWith('user-1', expect.objectContaining({
        orderBy: 'createdAt'
      }))
    })

    it('should call next on error', async () => {
      searchService.searchScenarios.mockRejectedValue(new Error('fail'))

      await searchScenariosHandler(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('getScenariosByDateHandler', () => {
    it('should return grouped scenarios', async () => {
      const grouped = { '2026-03-15': [{ id: '1' }] }
      searchService.getScenariosByDate.mockResolvedValue(grouped)

      await getScenariosByDateHandler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ grouped })
    })

    it('should call next on error', async () => {
      searchService.getScenariosByDate.mockRejectedValue(new Error('fail'))

      await getScenariosByDateHandler(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('getRecentScenariosHandler', () => {
    it('should return recent scenarios with default limit', async () => {
      searchService.getRecentScenarios.mockResolvedValue([{ id: '1' }])

      await getRecentScenariosHandler(req, res, next)

      expect(searchService.getRecentScenarios).toHaveBeenCalledWith('user-1', 5)
      expect(res.json).toHaveBeenCalledWith({ scenarios: [{ id: '1' }] })
    })

    it('should respect custom limit', async () => {
      req.query = { limit: '10' }
      searchService.getRecentScenarios.mockResolvedValue([])

      await getRecentScenariosHandler(req, res, next)

      expect(searchService.getRecentScenarios).toHaveBeenCalledWith('user-1', 10)
    })
  })

  describe('getMostExecutedScenariosHandler', () => {
    it('should return most executed scenarios', async () => {
      searchService.getMostExecutedScenarios.mockResolvedValue([{ id: '1' }])

      await getMostExecutedScenariosHandler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ scenarios: [{ id: '1' }] })
    })
  })

  describe('filterScenariosHandler', () => {
    it('should filter with query params', async () => {
      req.query = { minSteps: '2', maxSteps: '10', searchText: 'login' }
      searchService.filterScenarios.mockResolvedValue({ scenarios: [], total: 0 })

      await filterScenariosHandler(req, res, next)

      expect(searchService.filterScenarios).toHaveBeenCalledWith('user-1', expect.objectContaining({
        minSteps: 2,
        maxSteps: 10,
        searchText: 'login'
      }))
    })

    it('should call next on error', async () => {
      searchService.filterScenarios.mockRejectedValue(new Error('fail'))

      await filterScenariosHandler(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })
})
