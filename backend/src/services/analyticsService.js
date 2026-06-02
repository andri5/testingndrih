import { prisma } from '../lib/prisma.js';

/**
 * Get overall analytics summary for the user
 */
export async function getAnalyticsSummary(userId) {
  try {
    const allExecutions = await prisma.execution.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        duration: true,
        totalSteps: true,
        passedSteps: true,
        failedSteps: true,
        createdAt: true,
        scenario: { select: { id: true, name: true } },
      },
    });

    const totalExecutions = allExecutions.length;
    const passedExecutions = allExecutions.filter((e) => e.status === 'PASSED').length;
    const failedExecutions = allExecutions.filter((e) => e.status === 'FAILED').length;
    const passRate = totalExecutions > 0 ? ((passedExecutions / totalExecutions) * 100).toFixed(2) : 0;

    const avgDuration =
      allExecutions.length > 0
        ? Math.round(allExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / allExecutions.length)
        : 0;

    const totalStepsRun = allExecutions.reduce((sum, e) => sum + e.totalSteps, 0);
    const totalStepsPassed = allExecutions.reduce((sum, e) => sum + e.passedSteps, 0);
    const stepPassRate = totalStepsRun > 0 ? ((totalStepsPassed / totalStepsRun) * 100).toFixed(2) : 0;

    const scenarioCount = await prisma.scenario.count({ where: { userId } });

    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const executionsLast7Days = allExecutions.filter((e) => new Date(e.createdAt) >= last7Days);
    const passedLast7Days = executionsLast7Days.filter((e) => e.status === 'PASSED').length;
    const passRateLast7Days =
      executionsLast7Days.length > 0 ? ((passedLast7Days / executionsLast7Days.length) * 100).toFixed(2) : 0;

    return {
      totalExecutions,
      passedExecutions,
      failedExecutions,
      passRate: parseFloat(passRate),
      avgDuration,
      totalScenarios: scenarioCount,
      stepPassRate: parseFloat(stepPassRate),
      last7Days: {
        executions: executionsLast7Days.length,
        passRate: parseFloat(passRateLast7Days),
      },
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    throw error;
  }
}

/**
 * Get execution history with pagination
 */
export async function getExecutionHistory(userId, limit = 50, offset = 0) {
  try {
    const executions = await prisma.execution.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        duration: true,
        totalSteps: true,
        passedSteps: true,
        failedSteps: true,
        createdAt: true,
        browser: true,
        scenario: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.execution.count({ where: { userId } });

    return {
      data: executions,
      total,
      limit,
      offset,
    };
  } catch (error) {
    console.error('Error getting execution history:', error);
    throw error;
  }
}

/**
 * Get scenario performance metrics
 */
export async function getScenarioMetrics(scenarioId, userId) {
  try {
    // Verify ownership
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      select: { userId: true },
    });

    if (!scenario || scenario.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const executions = await prisma.execution.findMany({
      where: { scenarioId },
      select: {
        id: true,
        status: true,
        duration: true,
        totalSteps: true,
        passedSteps: true,
        failedSteps: true,
        createdAt: true,
        stepResults: {
          select: {
            id: true,
            status: true,
            duration: true,
            testStep: { select: { stepNumber: true, description: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const totalExecutions = executions.length;
    const passedCount = executions.filter((e) => e.status === 'PASSED').length;
    const failedCount = executions.filter((e) => e.status === 'FAILED').length;
    const passRate = totalExecutions > 0 ? ((passedCount / totalExecutions) * 100).toFixed(2) : 0;

    const avgDuration =
      totalExecutions > 0
        ? Math.round(executions.reduce((sum, e) => sum + (e.duration || 0), 0) / totalExecutions)
        : 0;

    // Analyze flaky steps (steps that fail sometimes but not always)
    const stepStats = {};
    executions.forEach((exec) => {
      exec.stepResults.forEach((result) => {
        const stepKey = `step_${result.testStep.stepNumber}`;
        if (!stepStats[stepKey]) {
          stepStats[stepKey] = {
            stepNumber: result.testStep.stepNumber,
            description: result.testStep.description,
            total: 0,
            failed: 0,
            avgDuration: 0,
            durations: [],
          };
        }
        stepStats[stepKey].total += 1;
        if (result.status === 'FAILED') {
          stepStats[stepKey].failed += 1;
        }
        if (result.duration) {
          stepStats[stepKey].durations.push(result.duration);
        }
      });
    });

    const flakySteps = Object.values(stepStats)
      .map((step) => ({
        ...step,
        failRate: step.total > 0 ? ((step.failed / step.total) * 100).toFixed(2) : 0,
        avgDuration: step.durations.length > 0 ? Math.round(step.durations.reduce((a, b) => a + b) / step.durations.length) : 0,
      }))
      .filter((step) => step.failed > 0)
      .sort((a, b) => b.failRate - a.failRate)
      .slice(0, 10);

    // Execution trend (last 20)
    const trend = executions
      .slice()
      .reverse()
      .map((exec) => ({
        date: new Date(exec.createdAt).toISOString().split('T')[0],
        status: exec.status,
        duration: exec.duration,
      }));

    return {
      scenarioId,
      totalExecutions,
      passedCount,
      failedCount,
      passRate: parseFloat(passRate),
      avgDuration,
      flakySteps,
      trend,
      lastExecuted: executions[0]?.createdAt || null,
    };
  } catch (error) {
    console.error('Error getting scenario metrics:', error);
    throw error;
  }
}

/**
 * Export analytics data in various formats
 */
export async function exportAnalyticsData(userId, format = 'json') {
  try {
    const summary = await getAnalyticsSummary(userId);
    const history = await getExecutionHistory(userId, 500, 0);

    const data = {
      summary,
      executions: history.data,
      exportedAt: new Date(),
    };

    if (format === 'json') {
      return {
        format: 'json',
        data,
        filename: `test-analytics-${Date.now()}.json`,
      };
    }

    if (format === 'csv') {
      // CSV format for executions
      const headers = ['Date', 'Scenario', 'Status', 'Duration (ms)', 'Passed Steps', 'Failed Steps', 'Total Steps'];
      const rows = history.data.map((exec) => [
        new Date(exec.createdAt).toISOString(),
        exec.scenario.name,
        exec.status,
        exec.duration || 'N/A',
        exec.passedSteps,
        exec.failedSteps,
        exec.totalSteps,
      ]);

      return {
        format: 'csv',
        headers,
        rows,
        filename: `test-analytics-${Date.now()}.csv`,
      };
    }

    throw new Error(`Unsupported format: ${format}`);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    throw error;
  }
}

/**
 * Get pass/fail trend data for dashboard
 */
export async function getPassFailTrend(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const executions = await prisma.execution.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const trendMap = new Map();
    executions.forEach(exec => {
      const dateStr = exec.createdAt.toISOString().split('T')[0];
      if (!trendMap.has(dateStr)) {
        trendMap.set(dateStr, { passed: 0, failed: 0, date: dateStr });
      }
      const trend = trendMap.get(dateStr);
      if (exec.status === 'PASSED') {
        trend.passed++;
      } else {
        trend.failed++;
      }
    });

    return Array.from(trendMap.values());
  } catch (error) {
    console.error('Error getting pass/fail trend:', error);
    throw error;
  }
}

/**
 * Get top failing steps ranked by frequency
 */
export async function getTopFailingSteps(userId, limit = 10) {
  try {
    const failedSteps = await prisma.stepResult.findMany({
      where: {
        status: 'FAILED',
        testStep: {
          scenario: {
            userId
          }
        }
      },
      select: {
        testStep: {
          select: {
            stepNumber: true,
            type: true,
            description: true,
            scenario: {
              select: { name: true }
            }
          }
        },
        errorMessage: true
      },
      orderBy: { createdAt: 'desc' },
      take: 500
    });

    // Group and count by step
    const stepFailureMap = new Map();
    failedSteps.forEach(result => {
      if (!result.testStep) return;
      const key = `${result.testStep.scenario?.name}#${result.testStep.stepNumber}`;
      if (!stepFailureMap.has(key)) {
        stepFailureMap.set(key, {
          scenario: result.testStep.scenario?.name || 'Unknown',
          stepNumber: result.testStep.stepNumber,
          type: result.testStep.type,
          description: result.testStep.description,
          failCount: 0
        });
      }
      stepFailureMap.get(key).failCount++;
    });

    return Array.from(stepFailureMap.values())
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting top failing steps:', error);
    throw error;
  }
}

/**
 * Get execution volume statistics
 */
export async function getExecutionVolume(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const executions = await prisma.execution.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const volumeMap = new Map();
    executions.forEach(exec => {
      const dateStr = exec.createdAt.toISOString().split('T')[0];
      if (!volumeMap.has(dateStr)) {
        volumeMap.set(dateStr, { date: dateStr, count: 0 });
      }
      volumeMap.get(dateStr).count++;
    });

    return Array.from(volumeMap.values());
  } catch (error) {
    console.error('Error getting execution volume:', error);
    throw error;
  }
}

/**
 * Get scenario performance ranking
 */
export async function getScenarioPerformance(userId, limit = 20) {
  try {
    const scenarios = await prisma.scenario.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        executions: {
          select: { status: true }
        }
      },
      take: limit
    });

    return scenarios
      .map(scenario => {
        const execs = scenario.executions || [];
        const passed = execs.filter(e => e.status === 'PASSED').length;
        const total = execs.length;

        return {
          id: scenario.id,
          name: scenario.name,
          totalExecutions: total,
          passedExecutions: passed,
          failedExecutions: total - passed,
          successRate: total > 0 ? Math.round((passed / total) * 100) : 0
        };
      })
      .sort((a, b) => b.successRate - a.successRate);
  } catch (error) {
    console.error('Error getting scenario performance:', error);
    throw error;
  }
}
