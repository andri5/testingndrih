import { prisma } from '../lib/prisma.js'
import { getResolvedVariables, getDefaultVariables } from './environmentService.js'
import { substituteVariables } from '../utils/variableSubstitution.js'

async function assertScenarioOwner(scenarioId, userId) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: { userId: true }
  })
  if (!scenario || scenario.userId !== userId) {
    throw Object.assign(new Error('Scenario not found'), { status: 404 })
  }
  return scenario
}

export async function listApiTests(userId, scenarioId) {
  await assertScenarioOwner(scenarioId, userId)
  return prisma.apiTest.findMany({
    where: { scenarioId },
    orderBy: { createdAt: 'desc' },
    include: {
      results: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  })
}

export async function createApiTest(userId, scenarioId, data) {
  await assertScenarioOwner(scenarioId, userId)
  const { name, description, method, url, headers, body, expectedCode } = data
  if (!name || !method || !url) {
    throw Object.assign(new Error('name, method, and url are required'), { status: 400 })
  }
  return prisma.apiTest.create({
    data: {
      name,
      description: description || null,
      method,
      url,
      headers: headers ? JSON.stringify(headers) : null,
      body: body ? JSON.stringify(body) : null,
      expectedCode: expectedCode ?? 200,
      scenarioId
    }
  })
}

export async function updateApiTest(userId, apiTestId, data) {
  const existing = await prisma.apiTest.findUnique({
    where: { id: apiTestId },
    include: { scenario: { select: { userId: true } } }
  })
  if (!existing || existing.scenario.userId !== userId) {
    throw Object.assign(new Error('API test not found'), { status: 404 })
  }
  const updateData = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.method !== undefined) updateData.method = data.method
  if (data.url !== undefined) updateData.url = data.url
  if (data.expectedCode !== undefined) updateData.expectedCode = data.expectedCode
  if (data.headers !== undefined) updateData.headers = data.headers ? JSON.stringify(data.headers) : null
  if (data.body !== undefined) updateData.body = data.body ? JSON.stringify(data.body) : null
  return prisma.apiTest.update({ where: { id: apiTestId }, data: updateData })
}

export async function deleteApiTest(userId, apiTestId) {
  const existing = await prisma.apiTest.findUnique({
    where: { id: apiTestId },
    include: { scenario: { select: { userId: true } } }
  })
  if (!existing || existing.scenario.userId !== userId) {
    throw Object.assign(new Error('API test not found'), { status: 404 })
  }
  await prisma.apiTest.delete({ where: { id: apiTestId } })
  return { success: true }
}

export async function runApiTest(userId, apiTestId, options = {}) {
  const apiTest = await prisma.apiTest.findUnique({
    where: { id: apiTestId },
    include: { scenario: { select: { userId: true, name: true } } }
  })
  if (!apiTest || apiTest.scenario.userId !== userId) {
    throw Object.assign(new Error('API test not found'), { status: 404 })
  }

  let envVariables = {}
  try {
    if (options.environmentId) {
      envVariables = await getResolvedVariables(userId, options.environmentId)
    } else {
      envVariables = await getDefaultVariables(userId)
    }
  } catch {
    envVariables = {}
  }

  const resolvedUrl = substituteVariables(apiTest.url, envVariables)
  const start = Date.now()
  let headers = {}
  let body = undefined
  try {
    if (apiTest.headers) {
      const parsed = JSON.parse(apiTest.headers)
      headers = Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [k, substituteVariables(String(v), envVariables)])
      )
    }
  } catch {
    headers = {}
  }
  try {
    if (apiTest.body) body = substituteVariables(apiTest.body, envVariables)
  } catch {
    body = substituteVariables(apiTest.body, envVariables)
  }

  const fetchOptions = {
    method: apiTest.method,
    headers: { 'Content-Type': 'application/json', ...headers },
    signal: AbortSignal.timeout(30000)
  }
  if (body && !['GET', 'HEAD'].includes(apiTest.method)) {
    fetchOptions.body = body
  }

  let status = 0
  let responseText = ''
  let errorMessage = null
  let passed = false

  try {
    const res = await fetch(resolvedUrl, fetchOptions)
    status = res.status
    responseText = (await res.text()).slice(0, 5000)
    passed = status === apiTest.expectedCode
  } catch (err) {
    errorMessage = err.message
    passed = false
  }

  const responseTime = Date.now() - start

  const result = await prisma.apiTestResult.create({
    data: {
      apiTestId: apiTest.id,
      status: status || 0,
      responseTime,
      response: responseText || null,
      passed,
      errorMessage
    }
  })

  return {
    apiTest: {
      id: apiTest.id,
      name: apiTest.name,
      scenarioName: apiTest.scenario.name
    },
    result
  }
}

export async function getApiTestResults(userId, apiTestId, limit = 20) {
  const apiTest = await prisma.apiTest.findUnique({
    where: { id: apiTestId },
    include: { scenario: { select: { userId: true } } }
  })
  if (!apiTest || apiTest.scenario.userId !== userId) {
    throw Object.assign(new Error('API test not found'), { status: 404 })
  }
  return prisma.apiTestResult.findMany({
    where: { apiTestId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}
