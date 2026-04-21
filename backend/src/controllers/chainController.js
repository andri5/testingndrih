/**
 * Chain Controller - HTTP handlers for test chains
 */

import chainService from '../services/chainService.js';
import { executionService } from '../services/executionService.js';

export const chainController = {
  /**
   * Create new chain
   */
  async createChainHandler(req, res) {
    try {
      const { userId } = req.user;
      const { name, description } = req.body;

      const chain = await chainService.createChain(userId, { name, description });
      res.status(201).json({ success: true, chain });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * Get all chains for user
   */
  async getChainsHandler(req, res) {
    try {
      const { userId } = req.user;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const result = await chainService.getChains(userId, limit, offset);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get chain details
   */
  async getChainHandler(req, res) {
    try {
      const { userId } = req.user;
      const { chainId } = req.params;

      const chain = await chainService.getChainById(chainId, userId);
      res.status(200).json({ success: true, chain });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  },

  /**
   * Update chain
   */
  async updateChainHandler(req, res) {
    try {
      const { userId } = req.user;
      const { chainId } = req.params;
      const { name, description, isActive } = req.body;

      const chain = await chainService.updateChain(chainId, userId, { name, description, isActive });
      res.status(200).json({ success: true, chain });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * Delete chain
   */
  async deleteChainHandler(req, res) {
    try {
      const { userId } = req.user;
      const { chainId } = req.params;

      const result = await chainService.deleteChain(chainId, userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  },

  /**
   * Add step to chain
   */
  async addChainStepHandler(req, res) {
    try {
      const { userId } = req.user;
      const { chainId } = req.params;
      const { scenarioId, description, stepNumber, runMode, waitTime, retryCount, stopOnFail } = req.body;

      const step = await chainService.addChainStep(chainId, userId, {
        scenarioId,
        description,
        stepNumber,
        runMode,
        waitTime,
        retryCount,
        stopOnFail
      });

      res.status(201).json({ success: true, step });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * Get chain steps
   */
  async getChainStepsHandler(req, res) {
    try {
      const { userId } = req.user;
      const { chainId } = req.params;

      const steps = await chainService.getChainSteps(chainId, userId);
      res.status(200).json({ success: true, steps });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  },

  /**
   * Update chain step
   */
  async updateChainStepHandler(req, res) {
    try {
      const { userId } = req.user;
      const { stepId } = req.params;
      const { description, runMode, waitTime, retryCount, stopOnFail } = req.body;

      const step = await chainService.updateChainStep(stepId, userId, {
        description,
        runMode,
        waitTime,
        retryCount,
        stopOnFail
      });

      res.status(200).json({ success: true, step });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  /**
   * Delete chain step
   */
  async deleteChainStepHandler(req, res) {
    try {
      const { userId } = req.user;
      const { stepId } = req.params;

      const result = await chainService.deleteChainStep(stepId, userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  },

  /**
   * Execute chain
   */
  async executeChainHandler(req, res) {
    try {
      const { userId } = req.user;
      const { chainId } = req.params;
      const { headless = false } = req.body;

      // Get chain with all steps
      const chain = await chainService.getChainById(chainId, userId);

      if (!chain.chainSteps || chain.chainSteps.length === 0) {
        return res.status(400).json({ success: false, error: 'Chain has no steps' });
      }

      // Create chain execution record
      const chainExecution = await chainService.createChainExecution(chainId, userId);

      // Update to RUNNING
      await chainService.updateChainExecution(chainExecution.id, {
        status: 'RUNNING',
        startTime: new Date()
      });

      // Execute chain steps sequentially
      const startTime = Date.now();
      let passedSteps = 0;
      let failedSteps = 0;

      for (const step of chain.chainSteps) {
        try {
          // Execute scenario
          const execution = await executionService.executeScenario(step.scenario.id, userId, {
            headless
          });

          // Record step result
          await chainService.addChainStepResult(chainExecution.id, step.id, {
            stepNumber: step.stepNumber,
            status: execution.status,
            duration: execution.duration || 0,
            errorMessage: execution.errorMessage || null,
            executionId: execution.id
          });

          if (execution.status === 'PASSED') {
            passedSteps++;
          } else {
            failedSteps++;
            if (step.stopOnFail) {
              break;
            }
          }

          // Wait if specified
          if (step.waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, step.waitTime));
          }
        } catch (stepError) {
          failedSteps++;

          await chainService.addChainStepResult(chainExecution.id, step.id, {
            stepNumber: step.stepNumber,
            status: 'FAILED',
            duration: 0,
            errorMessage: stepError.message
          });

          if (step.stopOnFail) {
            break;
          }
        }
      }

      const duration = Date.now() - startTime;
      const finalStatus = failedSteps === 0 ? 'PASSED' : 'FAILED';

      // Update chain execution with final status
      const completedExecution = await chainService.updateChainExecution(chainExecution.id, {
        status: finalStatus,
        endTime: new Date(),
        duration,
        passedSteps,
        failedSteps
      });

      res.status(200).json({ success: true, chainExecution: completedExecution });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get chain execution history
   */
  async getChainExecutionHistoryHandler(req, res) {
    try {
      const { userId } = req.user;
      const { chainId } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const result = await chainService.getChainExecutionHistory(chainId, userId, limit, offset);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  },

  /**
   * Get chain execution details
   */
  async getChainExecutionDetailsHandler(req, res) {
    try {
      const { userId } = req.user;
      const { executionId } = req.params;

      const execution = await chainService.getChainExecutionDetails(executionId, userId);
      res.status(200).json({ success: true, execution });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
};

export default chainController;
