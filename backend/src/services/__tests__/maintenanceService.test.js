import {
  cleanupExpiredResetTokens,
  cleanupFailedMigrationRecords,
} from '../maintenanceService.js'
import { prisma } from '../../lib/prisma.js'

jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: { updateMany: jest.fn() },
    $executeRaw: jest.fn(),
  },
}))

describe('maintenanceService', () => {
  beforeEach(() => jest.clearAllMocks())

  it('clears expired reset tokens', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 2 })
    const count = await cleanupExpiredResetTokens()
    expect(count).toBe(2)
    expect(prisma.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { resetToken: null, resetTokenExpiry: null },
      })
    )
  })

  it('removes failed migration records', async () => {
    prisma.$executeRaw.mockResolvedValue(1)
    const count = await cleanupFailedMigrationRecords()
    expect(count).toBe(1)
  })
})
