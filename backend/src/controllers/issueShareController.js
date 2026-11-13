import * as issueShareService from '../services/issueShareService.js'

function resolveAppBase(req) {
  const envBase = (process.env.FRONTEND_URL || process.env.APP_URL || '').trim()
  if (envBase) return envBase.replace(/\/$/, '')
  const proto = req.get('x-forwarded-proto') || req.protocol || 'https'
  const host = req.get('x-forwarded-host') || req.get('host')
  return host ? `${proto}://${host}` : ''
}

export const issueShareController = {
  /** POST /api/issues/:issueId/share */
  async create(req, res) {
    try {
      const result = await issueShareService.createIssueShare(
        req.user.id,
        req.params.issueId,
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

  /** GET /api/issues/:issueId/shares */
  async list(req, res) {
    try {
      const shares = await issueShareService.listIssueShares(req.user.id, req.params.issueId)
      res.json({ success: true, shares })
    } catch (err) {
      res.status(err.status || 400).json({ success: false, message: err.message })
    }
  },

  /** DELETE /api/issues/:issueId/shares/:shareId */
  async revoke(req, res) {
    try {
      const share = await issueShareService.revokeIssueShare(
        req.user.id,
        req.params.issueId,
        req.params.shareId
      )
      res.json({ success: true, share })
    } catch (err) {
      res.status(err.status || 400).json({ success: false, message: err.message })
    }
  },

  /** GET /api/public/shared-bugs/:token */
  async publicGet(req, res) {
    try {
      const data = await issueShareService.resolvePublicIssueShare(req.params.token)
      res.json({ success: true, ...data })
    } catch (err) {
      res.status(err.status || 400).json({ success: false, message: err.message })
    }
  },
}
