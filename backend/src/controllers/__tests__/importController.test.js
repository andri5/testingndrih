import * as importService from '../../services/importService.js'
import {
  importCSVHandler,
  importTemplateHandler,
  validateCSVHandler,
  exportScenarioHandler,
  bulkImportHandler
} from '../importController.js'

jest.mock('../../services/importService.js')

describe('ImportController', () => {
  let req, res, next

  beforeEach(() => {
    req = {
      user: { id: 'user-1' },
      params: {},
      query: {},
      body: {},
      file: null
    }
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      send: jest.fn()
    }
    next = jest.fn()
  })

  describe('importCSVHandler', () => {
    it('should return 400 if no file provided', async () => {
      await importCSVHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('No CSV file')
      }))
    })

    it('should return 400 if file is not CSV', async () => {
      req.file = { mimetype: 'application/json', originalname: 'test.json', buffer: Buffer.from('{}') }

      await importCSVHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('CSV')
      }))
    })
  })

  describe('importTemplateHandler', () => {
    it('should import from template and return 201', async () => {
      req.params = { templateId: 'template-1' }
      req.body = { scenarioName: 'My Scenario' }
      importService.importScenarioFromTemplate.mockResolvedValue({ id: 'scenario-1' })

      await importTemplateHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        scenario: { id: 'scenario-1' }
      }))
    })

    it('should call next on error', async () => {
      req.params = { templateId: 'template-1' }
      importService.importScenarioFromTemplate.mockRejectedValue(new Error('fail'))

      await importTemplateHandler(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('validateCSVHandler', () => {
    it('should return 400 if no file provided', async () => {
      await validateCSVHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should validate and return result', async () => {
      req.file = { buffer: Buffer.from('stepnumber,type,description\n1,CLICK,test') }
      importService.validateCSVFormat.mockReturnValue({ valid: true })

      await validateCSVHandler(req, res, next)

      expect(res.json).toHaveBeenCalledWith({ valid: true })
    })
  })

  describe('exportScenarioHandler', () => {
    it('should export scenario as CSV', async () => {
      req.params = { scenarioId: 'scenario-1' }
      importService.exportScenarioToCSV.mockResolvedValue('stepNumber,type\n1,CLICK')

      await exportScenarioHandler(req, res, next)

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv')
      expect(res.send).toHaveBeenCalledWith('stepNumber,type\n1,CLICK')
    })

    it('should call next on error', async () => {
      req.params = { scenarioId: 'scenario-1' }
      importService.exportScenarioToCSV.mockRejectedValue(new Error('fail'))

      await exportScenarioHandler(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('bulkImportHandler', () => {
    it('should return 400 if no file provided', async () => {
      await bulkImportHandler(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
