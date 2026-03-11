import {
  createScenarioHandler,
  getScenarioListHandler,
  getScenarioHandler,
  updateScenarioHandler,
  deleteScenarioHandler
} from '../scenarioController.js'
import * as scenarioService from '../../services/scenarioService.js'

jest.mock('../../services/scenarioService.js')

describe('ScenarioController', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user-123' }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    next = jest.fn()
    jest.clearAllMocks()
  })

  describe('createScenarioHandler', () => {
    it('should create a scenario', async () => {
      req.body = {
        name: 'Test Scenario',
        description: 'A test',
        url: 'https://example.com'
      }

      const mockScenario = {
        id: 'scenario-1',
        name: 'Test Scenario',
        userId: 'user-123'
      }

      scenarioService.createScenario.mockResolvedValue(mockScenario)

      await createScenarioHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalled()
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(true)
      expect(response.scenario).toEqual(mockScenario)
    })

    it('should call service with userId from request', async () => {
      req.body = {
        name: 'Test',
        url: 'https://example.com'
      }
      req.user.id = 'user-456'

      scenarioService.createScenario.mockResolvedValue({
        id: 'scenario-1'
      })

      await createScenarioHandler(req, res, next)

      expect(scenarioService.createScenario).toHaveBeenCalledWith(
        'user-456',
        expect.objectContaining({
          name: 'Test',
          url: 'https://example.com'
        })
      )
    })

    it('should handle service errors', async () => {
      req.body = { name: 'Test', url: 'https://example.com' }

      scenarioService.createScenario.mockRejectedValue(
        new Error('Creation failed')
      )

      await createScenarioHandler(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('getScenarioListHandler', () => {
    it('should list scenarios with default pagination', async () => {
      scenarioService.getUserScenarios.mockResolvedValue({
        scenarios: [{ id: 'scenario-1' }],
        total: 1
      })

      await getScenarioListHandler(req, res, next)

      expect(res.json).toHaveBeenCalled()
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(true)
      expect(response.pagination.skip).toBe(0)
      expect(response.pagination.take).toBe(20)
    })

    it('should validate pagination parameters', async () => {
      req.query = { skip: -1, take: 20 }

      await getScenarioListHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(false)
    })

    it('should reject take greater than 100', async () => {
      req.query = { skip: 0, take: 101 }

      await getScenarioListHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should pass custom pagination to service', async () => {
      req.query = { skip: 10, take: 50, orderBy: 'name', orderDirection: 'asc' }

      scenarioService.getUserScenarios.mockResolvedValue({
        scenarios: [],
        total: 0
      })

      await getScenarioListHandler(req, res, next)

      expect(scenarioService.getUserScenarios).toHaveBeenCalledWith(
        'user-123',
        {
          skip: 10,
          take: 50,
          orderBy: 'name',
          orderDirection: 'asc'
        }
      )
    })

    it('should include hasMore in pagination', async () => {
      scenarioService.getUserScenarios.mockResolvedValue({
        scenarios: [{ id: 'scenario-1' }],
        total: 100
      })
      req.query = { skip: 0, take: 20 }

      await getScenarioListHandler(req, res, next)

      const response = res.json.mock.calls[0][0]
      expect(response.pagination.hasMore).toBe(true)
    })
  })

  describe('getScenarioHandler', () => {
    it('should get scenario by id', async () => {
      req.params = { id: 'scenario-1' }

      const mockScenario = {
        id: 'scenario-1',
        name: 'Test Scenario',
        userId: 'user-123'
      }

      scenarioService.getScenarioById.mockResolvedValue(mockScenario)

      await getScenarioHandler(req, res, next)

      expect(res.json).toHaveBeenCalled()
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(true)
      expect(response.scenario).toEqual(mockScenario)
    })

    it('should pass userId to service', async () => {
      req.params = { id: 'scenario-1' }
      req.user.id = 'user-456'

      scenarioService.getScenarioById.mockResolvedValue({
        id: 'scenario-1'
      })

      await getScenarioHandler(req, res, next)

      expect(scenarioService.getScenarioById).toHaveBeenCalledWith(
        'scenario-1',
        'user-456'
      )
    })

    it('should handle not found errors', async () => {
      req.params = { id: 'nonexistent' }

      scenarioService.getScenarioById.mockRejectedValue(
        new Error('Scenario not found')
      )

      await getScenarioHandler(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('updateScenarioHandler', () => {
    it('should update scenario', async () => {
      req.params = { id: 'scenario-1' }
      req.body = { name: 'Updated', url: 'https://updated.com' }

      const updateResult = {
        id: 'scenario-1',
        name: 'Updated'
      }

      scenarioService.updateScenario.mockResolvedValue(updateResult)

      await updateScenarioHandler(req, res, next)

      expect(res.json).toHaveBeenCalled()
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(true)
    })

    it('should pass data to service correctly', async () => {
      req.params = { id: 'scenario-1' }
      req.user.id = 'user-789'
      req.body = {
        name: 'New Name',
        description: 'New Desc',
        url: 'https://new.com'
      }

      scenarioService.updateScenario.mockResolvedValue({})

      await updateScenarioHandler(req, res, next)

      expect(scenarioService.updateScenario).toHaveBeenCalledWith(
        'scenario-1',
        'user-789',
        {
          name: 'New Name',
          description: 'New Desc',
          url: 'https://new.com'
        }
      )
    })
  })

  describe('deleteScenarioHandler', () => {
    it('should delete scenario', async () => {
      req.params = { id: 'scenario-1' }

      scenarioService.deleteScenario.mockResolvedValue({ message: 'deleted' })

      await deleteScenarioHandler(req, res, next)

      expect(res.json).toHaveBeenCalled()
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(true)
    })

    it('should pass userId to service', async () => {
      req.params = { id: 'scenario-1' }
      req.user.id = 'user-999'

      scenarioService.deleteScenario.mockResolvedValue({})

      await deleteScenarioHandler(req, res, next)

      expect(scenarioService.deleteScenario).toHaveBeenCalledWith(
        'scenario-1',
        'user-999'
      )
    })

    it('should handle service errors', async () => {
      req.params = { id: 'scenario-1' }

      scenarioService.deleteScenario.mockRejectedValue(
        new Error('Unauthorized')
      )

      await deleteScenarioHandler(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })
})
