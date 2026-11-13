import * as issueService from '../services/issueService.js'
import * as issueAttachmentService from '../services/issueAttachmentService.js'

export async function listHandler(req, res, next) {
  try {
    const { status, source, limit = 50, offset = 0 } = req.query
    const data = await issueService.listIssues(req.user.id, {
      status,
      source,
      limit: parseInt(limit),
      offset: parseInt(offset),
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

export async function createHandler(req, res, next) {
  try {
    const issue = await issueService.createManualIssue(req.user.id, req.body || {})
    res.status(201).json({ success: true, issue })
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

export async function uploadAttachmentsHandler(req, res, next) {
  try {
    const files = req.files || []
    const attachments = await issueAttachmentService.addIssueAttachments(
      req.user.id,
      req.params.issueId,
      files
    )
    res.status(201).json({ success: true, attachments })
  } catch (error) {
    next(error)
  }
}

export async function deleteAttachmentHandler(req, res, next) {
  try {
    await issueAttachmentService.deleteIssueAttachment(
      req.user.id,
      req.params.issueId,
      req.params.attachmentId
    )
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
