import * as apiTestService from '../services/apiTestService.js'

export async function listHandler(req, res, next) {
  try {
    const tests = await apiTestService.listApiTests(req.user.id, req.params.scenarioId)
    res.json({ success: true, apiTests: tests })
  } catch (error) {
    next(error)
  }
}

export async function createHandler(req, res, next) {
  try {
    const test = await apiTestService.createApiTest(req.user.id, req.params.scenarioId, req.body)
    res.status(201).json({ success: true, apiTest: test })
  } catch (error) {
    next(error)
  }
}

export async function updateHandler(req, res, next) {
  try {
    const test = await apiTestService.updateApiTest(req.user.id, req.params.apiTestId, req.body)
    res.json({ success: true, apiTest: test })
  } catch (error) {
    next(error)
  }
}

export async function deleteHandler(req, res, next) {
  try {
    await apiTestService.deleteApiTest(req.user.id, req.params.apiTestId)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function runHandler(req, res, next) {
  try {
    const { environmentId } = req.body || {}
    const result = await apiTestService.runApiTest(req.user.id, req.params.apiTestId, { environmentId })
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}

export async function resultsHandler(req, res, next) {
  try {
    const results = await apiTestService.getApiTestResults(req.user.id, req.params.apiTestId)
    res.json({ success: true, results })
  } catch (error) {
    next(error)
  }
}
