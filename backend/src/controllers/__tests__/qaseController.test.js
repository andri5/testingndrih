import { qaseService } from '../../services/qaseService.js'
import { qaseController } from '../qaseController.js'

jest.mock('../../services/qaseService.js')

describe('QaseController', () => {
  let req, res

  beforeEach(() => {
    req = {
      user: { id: 'user-1' },
      params: {},
      query: {},
      body: {}
    }
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    }
  })

  describe('connectQase', () => {
    it('should connect with valid credentials', async () => {
      req.body = { apiKey: 'test-key', projectCode: 'PROJ' }
      qaseService.saveQaseCredentials.mockResolvedValue({ message: 'Connected' })

      await qaseController.connectQase(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
    })

    it('should return 400 if apiKey missing', async () => {
      req.body = { projectCode: 'PROJ' }

      await qaseController.connectQase(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 400 if projectCode missing', async () => {
      req.body = { apiKey: 'test-key' }

      await qaseController.connectQase(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should handle service error', async () => {
      req.body = { apiKey: 'test-key', projectCode: 'PROJ' }
      qaseService.saveQaseCredentials.mockRejectedValue(new Error('Connection failed'))

      await qaseController.connectQase(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }))
    })
  })

  describe('getQaseStatus', () => {
    it('should return connected status', async () => {
      qaseService.getQaseIntegration.mockResolvedValue({
        isConnected: true, projectCode: 'PROJ', lastSyncedAt: new Date()
      })

      await qaseController.getQaseStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ connected: true }))
    })

    it('should return not connected if no integration', async () => {
      qaseService.getQaseIntegration.mockResolvedValue(null)

      await qaseController.getQaseStatus(req, res)

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ connected: false }))
    })

    it('should handle error', async () => {
      qaseService.getQaseIntegration.mockRejectedValue(new Error('fail'))

      await qaseController.getQaseStatus(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('syncCasesFromQase', () => {
    it('should sync cases successfully', async () => {
      qaseService.syncCasesFromQase.mockResolvedValue({ synced: 5 })

      await qaseController.syncCasesFromQase(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, synced: 5 }))
    })

    it('should handle error', async () => {
      qaseService.syncCasesFromQase.mockRejectedValue(new Error('fail'))

      await qaseController.syncCasesFromQase(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getSyncedCases', () => {
    it('should return synced cases', async () => {
      qaseService.getSyncedCases.mockResolvedValue([{ id: 'case-1' }])

      await qaseController.getSyncedCases(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        cases: [{ id: 'case-1' }],
        total: 1
      }))
    })
  })

  describe('pushExecutionToQase', () => {
    it('should push execution', async () => {
      req.params = { executionId: 'exec-1' }
      qaseService.pushExecutionToQase.mockResolvedValue({ pushed: true })

      await qaseController.pushExecutionToQase(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should return 400 if executionId missing', async () => {
      req.params = {}

      await qaseController.pushExecutionToQase(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('pushAllExecutionsToQase', () => {
    it('should push all executions', async () => {
      qaseService.pushAllExecutionsToQase.mockResolvedValue({ pushed: 3 })

      await qaseController.pushAllExecutionsToQase(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should handle error', async () => {
      qaseService.pushAllExecutionsToQase.mockRejectedValue(new Error('fail'))

      await qaseController.pushAllExecutionsToQase(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('createScenarioFromQaseCase', () => {
    it('should create scenario from Qase case', async () => {
      req.params = { qaseCaseId: 'case-1' }
      qaseService.createScenarioFromQaseCase.mockResolvedValue({ id: 'scenario-1' })

      await qaseController.createScenarioFromQaseCase(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
    })

    it('should return 400 if qaseCaseId missing', async () => {
      req.params = {}

      await qaseController.createScenarioFromQaseCase(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('getProjectDetails', () => {
    it('should return project details', async () => {
      qaseService.getQaseProjectDetails.mockResolvedValue({ name: 'Project' })

      await qaseController.getProjectDetails(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('disconnectQase', () => {
    it('should disconnect', async () => {
      qaseService.disconnectQase.mockResolvedValue({ message: 'Disconnected' })

      await qaseController.disconnectQase(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should handle error', async () => {
      qaseService.disconnectQase.mockRejectedValue(new Error('fail'))

      await qaseController.disconnectQase(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
