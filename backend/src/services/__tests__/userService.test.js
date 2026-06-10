import { listUsers, updateUserRole } from '../userService.js'
import { prisma } from '../../lib/prisma.js'

jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listUsers', () => {
    it('returns all users ordered by createdAt', async () => {
      const users = [{ id: '1', email: 'a@test.com', role: 'USER' }]
      prisma.user.findMany.mockResolvedValue(users)

      const result = await listUsers()

      expect(result).toEqual(users)
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } })
      )
    })
  })

  describe('updateUserRole', () => {
    it('rejects demoting primary admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'donkditren@gmail.com',
        role: 'ADMIN',
      })

      await expect(updateUserRole('other@test.com', '1', 'USER')).rejects.toMatchObject({
        status: 403,
        message: expect.stringContaining('primary admin'),
      })
    })

    it('updates role for regular users', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '2',
        email: 'user@test.com',
        role: 'USER',
      })
      prisma.user.update.mockResolvedValue({
        id: '2',
        email: 'user@test.com',
        role: 'ADMIN',
      })

      const result = await updateUserRole('donkditren@gmail.com', '2', 'ADMIN')

      expect(result.role).toBe('ADMIN')
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '2' },
        data: { role: 'ADMIN' },
        select: expect.any(Object),
      })
    })
  })
})
