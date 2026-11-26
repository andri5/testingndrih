import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { rejectSqlInjection } from '../middleware/sqlInjectionGuard.js'
import {
  listHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  listVariablesHandler,
  upsertVariableHandler,
  deleteVariableHandler,
  resolvedMapHandler
} from '../controllers/environmentController.js'

const router = Router()
router.use(authenticateToken)

router.get('/', listHandler)
router.post('/', rejectSqlInjection({ body: ['name', 'description', 'baseUrl'] }), createHandler)
router.put('/:environmentId', rejectSqlInjection({ body: ['name', 'description', 'baseUrl'] }), updateHandler)
router.delete('/:environmentId', deleteHandler)
router.get('/:environmentId/variables', listVariablesHandler)
router.get('/:environmentId/resolved', resolvedMapHandler)
router.post(
  '/:environmentId/variables',
  rejectSqlInjection({ body: ['key', 'value', 'name'] }),
  upsertVariableHandler
)
router.delete('/:environmentId/variables/:variableId', deleteVariableHandler)

export default router
