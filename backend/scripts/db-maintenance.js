/**
 * One-shot database maintenance: expired reset tokens + failed migration records.
 *
 * Usage: node scripts/db-maintenance.js
 */
import 'dotenv/config'
import {
  cleanupExpiredResetTokens,
  cleanupFailedMigrationRecords,
} from '../src/services/maintenanceService.js'

async function main() {
  const tokens = await cleanupExpiredResetTokens()
  const migrations = await cleanupFailedMigrationRecords()

  console.log(`✅ Cleared ${tokens} expired password-reset token(s)`)
  console.log(`✅ Removed ${migrations} failed Prisma migration record(s)`)
}

main().catch((err) => {
  console.error('❌ Maintenance failed:', err.message)
  process.exit(1)
})
