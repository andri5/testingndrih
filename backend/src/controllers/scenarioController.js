import {
  createScenario,
  getUserScenarios,
  getScenarioById,
  getScenarioRuns,
  updateScenario,
  deleteScenario,
  duplicateScenario,
  getScenarioStats,
  toggleScenarioFavorite,
  updateScenarioTags,
  listScenarioTags,
  moveScenarios,
  getScenarioReminders,
} from '../services/scenarioService.js'
import * as scenarioAttachmentService from '../services/scenarioAttachmentService.js'
import { listScenarioHistory } from '../services/scenarioAuditService.js'
import { bulkAssignScenarioOwner } from '../services/testRunService.js'

/**
 * POST /api/scenarios
 * Create a new scenario
 */
export async function createScenarioHandler(req, res, next) {
  try {
    const {
      name,
      description,
      url,
      folderId,
      tags,
      precondition,
      priority,
      caseType,
      ownerId,
    } = req.body
    const userId = req.user.id

    const scenario = await createScenario(userId, {
      name,
      description,
      url,
      folderId,
      tags,
      precondition,
      priority,
      caseType,
      ownerId,
    })

    res.status(201).json({
      success: true,
      message: 'Scenario created successfully',
      scenario
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/scenarios
 * Get all scenarios for authenticated user
 */
export async function getScenarioListHandler(req, res, next) {
  try {
    const userId = req.user.id
    const skip = parseInt(req.query.skip) || 0
    const take = parseInt(req.query.take) || 50
    const orderBy = req.query.orderBy || 'createdAt'
    const orderDirection = req.query.orderDirection || 'desc'
    const favoritesOnly = req.query.favoritesOnly === 'true' || req.query.favoritesOnly === '1'
    const tag = req.query.tag || null
    const folderId = req.query.folderId || undefined
    const unfiled = req.query.unfiled === 'true' || req.query.unfiled === '1'
    const includeDescendants =
      req.query.includeDescendants === 'true' || req.query.includeDescendants === '1'

    // Validate pagination
    if (skip < 0 || take < 1 || take > 500) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      })
    }

    const { scenarios, total } = await getUserScenarios(userId, {
      skip,
      take,
      orderBy,
      orderDirection,
      favoritesOnly,
      tag,
      folderId,
      unfiled,
      includeDescendants,
    })

    res.json({
      success: true,
      scenarios,
      pagination: {
        skip,
        take,
        total,
        hasMore: skip + take < total
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/scenarios/move
 */
export async function moveScenariosHandler(req, res, next) {
  try {
    const { ids, folderId = null, sortOrders } = req.body
    const result = await moveScenarios(req.user.id, { ids, folderId, sortOrders })
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/scenarios/reminders
 * Unfinished / never-run / stuck scenario reminders
 */
export async function getScenarioRemindersHandler(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20)
    const data = await getScenarioReminders(req.user.id, { limit })
    res.json({ success: true, ...data })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/scenarios/:id
 * Get a specific scenario with its test steps
 */
export async function getScenarioHandler(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    const scenario = await getScenarioById(id, userId)

    res.json({
      success: true,
      scenario
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/scenarios/:id/runs
 * Execution history for this test case (Testiny Runs tab)
 */
export async function getScenarioRunsHandler(req, res, next) {
  try {
    const { id } = req.params
    const { limit = '20', offset = '0' } = req.query
    const data = await getScenarioRuns(id, req.user.id, { limit, offset })
    res.json({ success: true, ...data })
  } catch (error) {
    next(error)
  }
}

export async function uploadScenarioAttachmentsHandler(req, res, next) {
  try {
    const attachments = await scenarioAttachmentService.addScenarioAttachments(
      req.user.id,
      req.params.id,
      req.files || []
    )
    res.status(201).json({ success: true, attachments })
  } catch (error) {
    next(error)
  }
}

export async function listScenarioAttachmentsHandler(req, res, next) {
  try {
    const attachments = await scenarioAttachmentService.listScenarioAttachments(
      req.user.id,
      req.params.id
    )
    res.json({ success: true, attachments })
  } catch (error) {
    next(error)
  }
}

export async function deleteScenarioAttachmentHandler(req, res, next) {
  try {
    await scenarioAttachmentService.deleteScenarioAttachment(
      req.user.id,
      req.params.id,
      req.params.attachmentId
    )
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function getScenarioHistoryHandler(req, res, next) {
  try {
    const data = await listScenarioHistory(req.params.id, req.user.id, {
      limit: req.query.limit,
      offset: req.query.offset,
    })
    res.json({ success: true, ...data })
  } catch (error) {
    next(error)
  }
}

export async function bulkAssignOwnerHandler(req, res, next) {
  try {
    const result = await bulkAssignScenarioOwner(
      req.user.id,
      req.body?.ids || [],
      req.body?.ownerId
    )
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}

/**
 * PUT /api/scenarios/:id
 * Update a scenario
 */
export async function updateScenarioHandler(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id
    const {
      name,
      description,
      url,
      tags,
      folderId,
      sortOrder,
      precondition,
      priority,
      caseType,
      ownerId,
    } = req.body

    const scenario = await updateScenario(id, userId, {
      name,
      description,
      url,
      tags,
      folderId,
      sortOrder,
      precondition,
      priority,
      caseType,
      ownerId,
    })

    res.json({
      success: true,
      message: 'Scenario updated successfully',
      scenario
    })
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/scenarios/:id
 * Delete a scenario
 */
export async function deleteScenarioHandler(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    await deleteScenario(id, userId)

    res.json({
      success: true,
      message: 'Scenario deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/scenarios/:id/duplicate
 * Duplicate a scenario
 */
export async function duplicateScenarioHandler(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    const newScenario = await duplicateScenario(id, userId)

    res.status(201).json({
      success: true,
      message: 'Scenario duplicated successfully',
      scenario: newScenario
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/scenarios/:id/stats
 * Get scenario statistics
 */
export async function getScenarioStatsHandler(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.id

    const stats = await getScenarioStats(id, userId)

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    next(error)
  }
}

export async function listScenarioTagsHandler(req, res, next) {
  try {
    const tags = await listScenarioTags(req.user.id)
    res.json({ success: true, tags })
  } catch (error) {
    next(error)
  }
}

export async function toggleFavoriteHandler(req, res, next) {
  try {
    const { id } = req.params
    const scenario = await toggleScenarioFavorite(id, req.user.id)
    res.json({ success: true, scenario })
  } catch (error) {
    next(error)
  }
}

export async function updateTagsHandler(req, res, next) {
  try {
    const { id } = req.params
    const { tags } = req.body
    const scenario = await updateScenarioTags(id, req.user.id, tags)
    res.json({ success: true, scenario })
  } catch (error) {
    next(error)
  }
}
