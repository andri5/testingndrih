import { prisma } from '../lib/prisma.js'
import * as agentJobService from '../services/agentJobService.js'

/**
 * Hybrid local agent — queue private-target runs for a machine on VPN/LAN.
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

      const job = agentJobService.enqueueAgentJob({
        userId,
        scenarioId,
        options: req.body || {},
      })

      res.status(201).json({
        success: true,
        message:
          'Job diantrekan untuk local agent. Jalankan scripts/local-agent di PC yang punya akses ke URL internal.',
        job,
        docs: '/docs/RUN_INTERNAL.md',
      })
    } catch (err) {
      res.status(400).json({ success: false, message: err.message })
    }
  },

  /** GET /api/agent/jobs/next — claim one queued job */
  async nextJob(req, res) {
    try {
      const job = agentJobService.claimNextJob(req.user.id)
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
      const job = agentJobService.completeJob(req.params.jobId, req.user.id, req.body || {})
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' })
      }
      res.json({ success: true, job })
    } catch (err) {
      res.status(400).json({ success: false, message: err.message })
    }
  },

  /** GET /api/agent/stats */
  async stats(req, res) {
    res.json({ success: true, stats: agentJobService.getAgentJobStats(req.user.id) })
  },
}
