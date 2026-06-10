import { prisma } from '../lib/prisma.js'

/**
 * Clear password-reset tokens that have expired (housekeeping).
 */
export async function cleanupExpiredResetTokens() {
  const result = await prisma.user.updateMany({
    where: {
      resetToken: { not: null },
      resetTokenExpiry: { lt: new Date() },
    },
    data: {
      resetToken: null,
      resetTokenExpiry: null,
    },
  })
  return result.count
}

/**
 * Remove failed Prisma migration rows left after a retried migration.
 */
export async function cleanupFailedMigrationRecords() {
  const result = await prisma.$executeRaw`
    DELETE FROM "_prisma_migrations"
    WHERE finished_at IS NULL
  `
  return Number(result)
}
