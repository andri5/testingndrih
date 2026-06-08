import {
  listBaselines,
  listComparisons,
  deleteBaseline
} from '../visualRegressionService.js'
import { prisma } from '../../lib/prisma.js'
import fs from 'fs'

jest.mock('../../lib/prisma.js')
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn(),
  copyFileSync: jest.fn(),
  readFileSync: jest.fn()
}))

describe('visualRegressionService', () => {
  const userId = 'user-1'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listBaselines', () => {
    it('returns baselines with public image URLs', async () => {
      prisma.visualBaseline.findMany.mockResolvedValue([
        {
          id: 'b1',
          scenarioId: 's1',
          stepNumber: 1,
          browser: 'chromium',
          width: 800,
          height: 600,
          imagePath: 'D:/app/uploads/visual/baselines/s1_chromium_step_1.png',
          updatedAt: new Date(),
          scenario: { id: 's1', name: 'Login Flow' }
        }
      ])

      const rows = await listBaselines(userId, 's1')

      expect(rows).toHaveLength(1)
      expect(rows[0].scenarioName).toBe('Login Flow')
      expect(rows[0].imageUrl).toContain('/api/visual/')
    })
  })

  describe('listComparisons', () => {
    it('returns formatted comparisons for user', async () => {
      prisma.visualComparison.findMany.mockResolvedValue([
        {
          id: 'c1',
          scenarioId: 's1',
          executionId: 'e1',
          stepNumber: 2,
          browser: 'chromium',
          status: 'FAILED',
          diffPercent: 12.5,
          diffPixels: 100,
          totalPixels: 800,
          threshold: 0.1,
          baselinePath: 'D:/app/uploads/visual/baselines/s1.png',
          currentPath: 'D:/app/uploads/visual/current/e1.png',
          diffPath: 'D:/app/uploads/visual/diff/e1.png',
          createdAt: new Date(),
          scenario: { name: 'Login Flow' }
        }
      ])

      const rows = await listComparisons(userId, { scenarioId: 's1', limit: 10 })

      expect(rows[0].status).toBe('FAILED')
      expect(rows[0].scenarioName).toBe('Login Flow')
      expect(rows[0].diffUrl).toContain('/api/visual/')
    })
  })

  describe('deleteBaseline', () => {
    it('removes baseline file and database row', async () => {
      prisma.visualBaseline.findFirst.mockResolvedValue({
        id: 'b1',
        userId,
        imagePath: 'D:/app/uploads/visual/baselines/s1.png'
      })
      prisma.visualBaseline.delete.mockResolvedValue({ id: 'b1' })

      const result = await deleteBaseline(userId, 'b1')

      expect(result.success).toBe(true)
      expect(fs.unlinkSync).toHaveBeenCalled()
      expect(prisma.visualBaseline.delete).toHaveBeenCalledWith({ where: { id: 'b1' } })
    })

    it('throws when baseline not found', async () => {
      prisma.visualBaseline.findFirst.mockResolvedValue(null)

      await expect(deleteBaseline(userId, 'missing')).rejects.toMatchObject({ status: 404 })
    })
  })
})
