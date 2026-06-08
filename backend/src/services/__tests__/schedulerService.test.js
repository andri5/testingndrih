/**
 * Scheduler Service Unit Tests
 * Aligned with actual schedulerService.js implementation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const mockCronJob = { stop: jest.fn(), destroy: jest.fn() }

jest.mock('node-cron', () => ({
  __esModule: true,
  default: {
    schedule: jest.fn(() => mockCronJob)
  }
}))

jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    testSchedule: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    scenario: {
      findUnique: jest.fn()
    }
  }
}))

jest.mock('../executionService.js', () => ({
  executionService: {
    executeScenario: jest.fn()
  }
}))

jest.mock('../notificationService.js', () => ({
  notifyScheduledExecution: jest.fn().mockResolvedValue(undefined)
}))

import cron from 'node-cron'
import { SchedulerService } from '../schedulerService.js'
import { prisma } from '../../lib/prisma.js'
import { executionService } from '../executionService.js'
import { notifyScheduledExecution } from '../notificationService.js'

describe('SchedulerService', () => {
  let schedulerService
  const mockSchedule = {
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

  beforeEach(() => {
    jest.clearAllMocks()
    schedulerService = new SchedulerService()
    cron.schedule.mockReturnValue(mockCronJob)
  })

  describe('generateCronExpression', () => {
    it('should generate valid DAILY cron expression', () => {
      expect(schedulerService.generateCronExpression('DAILY', '09:00', null)).toBe('00 09 * * *')
    })

    it('should generate valid HOURLY cron expression', () => {
      expect(schedulerService.generateCronExpression('HOURLY', null, null)).toBe('0 * * * *')
    })

    it('should generate valid WEEKLY cron expression', () => {
      const cronExpr = schedulerService.generateCronExpression('WEEKLY', '14:30', [1, 3, 5])
      expect(cronExpr).toBe('30 14 * * 1,3,5')
    })

    it('should return null for ONCE frequency', () => {
      expect(schedulerService.generateCronExpression('ONCE', '09:00', null)).toBeNull()
    })
  })

  describe('createSchedule', () => {
    it('should create schedule with valid data', async () => {
      prisma.testSchedule.create.mockResolvedValueOnce(mockSchedule)

      const result = await schedulerService.createSchedule('user-123', 'scenario-123', {
        frequency: 'DAILY',
        timeOfDay: '09:00',
        isActive: true
      })

      expect(result).toEqual(mockSchedule)
      expect(prisma.testSchedule.create).toHaveBeenCalled()
      expect(cron.schedule).toHaveBeenCalled()
    })

    it('should throw error if invalid frequency', async () => {
      await expect(
        schedulerService.createSchedule('user-123', 'scenario-123', {
          frequency: 'INVALID',
          timeOfDay: '09:00'
        })
      ).rejects.toThrow('Invalid frequency: INVALID')
    })

    it('should create schedule with weekly frequency', async () => {
      const weeklySchedule = { ...mockSchedule, frequency: 'WEEKLY', daysOfWeek: '1,3,5' }
      prisma.testSchedule.create.mockResolvedValueOnce(weeklySchedule)

      const result = await schedulerService.createSchedule('user-123', 'scenario-123', {
        frequency: 'WEEKLY',
        timeOfDay: '10:30',
        daysOfWeek: [1, 3, 5]
      })

      expect(result.frequency).toBe('WEEKLY')
      expect(result.daysOfWeek).toBe('1,3,5')
    })
  })

  describe('listSchedules', () => {
    it('should return all schedules for user', async () => {
      const schedules = [mockSchedule, { ...mockSchedule, id: 'schedule-456' }]
      prisma.testSchedule.findMany.mockResolvedValueOnce(schedules)

      const result = await schedulerService.listSchedules('user-123')

      expect(result).toHaveLength(2)
      expect(prisma.testSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-123' } })
      )
    })

    it('should return empty array if no schedules', async () => {
      prisma.testSchedule.findMany.mockResolvedValueOnce([])
      const result = await schedulerService.listSchedules('user-123')
      expect(result).toHaveLength(0)
    })
  })

  describe('updateSchedule', () => {
    it('should update schedule with new frequency', async () => {
      const updated = { ...mockSchedule, frequency: 'WEEKLY' }
      prisma.testSchedule.update.mockResolvedValueOnce(updated)

      const result = await schedulerService.updateSchedule('schedule-123', {
        frequency: 'WEEKLY',
        timeOfDay: '14:00',
        isActive: true
      })

      expect(result.frequency).toBe('WEEKLY')
      expect(prisma.testSchedule.update).toHaveBeenCalled()
    })

    it('should stop job when deactivated', async () => {
      const inactive = { ...mockSchedule, isActive: false }
      prisma.testSchedule.update.mockResolvedValueOnce(inactive)
      schedulerService.jobs.set('schedule-123', mockCronJob)

      await schedulerService.updateSchedule('schedule-123', {
        frequency: 'DAILY',
        timeOfDay: '09:00',
        isActive: false
      })

      expect(mockCronJob.stop).toHaveBeenCalled()
    })
  })

  describe('deleteSchedule', () => {
    it('should delete schedule and stop job', async () => {
      schedulerService.jobs.set('schedule-123', mockCronJob)
      prisma.testSchedule.delete.mockResolvedValueOnce(mockSchedule)

      await schedulerService.deleteSchedule('schedule-123')

      expect(prisma.testSchedule.delete).toHaveBeenCalledWith({
        where: { id: 'schedule-123' }
      })
      expect(schedulerService.jobs.has('schedule-123')).toBe(false)
    })
  })

  describe('executeScheduledScenario', () => {
    it('should execute scenario and update schedule metadata', async () => {
      const execution = { id: 'exec-123', status: 'PASSED' }
      const scenario = { id: 'scenario-123', name: 'Login', steps: [] }

      prisma.scenario.findUnique.mockResolvedValueOnce(scenario)
      executionService.executeScenario.mockResolvedValueOnce(execution)
      prisma.testSchedule.update.mockResolvedValueOnce({ ...mockSchedule, lastRunAt: new Date() })

      const result = await schedulerService.executeScheduledScenario(mockSchedule)

      expect(result.id).toBe('exec-123')
      expect(executionService.executeScenario).toHaveBeenCalled()
      expect(prisma.testSchedule.update).toHaveBeenCalled()
      expect(notifyScheduledExecution).not.toHaveBeenCalled()
    })

    it('should notify when scheduled execution fails', async () => {
      const execution = { id: 'exec-123', status: 'FAILED', errorMessage: 'Step failed' }
      const scenario = { id: 'scenario-123', name: 'Checkout', steps: [] }

      prisma.scenario.findUnique.mockResolvedValueOnce(scenario)
      executionService.executeScenario.mockResolvedValueOnce(execution)
      prisma.testSchedule.update.mockResolvedValueOnce({ ...mockSchedule, lastRunAt: new Date() })

      await schedulerService.executeScheduledScenario(mockSchedule)

      expect(notifyScheduledExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          scenarioName: 'Checkout',
          execution
        })
      )
    })

    it('should throw when scenario not found', async () => {
      prisma.scenario.findUnique.mockResolvedValueOnce(null)

      await expect(
        schedulerService.executeScheduledScenario(mockSchedule)
      ).rejects.toThrow('Scenario #scenario-123 not found')
    })
  })

  describe('initialize', () => {
    it('should load active schedules on init', async () => {
      prisma.testSchedule.findMany.mockResolvedValueOnce([mockSchedule])

      await schedulerService.initialize()

      expect(schedulerService.isRunning).toBe(true)
      expect(prisma.testSchedule.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: { scenario: true, user: true }
      })
    })
  })

  describe('calculateNextRun', () => {
    it('should calculate next run time for daily schedule', () => {
      const next = schedulerService.calculateNextRun('0 9 * * *')
      expect(next).toBeInstanceOf(Date)
    })

    it('should return null for empty cron expression', () => {
      expect(schedulerService.calculateNextRun(null)).toBeNull()
    })
  })
})
