import { prisma } from '../lib/prisma.js'

const QASE_API_BASE = 'https://api.qase.io/v1'

/**
 * Qase.io Integration Service
 * Handles synchronization with Qase.io test management platform
 */

export const qaseService = {
  /**
   * Store Qase API credentials
   */
  async saveQaseCredentials(userId, apiKey, projectCode) {
    if (!apiKey || !projectCode) {
      throw new Error('API key and project code are required')
    }

    // Verify credentials by testing API connection
    try {
      const response = await fetch(
        `${QASE_API_BASE}/project/${projectCode}`,
        {
          headers: { 'Token': apiKey }
        }
      )

      if (!response.ok) {
        throw new Error(`Invalid credentials: ${response.statusText}`)
      }
    } catch (error) {
      throw new Error(`Failed to verify Qase credentials: ${error.message}`)
    }

    // Delete existing integration if any
    await prisma.qaseIntegration.deleteMany({ where: { userId } })

    // Store new credentials
    const integration = await prisma.qaseIntegration.create({
      data: {
        userId,
        apiKey,
        projectCode,
        isConnected: true,
        lastSyncedAt: new Date()
      }
    })

    return { message: 'Credentials saved', projectCode: integration.projectCode }
  },

  /**
   * Get stored Qase integration
   */
  async getQaseIntegration(userId) {
    const integration = await prisma.qaseIntegration.findUnique({
      where: { userId }
    })

    if (!integration) {
      return null
    }

    // Don't return full API key
    return {
      projectCode: integration.projectCode,
      isConnected: integration.isConnected,
      lastSyncedAt: integration.lastSyncedAt
    }
  },

  /**
   * Sync test cases from Qase
   */
  async syncCasesFromQase(userId) {
    const integration = await prisma.qaseIntegration.findUnique({
      where: { userId }
    })

    if (!integration) {
      throw new Error('Qase integration not configured')
    }

    try {
      // Fetch cases from Qase API
      const response = await fetch(
        `${QASE_API_BASE}/case/${integration.projectCode}`,
        {
          headers: { 'Token': integration.apiKey }
        }
      )

      if (!response.ok) {
        throw new Error(`Qase API error: ${response.statusText}`)
      }

      const data = await response.json()
      const cases = data.result?.entities || []

      // Store synced cases
      const syncedCases = []
      for (const testCase of cases) {
        const qaseCase = await prisma.qaseTestCase.upsert({
          where: {
            qaseId_userId: {
              qaseId: testCase.id,
              userId
            }
          },
          update: {
            caseTitle: testCase.title,
            caseDescription: testCase.description,
            qaseStatus: testCase.status,
            tags: JSON.stringify(testCase.tags || [])
          },
          create: {
            userId,
            qaseId: testCase.id,
            caseTitle: testCase.title,
            caseDescription: testCase.description,
            qaseStatus: testCase.status,
            tags: JSON.stringify(testCase.tags || [])
          }
        })
        syncedCases.push(qaseCase)
      }

      // Update sync time
      await prisma.qaseIntegration.update({
        where: { userId },
        data: { lastSyncedAt: new Date() }
      })

      return {
        message: 'Synced from Qase',
        caseCount: syncedCases.length,
        cases: syncedCases
      }
    } catch (error) {
      throw new Error(`Sync failed: ${error.message}`)
    }
  },

  /**
   * Get synced test cases
   */
  async getSyncedCases(userId) {
    const cases = await prisma.qaseTestCase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return cases.map(c => ({
      ...c,
      tags: JSON.parse(c.tags || '[]')
    }))
  },

  /**
   * Push execution result to Qase
   */
  async pushExecutionToQase(userId, executionId) {
    const integration = await prisma.qaseIntegration.findUnique({
      where: { userId }
    })

    if (!integration) {
      throw new Error('Qase integration not configured')
    }

    // Get execution details
    const execution = await prisma.execution.findFirst({
      where: { id: executionId, userId },
      include: {
        scenario: true,
        stepResults: { include: { testStep: true } }
      }
    })

    if (!execution) {
      throw new Error('Execution not found')
    }

    try {
      // Prepare result payload
      const resultPayload = {
        case_id: execution.scenarioId, // Map scenario to Qase case ID
        status: execution.status === 'PASSED' ? 'passed' : 'failed',
        time_ms: execution.duration || 0,
        comment: `Execution ID: ${execution.id}\nDuration: ${execution.duration}ms\nPassed: ${execution.passedSteps}/${execution.totalSteps}`,
        steps: execution.stepResults.map(sr => ({
          position: sr.testStep.stepNumber,
          status: sr.status === 'PASSED' ? 'passed' : 'failed',
          comment: sr.errorMessage || `Step: ${sr.testStep.description}`
        }))
      }

      // Post result to Qase API
      const response = await fetch(
        `${QASE_API_BASE}/result/${integration.projectCode}`,
        {
          method: 'POST',
          headers: {
            'Token': integration.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(resultPayload)
        }
      )

      if (!response.ok) {
        throw new Error(`Qase API error: ${response.statusText}`)
      }

      return { message: 'Result pushed to Qase' }
    } catch (error) {
      throw new Error(`Failed to push result: ${error.message}`)
    }
  },

  /**
   * Push all executions to Qase
   */
  async pushAllExecutionsToQase(userId, scenarioId = null) {
    const where = { userId }
    if (scenarioId) {
      where.scenarioId = scenarioId
    }

    const executions = await prisma.execution.findMany({
      where: {
        ...where,
        status: { in: ['PASSED', 'FAILED'] }
      },
      select: { id: true }
    })

    const results = []
    for (const execution of executions) {
      try {
        const result = await this.pushExecutionToQase(userId, execution.id)
        results.push({ executionId: execution.id, success: true, ...result })
      } catch (error) {
        results.push({ executionId: execution.id, success: false, error: error.message })
      }
    }

    return {
      message: 'Bulk push completed',
      total: executions.length,
      results
    }
  },

  /**
   * Create scenario from Qase test case
   */
  async createScenarioFromQaseCase(userId, qaseCaseId) {
    const qaseCase = await prisma.qaseTestCase.findFirst({
      where: { qaseId: qaseCaseId, userId }
    })

    if (!qaseCase) {
      throw new Error('Qase test case not found')
    }

    // Create scenario from Qase case
    const scenario = await prisma.scenario.create({
      data: {
        userId,
        name: qaseCase.caseTitle,
        description: qaseCase.caseDescription,
        url: 'https://example.com', // Default, can be updated
        steps: 0
      }
    })

    // Link Qase case to scenario
    await prisma.qaseTestCase.update({
      where: { id: qaseCase.id },
      data: { scenarioId: scenario.id }
    })

    return scenario
  },

  /**
   * Get Qase API project details
   */
  async getQaseProjectDetails(userId) {
    const integration = await prisma.qaseIntegration.findUnique({
      where: { userId }
    })

    if (!integration) {
      throw new Error('Qase integration not configured')
    }

    try {
      const response = await fetch(
        `${QASE_API_BASE}/project/${integration.projectCode}`,
        {
          headers: { 'Token': integration.apiKey }
        }
      )

      if (!response.ok) {
        throw new Error(`Qase API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.result || {}
    } catch (error) {
      throw new Error(`Failed to fetch project details: ${error.message}`)
    }
  },

  /**
   * Disconnect Qase integration
   */
  async disconnectQase(userId) {
    await prisma.qaseIntegration.delete({
      where: { userId }
    })

    return { message: 'Qase integration disconnected' }
  }
}
