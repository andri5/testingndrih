import { prisma } from '../lib/prisma.js'
import { encryptSecret, decryptSecret } from '../utils/secretCrypto.js'

const MASKED = '••••••••'
const KEY_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/

function maskVariable(v) {
  return {
    id: v.id,
    key: v.key,
    isSecret: v.isSecret,
    value: v.isSecret ? MASKED : v.value,
    hasValue: Boolean(v.value),
    createdAt: v.createdAt,
    updatedAt: v.updatedAt
  }
}

async function assertEnvironmentOwner(environmentId, userId) {
  const env = await prisma.testEnvironment.findFirst({
    where: { id: environmentId, userId }
  })
  if (!env) {
    throw Object.assign(new Error('Environment not found'), { status: 404 })
  }
  return env
}

export async function listEnvironments(userId) {
  const envs = await prisma.testEnvironment.findMany({
    where: { userId },
    include: {
      variables: { orderBy: { key: 'asc' } },
      _count: { select: { variables: true } }
    },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
  })

  if (envs.length === 0) {
    const created = await seedDefaultEnvironments(userId)
    return created
  }

  return envs.map((env) => ({
    id: env.id,
    name: env.name,
    description: env.description,
    baseUrl: env.baseUrl,
    isDefault: env.isDefault,
    variableCount: env._count.variables,
    variables: env.variables.map(maskVariable),
    createdAt: env.createdAt,
    updatedAt: env.updatedAt
  }))
}

export async function seedDefaultEnvironments(userId) {
  const presets = [
    {
      name: 'Development',
      description: 'Local / dev environment',
      baseUrl: 'http://localhost:3000',
      isDefault: true,
      variables: [
        { key: 'baseUrl', value: 'http://localhost:3000', isSecret: false },
        { key: 'username', value: 'test@example.com', isSecret: false },
        { key: 'password', value: 'changeme123', isSecret: true }
      ]
    },
    {
      name: 'Staging',
      description: 'Staging / pre-production',
      baseUrl: 'https://staging.example.com',
      isDefault: false,
      variables: [
        { key: 'baseUrl', value: 'https://staging.example.com', isSecret: false }
      ]
    },
    {
      name: 'Production',
      description: 'Production environment',
      baseUrl: 'https://example.com',
      isDefault: false,
      variables: [
        { key: 'baseUrl', value: 'https://example.com', isSecret: false }
      ]
    }
  ]

  const created = []
  for (const preset of presets) {
    const env = await prisma.testEnvironment.create({
      data: {
        userId,
        name: preset.name,
        description: preset.description,
        baseUrl: preset.baseUrl,
        isDefault: preset.isDefault,
        variables: {
          create: preset.variables.map((v) => ({
            key: v.key,
            value: v.isSecret ? encryptSecret(v.value) : v.value,
            isSecret: v.isSecret
          }))
        }
      },
      include: { variables: true, _count: { select: { variables: true } } }
    })
    created.push({
      id: env.id,
      name: env.name,
      description: env.description,
      baseUrl: env.baseUrl,
      isDefault: env.isDefault,
      variableCount: env._count.variables,
      variables: env.variables.map(maskVariable),
      createdAt: env.createdAt,
      updatedAt: env.updatedAt
    })
  }
  return created
}

export async function createEnvironment(userId, data) {
  const { name, description, baseUrl, isDefault } = data
  if (!name?.trim()) {
    throw Object.assign(new Error('Environment name is required'), { status: 400 })
  }

  if (isDefault) {
    await prisma.testEnvironment.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    })
  }

  const env = await prisma.testEnvironment.create({
    data: {
      userId,
      name: name.trim(),
      description: description?.trim() || null,
      baseUrl: baseUrl?.trim() || null,
      isDefault: !!isDefault
    },
    include: { variables: true, _count: { select: { variables: true } } }
  })

  return {
    id: env.id,
    name: env.name,
    description: env.description,
    baseUrl: env.baseUrl,
    isDefault: env.isDefault,
    variableCount: env._count.variables,
    variables: env.variables.map(maskVariable),
    createdAt: env.createdAt,
    updatedAt: env.updatedAt
  }
}

export async function updateEnvironment(userId, environmentId, data) {
  await assertEnvironmentOwner(environmentId, userId)

  if (data.isDefault) {
    await prisma.testEnvironment.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    })
  }

  const updateData = {}
  if (data.name !== undefined) updateData.name = data.name.trim()
  if (data.description !== undefined) updateData.description = data.description?.trim() || null
  if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl?.trim() || null
  if (data.isDefault !== undefined) updateData.isDefault = !!data.isDefault

  const env = await prisma.testEnvironment.update({
    where: { id: environmentId },
    data: updateData,
    include: { variables: true, _count: { select: { variables: true } } }
  })

  return {
    id: env.id,
    name: env.name,
    description: env.description,
    baseUrl: env.baseUrl,
    isDefault: env.isDefault,
    variableCount: env._count.variables,
    variables: env.variables.map(maskVariable),
    createdAt: env.createdAt,
    updatedAt: env.updatedAt
  }
}

export async function deleteEnvironment(userId, environmentId) {
  const env = await assertEnvironmentOwner(environmentId, userId)
  await prisma.testEnvironment.delete({ where: { id: environmentId } })

  if (env.isDefault) {
    const next = await prisma.testEnvironment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    })
    if (next) {
      await prisma.testEnvironment.update({
        where: { id: next.id },
        data: { isDefault: true }
      })
    }
  }

  return { success: true }
}

export async function listVariables(userId, environmentId) {
  await assertEnvironmentOwner(environmentId, userId)
  const variables = await prisma.environmentVariable.findMany({
    where: { environmentId },
    orderBy: { key: 'asc' }
  })
  return variables.map(maskVariable)
}

export async function upsertVariable(userId, environmentId, data) {
  await assertEnvironmentOwner(environmentId, userId)
  const { key, value, isSecret } = data

  if (!key?.trim() || !KEY_REGEX.test(key.trim())) {
    throw Object.assign(
      new Error('Variable key must start with a letter and contain only letters, numbers, underscore'),
      { status: 400 }
    )
  }

  const normalizedKey = key.trim()
  const existing = await prisma.environmentVariable.findUnique({
    where: { environmentId_key: { environmentId, key: normalizedKey } }
  })

  let storedValue = value
  if (isSecret || existing?.isSecret) {
    if (!value || value === MASKED) {
      if (existing) return maskVariable(existing)
      throw Object.assign(new Error('Secret value is required'), { status: 400 })
    }
    storedValue = encryptSecret(value)
  }

  const variable = existing
    ? await prisma.environmentVariable.update({
        where: { id: existing.id },
        data: {
          value: storedValue,
          ...(isSecret !== undefined && { isSecret: !!isSecret })
        }
      })
    : await prisma.environmentVariable.create({
        data: {
          environmentId,
          key: normalizedKey,
          value: storedValue,
          isSecret: !!isSecret
        }
      })

  return maskVariable(variable)
}

export async function deleteVariable(userId, environmentId, variableId) {
  await assertEnvironmentOwner(environmentId, userId)
  const variable = await prisma.environmentVariable.findFirst({
    where: { id: variableId, environmentId }
  })
  if (!variable) {
    throw Object.assign(new Error('Variable not found'), { status: 404 })
  }
  await prisma.environmentVariable.delete({ where: { id: variableId } })
  return { success: true }
}

/**
 * Resolve all variables for execution (decrypted). Includes baseUrl from env if set.
 */
export async function getResolvedVariables(userId, environmentId) {
  const env = await prisma.testEnvironment.findFirst({
    where: { id: environmentId, userId },
    include: { variables: true }
  })
  if (!env) {
    throw Object.assign(new Error('Environment not found'), { status: 404 })
  }
  return buildVariableMap(env)
}

export async function getDefaultVariables(userId) {
  let env = await prisma.testEnvironment.findFirst({
    where: { userId, isDefault: true },
    include: { variables: true }
  })
  if (!env) {
    env = await prisma.testEnvironment.findFirst({
      where: { userId },
      include: { variables: true },
      orderBy: { createdAt: 'asc' }
    })
  }
  if (!env) return {}
  return buildVariableMap(env)
}

function buildVariableMap(env) {
  const map = {}
  if (env.baseUrl) {
    map.baseUrl = env.baseUrl
  }
  for (const v of env.variables) {
    map[v.key] = v.isSecret ? decryptSecret(v.value) : v.value
  }
  if (!map.baseUrl && map.base_url) {
    map.baseUrl = map.base_url
  }
  return map
}
