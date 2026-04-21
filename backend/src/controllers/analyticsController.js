import { getAnalyticsSummary, getExecutionHistory, getScenarioMetrics, exportAnalyticsData } from '../services/analyticsService.js';

/**
 * Get analytics summary
 */
export async function getAnalyticsSummaryHandler(req, res, next) {
  try {
    const { userId } = req.user;
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
    const { userId } = req.user;
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
    const { userId } = req.user;
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
    const { userId } = req.user;
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
