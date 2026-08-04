import { prisma } from '../lib/prisma.js'
import * as agentJobService from '../services/agentJobService.js'

/**
 * Hybrid local agent — durable queue for private/VPN targets (P2).
 */
export const agentController = {
  /** POST /api/agent/queue/:scenarioId */
  async queue(req, res) {
    try {
      const userId = req.user.id
      const { scenarioId } = req.params
      const scenario = await prisma.scenario.findFirst({
        where: { id: scenarioId, userId },
        include: { testSteps: { select: { id: true } } },
      })
      if (!scenario) {
        return res.status(404).json({ success: false, message: 'Scenario not found' })
      }
      if (!scenario.testSteps.length) {
        return res.status(400).json({ success: false, message: 'Scenario has no test steps' })
      }

      const job = await agentJobService.enqueueAgentJob({
        userId,
        scenarioId,
        options: req.body || {},
        totalSteps: scenario.testSteps.length,
      })

      res.status(201).json({
        success: true,
        message:
          'Job diantrekan untuk local agent (tersimpan di database). Jalankan scripts/local-agent di PC VPN/LAN.',
        job,
        executionId: job.executionId,
        docs: '/docs/RUN_INTERNAL.md',
      })
    } catch (err) {
      res.status(400).json({ success: false, message: err.message })
    }
  },

  /** GET /api/agent/jobs — list recent jobs for UI */
  async listJobs(req, res) {
    try {
      const jobs = await agentJobService.listJobsForUser(req.user.id, {
        scenarioId: req.query.scenarioId || null,
        limit: req.query.limit || 20,
      })
      res.json({ success: true, jobs })
    } catch (err) {
      res.status(400).json({ success: false, message: err.message })
    }
  },

  /** GET /api/agent/jobs/:jobId */
  async getJob(req, res) {
    try {
      const job = await agentJobService.getJob(req.params.jobId, req.user.id)
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' })
      }
      res.json({ success: true, job })
    } catch (err) {
      res.status(400).json({ success: false, message: err.message })
    }
  },

  /** GET /api/agent/jobs/next — claim one queued job */
  async nextJob(req, res) {
    try {
      const job = await agentJobService.claimNextJob(req.user.id)
      if (!job) {
        return res.json({ success: true, job: null })
      }

      const scenario = await prisma.scenario.findFirst({
        where: { id: job.scenarioId, userId: req.user.id },
        include: { testSteps: { orderBy: { stepNumber: 'asc' } } },
      })

      res.json({
        success: true,
        job: {
          ...job,
          scenario: scenario
            ? {
                id: scenario.id,
                name: scenario.name,
                url: scenario.url,
                steps: scenario.testSteps,
              }
            : null,
        },
      })
    } catch (err) {
      res.status(400).json({ success: false, message: err.message })
    }
  },

  /** POST /api/agent/jobs/:jobId/complete */
  async complete(req, res) {
    try {
      const job = await agentJobService.completeJob(req.params.jobId, req.user.id, req.body || {})
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' })
      }
      res.json({ success: true, job })
    } catch (err) {
      res.status(400).json({ success: false, message: err.message })
    }
  },

  /** POST /api/agent/jobs/:jobId/cancel */
  async cancel(req, res) {
    try {
      const job = await agentJobService.cancelQueuedJob(req.params.jobId, req.user.id)
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Queued job not found (only QUEUED jobs can be cancelled)',
        })
      }
      res.json({ success: true, job })
    } catch (err) {
      res.status(400).json({ success: false, message: err.message })
    }
  },

  /** GET /api/agent/stats */
  async stats(req, res) {
    try {
      const stats = await agentJobService.getAgentJobStats(req.user.id)
      res.json({ success: true, stats })
    } catch (err) {
      res.status(400).json({ success: false, message: err.message })
    }
  },
}
