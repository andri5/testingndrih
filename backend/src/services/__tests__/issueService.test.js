import {
  listIssues,
  updateIssue,
  createIssueFromExecution
} from '../issueService.js'
import { prisma } from '../../lib/prisma.js'

jest.mock('../../lib/prisma.js')

describe('issueService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createIssueFromExecution', () => {
    it('creates issue when execution failed', async () => {
      prisma.execution.findUnique.mockResolvedValue({
        id: 'exec-1',
        status: 'FAILED',
        errorMessage: 'Selector not found',
        scenario: { name: 'Login Test' },
        stepResults: [{ testStep: { stepNumber: 3 } }]
      })
      prisma.issue.findFirst.mockResolvedValue(null)
      prisma.issue.create.mockResolvedValue({ id: 'issue-1', title: 'Test failed: Login Test' })

      const result = await createIssueFromExecution('exec-1')

      expect(result.id).toBe('issue-1')
      expect(prisma.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'OPEN',
            severity: 'HIGH',
            stepNumber: 3,
            executionId: 'exec-1'
          })
        })
      )
    })

    it('returns null for passed execution', async () => {
      prisma.execution.findUnique.mockResolvedValue({
        id: 'exec-1',
        status: 'PASSED',
        scenario: { name: 'Login Test' },
        stepResults: []
      })

      const result = await createIssueFromExecution('exec-1')
      expect(result).toBeNull()
      expect(prisma.issue.create).not.toHaveBeenCalled()
    })

    it('returns existing open issue without duplicating', async () => {
      prisma.execution.findUnique.mockResolvedValue({
        id: 'exec-1',
        status: 'FAILED',
        scenario: { name: 'Login Test' },
        stepResults: []
      })
      prisma.issue.findFirst.mockResolvedValue({ id: 'existing-issue' })

      const result = await createIssueFromExecution('exec-1')
      expect(result.id).toBe('existing-issue')
      expect(prisma.issue.create).not.toHaveBeenCalled()
    })
  })

  describe('listIssues', () => {
    it('returns paginated issues for user', async () => {
      prisma.issue.findMany.mockResolvedValue([{ id: 'issue-1' }])
      prisma.issue.count.mockResolvedValue(1)

      const result = await listIssues('user-1', { status: 'OPEN', limit: 10, offset: 0 })

      expect(result.issues).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(prisma.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { execution: { userId: 'user-1' }, status: 'OPEN' }
        })
      )
    })
  })

  describe('updateIssue', () => {
    it('updates issue status', async () => {
      prisma.issue.findUnique.mockResolvedValue({
        id: 'issue-1',
        execution: { userId: 'user-1', status: 'FAILED', scenario: { id: 's1', name: 'T', url: 'http://x' }, stepResults: [] }
      })
      prisma.issue.update.mockResolvedValue({ id: 'issue-1', status: 'CLOSED' })

      const result = await updateIssue('user-1', 'issue-1', { status: 'CLOSED' })
      expect(result.status).toBe('CLOSED')
    })
  })
})
