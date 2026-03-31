import { prisma } from '../../lib/prisma.js'
import {
  importScenarioFromCSV,
  importScenarioFromTemplate,
  validateCSVFormat,
  exportScenarioToCSV
} from '../importService.js'

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn()
}))

import fs from 'fs'

describe('ImportService', () => {
  const userId = 'user-1'

  describe('validateCSVFormat', () => {
    it('should validate a valid CSV', () => {
      const csv = 'stepnumber,type,description\n1,CLICK,Click button'
      const result = validateCSVFormat(csv)
      expect(result.valid).toBe(true)
    })

    it('should reject CSV with only header', () => {
      const csv = 'stepnumber,type,description'
      const result = validateCSVFormat(csv)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('header and at least one data row')
    })

    it('should reject empty CSV', () => {
      const csv = ''
      const result = validateCSVFormat(csv)
      expect(result.valid).toBe(false)
    })

    it('should reject CSV without required headers', () => {
      const csv = 'foo,bar,baz\n1,2,3'
      const result = validateCSVFormat(csv)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must include at least one of')
    })

    it('should accept CSV with at least one required header', () => {
      const csv = 'description,extra\nClick button,yes'
      const result = validateCSVFormat(csv)
      expect(result.valid).toBe(true)
    })
  })

  describe('importScenarioFromCSV', () => {
    it('should import scenario from CSV file', async () => {
      const csvContent = 'stepnumber,type,description,selector,value\n1,CLICK,Click button,#btn,\n2,FILL,Fill input,#input,hello'
      fs.readFileSync.mockReturnValue(csvContent)

      prisma.scenario.create.mockResolvedValue({
        id: 'scenario-1', name: 'Test Import', steps: 2
      })
      prisma.testStep.create
        .mockResolvedValueOnce({ id: 'step-1', stepNumber: 1 })
        .mockResolvedValueOnce({ id: 'step-2', stepNumber: 2 })

      const result = await importScenarioFromCSV('/tmp/test.csv', userId, {
        name: 'Test Import'
      })

      expect(result.scenario.id).toBe('scenario-1')
      expect(result.stepsCreated).toBe(2)
      expect(result.steps).toHaveLength(2)
    })

    it('should use default name if not provided', async () => {
      const csvContent = 'stepnumber,type,description\n1,NAVIGATE,Go to page'
      fs.readFileSync.mockReturnValue(csvContent)

      prisma.scenario.create.mockResolvedValue({ id: 'scenario-1', steps: 1 })
      prisma.testStep.create.mockResolvedValue({ id: 'step-1' })

      await importScenarioFromCSV('/tmp/test.csv', userId)

      expect(prisma.scenario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: expect.stringContaining('Imported Scenario')
          })
        })
      )
    })

    it('should throw on empty CSV', async () => {
      fs.readFileSync.mockReturnValue('stepnumber,type,description')

      await expect(
        importScenarioFromCSV('/tmp/empty.csv', userId)
      ).rejects.toThrow('Failed to import CSV')
    })

    it('should throw on read error', async () => {
      fs.readFileSync.mockImplementation(() => { throw new Error('File not found') })

      await expect(
        importScenarioFromCSV('/tmp/missing.csv', userId)
      ).rejects.toThrow('Failed to import CSV')
    })
  })

  describe('importScenarioFromTemplate', () => {
    it('should import scenario from template', async () => {
      prisma.scenario.create.mockResolvedValue({
        id: 'scenario-1', name: 'From Template'
      })

      const result = await importScenarioFromTemplate('template-1', userId, 'From Template')

      expect(result.id).toBe('scenario-1')
      expect(prisma.scenario.create).toHaveBeenCalled()
    })

    it('should use default name if not provided', async () => {
      prisma.scenario.create.mockResolvedValue({ id: 'scenario-1' })

      await importScenarioFromTemplate('template-1', userId)

      expect(prisma.scenario.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: expect.stringContaining('Template Import')
          })
        })
      )
    })

    it('should throw on database error', async () => {
      prisma.scenario.create.mockRejectedValue(new Error('DB error'))

      await expect(
        importScenarioFromTemplate('template-1', userId)
      ).rejects.toThrow('Failed to import from template')
    })
  })

  describe('exportScenarioToCSV', () => {
    it('should export scenario as CSV', async () => {
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1',
        userId,
        testSteps: [
          { stepNumber: 1, type: 'NAVIGATE', description: 'Go to home', selector: null, value: null },
          { stepNumber: 2, type: 'CLICK', description: 'Click login', selector: '#login', value: null }
        ]
      })

      const csv = await exportScenarioToCSV('scenario-1', userId)

      expect(csv).toContain('stepNumber,type,description,selector,value')
      expect(csv).toContain('NAVIGATE')
      expect(csv).toContain('CLICK')
    })

    it('should throw if scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValue(null)

      await expect(
        exportScenarioToCSV('nonexistent', userId)
      ).rejects.toThrow('Failed to export scenario')
    })

    it('should throw if unauthorized', async () => {
      prisma.scenario.findUnique.mockResolvedValue({
        id: 'scenario-1', userId: 'other-user', testSteps: []
      })

      await expect(
        exportScenarioToCSV('scenario-1', userId)
      ).rejects.toThrow('Failed to export scenario')
    })
  })
})
