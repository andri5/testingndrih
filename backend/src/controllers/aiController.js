import {
  isAiEnabled,
  explainFailure,
  generateScenario,
  suggestLocator,
} from '../services/aiService.js'
import {
  assertAiQuota,
  recordAiUsage,
  getAiQuotaStatus,
  markProviderCooldown,
} from '../services/aiUsageService.js'

async function withAiQuota(userId, fn) {
  assertAiQuota(userId)
  try {
    const result = await fn()
    recordAiUsage(userId)
    return result
  } catch (error) {
    if (error.status === 429 || error.code === 'AI_PROVIDER_RATE_LIMIT') {
      markProviderCooldown(90_000)
    }
    throw error
  }
}

export async function aiStatusHandler(req, res) {
  const quota = getAiQuotaStatus(req.user.id)
  res.json({
    success: true,
    enabled: isAiEnabled(),
    model: isAiEnabled() ? (process.env.OPENAI_MODEL || 'gpt-4o-mini') : null,
    quota,
  })
}

export async function explainFailureHandler(req, res, next) {
  try {
    const { errorDetail } = req.body
    if (!errorDetail?.message && !errorDetail?.step) {
      return res.status(400).json({
        success: false,
        message: 'errorDetail with message or step is required',
      })
    }
    const insight = await withAiQuota(req.user.id, () => explainFailure(errorDetail))
    res.json({ success: true, insight, quota: getAiQuotaStatus(req.user.id) })
  } catch (error) {
    next(error)
  }
}

export async function generateScenarioHandler(req, res, next) {
  try {
    const { prompt, url } = req.body
    if (!prompt?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'prompt is required',
      })
    }
    const scenario = await withAiQuota(req.user.id, () =>
      generateScenario({ prompt: prompt.trim(), url: url?.trim() })
    )
    res.json({ success: true, scenario, quota: getAiQuotaStatus(req.user.id) })
  } catch (error) {
    next(error)
  }
}

export async function suggestLocatorHandler(req, res, next) {
  try {
    const { step, page, failedSelector, locatorSuggestions, message } = req.body
    if (!step && !failedSelector) {
      return res.status(400).json({
        success: false,
        message: 'step or failedSelector is required',
      })
    }
    const result = await withAiQuota(req.user.id, () =>
      suggestLocator({
        step,
        page,
        failedSelector: failedSelector || step?.selector,
        locatorSuggestions,
        message,
      })
    )
    res.json({ success: true, ...result, quota: getAiQuotaStatus(req.user.id) })
  } catch (error) {
    next(error)
  }
}
