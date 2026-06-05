import {
  getNotificationSettings,
  updateNotificationSettings,
  notifyTestFailure
} from '../notificationService.js'
import { prisma } from '../../lib/prisma.js'
import { sendTestAlertEmail } from '../emailService.js'

jest.mock('../../lib/prisma.js')
jest.mock('../emailService.js')

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
  })

  describe('getNotificationSettings', () => {
    it('creates default settings if missing', async () => {
      prisma.notificationSettings.findUnique.mockResolvedValue(null)
      prisma.notificationSettings.create.mockResolvedValue({
        userId: 'user-1',
        emailOnFailure: true,
        webhookEnabled: false
      })

      const settings = await getNotificationSettings('user-1')
      expect(settings.userId).toBe('user-1')
      expect(prisma.notificationSettings.create).toHaveBeenCalled()
    })
  })

  describe('updateNotificationSettings', () => {
    it('updates webhook settings', async () => {
      prisma.notificationSettings.findUnique.mockResolvedValue({ userId: 'user-1' })
      prisma.notificationSettings.update.mockResolvedValue({
        userId: 'user-1',
        webhookEnabled: true,
        webhookUrl: 'https://hooks.example.com'
      })

      const settings = await updateNotificationSettings('user-1', {
        webhookEnabled: true,
        webhookUrl: 'https://hooks.example.com'
      })

      expect(settings.webhookEnabled).toBe(true)
    })
  })

  describe('notifyTestFailure', () => {
    it('sends email when emailOnFailure is enabled', async () => {
      prisma.notificationSettings.findUnique.mockResolvedValue({
        emailOnFailure: true,
        emailOnSmokeFail: false,
        webhookEnabled: false
      })
      prisma.user.findUnique.mockResolvedValue({ email: 'qa@example.com', name: 'QA' })
      sendTestAlertEmail.mockResolvedValue({ success: true })

      await notifyTestFailure({
        userId: 'user-1',
        type: 'execution',
        scenarioName: 'Checkout',
        status: 'FAILED',
        executionId: 'exec-1',
        errorMessage: 'Step 2 failed',
        passedSteps: 1,
        totalSteps: 5
      })

      expect(sendTestAlertEmail).toHaveBeenCalledWith(
        'qa@example.com',
        expect.stringContaining('Checkout'),
        expect.objectContaining({ scenarioName: 'Checkout' })
      )
    })

    it('posts webhook when configured', async () => {
      prisma.notificationSettings.findUnique.mockResolvedValue({
        emailOnFailure: false,
        emailOnSmokeFail: false,
        webhookEnabled: true,
        webhookUrl: 'https://hooks.example.com',
        webhookOnFailure: true,
        webhookOnSmokeFail: false
      })
      prisma.user.findUnique.mockResolvedValue({ email: 'qa@example.com' })

      await notifyTestFailure({
        userId: 'user-1',
        type: 'execution',
        scenarioName: 'Login',
        status: 'FAILED'
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://hooks.example.com',
        expect.objectContaining({ method: 'POST' })
      )
    })
  })
})
