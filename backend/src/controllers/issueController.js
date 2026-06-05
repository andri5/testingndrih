import * as issueService from '../services/issueService.js'

export async function listHandler(req, res, next) {
  try {
    const { status, limit = 50, offset = 0 } = req.query
    const data = await issueService.listIssues(req.user.id, {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
    res.json({ success: true, ...data })
  } catch (error) {
    next(error)
  }
}

export async function getHandler(req, res, next) {
  try {
    const issue = await issueService.getIssueById(req.user.id, req.params.issueId)
    res.json({ success: true, issue })
  } catch (error) {
    next(error)
  }
}

export async function updateHandler(req, res, next) {
  try {
    const issue = await issueService.updateIssue(req.user.id, req.params.issueId, req.body)
    res.json({ success: true, issue })
  } catch (error) {
    next(error)
  }
}
