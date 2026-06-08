import {
  listEnvironments,
  createEnvironment,
  deleteEnvironment,
  getResolvedVariables,
  upsertVariable
} from '../environmentService.js'
import { prisma } from '../../lib/prisma.js'

jest.mock('../../lib/prisma.js')
jest.mock('../../utils/secretCrypto.js', () => ({
  encryptSecret: (v) => `enc:${v}`,
  decryptSecret: (v) => (v.startsWith('enc:') ? v.slice(4) : v)
}))

describe('environmentService', () => {
  const userId = 'user-1'
  const mockEnv = {
    id: 'env-1',
    userId,
    name: 'Development',
    description: 'Dev',
    baseUrl: 'http://localhost:3001',
    isDefault: true,
    variables: [
      { id: 'v1', key: 'baseUrl', value: 'http://localhost:3001', isSecret: false, createdAt: new Date(), updatedAt: new Date() }
    ],
    _count: { variables: 1 },
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listEnvironments', () => {
    it('returns mapped environments for user', async () => {
      prisma.testEnvironment.findMany.mockResolvedValue([mockEnv])

      const result = await listEnvironments(userId)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Development')
      expect(result[0].variables[0].value).toBe('http://localhost:3001')
    })

    it('seeds defaults when user has no environments', async () => {
      prisma.testEnvironment.findMany.mockResolvedValueOnce([])
      prisma.testEnvironment.create.mockImplementation(({ data }) =>
        Promise.resolve({
          id: `env-${data.name}`,
          userId: data.userId,
          name: data.name,
          description: data.description,
          baseUrl: data.baseUrl,
          isDefault: data.isDefault,
          variables: [],
          _count: { variables: 0 },
          createdAt: new Date(),
          updatedAt: new Date()
        })
      )

      const result = await listEnvironments(userId)

      expect(result.length).toBeGreaterThanOrEqual(1)
      expect(prisma.testEnvironment.create).toHaveBeenCalled()
    })
  })

  describe('createEnvironment', () => {
    it('creates environment with trimmed name', async () => {
      prisma.testEnvironment.create.mockResolvedValue(mockEnv)

      await createEnvironment(userId, {
        name: '  Staging  ',
        description: 'Pre-prod',
        baseUrl: 'https://staging.test'
      })

      expect(prisma.testEnvironment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Staging' })
        })
      )
    })

    it('throws when name is empty', async () => {
      await expect(createEnvironment(userId, { name: '  ' })).rejects.toMatchObject({
        message: 'Environment name is required',
        status: 400
      })
    })
  })

  describe('getResolvedVariables', () => {
    it('returns decrypted variable map including baseUrl', async () => {
      prisma.testEnvironment.findFirst.mockResolvedValue({
        ...mockEnv,
        variables: [
          { key: 'apiKey', value: 'enc:secret-key', isSecret: true },
          { key: 'username', value: 'admin', isSecret: false }
        ]
      })

      const map = await getResolvedVariables(userId, 'env-1')

      expect(map.baseUrl).toBe('http://localhost:3001')
      expect(map.apiKey).toBe('secret-key')
      expect(map.username).toBe('admin')
    })

    it('throws when environment not found', async () => {
      prisma.testEnvironment.findFirst.mockResolvedValue(null)

      await expect(getResolvedVariables(userId, 'missing')).rejects.toMatchObject({
        status: 404
      })
    })
  })

  describe('upsertVariable', () => {
    it('rejects invalid variable keys', async () => {
      prisma.testEnvironment.findFirst.mockResolvedValue(mockEnv)

      await expect(
        upsertVariable(userId, 'env-1', { key: '123invalid', value: 'x' })
      ).rejects.toMatchObject({ status: 400 })
    })
  })

  describe('deleteEnvironment', () => {
    it('deletes owned environment', async () => {
      prisma.testEnvironment.findFirst.mockResolvedValue(mockEnv)
      prisma.testEnvironment.delete.mockResolvedValue(mockEnv)
      prisma.testEnvironment.findFirst.mockResolvedValueOnce(mockEnv).mockResolvedValueOnce(null)

      const result = await deleteEnvironment(userId, 'env-1')

      expect(result.success).toBe(true)
      expect(prisma.testEnvironment.delete).toHaveBeenCalledWith({ where: { id: 'env-1' } })
    })
  })
})
