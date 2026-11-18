/**
 * Point primary admin to KEEP_EMAIL, ensure ADMIN role, delete REMOVE_EMAIL.
 * Usage:
 *   KEEP_EMAIL=faizalandri04@gmail.com REMOVE_EMAIL=admin@testingndrih.local node scripts/transfer-primary-admin.js
 */
import { prisma } from '../src/lib/prisma.js'

const KEEP = (process.env.KEEP_EMAIL || 'faizalandri04@gmail.com').trim().toLowerCase()
const REMOVE = (process.env.REMOVE_EMAIL || 'admin@testingndrih.local').trim().toLowerCase()

async function main() {
  if (KEEP === REMOVE) {
    throw new Error('KEEP_EMAIL and REMOVE_EMAIL must differ')
  }

  const keepUser = await prisma.user.findFirst({
    where: { email: { equals: KEEP, mode: 'insensitive' } },
  })
  if (!keepUser) {
    throw new Error(`Keep user not found: ${KEEP}`)
  }

  const updated = await prisma.user.update({
    where: { id: keepUser.id },
    data: {
      role: 'ADMIN',
      isActive: true,
      menuPermissions: [],
    },
    select: { id: true, email: true, role: true, isActive: true },
  })
  console.log('Primary admin ready:', updated)

  const removeUser = await prisma.user.findFirst({
    where: { email: { equals: REMOVE, mode: 'insensitive' } },
  })
  if (!removeUser) {
    console.log(`Nothing to delete (not found): ${REMOVE}`)
  } else {
    await prisma.user.delete({ where: { id: removeUser.id } })
    console.log('Deleted:', removeUser.email)
  }

  const remaining = await prisma.user.findMany({
    select: { email: true, role: true, isActive: true },
    orderBy: { email: 'asc' },
  })
  console.log('Users now:', remaining)
}

main()
  .catch((err) => {
    console.error(err.message || err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
