import {
  createShare,
  listShares,
  revokeShare,
  resolvePublicShare,
  toPublicExecutionDto,
} from '../executionShareService.js'
import { prisma } from '../../lib/prisma.js'

describe('executionShareService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('toPublicExecutionDto omits step value and scenario URL', () => {
    const dto = toPublicExecutionDto({
      id: 'exec-1',
      status: 'PASSED',
      passedSteps: 1,
      failedSteps: 0,
      totalSteps: 1,
      errorMessage: null,
      scenario: { name: 'Login', url: 'https://secret.internal/app' },
      stepResults: [
        {
          id: 'sr-1',
          status: 'PASSED',
          duration: 100,
          errorMessage: null,
          testStep: {
            id: 'step-1',
            stepNumber: 1,
            type: 'FILL',
            description: 'Password',
            value: 'SuperSecret123',
            metadata: '{"x":1}',
            selector: '#password',
          },
          screenshot: { id: 'shot-1', url: '/api/screenshots/a.png' },
        },
      ],
    })

    expect(dto.scenario).toEqual({ name: 'Login' })
    expect(dto.stepResults[0].testStep.value).toBeUndefined()
    expect(dto.stepResults[0].testStep.metadata).toBeUndefined()
    expect(dto.stepResults[0].testStep.selector).toBeUndefined()
    expect(dto.stepResults[0].screenshot.url).toBe('/api/screenshots/a.png')
  })

  test('createShare stores hash and returns raw token once', async () => {
    prisma.execution.findFirst.mockResolvedValueOnce({ id: 'exec-1', status: 'PASSED' })
    prisma.executionShareLink.create.mockImplementationOnce(async (args) => ({
      id: 'share-1',
      ...args.data,
      revokedAt: null,
      lastAccessedAt: null,
      createdAt: new Date(),
    }))

    const result = await createShare('user-1', 'exec-1', { expiresInDays: 7 }, 'https://testsambilngopi.com')

    expect(result.token).toMatch(/^tsnshare_/)
    expect(result.shareUrl).toContain('/share/runs/tsnshare_')
    expect(prisma.executionShareLink.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: expect.any(String),
          createdByUserId: 'user-1',
          executionId: 'exec-1',
        }),
      })
    )
    const storedHash = prisma.executionShareLink.create.mock.calls[0][0].data.tokenHash
    expect(storedHash).not.toBe(result.token)
  })

  test('createShare 404 when execution missing', async () => {
    prisma.execution.findFirst.mockResolvedValueOnce(null)
    await expect(createShare('user-1', 'missing')).rejects.toMatchObject({ status: 404 })
  })

  test('listShares returns serialized rows', async () => {
    prisma.execution.findFirst.mockResolvedValueOnce({ id: 'exec-1' })
    prisma.executionShareLink.findMany.mockResolvedValueOnce([
      {
        id: 'share-1',
        prefix: 'tsnshare_ab…',
        expiresAt: new Date('2026-09-01'),
        revokedAt: null,
        lastAccessedAt: null,
        createdAt: new Date('2026-08-04'),
        executionId: 'exec-1',
      },
    ])
    const shares = await listShares('user-1', 'exec-1')
    expect(shares).toHaveLength(1)
    expect(shares[0].id).toBe('share-1')
  })

  test('revokeShare sets revokedAt', async () => {
    prisma.executionShareLink.findFirst.mockResolvedValueOnce({
      id: 'share-1',
      executionId: 'exec-1',
      createdByUserId: 'user-1',
      revokedAt: null,
    })
    prisma.executionShareLink.update.mockResolvedValueOnce({
      id: 'share-1',
      prefix: 'tsnshare_ab…',
      expiresAt: null,
      revokedAt: new Date(),
      lastAccessedAt: null,
      createdAt: new Date(),
      executionId: 'exec-1',
    })
    const share = await revokeShare('user-1', 'exec-1', 'share-1')
    expect(share.revokedAt).toBeTruthy()
  })

  test('resolvePublicShare rejects invalid token prefix', async () => {
    await expect(resolvePublicShare('badtoken')).rejects.toMatchObject({ status: 404 })
  })

  test('resolvePublicShare returns redacted execution', async () => {
    const token = `tsnshare_${'a'.repeat(64)}`
    prisma.executionShareLink.findUnique.mockResolvedValueOnce({
      id: 'share-1',
      executionId: 'exec-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    })
    prisma.execution.findUnique.mockResolvedValueOnce({
      id: 'exec-1',
      status: 'PASSED',
      passedSteps: 1,
      failedSteps: 0,
      totalSteps: 1,
      errorMessage: null,
      scenario: { name: 'Demo' },
      stepResults: [
        {
          id: 'sr-1',
          status: 'PASSED',
          duration: 50,
          errorMessage: null,
          testStep: { id: 's1', stepNumber: 1, type: 'CLICK', description: 'Click' },
          screenshot: null,
        },
      ],
    })
    prisma.executionShareLink.update.mockResolvedValueOnce({})

    const data = await resolvePublicShare(token)
    expect(data.execution.status).toBe('PASSED')
    expect(data.execution.scenario.name).toBe('Demo')
    expect(prisma.executionShareLink.update).toHaveBeenCalled()
  })

  test('resolvePublicShare rejects expired', async () => {
    const token = `tsnshare_${'b'.repeat(64)}`
    prisma.executionShareLink.findUnique.mockResolvedValueOnce({
      id: 'share-1',
      executionId: 'exec-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    })
    await expect(resolvePublicShare(token)).rejects.toMatchObject({ status: 410 })
  })
})
