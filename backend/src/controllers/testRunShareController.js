import * as testRunShareService from '../services/testRunShareService.js'

function resolveAppBase(req) {
  const envBase = (process.env.FRONTEND_URL || process.env.APP_URL || '').trim()
  if (envBase) return envBase.replace(/\/$/, '')
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https'
  const host = req.get('x-forwarded-host') || req.get('host')
  return host ? `${proto}://${host}` : ''
}

export const testRunShareController = {
  /** POST /api/test-runs/:id/share */
  async create(req, res) {
    try {
      const result = await testRunShareService.createTestRunShare(
        req.user.id,
        req.params.id,
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

  /** GET /api/test-runs/:id/shares */
  async list(req, res) {
    try {
      const shares = await testRunShareService.listTestRunShares(req.user.id, req.params.id)
      res.json({ success: true, shares })
    } catch (err) {
      res.status(err.status || 400).json({ success: false, message: err.message })
    }
  },

  /** DELETE /api/test-runs/:id/shares/:shareId */
  async revoke(req, res) {
    try {
      const share = await testRunShareService.revokeTestRunShare(
        req.user.id,
        req.params.id,
        req.params.shareId
      )
      res.json({ success: true, share })
    } catch (err) {
      res.status(err.status || 400).json({ success: false, message: err.message })
    }
  },

  /** GET /api/public/shared-test-runs/:token */
  async publicGet(req, res) {
    try {
      const data = await testRunShareService.resolvePublicTestRunShare(req.params.token)
      res.json({ success: true, ...data })
    } catch (err) {
      res.status(err.status || 400).json({ success: false, message: err.message })
    }
  },
}
