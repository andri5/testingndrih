/**
 * Remove automated test users and their data from the dev database.
 * Preserves real accounts (non-test email domains) and the primary admin.
 *
 * Usage:
 *   node scripts/cleanup-test-data.js           # dry-run (preview only)
 *   node scripts/cleanup-test-data.js --apply   # delete test data
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PRIMARY_ADMIN_EMAIL } from '../src/utils/roles.js'

const prisma = new PrismaClient()
const apply = process.argv.includes('--apply')

const TEST_EMAIL_SUFFIXES = ['@testingndrih.local', '@test.local']

function isTestEmail(email) {
  const lower = (email || '').toLowerCase()
  return TEST_EMAIL_SUFFIXES.some((suffix) => lower.endsWith(suffix))
}

async function main() {
  const testUsers = await prisma.user.findMany({
    where: {
      OR: TEST_EMAIL_SUFFIXES.map((suffix) => ({
        email: { endsWith: suffix },
      })),
    },
    select: { id: true, email: true, role: true },
  })

  const protectedUsers = testUsers.filter(
    (u) => u.email.toLowerCase() === PRIMARY_ADMIN_EMAIL
  )
  const toDelete = testUsers.filter(
    (u) => u.email.toLowerCase() !== PRIMARY_ADMIN_EMAIL
  )

  const counts = {
    users: toDelete.length,
    scenarios: await prisma.scenario.count({
      where: { userId: { in: toDelete.map((u) => u.id) } },
    }),
    schedules: await prisma.testSchedule.count({
      where: { userId: { in: toDelete.map((u) => u.id) } },
    }),
    executions: await prisma.execution.count({
      where: { userId: { in: toDelete.map((u) => u.id) } },
    }),
  }

  console.log(apply ? '🧹 Applying test data cleanup...' : '🔍 Dry-run — no data deleted')
  console.log(`   Primary admin preserved: ${PRIMARY_ADMIN_EMAIL}`)
  if (protectedUsers.length) {
    console.log(`   Skipped (protected): ${protectedUsers.map((u) => u.email).join(', ')}`)
  }
  console.log(`   Test users to remove: ${counts.users}`)
  console.log(`   Related scenarios:    ${counts.scenarios}`)
  console.log(`   Related schedules:    ${counts.schedules}`)
  console.log(`   Related executions:   ${counts.executions}`)

  if (!apply) {
    console.log('\nRun with --apply to delete the rows above.')
    return
  }

  if (toDelete.length === 0) {
    console.log('\n✅ Nothing to clean up.')
    return
  }

  const result = await prisma.user.deleteMany({
    where: { id: { in: toDelete.map((u) => u.id) } },
  })

  console.log(`\n✅ Deleted ${result.count} test user(s) and cascaded related data.`)
}

main()
  .catch((err) => {
    console.error('❌ Cleanup failed:', err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
