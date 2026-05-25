/**
 * Scheduler Service Unit Tests
 * Test scheduling, cron expression generation, execution management
 * Target: 20+ test cases
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock prisma
jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    testSchedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    testScenario: {
      findUnique: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    },
    $transaction: jest.fn()
  }
}), { virtual: true })

// Mock execution service
jest.mock('../executionService.js', () => ({
  executionService: {
    executeScenario: jest.fn()
  }
}))

import { SchedulerService } from '../schedulerService.js'
import { prisma } from '../../lib/prisma.js'
import { executionService } from '../executionService.js'

describe('SchedulerService', () => {
  let schedulerService
  let mockUser
  let mockScenario
  let mockSchedule

  beforeEach(() => {
    jest.clearAllMocks()
    schedulerService = new SchedulerService()

    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User'
    }

    mockScenario = {
      id: 'scenario-123',
      name: 'Test Scenario',
      userId: 'user-123'
    }

    mockSchedule = {
      id: 'schedule-123',
      userId: 'user-123',
      scenarioId: 'scenario-123',
      frequency: 'DAILY',
      timeOfDay: '09:00',
      daysOfWeek: null,
      cronExpression: '0 9 * * *',
      isActive: true,
      lastRunAt: null,
      nextRunAt: new Date(Date.now() + 86400000)
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('generateCronExpression', () => {
    it('should generate valid DAILY cron expression', () => {
      const cron = schedulerService.generateCronExpression('DAILY', '09:00', null)
      expect(cron).toBe('0 9 * * *')
    })

    it('should generate valid HOURLY cron expression', () => {
      const cron = schedulerService.generateCronExpression('HOURLY', null, null)
      expect(cron).toBe('0 * * * *')
    })

    it('should generate valid WEEKLY cron expression', () => {
      const cron = schedulerService.generateCronExpression('WEEKLY', '14:30', '1,3,5')
      expect(cron).toMatch(/0 14 \* \* [0-9,]+/)
    })

    it('should handle 24-hour time format', () => {
      const cron = schedulerService.generateCronExpression('DAILY', '23:59', null)
      expect(cron).toBe('59 23 * * *')
    })

    it('should throw error for invalid frequency', () => {
      expect(() => {
        schedulerService.generateCronExpression('INVALID', '09:00', null)
      }).toThrow()
    })

    it('should throw error for invalid time format', () => {
      expect(() => {
        schedulerService.generateCronExpression('DAILY', '25:00', null)
      }).toThrow()
    })
  })

  describe('createSchedule', () => {
    it('should create schedule with valid data', async () => {
      prisma.testSchedule.create.mockResolvedValueOnce(mockSchedule)
      prisma.testScenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.user.findUnique.mockResolvedValueOnce(mockUser)

      const result = await schedulerService.createSchedule('user-123', 'scenario-123', {
        frequency: 'DAILY',
        timeOfDay: '09:00',
        isActive: true
      })

      expect(result).toEqual(mockSchedule)
      expect(prisma.testSchedule.create).toHaveBeenCalled()
    })

    it('should throw error if scenario not found', async () => {
      prisma.testScenario.findUnique.mockResolvedValueOnce(null)

      await expect(
        schedulerService.createSchedule('user-123', 'invalid-id', {
          frequency: 'DAILY',
          timeOfDay: '09:00'
        })
      ).rejects.toThrow('Scenario not found')
    })

    it('should throw error if invalid frequency', async () => {
      prisma.testScenario.findUnique.mockResolvedValueOnce(mockScenario)

      await expect(
        schedulerService.createSchedule('user-123', 'scenario-123', {
          frequency: 'INVALID',
          timeOfDay: '09:00'
        })
      ).rejects.toThrow()
    })

    it('should create schedule with weekly frequency', async () => {
      const weeklySchedule = { ...mockSchedule, frequency: 'WEEKLY', daysOfWeek: '1,3,5' }
      prisma.testSchedule.create.mockResolvedValueOnce(weeklySchedule)
      prisma.testScenario.findUnique.mockResolvedValueOnce(mockScenario)
      prisma.user.findUnique.mockResolvedValueOnce(mockUser)

      const result = await schedulerService.createSchedule('user-123', 'scenario-123', {
        frequency: 'WEEKLY',
        timeOfDay: '10:30',
        daysOfWeek: [1, 3, 5]
      })

      expect(result.frequency).toBe('WEEKLY')
      expect(result.daysOfWeek).toBe('1,3,5')
    })
  })

  describe('getSchedules', () => {
    it('should return all schedules for user', async () => {
      const schedules = [mockSchedule, { ...mockSchedule, id: 'schedule-456' }]
      prisma.testSchedule.findMany.mockResolvedValueOnce(schedules)
      prisma.testSchedule.count.mockResolvedValueOnce(2)

      const result = await schedulerService.getSchedules('user-123')

      expect(result.schedules).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(prisma.testSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-123' } })
      )
    })

    it('should support pagination', async () => {
      prisma.testSchedule.findMany.mockResolvedValueOnce([mockSchedule])
      prisma.testSchedule.count.mockResolvedValueOnce(10)

      const result = await schedulerService.getSchedules('user-123', 5, 10)

      expect(prisma.testSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 10
        })
      )
    })

    it('should return empty array if no schedules', async () => {
      prisma.testSchedule.findMany.mockResolvedValueOnce([])
      prisma.testSchedule.count.mockResolvedValueOnce(0)

      const result = await schedulerService.getSchedules('user-123')

      expect(result.schedules).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('updateSchedule', () => {
    it('should update schedule with new frequency', async () => {
      const updated = { ...mockSchedule, frequency: 'WEEKLY' }
      prisma.testSchedule.update.mockResolvedValueOnce(updated)

      const result = await schedulerService.updateSchedule('schedule-123', {
        frequency: 'WEEKLY',
        timeOfDay: '14:00'
      })

      expect(result.frequency).toBe('WEEKLY')
      expect(prisma.testSchedule.update).toHaveBeenCalled()
    })

    it('should toggle schedule active status', async () => {
      const inactive = { ...mockSchedule, isActive: false }
      prisma.testSchedule.update.mockResolvedValueOnce(inactive)

      const result = await schedulerService.updateSchedule('schedule-123', {
        isActive: false
      })

      expect(result.isActive).toBe(false)
    })

    it('should throw error if schedule not found', async () => {
      prisma.testSchedule.update.mockRejectedValueOnce(new Error('Not found'))

      await expect(
        schedulerService.updateSchedule('invalid-id', { isActive: false })
      ).rejects.toThrow()
    })
  })

  describe('deleteSchedule', () => {
    it('should delete schedule by id', async () => {
      prisma.testSchedule.delete.mockResolvedValueOnce(mockSchedule)

      const result = await schedulerService.deleteSchedule('schedule-123')

      expect(result.id).toBe('schedule-123')
      expect(prisma.testSchedule.delete).toHaveBeenCalledWith({
        where: { id: 'schedule-123' }
      })
    })

    it('should handle cascade delete of related jobs', async () => {
      schedulerService.jobs.set('schedule-123', { stop: jest.fn() })
      prisma.testSchedule.delete.mockResolvedValueOnce(mockSchedule)

      await schedulerService.deleteSchedule('schedule-123')

      expect(schedulerService.jobs.has('schedule-123')).toBe(false)
    })
  })

  describe('executeScheduledScenario', () => {
    it('should execute scenario and update lastRunAt', async () => {
      const execution = { id: 'exec-123', status: 'PENDING' }
      executionService.executeScenario.mockResolvedValueOnce(execution)
      prisma.testSchedule.update.mockResolvedValueOnce({ ...mockSchedule, lastRunAt: new Date() })

      const result = await schedulerService.executeScheduledScenario(mockSchedule)

      expect(result.status).toBe('PENDING')
      expect(prisma.testSchedule.update).toHaveBeenCalled()
    })

    it('should handle execution errors gracefully', async () => {
      executionService.executeScenario.mockRejectedValueOnce(new Error('Execution failed'))

      const result = await schedulerService.executeScheduledScenario(mockSchedule)

      expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }))
    })
  })

  describe('initialize', () => {
    it('should load active schedules on init', async () => {
      prisma.testSchedule.findMany.mockResolvedValueOnce([mockSchedule])

      await schedulerService.initialize()

      expect(schedulerService.isRunning).toBe(true)
      expect(prisma.testSchedule.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Object)
      })
    })

    it('should handle initialization errors', async () => {
      prisma.testSchedule.findMany.mockRejectedValueOnce(new Error('DB error'))

      await expect(schedulerService.initialize()).rejects.toThrow()
    })
  })

  describe('calculateNextRun', () => {
    it('should calculate next run time for daily schedule', () => {
      const next = schedulerService.calculateNextRun('0 9 * * *')
      expect(next).toBeInstanceOf(Date)
      expect(next.getTime()).toBeGreaterThan(Date.now())
    })

    it('should handle cron expression validation', () => {
      expect(() => {
        schedulerService.calculateNextRun('INVALID')
      }).toThrow()
    })
  })
})
