import { Router } from 'express';
import {
  getAnalyticsSummaryHandler,
  getExecutionHistoryHandler,
  getScenarioMetricsHandler,
  exportAnalyticsDataHandler,
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

// Export analytics data
router.get('/export', exportAnalyticsDataHandler);

export default router;
