import { prisma } from '../lib/prisma.js'
import { isPrimaryAdmin } from '../utils/roles.js'

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
}

export async function listUsers() {
  return prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: 'asc' },
  })
}

export async function updateUserRole(actorEmail, userId, role) {
  if (!['ADMIN', 'USER'].includes(role)) {
    throw Object.assign(new Error('Invalid role'), { status: 400 })
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  })

  if (!target) {
    throw Object.assign(new Error('User not found'), { status: 404 })
  }

  if (isPrimaryAdmin(target.email) && role !== 'ADMIN') {
    throw Object.assign(
      new Error('The primary admin account cannot be demoted'),
      { status: 403 }
    )
  }

  if (normalizeActor(actorEmail) === normalizeActor(target.email) && role !== 'ADMIN') {
    throw Object.assign(
      new Error('You cannot demote your own admin account'),
      { status: 403 }
    )
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: userSelect,
  })
}

function normalizeActor(email) {
  return (email || '').trim().toLowerCase()
}
