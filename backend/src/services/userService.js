import { prisma } from '../lib/prisma.js'
import { hashPassword } from '../utils/password.js'
import { validatePassword } from '../utils/passwordValidation.js'
import {
  validateRegistrationEmail,
  validateRegistrationName,
} from '../utils/registerValidation.js'
import { isPrimaryAdmin } from '../utils/roles.js'

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
}

const userDetailSelect = {
  ...userSelect,
  _count: {
    select: {
      scenarios: true,
      executions: true,
      testSchedules: true,
      testChains: true,
      apiTokens: true,
    },
  },
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

function resolveAssignableRole(email, requestedRole) {
  if (isPrimaryAdmin(email)) return 'ADMIN'
  if (!['ADMIN', 'USER'].includes(requestedRole)) {
    throw Object.assign(new Error('Invalid role'), { status: 400 })
  }
  return requestedRole
}

export async function listUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: 'asc' },
  })
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userDetailSelect,
  })

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 })
  }

  return user
}

export async function createUser({ email, name, password, role = 'USER' }) {
  const nameError = validateRegistrationName(name)
  if (nameError) {
    throw Object.assign(new Error(nameError), { status: 400 })
  }

  const emailError = validateRegistrationEmail(email)
  if (emailError) {
    throw Object.assign(new Error(emailError), { status: 400 })
  }

  if (!password) {
    throw Object.assign(new Error('Password is required'), { status: 400 })
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    throw Object.assign(new Error(passwordValidation.message), { status: 400 })
  }

  const normalizedEmail = normalizeEmail(email)
  const finalRole = resolveAssignableRole(normalizedEmail, role)

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  })

  if (existingUser) {
    throw Object.assign(new Error('User already exists'), { status: 409 })
  }

  const hashedPassword = await hashPassword(password)

  return prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name.trim(),
      password: hashedPassword,
      role: finalRole,
    },
    select: userSelect,
  })
}

export async function updateUser(actor, userId, payload) {
  const { name, email, role, password } = payload
  const actorId = actor?.id
  const actorEmail = actor?.email

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  })

  if (!target) {
    throw Object.assign(new Error('User not found'), { status: 404 })
  }

  const data = {}

  if (name !== undefined) {
    const nameError = validateRegistrationName(name)
    if (nameError) {
      throw Object.assign(new Error(nameError), { status: 400 })
    }
    data.name = name.trim()
  }

  if (email !== undefined) {
    const emailError = validateRegistrationEmail(email)
    if (emailError) {
      throw Object.assign(new Error(emailError), { status: 400 })
    }
    const normalizedEmail = normalizeEmail(email)
    if (normalizedEmail !== normalizeEmail(target.email)) {
      const duplicate = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      })
      if (duplicate) {
        throw Object.assign(new Error('Email is already in use'), { status: 409 })
      }
      data.email = normalizedEmail
    }
  }

  const nextEmail = data.email ?? target.email

  if (role !== undefined) {
    if (isPrimaryAdmin(target.email) && role !== 'ADMIN') {
      throw Object.assign(
        new Error('The primary admin account cannot be demoted'),
        { status: 403 }
      )
    }

    const nextRole = resolveAssignableRole(nextEmail, role)

    if (
      actorId === target.id &&
      target.role === 'ADMIN' &&
      nextRole !== 'ADMIN'
    ) {
      throw Object.assign(
        new Error('You cannot demote your own admin account'),
        { status: 403 }
      )
    }

    data.role = nextRole
  } else if (data.email && isPrimaryAdmin(data.email)) {
    data.role = 'ADMIN'
  }

  if (password !== undefined && password !== '') {
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      throw Object.assign(new Error(passwordValidation.message), { status: 400 })
    }
    data.password = await hashPassword(password)
  }

  if (Object.keys(data).length === 0) {
    return target
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: userSelect,
  })
}

export async function updateUserRole(actor, userId, role) {
  return updateUser(actor, userId, { role })
}

export async function deleteUser(actor, userId) {
  const actorId = actor?.id

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  })

  if (!target) {
    throw Object.assign(new Error('User not found'), { status: 404 })
  }

  if (isPrimaryAdmin(target.email)) {
    throw Object.assign(
      new Error('The primary admin account cannot be deleted'),
      { status: 403 }
    )
  }

  if (actorId === target.id) {
    throw Object.assign(new Error('You cannot delete your own account'), {
      status: 403,
    })
  }

  await prisma.user.delete({ where: { id: userId } })

  return { id: userId, email: target.email }
}
