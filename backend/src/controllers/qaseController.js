import { qaseService } from '../services/qaseService.js'

/**
 * Qase Integration Controller
 * Handles HTTP requests for Qase.io integration
 */

export const qaseController = {
  /**
   * Save Qase credentials
   * POST /api/qase/connect
   */
  async connectQase(req, res) {
    try {
      const { apiKey, projectCode } = req.body
      const userId = req.user.id

      if (!apiKey || !projectCode) {
        return res.status(400).json({
          message: 'API key and project code are required'
        })
      }

      const result = await qaseService.saveQaseCredentials(
        userId,
        apiKey,
        projectCode
      )

      res.status(200).json({
        success: true,
        message: result.message
      })
    } catch (error) {
      console.error('Qase connection error:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Get Qase integration status
   * GET /api/qase/status
   */
  async getQaseStatus(req, res) {
    try {
      const userId = req.user.id
      const integration = await qaseService.getQaseIntegration(userId)

      if (!integration) {
        return res.status(200).json({
          success: true,
          connected: false
        })
      }

      res.status(200).json({
        success: true,
        connected: integration.isConnected,
        projectCode: integration.projectCode,
        lastSyncedAt: integration.lastSyncedAt
      })
    } catch (error) {
      console.error('Error fetching Qase status:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Sync test cases from Qase
   * POST /api/qase/sync
   */
  async syncCasesFromQase(req, res) {
    try {
      const userId = req.user.id
      const result = await qaseService.syncCasesFromQase(userId)

      res.status(200).json({
        success: true,
        ...result
      })
    } catch (error) {
      console.error('Qase sync error:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Get synced test cases
   * GET /api/qase/cases
   */
  async getSyncedCases(req, res) {
    try {
      const userId = req.user.id
      const cases = await qaseService.getSyncedCases(userId)

      res.status(200).json({
        success: true,
        cases,
        total: cases.length
      })
    } catch (error) {
      console.error('Error fetching synced cases:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Push execution to Qase
   * POST /api/qase/push/:executionId
   */
  async pushExecutionToQase(req, res) {
    try {
      const userId = req.user.id
      const { executionId } = req.params

      if (!executionId) {
        return res.status(400).json({
          message: 'Execution ID is required'
        })
      }

      const result = await qaseService.pushExecutionToQase(userId, executionId)

      res.status(200).json({
        success: true,
        ...result
      })
    } catch (error) {
      console.error('Qase push error:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Push all executions to Qase
   * POST /api/qase/push-all
   */
  async pushAllExecutionsToQase(req, res) {
    try {
      const userId = req.user.id
      const { scenarioId } = req.query

      const result = await qaseService.pushAllExecutionsToQase(
        userId,
        scenarioId || null
      )

      res.status(200).json({
        success: true,
        ...result
      })
    } catch (error) {
      console.error('Qase bulk push error:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Create scenario from Qase case
   * POST /api/qase/create-scenario/:qaseCaseId
   */
  async createScenarioFromQaseCase(req, res) {
    try {
      const userId = req.user.id
      const { qaseCaseId } = req.params

      if (!qaseCaseId) {
        return res.status(400).json({
          message: 'Qase case ID is required'
        })
      }

      const scenario = await qaseService.createScenarioFromQaseCase(
        userId,
        qaseCaseId
      )

      res.status(201).json({
        success: true,
        message: 'Scenario created from Qase case',
        scenario
      })
    } catch (error) {
      console.error('Error creating scenario:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Get Qase project details
   * GET /api/qase/project
   */
  async getProjectDetails(req, res) {
    try {
      const userId = req.user.id
      const project = await qaseService.getQaseProjectDetails(userId)

      res.status(200).json({
        success: true,
        project
      })
    } catch (error) {
      console.error('Error fetching project details:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Disconnect Qase integration
   * POST /api/qase/disconnect
   */
  async disconnectQase(req, res) {
    try {
      const userId = req.user.id
      const result = await qaseService.disconnectQase(userId)

      res.status(200).json({
        success: true,
        ...result
      })
    } catch (error) {
      console.error('Qase disconnect error:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }
}
