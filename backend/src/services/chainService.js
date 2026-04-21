/**
 * Chain Service - Manage test chains and chain execution
 */

import { prisma } from '../lib/prisma.js';

export const chainService = {
  /**
   * Create a new test chain
   */
  async createChain(userId, data) {
    const { name, description } = data;
    
    if (!name || name.trim().length === 0) {
      throw new Error('Chain name is required');
    }

    return await prisma.testChain.create({
      data: {
        name,
        description: description || null,
        userId,
        steps: 0
      },
      include: {
        chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } }
      }
    });
  },

  /**
   * Get chains for user
   */
  async getChains(userId, limit = 20, offset = 0) {
    const [chains, total] = await Promise.all([
      prisma.testChain.findMany({
        where: { userId },
        include: {
          chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } },
          _count: { select: { chainExecutions: true } }
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.testChain.count({ where: { userId } })
    ]);

    return { chains, total, limit, offset };
  },

  /**
   * Get chain by ID
   */
  async getChainById(chainId, userId) {
    const chain = await prisma.testChain.findFirst({
      where: { id: chainId, userId },
      include: {
        chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } },
        chainExecutions: { orderBy: { createdAt: 'desc' }, take: 5 }
      }
    });

    if (!chain) {
      throw new Error('Chain not found');
    }

    return chain;
  },

  /**
   * Update chain
   */
  async updateChain(chainId, userId, data) {
    const chain = await prisma.testChain.findFirst({
      where: { id: chainId, userId }
    });

    if (!chain) {
      throw new Error('Chain not found');
    }

    return await prisma.testChain.update({
      where: { id: chainId },
      data: {
        name: data.name || chain.name,
        description: data.description !== undefined ? data.description : chain.description,
        isActive: data.isActive !== undefined ? data.isActive : chain.isActive
      },
      include: {
        chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } }
      }
    });
  },

  /**
   * Delete chain
   */
  async deleteChain(chainId, userId) {
    const chain = await prisma.testChain.findFirst({
      where: { id: chainId, userId }
    });

    if (!chain) {
      throw new Error('Chain not found');
    }

    await prisma.testChain.delete({ where: { id: chainId } });
    return { success: true, message: 'Chain deleted successfully' };
  },

  /**
   * Add step to chain
   */
  async addChainStep(chainId, userId, data) {
    const { scenarioId, description, stepNumber, runMode = 'sequential', waitTime = 0, retryCount = 1, stopOnFail = true } = data;

    const chain = await prisma.testChain.findFirst({
      where: { id: chainId, userId }
    });

    if (!chain) {
      throw new Error('Chain not found');
    }

    const scenario = await prisma.scenario.findFirst({
      where: { id: scenarioId, userId }
    });

    if (!scenario) {
      throw new Error('Scenario not found');
    }

    // Determine step number
    let actualStepNumber = stepNumber;
    if (!actualStepNumber) {
      const lastStep = await prisma.chainStep.findFirst({
        where: { chainId },
        orderBy: { stepNumber: 'desc' }
      });
      actualStepNumber = (lastStep?.stepNumber || 0) + 1;
    }

    const step = await prisma.chainStep.create({
      data: {
        chainId,
        scenarioId,
        stepNumber: actualStepNumber,
        description: description || null,
        runMode,
        waitTime,
        retryCount,
        stopOnFail
      },
      include: { scenario: true }
    });

    // Update chain step count
    await prisma.testChain.update({
      where: { id: chainId },
      data: { steps: { increment: 1 } }
    });

    return step;
  },

  /**
   * Get chain steps
   */
  async getChainSteps(chainId, userId) {
    const chain = await prisma.testChain.findFirst({
      where: { id: chainId, userId }
    });

    if (!chain) {
      throw new Error('Chain not found');
    }

    return await prisma.chainStep.findMany({
      where: { chainId },
      include: { scenario: true },
      orderBy: { stepNumber: 'asc' }
    });
  },

  /**
   * Update chain step
   */
  async updateChainStep(stepId, userId, data) {
    const step = await prisma.chainStep.findFirst({
      where: {
        id: stepId,
        chain: { userId }
      }
    });

    if (!step) {
      throw new Error('Chain step not found');
    }

    return await prisma.chainStep.update({
      where: { id: stepId },
      data: {
        description: data.description !== undefined ? data.description : step.description,
        runMode: data.runMode || step.runMode,
        waitTime: data.waitTime !== undefined ? data.waitTime : step.waitTime,
        retryCount: data.retryCount !== undefined ? data.retryCount : step.retryCount,
        stopOnFail: data.stopOnFail !== undefined ? data.stopOnFail : step.stopOnFail
      },
      include: { scenario: true }
    });
  },

  /**
   * Delete chain step
   */
  async deleteChainStep(stepId, userId) {
    const step = await prisma.chainStep.findFirst({
      where: {
        id: stepId,
        chain: { userId }
      }
    });

    if (!step) {
      throw new Error('Chain step not found');
    }

    await prisma.chainStep.delete({ where: { id: stepId } });

    // Update chain step count
    await prisma.testChain.update({
      where: { id: step.chainId },
      data: { steps: { decrement: 1 } }
    });

    return { success: true, message: 'Chain step deleted successfully' };
  },

  /**
   * Get chain execution history
   */
  async getChainExecutionHistory(chainId, userId, limit = 20, offset = 0) {
    const chain = await prisma.testChain.findFirst({
      where: { id: chainId, userId }
    });

    if (!chain) {
      throw new Error('Chain not found');
    }

    const [executions, total] = await Promise.all([
      prisma.chainExecution.findMany({
        where: { chainId },
        include: {
          stepResults: { orderBy: { stepNumber: 'asc' } }
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.chainExecution.count({ where: { chainId } })
    ]);

    return { executions, total, limit, offset };
  },

  /**
   * Create chain execution record
   */
  async createChainExecution(chainId, userId) {
    const chain = await prisma.testChain.findFirst({
      where: { id: chainId, userId },
      include: { chainSteps: { orderBy: { stepNumber: 'asc' } } }
    });

    if (!chain) {
      throw new Error('Chain not found');
    }

    if (chain.chainSteps.length === 0) {
      throw new Error('Chain has no steps');
    }

    return await prisma.chainExecution.create({
      data: {
        chainId,
        userId,
        totalSteps: chain.chainSteps.length,
        status: 'PENDING'
      }
    });
  },

  /**
   * Update chain execution
   */
  async updateChainExecution(executionId, data) {
    return await prisma.chainExecution.update({
      where: { id: executionId },
      data: {
        status: data.status,
        startTime: data.startTime || undefined,
        endTime: data.endTime || undefined,
        duration: data.duration || undefined,
        passedSteps: data.passedSteps !== undefined ? data.passedSteps : undefined,
        failedSteps: data.failedSteps !== undefined ? data.failedSteps : undefined,
        errorMessage: data.errorMessage || undefined
      },
      include: { stepResults: { orderBy: { stepNumber: 'asc' } } }
    });
  },

  /**
   * Add step result to chain execution
   */
  async addChainStepResult(executionId, chainStepId, data) {
    const { stepNumber, status, duration, errorMessage, executionId: scenarioExecutionId } = data;

    return await prisma.chainStepResult.create({
      data: {
        chainExecutionId: executionId,
        chainStepId,
        stepNumber,
        status,
        duration,
        errorMessage,
        executionId: scenarioExecutionId
      }
    });
  },

  /**
   * Get chain execution details
   */
  async getChainExecutionDetails(executionId, userId) {
    const execution = await prisma.chainExecution.findFirst({
      where: {
        id: executionId,
        userId
      },
      include: {
        chain: { include: { chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } } } },
        stepResults: { orderBy: { stepNumber: 'asc' } }
      }
    });

    if (!execution) {
      throw new Error('Chain execution not found');
    }

    return execution;
  }
};

export default chainService;
