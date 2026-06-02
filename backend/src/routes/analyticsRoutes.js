import { Router } from 'express';
import {
  getAnalyticsSummaryHandler,
  getExecutionHistoryHandler,
  getScenarioMetricsHandler,
  exportAnalyticsDataHandler,
  getPassFailTrendHandler,
  getTopFailingStepsHandler,
  getExecutionVolumeHandler,
  getScenarioPerformanceHandler,
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get overall analytics summary
router.get('/summary', getAnalyticsSummaryHandler);

// Get execution history (paginated)
router.get('/executions', getExecutionHistoryHandler);

// Get scenario performance metrics
router.get('/scenarios/:scenarioId', getScenarioMetricsHandler);

// Dashboard Analytics Endpoints
// Get pass/fail trend
router.get('/dashboard/trends', getPassFailTrendHandler);

// Get top failing steps
router.get('/dashboard/failing-steps', getTopFailingStepsHandler);

// Get execution volume
router.get('/dashboard/volume', getExecutionVolumeHandler);

// Get scenario performance ranking
router.get('/dashboard/scenario-performance', getScenarioPerformanceHandler);

// Export analytics data
router.get('/export', exportAnalyticsDataHandler);

export default router;
