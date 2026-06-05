import { getAnalyticsSummary, getExecutionHistory, getScenarioMetrics, exportAnalyticsData, getPassFailTrend, getTopFailingSteps, getExecutionVolume, getScenarioPerformance, getFlakySteps } from '../services/analyticsService.js';

/**
 * Get analytics summary
 */
export async function getAnalyticsSummaryHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const summary = await getAnalyticsSummary(userId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
}

/**
 * Get execution history
 */
export async function getExecutionHistoryHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    const history = await getExecutionHistory(userId, parseInt(limit), parseInt(offset));
    res.json(history);
  } catch (error) {
    next(error);
  }
}

/**
 * Get scenario performance metrics
 */
export async function getScenarioMetricsHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const { scenarioId } = req.params;
    const metrics = await getScenarioMetrics(scenarioId, userId);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
}

/**
 * Export analytics data
 */
export async function exportAnalyticsDataHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const { format = 'json' } = req.query;
    const exported = await exportAnalyticsData(userId, format);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
      res.json(exported.data);
    } else if (format === 'csv') {
      // Build CSV content
      const { headers, rows } = exported;
      const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
      res.send(csvContent);
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get pass/fail trend data
 */
export async function getPassFailTrendHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    const trend = await getPassFailTrend(userId, parseInt(days));
    res.json(trend);
  } catch (error) {
    next(error);
  }
}

/**
 * Get top failing steps
 */
export async function getTopFailingStepsHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;
    const steps = await getTopFailingSteps(userId, parseInt(limit));
    res.json(steps);
  } catch (error) {
    next(error);
  }
}

/**
 * Get execution volume
 */
export async function getExecutionVolumeHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    const volume = await getExecutionVolume(userId, parseInt(days));
    res.json(volume);
  } catch (error) {
    next(error);
  }
}

/**
 * Get scenario performance
 */
export async function getScenarioPerformanceHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;
    const performance = await getScenarioPerformance(userId, parseInt(limit));
    res.json(performance);
  } catch (error) {
    next(error);
  }
}

/**
 * Get flaky steps across all scenarios
 */
export async function getFlakyStepsHandler(req, res, next) {
  try {
    const userId = req.user.id;
    const { limit = 15 } = req.query;
    const flakySteps = await getFlakySteps(userId, parseInt(limit));
    res.json(flakySteps);
  } catch (error) {
    next(error);
  }
}
