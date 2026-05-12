import * as securityTestService from '../services/securityTestService.js'
import { prisma } from '../lib/prisma.js'

/**
 * POST /api/security/scan
 * Start a security scan for a scenario
 */
export async function startSecurityScan(req, res) {
  try {
    const { scenarioId, scanType = 'full', vulnTypes = [] } = req.body
    const userId = req.user.id

    if (!scenarioId) {
      return res.status(400).json({ 
        success: false, 
        message: 'scenarioId is required' 
      })
    }

    const scan = await securityTestService.runSecurityScan(scenarioId, userId, {
      scanType,
      vulnTypes
    })

    res.json({
      success: true,
      data: scan,
      message: 'Security scan started'
    })
  } catch (error) {
    console.error('[SECURITY SCAN] Error:', error)
    res.status(error.message.includes('Unauthorized') ? 403 : 400).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * GET /api/security/scans
 * Get all security scans for the user
 */
export async function listSecurityScans(req, res) {
  try {
    const userId = req.user.id
    const { skip = 0, take = 10 } = req.query

    const scans = await prisma.securityScan.findMany({
      where: { userId },
      skip: parseInt(skip),
      take: parseInt(take),
      orderBy: { createdAt: 'desc' },
      include: {
        scenario: {
          select: { name: true, url: true }
        },
        _count: {
          select: { findings: true }
        }
      }
    })

    const total = await prisma.securityScan.count({
      where: { userId }
    })

    res.json({
      success: true,
      data: scans,
      pagination: {
        skip: parseInt(skip),
        take: parseInt(take),
        total,
        hasMore: parseInt(skip) + parseInt(take) < total
      }
    })
  } catch (error) {
    console.error('[SECURITY SCANS] Error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * GET /api/security/scans/:scanId
 * Get detailed security scan with findings summary
 */
export async function getSecurityScan(req, res) {
  try {
    const { scanId } = req.params
    const userId = req.user.id

    const scan = await securityTestService.getSecurityScan(scanId, userId)

    res.json({
      success: true,
      data: scan
    })
  } catch (error) {
    console.error('[SECURITY SCAN DETAIL] Error:', error)
    res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * GET /api/security/scans/:scanId/findings
 * Get detailed findings for a scan with filters
 */
export async function getFindings(req, res) {
  try {
    const { scanId } = req.params
    const { severity, type } = req.query
    const userId = req.user.id

    const findings = await securityTestService.getSecurityFindings(scanId, userId, {
      severity,
      type
    })

    res.json({
      success: true,
      data: findings,
      count: findings.length
    })
  } catch (error) {
    console.error('[SECURITY FINDINGS] Error:', error)
    res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * POST /api/security/mark/:scenarioId
 * Mark scenario as security test
 */
export async function markAsSecurityTest(req, res) {
  try {
    const { scenarioId } = req.params
    const userId = req.user.id

    const scenario = await securityTestService.markAsSecurityTest(scenarioId, userId)

    res.json({
      success: true,
      data: scenario,
      message: 'Scenario marked for security testing'
    })
  } catch (error) {
    console.error('[MARK SECURITY] Error:', error)
    res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * DELETE /api/security/mark/:scenarioId
 * Unmark scenario from security test
 */
export async function unmarkAsSecurityTest(req, res) {
  try {
    const { scenarioId } = req.params
    const userId = req.user.id

    const scenario = await securityTestService.unmarkAsSecurityTest(scenarioId, userId)

    res.json({
      success: true,
      data: scenario,
      message: 'Security testing marker removed'
    })
  } catch (error) {
    console.error('[UNMARK SECURITY] Error:', error)
    res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * GET /api/security/scenarios
 * Get all scenarios marked for security testing
 */
export async function getSecurityScenarios(req, res) {
  try {
    const userId = req.user.id

    const scenarios = await securityTestService.getSecurityScenarios(userId)

    res.json({
      success: true,
      data: scenarios,
      count: scenarios.length
    })
  } catch (error) {
    console.error('[SECURITY SCENARIOS] Error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * GET /api/security/history/:scenarioId
 * Get security scan history for a scenario
 */
export async function getHistory(req, res) {
  try {
    const { scenarioId } = req.params
    const { limit = 10 } = req.query
    const userId = req.user.id

    const history = await securityTestService.getSecurityHistory(
      scenarioId,
      userId,
      parseInt(limit)
    )

    res.json({
      success: true,
      data: history,
      count: history.length
    })
  } catch (error) {
    console.error('[SECURITY HISTORY] Error:', error)
    res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * GET /api/security/summary
 * Get overall security testing summary
 */
export async function getSummary(req, res) {
  try {
    const userId = req.user.id

    const summary = await securityTestService.getSecuritySummary(userId)

    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('[SECURITY SUMMARY] Error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

/**
 * POST /api/security/findings/:findingId/status
 * Update finding status
 */
export async function updateFindingStatus(req, res) {
  try {
    const { findingId } = req.params
    const { status, notes = '' } = req.body
    const userId = req.user.id

    const validStatuses = ['NEW', 'ACKNOWLEDGED', 'FIXED', 'FALSE_POSITIVE']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      })
    }

    const finding = await securityTestService.updateFindingStatus(
      findingId,
      userId,
      status,
      notes
    )

    res.json({
      success: true,
      data: finding,
      message: 'Finding status updated'
    })
  } catch (error) {
    console.error('[UPDATE FINDING] Error:', error)
    res.status(error.message.includes('Unauthorized') ? 403 : 404).json({
      success: false,
      message: error.message
    })
  }
}
