import * as testRunService from '../services/testRunService.js'

export async function createHandler(req, res, next) {
  try {
    const run = await testRunService.createTestRun(req.user.id, req.body || {})
    res.status(201).json({ success: true, run })
  } catch (error) {
    next(error)
  }
}

export async function listHandler(req, res, next) {
  try {
    const data = await testRunService.listTestRuns(req.user.id, {
      status: req.query.status,
      limit: req.query.limit,
      offset: req.query.offset,
    })
    res.json({ success: true, ...data })
  } catch (error) {
    next(error)
  }
}

export async function getHandler(req, res, next) {
  try {
    const run = await testRunService.getTestRun(req.user.id, req.params.id)
    res.json({ success: true, run })
  } catch (error) {
    next(error)
  }
}

export async function closeHandler(req, res, next) {
  try {
    const run = await testRunService.closeTestRun(req.user.id, req.params.id)
    res.json({ success: true, run })
  } catch (error) {
    next(error)
  }
}

export async function updateItemHandler(req, res, next) {
  try {
    const run = await testRunService.updateTestRunItem(
      req.user.id,
      req.params.id,
      req.params.itemId,
      req.body || {}
    )
    res.json({ success: true, run })
  } catch (error) {
    next(error)
  }
}

export async function addItemsHandler(req, res, next) {
  try {
    const run = await testRunService.addCasesToRun(
      req.user.id,
      req.params.id,
      req.body?.scenarioIds || []
    )
    res.json({ success: true, run })
  } catch (error) {
    next(error)
  }
}

export async function removeItemHandler(req, res, next) {
  try {
    const run = await testRunService.removeRunItem(
      req.user.id,
      req.params.id,
      req.params.itemId
    )
    res.json({ success: true, run })
  } catch (error) {
    next(error)
  }
}

export async function startManualHandler(req, res, next) {
  try {
    const result = await testRunService.startItemManualChecklist(
      req.user.id,
      req.params.id,
      req.params.itemId
    )
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}
