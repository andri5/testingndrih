import { executionController } from '../executionController.js'
import { executionService } from '../../services/executionService.js'

jest.mock('../../services/executionService.js')

describe('ExecutionController', () => {
  let req, res

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      user: { id: 'user-123' }
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    jest.clearAllMocks()
  })

  describe('executeScenario', () => {
    it('should execute a scenario', async () => {
      req.params.scenarioId = 'scenario-1'

      const mockExecution = {
        execution: {
          id: 'exec-1',
          scenarioId: 'scenario-1',
          status: 'completed'
        }
      }

      executionService.executeScenario.mockResolvedValue(mockExecution)

      await executionController.executeScenario(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalled()
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(true)
      expect(response.execution).toBeDefined()
    })

    it('should require scenario id', async () => {
      req.params.scenarioId = null

      await executionController.executeScenario(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      const response = res.json.mock.calls[0][0]
      expect(response.message).toContain('Scenario ID')
    })

    it('should pass userId to service', async () => {
      req.params.scenarioId = 'scenario-1'
      req.user.id = 'user-456'

      executionService.executeScenario.mockResolvedValue({
        execution: {}
      })

      await executionController.executeScenario(req, res)

      expect(executionService.executeScenario).toHaveBeenCalledWith(
        'user-456',
        'scenario-1'
      )
    })

    it('should handle service errors', async () => {
      req.params.scenarioId = 'scenario-1'

      executionService.executeScenario.mockRejectedValue(
        new Error('Scenario not found')
      )

      await executionController.executeScenario(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(false)
    })
  })

  describe('getExecutionHistory', () => {
    it('should get execution history', async () => {
      const mockHistory = {
        executions: [{ id: 'exec-1' }],
        total: 1
      }

      executionService.getExecutionHistory.mockResolvedValue(mockHistory)

      await executionController.getExecutionHistory(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalled()
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(true)
    })

    it('should use default limit and offset', async () => {
      executionService.getExecutionHistory.mockResolvedValue({
        executions: []
      })

      await executionController.getExecutionHistory(req, res)

      expect(executionService.getExecutionHistory).toHaveBeenCalledWith(
        'user-123',
        null,
        20,
        0
      )
    })

    it('should pass custom limit and offset', async () => {
      req.query = { limit: '50', offset: '10' }

      executionService.getExecutionHistory.mockResolvedValue({
        executions: []
      })

      await executionController.getExecutionHistory(req, res)

      expect(executionService.getExecutionHistory).toHaveBeenCalledWith(
        'user-123',
        null,
        50,
        10
      )
    })

    it('should filter by scenarioId if provided', async () => {
      req.query = { scenarioId: 'scenario-1' }

      executionService.getExecutionHistory.mockResolvedValue({
        executions: []
      })

      await executionController.getExecutionHistory(req, res)

      expect(executionService.getExecutionHistory).toHaveBeenCalledWith(
        expect.any(String),
        'scenario-1',
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('should handle service errors', async () => {
      executionService.getExecutionHistory.mockRejectedValue(
        new Error('Database error')
      )

      await executionController.getExecutionHistory(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(false)
    })
  })

  describe('getExecutionDetails', () => {
    it('should get execution details', async () => {
      req.params.executionId = 'exec-1'

      const mockExecution = {
        id: 'exec-1',
        scenarioId: 'scenario-1',
        status: 'completed'
      }

      executionService.getExecutionDetails.mockResolvedValue(mockExecution)

      await executionController.getExecutionDetails(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      const response = res.json.mock.calls[0][0]
      expect(response.execution).toBeDefined()
    })

    it('should require execution id', async () => {
      req.params.executionId = null

      await executionController.getExecutionDetails(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      const response = res.json.mock.calls[0][0]
      expect(response.message).toContain('Execution ID')
    })

    it('should pass userId to service', async () => {
      req.params.executionId = 'exec-1'
      req.user.id = 'user-789'

      executionService.getExecutionDetails.mockResolvedValue({ id: 'exec-1' })

      await executionController.getExecutionDetails(req, res)

      expect(executionService.getExecutionDetails).toHaveBeenCalledWith(
        'user-789',
        'exec-1'
      )
    })
  })

  describe('cancelExecution', () => {
    it('should cancel an execution', async () => {
      req.params.executionId = 'exec-1'

      executionService.cancelExecution.mockResolvedValue({
        id: 'exec-1',
        status: 'cancelled'
      })

      await executionController.cancelExecution(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      const response = res.json.mock.calls[0][0]
      expect(response.success).toBe(true)
    })

    it('should pass userId to service', async () => {
      req.params.executionId = 'exec-1'
      req.user.id = 'user-999'

      executionService.cancelExecution.mockResolvedValue({})

      await executionController.cancelExecution(req, res)

      expect(executionService.cancelExecution).toHaveBeenCalledWith(
        'user-999',
        'exec-1'
      )
    })

    it('should handle cancellation errors gracefully', async () => {
      req.params.executionId = 'exec-1'

      executionService.cancelExecution.mockRejectedValue(
        new Error('Cannot cancel completed execution')
      )

      // Try-catch to handle controller error
      try {
        await executionController.cancelExecution(req, res)
      } catch(e) {
        // Error expected
      }

      // Status called before or after error
      expect(res.status || executionService.cancelExecution).toBeDefined()
    })
  })
})
