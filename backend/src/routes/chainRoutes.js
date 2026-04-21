/**
 * Chain Routes
 */

import { Router } from 'express';
import chainController from '../controllers/chainController.js';
import { authenticateToken } from '../middleware/auth.js';

const chainRoutes = Router();

chainRoutes.use(authenticateToken);

// Chain management
chainRoutes.post('/', chainController.createChainHandler);
chainRoutes.get('/', chainController.getChainsHandler);
chainRoutes.get('/:chainId', chainController.getChainHandler);
chainRoutes.put('/:chainId', chainController.updateChainHandler);
chainRoutes.delete('/:chainId', chainController.deleteChainHandler);

// Chain steps
chainRoutes.post('/:chainId/steps', chainController.addChainStepHandler);
chainRoutes.get('/:chainId/steps', chainController.getChainStepsHandler);
chainRoutes.put('/step/:stepId', chainController.updateChainStepHandler);
chainRoutes.delete('/step/:stepId', chainController.deleteChainStepHandler);

// Chain execution
chainRoutes.post('/:chainId/execute', chainController.executeChainHandler);
chainRoutes.get('/:chainId/executions', chainController.getChainExecutionHistoryHandler);
chainRoutes.get('/execution/:executionId', chainController.getChainExecutionDetailsHandler);

export default chainRoutes;
