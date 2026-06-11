import { Router } from 'express'
import { adminAuth } from '../middleware/adminAuth.js'
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
router.use(...adminAuth)

router.get('/', listHandler)
router.post('/', createHandler)
router.put('/:environmentId', updateHandler)
router.delete('/:environmentId', deleteHandler)
router.get('/:environmentId/variables', listVariablesHandler)
router.get('/:environmentId/resolved', resolvedMapHandler)
router.post('/:environmentId/variables', upsertVariableHandler)
router.delete('/:environmentId/variables/:variableId', deleteVariableHandler)

export default router
