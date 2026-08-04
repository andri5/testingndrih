import * as executionShareService from '../services/executionShareService.js'

function resolveAppBase(req) {
  const envBase = (process.env.FRONTEND_URL || process.env.APP_URL || '').trim()
  if (envBase) return envBase.replace(/\/$/, '')
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https'
  const host = req.get('x-forwarded-host') || req.get('host')
  return host ? `${proto}://${host}` : ''
}

export const executionShareController = {
  /** POST /api/executions/:executionId/share */
  async create(req, res) {
    try {
      const result = await executionShareService.createShare(
        req.user.id,
        req.params.executionId,
        { expiresInDays: req.body?.expiresInDays },
        resolveAppBase(req)
      )
      res.status(201).json({
        success: true,
        message: 'Share link created. Copy it now — the full token is shown only once.',
        ...result,
      })
    } catch (err) {
      res.status(err.status || 400).json({ success: false, message: err.message })
    }
  },

  /** GET /api/executions/:executionId/shares */
  async list(req, res) {
    try {
      const shares = await executionShareService.listShares(req.user.id, req.params.executionId)
      res.json({ success: true, shares })
    } catch (err) {
      res.status(err.status || 400).json({ success: false, message: err.message })
    }
  },

  /** DELETE /api/executions/:executionId/shares/:shareId */
  async revoke(req, res) {
    try {
      const share = await executionShareService.revokeShare(
        req.user.id,
        req.params.executionId,
        req.params.shareId
      )
      res.json({ success: true, share })
    } catch (err) {
      res.status(err.status || 400).json({ success: false, message: err.message })
    }
  },

  /** GET /api/public/shared-runs/:token */
  async publicGet(req, res) {
    try {
      const data = await executionShareService.resolvePublicShare(req.params.token)
      res.json({ success: true, ...data })
    } catch (err) {
      res.status(err.status || 400).json({ success: false, message: err.message })
    }
  },
}
