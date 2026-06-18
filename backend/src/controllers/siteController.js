import * as siteService from '../services/siteService.js'

const VISITOR_COOKIE = 'tsn_vid'
const COOKIE_MAX_AGE_SEC = 365 * 24 * 60 * 60

function handleServiceError(error, res, next) {
  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message })
  }
  return next(error)
}

function readVisitorCookie(req) {
  const header = req.headers.cookie
  if (!header) return null
  const match = header
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${VISITOR_COOKIE}=`))
  if (!match) return null
  return decodeURIComponent(match.slice(VISITOR_COOKIE.length + 1))
}

function setVisitorCookie(res, visitorId) {
  const isProd = process.env.NODE_ENV === 'production'
  const parts = [
    `${VISITOR_COOKIE}=${encodeURIComponent(visitorId)}`,
    'Path=/',
    `Max-Age=${COOKIE_MAX_AGE_SEC}`,
    'SameSite=Lax',
    'HttpOnly',
  ]
  if (isProd) parts.push('Secure')
  res.setHeader('Set-Cookie', parts.join('; '))
}

export async function trackPageView(req, res, next) {
  try {
    const { path, lang } = req.body || {}
    let visitorId = readVisitorCookie(req)
    let isNewVisitor = false

    if (!visitorId) {
      visitorId = siteService.createVisitorId()
      isNewVisitor = true
    }

    await siteService.trackPageView({
      path,
      lang,
      visitorId,
      userAgent: req.get('user-agent'),
      referer: req.get('referer'),
    })

    if (isNewVisitor) {
      setVisitorCookie(res, visitorId)
    }

    res.json({ success: true })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}

export async function submitFeedback(req, res, next) {
  try {
    const { name, email, message, page, lang } = req.body || {}
    const result = await siteService.submitLandingFeedback({
      name,
      email,
      message,
      page,
      lang,
    })
    res.status(201).json({ success: true, feedback: result })
  } catch (error) {
    return handleServiceError(error, res, next)
  }
}

export async function listFeedback(req, res, next) {
  try {
    const limit = req.query.limit
    const skip = req.query.skip
    const result = await siteService.listLandingFeedback({ limit, skip })
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
}

export async function getAnalytics(req, res, next) {
  try {
    const days = req.query.days
    const analytics = await siteService.getSiteAnalytics({ days })
    res.json({ success: true, analytics })
  } catch (error) {
    next(error)
  }
}
