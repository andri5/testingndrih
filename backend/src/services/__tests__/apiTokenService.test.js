import {
  generateApiToken,
  createApiToken,
  listApiTokens,
  revokeApiToken,
  resolveUserFromApiToken
} from '../apiTokenService.js'
import { prisma } from '../../lib/prisma.js'

jest.mock('../../lib/prisma.js')

describe('apiTokenService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateApiToken', () => {
    it('returns token with tsn_ prefix', () => {
      const token = generateApiToken()
      expect(token.startsWith('tsn_')).toBe(true)
      expect(token.length).toBeGreaterThan(20)
    })
  })

  describe('createApiToken', () => {
    it('stores hashed token and returns plain token once', async () => {
      prisma.apiToken.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'tok-1', name: data.name, prefix: data.prefix })
      )

      const result = await createApiToken('user-1', 'CI Token', 30)

      expect(result.token).toMatch(/^tsn_/)
      expect(result.name).toBe('CI Token')
      expect(prisma.apiToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            name: 'CI Token',
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date)
          })
        })
      )
    })
  })

  describe('resolveUserFromApiToken', () => {
    it('returns user for valid token', async () => {
      const token = generateApiToken()
      prisma.apiToken.findUnique.mockResolvedValue({
        id: 'tok-1',
        expiresAt: null,
        user: { id: 'user-1', email: 'test@example.com' }
      })
      prisma.apiToken.update.mockResolvedValue({})

      const user = await resolveUserFromApiToken(token)
      expect(user).toEqual({ id: 'user-1', email: 'test@example.com' })
    })

    it('returns null for invalid token', async () => {
      prisma.apiToken.findUnique.mockResolvedValue(null)
      const user = await resolveUserFromApiToken('tsn_invalid')
      expect(user).toBeNull()
    })

    it('returns null for expired token', async () => {
      prisma.apiToken.findUnique.mockResolvedValue({
        id: 'tok-1',
        expiresAt: new Date('2020-01-01'),
        user: { id: 'user-1', email: 'test@example.com' }
      })
      const user = await resolveUserFromApiToken('tsn_expired')
      expect(user).toBeNull()
    })
  })

  describe('revokeApiToken', () => {
    it('deletes token owned by user', async () => {
      prisma.apiToken.findFirst.mockResolvedValue({ id: 'tok-1' })
      prisma.apiToken.delete.mockResolvedValue({})

      await revokeApiToken('user-1', 'tok-1')
      expect(prisma.apiToken.delete).toHaveBeenCalledWith({ where: { id: 'tok-1' } })
    })
  })

  describe('listApiTokens', () => {
    it('lists tokens without hash', async () => {
      prisma.apiToken.findMany.mockResolvedValue([{ id: 'tok-1', name: 'CI', prefix: 'tsn_abc...' }])
      const tokens = await listApiTokens('user-1')
      expect(tokens).toHaveLength(1)
    })
  })
})
