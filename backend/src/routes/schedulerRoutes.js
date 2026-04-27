/**
 * Phase 2.4: Scheduler Routes
 * REST API endpoints for managing test schedules
 */

import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { schedulerService } from '../services/schedulerService.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

/* Middleware: Require authentication for all scheduler routes */
router.use(authenticateToken)

/**
 * GET /api/scheduler - List user's schedules
 */
router.get('/', async (req, res) => {
  try {
    const schedules = await schedulerService.listSchedules(req.user.id)
    res.json({ schedules })
  } catch (err) {
    console.error('[SCHEDULER] List failed:', err.message)
    res.status(500).json({ error: 'Failed to list schedules' })
  }
})

/**
 * POST /api/scheduler - Create new schedule
 * Body: { scenarioId, frequency, timeOfDay?, daysOfWeek?, isActive? }
 */
router.post('/', async (req, res) => {
  try {
    const { scenarioId, frequency, timeOfDay, daysOfWeek, isActive } = req.body

    if (!scenarioId || !frequency) {
      return res.status(400).json({ error: 'scenarioId and frequency required' })
    }

    const schedule = await schedulerService.createSchedule(req.user.id, scenarioId, {
      frequency,
      timeOfDay: timeOfDay || '09:00',
      daysOfWeek,
      isActive
    })

    res.status(201).json({ schedule })
  } catch (err) {
    console.error('[SCHEDULER] Create failed:', err.message)
    res.status(400).json({ error: err.message })
  }
})

/**
 * GET /api/scheduler/:scheduleId - Get specific schedule details
 */
router.get('/:scheduleId', async (req, res) => {
  try {
    const schedule = await prisma.testSchedule.findUnique({
      where: { id: req.params.scheduleId },
      include: { scenario: true, user: true }
    })

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    // Verify ownership
    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Get stats
    const stats = await schedulerService.getScheduleStats(schedule.id)

    res.json({ schedule, stats })
  } catch (err) {
    console.error('[SCHEDULER] Get failed:', err.message)
    res.status(500).json({ error: 'Failed to get schedule' })
  }
})

/**
 * PUT /api/scheduler/:scheduleId - Update schedule
 * Body: { frequency, timeOfDay?, daysOfWeek?, isActive? }
 */
router.put('/:scheduleId', async (req, res) => {
  try {
    const { frequency, timeOfDay, daysOfWeek, isActive } = req.body

    // Verify ownership
    const schedule = await prisma.testSchedule.findUnique({
      where: { id: req.params.scheduleId }
    })

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const updated = await schedulerService.updateSchedule(req.params.scheduleId, {
      frequency: frequency || schedule.frequency,
      timeOfDay: timeOfDay || schedule.timeOfDay,
      daysOfWeek: daysOfWeek || (schedule.daysOfWeek?.split(',') || []),
      isActive: isActive !== undefined ? isActive : schedule.isActive
    })

    res.json({ schedule: updated })
  } catch (err) {
    console.error('[SCHEDULER] Update failed:', err.message)
    res.status(400).json({ error: err.message })
  }
})

/**
 * DELETE /api/scheduler/:scheduleId - Delete schedule
 */
router.delete('/:scheduleId', async (req, res) => {
  try {
    // Verify ownership
    const schedule = await prisma.testSchedule.findUnique({
      where: { id: req.params.scheduleId }
    })

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    await schedulerService.deleteSchedule(req.params.scheduleId)

    res.json({ message: 'Schedule deleted' })
  } catch (err) {
    console.error('[SCHEDULER] Delete failed:', err.message)
    res.status(500).json({ error: 'Failed to delete schedule' })
  }
})

/**
 * POST /api/scheduler/:scheduleId/test - Trigger test execution immediately
 * Useful for testing schedule config before saving
 */
router.post('/:scheduleId/test', async (req, res) => {
  try {
    // Verify ownership
    const schedule = await prisma.testSchedule.findUnique({
      where: { id: req.params.scheduleId }
    })

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Trigger execution immediately
    const execution = await schedulerService.executeScheduledScenario(schedule)

    res.json({
      message: 'Test execution triggered',
      executionId: execution.id
    })
  } catch (err) {
    console.error('[SCHEDULER] Test failed:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/scheduler/:scheduleId/history - Get execution history for schedule
 */
router.get('/:scheduleId/history', async (req, res) => {
  try {
    // Verify ownership
    const schedule = await prisma.testSchedule.findUnique({
      where: { id: req.params.scheduleId }
    })

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    if (schedule.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // Get recent executions for this scenario
    const executions = await prisma.execution.findMany({
      where: { scenarioId: schedule.scenarioId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        stepResults: {
          select: { status: true }
        }
      }
    })

    res.json({ executions })
  } catch (err) {
    console.error('[SCHEDULER] History failed:', err.message)
    res.status(500).json({ error: 'Failed to get execution history' })
  }
})

export default router
