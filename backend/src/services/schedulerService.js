/**
 * Phase 2.4: Test Scheduler Service
 * ════════════════════════════════════════════════════════
 * Run scenarios at:
 * - jam tertentu (specific time)
 * - harian (daily)
 * - mingguan (weekly)
 * 
 * Uses node-cron for scheduling
 * Stores schedule config in database
 * Auto-executes scenarios & sends reports
 */

import cron from 'node-cron'
import { prisma } from '../lib/prisma.js'
import { executionService } from './executionService.js'

class SchedulerService {
  constructor() {
    this.jobs = new Map() // Map<scheduleId, cronJob>
    this.isRunning = false
  }

  /**
   * Initialize scheduler on app startup
   * Load all active schedules from database
   */
  async initialize() {
    try {
      console.log('[SCHEDULER] Initializing...')
      
      // Create TestSchedule table if not exists (migrations should handle this)
      // But we'll be safe and check
      
      const schedules = await prisma.testSchedule.findMany({
        where: { isActive: true },
        include: { scenario: true, user: true }
      })

      console.log(`[SCHEDULER] Found ${schedules.length} active schedules`)

      for (const schedule of schedules) {
        await this.startSchedule(schedule)
      }

      this.isRunning = true
      console.log('[SCHEDULER] ✅ Scheduler initialized')
    } catch (err) {
      console.error('[SCHEDULER] Initialization failed:', err.message)
    }
  }

  /**
   * Create new schedule
   */
  async createSchedule(userId, scenarioId, config) {
    try {
      const { frequency, timeOfDay, daysOfWeek, isActive = true } = config

      // Validate frequency
      const validFrequencies = ['ONCE', 'HOURLY', 'DAILY', 'WEEKLY']
      if (!validFrequencies.includes(frequency)) {
        throw new Error(`Invalid frequency: ${frequency}`)
      }

      // Generate cron expression
      const cronExpression = this.generateCronExpression(frequency, timeOfDay, daysOfWeek)

      // Save to database
      const schedule = await prisma.testSchedule.create({
        data: {
          userId,
          scenarioId,
          frequency,
          timeOfDay,
          daysOfWeek: daysOfWeek?.join(',') || null,
          cronExpression,
          isActive,
          lastRunAt: null,
          nextRunAt: this.calculateNextRun(cronExpression)
        }
      })

      // Start the job if active
      if (isActive) {
        await this.startSchedule(schedule)
      }

      console.log(`[SCHEDULER] Created schedule #${schedule.id}: ${frequency} at ${timeOfDay}`)
      return schedule
    } catch (err) {
      console.error('[SCHEDULER] Create failed:', err.message)
      throw err
    }
  }

  /**
   * Start a scheduled job
   */
  async startSchedule(schedule) {
    try {
      // Stop existing job if any
      if (this.jobs.has(schedule.id)) {
        this.stopSchedule(schedule.id)
      }

      // Create cron job
      const job = cron.schedule(schedule.cronExpression, async () => {
        console.log(`[SCHEDULER] 🔔 Running scheduled execution: Schedule #${schedule.id}`)
        try {
          await this.executeScheduledScenario(schedule)
        } catch (err) {
          console.error(`[SCHEDULER] Execution failed:`, err.message)
        }
      })

      // Store job reference
      this.jobs.set(schedule.id, job)

      // Update nextRunAt
      await prisma.testSchedule.update({
        where: { id: schedule.id },
        data: { nextRunAt: this.calculateNextRun(schedule.cronExpression) }
      })

      console.log(`[SCHEDULER] ✅ Started job #${schedule.id}`)
      return job
    } catch (err) {
      console.error('[SCHEDULER] Start failed:', err.message)
      throw err
    }
  }

  /**
   * Stop a scheduled job
   */
  stopSchedule(scheduleId) {
    try {
      const job = this.jobs.get(scheduleId)
      if (job) {
        job.stop()
        job.destroy()
        this.jobs.delete(scheduleId)
        console.log(`[SCHEDULER] ⏹️  Stopped job #${scheduleId}`)
      }
    } catch (err) {
      console.error('[SCHEDULER] Stop failed:', err.message)
    }
  }

  /**
   * Execute scheduled scenario
   */
  async executeScheduledScenario(schedule) {
    try {
      const { scenarioId, userId, id: scheduleId } = schedule

      // Fetch scenario
      const scenario = await prisma.scenario.findUnique({
        where: { id: scenarioId },
        include: { steps: true }
      })

      if (!scenario) {
        throw new Error(`Scenario #${scenarioId} not found`)
      }

      // Trigger execution (async)
      const execution = await executionService.executeScenario(scenarioId, scenario.steps, null)

      // Update schedule metadata
      await prisma.testSchedule.update({
        where: { id: scheduleId },
        data: {
          lastRunAt: new Date(),
          nextRunAt: this.calculateNextRun(schedule.cronExpression),
          lastExecutionId: execution.id,
          successCount: { increment: execution.status === 'PASSED' ? 1 : 0 },
          failureCount: { increment: execution.status === 'FAILED' ? 1 : 0 }
        }
      })

      console.log(`[SCHEDULER] ✅ Execution #${execution.id} created for schedule #${scheduleId}`)

      if (execution.status === 'FAILED') {
        const { notifyScheduledExecution } = await import('./notificationService.js')
        await notifyScheduledExecution({
          userId,
          scenarioName: scenario.name,
          execution
        })
      }

      return execution
    } catch (err) {
      console.error('[SCHEDULER] Execution failed:', err.message)
      throw err
    }
  }

  /**
   * Generate cron expression from config
   */
  generateCronExpression(frequency, timeOfDay, daysOfWeek) {
    // timeOfDay format: "09:30" (HH:mm)
    const [hour, minute] = (timeOfDay || '09:00').split(':')

    switch (frequency) {
      case 'HOURLY':
        return `0 * * * *` // Every hour at minute 0

      case 'DAILY':
        return `${minute} ${hour} * * *` // Daily at specific time

      case 'WEEKLY':
        // daysOfWeek: array of 0-6 (0=Sunday, 1=Monday, etc.)
        const days = (daysOfWeek || [1]).join(',')
        return `${minute} ${hour} * * ${days}` // Weekly on specific days

      case 'ONCE':
        // For one-time execution, not a cron
        return null

      default:
        return `0 9 * * *` // Default: 9:00 AM daily
    }
  }

  /**
   * Calculate next run time from cron expression
   */
  calculateNextRun(cronExpression) {
    try {
      if (!cronExpression) return null

      // Simple approximation for common patterns
      const now = new Date()

      // Daily
      if (cronExpression.match(/^\d+ \d+ \* \* \*/)) {
        const [min, hour] = cronExpression.split(' ')
        const next = new Date(now)
        next.setHours(parseInt(hour), parseInt(min), 0)
        if (next <= now) {
          next.setDate(next.getDate() + 1)
        }
        return next
      }

      // Weekly
      if (cronExpression.includes('* * ')) {
        const [min, hour] = cronExpression.split(' ')
        const next = new Date(now)
        next.setHours(parseInt(hour), parseInt(min), 0)
        if (next <= now) {
          next.setDate(next.getDate() + 1)
        }
        return next
      }

      return null
    } catch (err) {
      return new Date(Date.now() + 3600000) // 1 hour from now as fallback
    }
  }

  /**
   * List schedules for user
   */
  async listSchedules(userId) {
    try {
      const schedules = await prisma.testSchedule.findMany({
        where: { userId },
        include: { scenario: true },
        orderBy: { createdAt: 'desc' }
      })
      return schedules
    } catch (err) {
      console.error('[SCHEDULER] List failed:', err.message)
      throw err
    }
  }

  /**
   * Update schedule
   */
  async updateSchedule(scheduleId, config) {
    try {
      const { frequency, timeOfDay, daysOfWeek, isActive } = config

      // Generate new cron expression
      const cronExpression = this.generateCronExpression(frequency, timeOfDay, daysOfWeek)

      const schedule = await prisma.testSchedule.update({
        where: { id: scheduleId },
        data: {
          frequency,
          timeOfDay,
          daysOfWeek: daysOfWeek?.join(',') || null,
          cronExpression,
          isActive,
          nextRunAt: this.calculateNextRun(cronExpression)
        }
      })

      // Restart job if needed
      if (isActive) {
        await this.startSchedule(schedule)
      } else {
        this.stopSchedule(scheduleId)
      }

      console.log(`[SCHEDULER] Updated schedule #${scheduleId}`)
      return schedule
    } catch (err) {
      console.error('[SCHEDULER] Update failed:', err.message)
      throw err
    }
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId) {
    try {
      this.stopSchedule(scheduleId)

      await prisma.testSchedule.delete({
        where: { id: scheduleId }
      })

      console.log(`[SCHEDULER] Deleted schedule #${scheduleId}`)
    } catch (err) {
      console.error('[SCHEDULER] Delete failed:', err.message)
      throw err
    }
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStats(scheduleId) {
    try {
      const schedule = await prisma.testSchedule.findUnique({
        where: { id: scheduleId }
      })

      if (!schedule) throw new Error('Schedule not found')

      return {
        total: (schedule.successCount || 0) + (schedule.failureCount || 0),
        passed: schedule.successCount || 0,
        failed: schedule.failureCount || 0,
        successRate: schedule.successCount ? 
          Math.round((schedule.successCount / ((schedule.successCount || 0) + (schedule.failureCount || 0))) * 100) : 0,
        lastRun: schedule.lastRunAt,
        nextRun: schedule.nextRunAt
      }
    } catch (err) {
      console.error('[SCHEDULER] Stats fetch failed:', err.message)
      throw err
    }
  }

  /**
   * Shutdown all jobs
   */
  async shutdown() {
    try {
      console.log('[SCHEDULER] Shutting down...')
      for (const [scheduleId, job] of this.jobs) {
        job.stop()
        job.destroy()
      }
      this.jobs.clear()
      console.log('[SCHEDULER] ✅ All jobs stopped')
    } catch (err) {
      console.error('[SCHEDULER] Shutdown failed:', err.message)
    }
  }
}

export { SchedulerService }
export const schedulerService = new SchedulerService()
