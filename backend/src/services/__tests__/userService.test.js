import {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserRole,
  setUserActive,
  deleteUser,
} from '../userService.js'
import { prisma } from '../../lib/prisma.js'
import { hashPassword } from '../../utils/password.js'

jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('../../utils/password.js', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
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

      expect(result).toEqual([{ ...users[0], isPrimaryAdmin: false }])
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } })
      )
    })
  })

  describe('getUserById', () => {
    it('returns user with counts', async () => {
      const user = { id: '1', email: 'a@test.com', _count: { scenarios: 2 } }
      prisma.user.findUnique.mockResolvedValue(user)

      const result = await getUserById('1')

      expect(result).toEqual(user)
    })

    it('throws 404 when missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(getUserById('missing')).rejects.toMatchObject({
        status: 404,
      })
    })
  })

  describe('createUser', () => {
    it('creates a user with hashed password', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: '2',
        email: 'new@test.com',
        name: 'New User',
        role: 'USER',
      })

      const result = await createUser({
        email: 'new@test.com',
        name: 'New User',
        password: 'SecurePass1!',
      })

      expect(hashPassword).toHaveBeenCalledWith('SecurePass1!')
      expect(result.email).toBe('new@test.com')
    })

    it('rejects duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1' })

      await expect(
        createUser({
          email: 'exists@test.com',
          name: 'Existing',
          password: 'SecurePass1!',
        })
      ).rejects.toMatchObject({ status: 409 })
    })
  })

  describe('updateUserRole', () => {
    it('rejects demoting primary admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'admin@testingndrih.local',
        role: 'ADMIN',
      })

      await expect(
        updateUserRole({ id: '9', email: 'other@test.com' }, '1', 'USER')
      ).rejects.toMatchObject({
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

      const result = await updateUserRole(
        { id: '1', email: 'admin@testingndrih.local' },
        '2',
        'ADMIN'
      )

      expect(result.role).toBe('ADMIN')
    })
  })

  describe('deleteUser', () => {
    it('rejects deleting primary admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'admin@testingndrih.local',
        role: 'ADMIN',
      })

      await expect(
        deleteUser({ id: '9', email: 'other@test.com' }, '1')
      ).rejects.toMatchObject({ status: 403 })
    })

    it('rejects self deletion', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '2',
        email: 'user@test.com',
        role: 'USER',
      })

      await expect(deleteUser({ id: '2', email: 'user@test.com' }, '2')).rejects.toMatchObject({
        status: 403,
      })
    })

    it('rejects deactivating primary admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'admin@testingndrih.local',
        role: 'ADMIN',
        isActive: true,
      })

      await expect(
        setUserActive({ id: '9', email: 'other@test.com' }, '1', false)
      ).rejects.toMatchObject({ status: 403 })
    })

    it('deactivates a regular user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '2',
        email: 'user@test.com',
        role: 'USER',
        isActive: true,
      })
      prisma.user.update.mockResolvedValue({
        id: '2',
        email: 'user@test.com',
        role: 'USER',
        isActive: false,
      })

      const result = await setUserActive(
        { id: '1', email: 'admin@testingndrih.local' },
        '2',
        false
      )

      expect(result.isActive).toBe(false)
    })

    it('deletes a regular user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '2',
        email: 'user@test.com',
        role: 'USER',
      })
      prisma.user.delete.mockResolvedValue({ id: '2' })

      const result = await deleteUser(
        { id: '1', email: 'admin@testingndrih.local' },
        '2'
      )

      expect(result.email).toBe('user@test.com')
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: '2' } })
    })
  })
})
