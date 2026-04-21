import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock the prisma module before importing chainService
jest.mock('../../lib/prisma.js', () => ({
  prisma: {
    testChain: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    $transaction: jest.fn()
  }
}), { virtual: true })

import { chainService } from '../chainService.js'
import { prisma } from '../../lib/prisma.js'

describe('ChainService', () => {
  let mockUser
  let mockChain

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User'
    }

    mockChain = {
      id: 'chain-123',
      name: 'Test Chain',
      description: 'A test chain',
      userId: 'user-123',
      steps: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      chainSteps: [],
      chainExecutions: []
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createChain', () => {
    it('should create a new test chain with valid data', async () => {
      prisma.testChain.create.mockResolvedValueOnce(mockChain)

      const data = {
        name: 'Test Chain',
        description: 'A test chain'
      }

      const result = await chainService.createChain(mockUser.id, data)

      expect(result).toEqual(mockChain)
      expect(prisma.testChain.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Chain',
          description: 'A test chain',
          userId: mockUser.id,
          steps: 0
        },
        include: {
          chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } }
        }
      })
    })

    it('should throw error if name is empty', async () => {
      const data = {
        name: '',
        description: 'A test chain'
      }

      await expect(chainService.createChain(mockUser.id, data)).rejects.toThrow(
        'Chain name is required'
      )
    })

    it('should throw error if name is not provided', async () => {
      const data = {
        description: 'A test chain'
      }

      await expect(chainService.createChain(mockUser.id, data)).rejects.toThrow(
        'Chain name is required'
      )
    })

    it('should set description to null if not provided', async () => {
      prisma.testChain.create.mockResolvedValueOnce(mockChain)

      const data = {
        name: 'Test Chain'
      }

      const result = await chainService.createChain(mockUser.id, data)

      expect(result).toEqual(mockChain)
      expect(prisma.testChain.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Chain',
          description: null,
          userId: mockUser.id,
          steps: 0
        },
        include: {
          chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } }
        }
      })
    })
  })

  describe('getChainById', () => {
    it('should get a chain by id', async () => {
      prisma.testChain.findFirst.mockResolvedValueOnce(mockChain)

      const result = await chainService.getChainById('chain-123', mockUser.id)

      expect(result).toEqual(mockChain)
      expect(prisma.testChain.findFirst).toHaveBeenCalledWith({
        where: { id: 'chain-123', userId: mockUser.id },
        include: {
          chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } },
          chainExecutions: { orderBy: { createdAt: 'desc' }, take: 5 }
        }
      })
    })

    it('should throw error if chain not found', async () => {
      prisma.testChain.findFirst.mockResolvedValueOnce(null)

      await expect(chainService.getChainById('nonexistent', mockUser.id)).rejects.toThrow(
        'Chain not found'
      )
    })
  })

  describe('getChains', () => {
    it('should get all chains for a user', async () => {
      prisma.testChain.findMany.mockResolvedValueOnce([mockChain])
      prisma.testChain.count.mockResolvedValueOnce(1)

      const result = await chainService.getChains(mockUser.id)

      expect(result).toEqual({
        chains: [mockChain],
        total: 1,
        limit: 20,
        offset: 0
      })
      expect(prisma.testChain.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } },
          _count: { select: { chainExecutions: true } }
        },
        take: 20,
        skip: 0,
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should get chains with custom limit and offset', async () => {
      prisma.testChain.findMany.mockResolvedValueOnce([mockChain])
      prisma.testChain.count.mockResolvedValueOnce(1)

      const result = await chainService.getChains(mockUser.id, 10, 5)

      expect(result).toEqual({
        chains: [mockChain],
        total: 1,
        limit: 10,
        offset: 5
      })
      expect(prisma.testChain.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: {
          chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } },
          _count: { select: { chainExecutions: true } }
        },
        take: 10,
        skip: 5,
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  describe('updateChain', () => {
    it('should update a chain', async () => {
      prisma.testChain.findFirst.mockResolvedValueOnce(mockChain)
      const updatedChain = { ...mockChain, name: 'Updated Chain' }
      prisma.testChain.update.mockResolvedValueOnce(updatedChain)

      const updateData = {
        name: 'Updated Chain'
      }

      const result = await chainService.updateChain('chain-123', mockUser.id, updateData)

      expect(result).toEqual(updatedChain)
      expect(prisma.testChain.update).toHaveBeenCalledWith({
        where: { id: 'chain-123' },
        data: {
          name: 'Updated Chain',
          description: mockChain.description,
          isActive: mockChain.isActive
        },
        include: {
          chainSteps: { orderBy: { stepNumber: 'asc' }, include: { scenario: true } }
        }
      })
    })

    it('should throw error if chain not found', async () => {
      prisma.testChain.findFirst.mockResolvedValueOnce(null)

      await expect(
        chainService.updateChain('nonexistent', mockUser.id, { name: 'Updated' })
      ).rejects.toThrow('Chain not found')
    })
  })

  describe('deleteChain', () => {
    it('should delete a chain', async () => {
      prisma.testChain.findFirst.mockResolvedValueOnce(mockChain)
      prisma.testChain.delete.mockResolvedValueOnce(mockChain)

      const result = await chainService.deleteChain('chain-123', mockUser.id)

      expect(result).toEqual({ success: true, message: 'Chain deleted successfully' })
      expect(prisma.testChain.delete).toHaveBeenCalledWith({
        where: { id: 'chain-123' }
      })
    })

    it('should throw error if chain not found', async () => {
      prisma.testChain.findFirst.mockResolvedValueOnce(null)

      await expect(chainService.deleteChain('nonexistent', mockUser.id)).rejects.toThrow(
        'Chain not found'
      )
    })
  })
})
