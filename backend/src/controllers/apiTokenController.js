import * as apiTokenService from '../services/apiTokenService.js'

export async function listHandler(req, res, next) {
  try {
    const tokens = await apiTokenService.listApiTokens(req.user.id)
    res.json({ success: true, tokens })
  } catch (error) {
    next(error)
  }
}

export async function createHandler(req, res, next) {
  try {
    const { name, expiresInDays } = req.body
    if (!name) {
      return res.status(400).json({ success: false, message: 'Token name is required' })
    }
    const result = await apiTokenService.createApiToken(req.user.id, name, expiresInDays)
    res.status(201).json({
      success: true,
      token: result.token,
      apiToken: {
        id: result.id,
        name: result.name,
        prefix: result.prefix,
        expiresAt: result.expiresAt,
        createdAt: result.createdAt
      },
      message: 'Copy this token now — it will not be shown again.'
    })
  } catch (error) {
    next(error)
  }
}

export async function revokeHandler(req, res, next) {
  try {
    await apiTokenService.revokeApiToken(req.user.id, req.params.tokenId)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
