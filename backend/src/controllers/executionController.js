import { executionService } from '../services/executionService.js'

/**
 * Execution Controller
 * Handles HTTP requests for test execution
 */

export const executionController = {
  /**
   * Execute a scenario
   * POST /api/executions/scenarios/:scenarioId
   */
  async executeScenario(req, res) {
    try {
      const { scenarioId } = req.params
      const userId = req.user.id

      if (!scenarioId) {
        return res.status(400).json({ message: 'Scenario ID is required' })
      }

      const result = await executionService.executeScenario(userId, scenarioId)

      res.status(200).json({
        success: true,
        message: 'Scenario executed successfully',
        execution: result.execution
      })
    } catch (error) {
      console.error('Execution error:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Execution failed'
      })
    }
  },

  /**
   * Get execution history
   * GET /api/executions
   */
  async getExecutionHistory(req, res) {
    try {
      const userId = req.user.id
      const { scenarioId, limit = '20', offset = '0' } = req.query

      const result = await executionService.getExecutionHistory(
        userId,
        scenarioId || null,
        parseInt(limit),
        parseInt(offset)
      )

      res.status(200).json({
        success: true,
        ...result
      })
    } catch (error) {
      console.error('Error fetching execution history:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Get execution details
   * GET /api/executions/:executionId
   */
  async getExecutionDetails(req, res) {
    try {
      const userId = req.user.id
      const { executionId } = req.params

      if (!executionId) {
        return res.status(400).json({ message: 'Execution ID is required' })
      }

      const execution = await executionService.getExecutionDetails(
        userId,
        executionId
      )

      res.status(200).json({
        success: true,
        execution
      })
    } catch (error) {
      console.error('Error fetching execution details:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Cancel execution
   * POST /api/executions/:executionId/cancel
   */
  async cancelExecution(req, res) {
    try {
      const userId = req.user.id
      const { executionId } = req.params

      if (!executionId) {
        return res.status(400).json({ message: 'Execution ID is required' })
      }

      const result = await executionService.cancelExecution(userId, executionId)

      res.status(200).json({
        success: true,
        message: result.message
      })
    } catch (error) {
      console.error('Error cancelling execution:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Delete execution
   * DELETE /api/executions/:executionId
   */
  async deleteExecution(req, res) {
    try {
      const userId = req.user.id
      const { executionId } = req.params

      if (!executionId) {
        return res.status(400).json({ message: 'Execution ID is required' })
      }

      const result = await executionService.deleteExecution(userId, executionId)

      res.status(200).json({
        success: true,
        message: result.message
      })
    } catch (error) {
      console.error('Error deleting execution:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  },

  /**
   * Get execution statistics
   * GET /api/executions/stats/summary
   */
  async getExecutionStats(req, res) {
    try {
      const userId = req.user.id
      const { scenarioId } = req.query

      const stats = await executionService.getExecutionStats(
        userId,
        scenarioId || null
      )

      res.status(200).json({
        success: true,
        stats
      })
    } catch (error) {
      console.error('Error fetching execution stats:', error)
      res.status(400).json({
        success: false,
        message: error.message
      })
    }
  }
}
