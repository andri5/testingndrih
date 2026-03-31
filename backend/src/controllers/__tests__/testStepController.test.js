import * as testStepService from '../../services/testStepService.js'
import {
  createTestStepHandler,
  getTestStepsHandler,
  getTestStepHandler,
  updateTestStepHandler,
  deleteTestStepHandler,
  reorderStepsHandler,
  getStepTypesHandler,
  validateStepHandler
} from '../testStepController.js'

jest.mock('../../services/testStepService.js')

describe('TestStepController', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      user: { id: 'user-1' },
      params: { scenarioId: 'scenario-1', stepId: 'step-1' },
      query: {},
      body: {}
    }
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    }
    next = jest.fn()
  })

  describe('createTestStepHandler', () => {
    it('should create a step and return 201', async () => {
      req.body = { type: 'CLICK', description: 'Click button', selector: '#btn' }
      testStepService.createTestStep.mockResolvedValue({ id: 'step-1', type: 'CLICK' })

      await createTestStepHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ id: 'step-1', type: 'CLICK' })
    })

    it('should return 400 if type is missing', async () => {
      req.body = { description: 'Click button' }

      await createTestStepHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('required')
      }))
    })

    it('should return 400 if description is missing', async () => {
      req.body = { type: 'CLICK' }

      await createTestStepHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should call next on error', async () => {
      req.body = { type: 'CLICK', description: 'test' }
      testStepService.createTestStep.mockRejectedValue(new Error('fail'))

      await createTestStepHandler(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('getTestStepsHandler', () => {
    it('should return steps list', async () => {
      testStepService.getTestSteps.mockResolvedValue({ steps: [{ id: 'step-1' }], total: 1 })

      await getTestStepsHandler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ steps: [{ id: 'step-1' }], total: 1 })
    })

    it('should sanitize query params', async () => {
      req.query = { skip: '5', take: '10', orderBy: 'stepNumber', orderDirection: 'desc' }
      testStepService.getTestSteps.mockResolvedValue({ steps: [], total: 0 })

      await getTestStepsHandler(req, res, next)

      expect(testStepService.getTestSteps).toHaveBeenCalledWith('scenario-1', 'user-1', expect.objectContaining({
        skip: 5, take: 10, orderBy: 'stepNumber', orderDirection: 'desc'
      }))
    })

    it('should call next on error', async () => {
      testStepService.getTestSteps.mockRejectedValue(new Error('fail'))

      await getTestStepsHandler(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('getTestStepHandler', () => {
    it('should return a single step', async () => {
      testStepService.getTestStep.mockResolvedValue({ id: 'step-1', type: 'CLICK' })

      await getTestStepHandler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ id: 'step-1', type: 'CLICK' })
    })
  })

  describe('updateTestStepHandler', () => {
    it('should update step and return result', async () => {
      req.body = { type: 'FILL', description: 'Updated' }
      testStepService.updateTestStep.mockResolvedValue({ id: 'step-1', type: 'FILL' })

      await updateTestStepHandler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ id: 'step-1', type: 'FILL' })
    })
  })

  describe('deleteTestStepHandler', () => {
    it('should delete step and return result', async () => {
      testStepService.deleteTestStep.mockResolvedValue({ message: 'deleted' })

      await deleteTestStepHandler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ message: 'deleted' })
    })
  })

  describe('reorderStepsHandler', () => {
    it('should reorder steps', async () => {
      req.body = { stepOrders: [{ stepId: 'step-1', sequenceNumber: 1 }] }
      testStepService.reorderSteps.mockResolvedValue([{ id: 'step-1' }])

      await reorderStepsHandler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ steps: [{ id: 'step-1' }] })
    })

    it('should return 400 if stepOrders is empty', async () => {
      req.body = { stepOrders: [] }

      await reorderStepsHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if stepOrders is missing', async () => {
      req.body = {}

      await reorderStepsHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getStepTypesHandler', () => {
    it('should return step types', async () => {
      testStepService.getStepTypes.mockReturnValue([{ type: 'CLICK' }])

      await getStepTypesHandler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ types: [{ type: 'CLICK' }] })
    })
  })

  describe('validateStepHandler', () => {
    it('should validate step', async () => {
      req.body = { type: 'CLICK', description: 'Click button' }
      testStepService.validateStep.mockReturnValue({ valid: true })

      await validateStepHandler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ valid: true })
    })

    it('should return 400 if type missing', async () => {
      req.body = { description: 'test' }

      await validateStepHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if description missing', async () => {
      req.body = { type: 'CLICK' }

      await validateStepHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
