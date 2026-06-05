import * as visualRegressionService from '../services/visualRegressionService.js'

export async function captureHandler(req, res, next) {
  try {
    const { browser, headless, environmentId } = req.body || {}
    const result = await visualRegressionService.captureBaselines(
      req.user.id,
      req.params.scenarioId,
      { browser, headless, environmentId }
    )
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}

export async function runHandler(req, res, next) {
  try {
    const { browser, headless, environmentId, threshold } = req.body || {}
    const result = await visualRegressionService.runVisualRegression(
      req.user.id,
      req.params.scenarioId,
      { browser, headless, environmentId, threshold }
    )
    const httpStatus = result.summary.failed > 0 ? 422 : 200
    res.status(httpStatus).json({ success: result.summary.failed === 0, ...result })
  } catch (error) {
    next(error)
  }
}

export async function listBaselinesHandler(req, res, next) {
  try {
    const baselines = await visualRegressionService.listBaselines(
      req.user.id,
      req.query.scenarioId || null
    )
    res.json({ success: true, baselines })
  } catch (error) {
    next(error)
  }
}

export async function listComparisonsHandler(req, res, next) {
  try {
    const comparisons = await visualRegressionService.listComparisons(req.user.id, {
      scenarioId: req.query.scenarioId,
      status: req.query.status,
      limit: parseInt(req.query.limit || '50')
    })
    res.json({ success: true, comparisons })
  } catch (error) {
    next(error)
  }
}

export async function approveHandler(req, res, next) {
  try {
    const comparison = await visualRegressionService.approveComparison(
      req.user.id,
      req.params.comparisonId
    )
    res.json({ success: true, comparison })
  } catch (error) {
    next(error)
  }
}

export async function deleteBaselineHandler(req, res, next) {
  try {
    await visualRegressionService.deleteBaseline(req.user.id, req.params.baselineId)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
