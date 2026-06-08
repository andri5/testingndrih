import { prisma } from '../lib/prisma.js'
import { sendTestAlertEmail } from './emailService.js'

export async function getNotificationSettings(userId) {
  let settings = await prisma.notificationSettings.findUnique({ where: { userId } })
  if (!settings) {
    settings = await prisma.notificationSettings.create({
      data: { userId }
    })
  }
  return settings
}

export async function updateNotificationSettings(userId, data) {
  await getNotificationSettings(userId)
  return prisma.notificationSettings.update({
    where: { userId },
    data: {
      ...(data.emailOnFailure !== undefined && { emailOnFailure: data.emailOnFailure }),
      ...(data.emailOnSmokeFail !== undefined && { emailOnSmokeFail: data.emailOnSmokeFail }),
      ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl || null }),
      ...(data.webhookEnabled !== undefined && { webhookEnabled: data.webhookEnabled }),
      ...(data.webhookOnFailure !== undefined && { webhookOnFailure: data.webhookOnFailure }),
      ...(data.webhookOnSmokeFail !== undefined && { webhookOnSmokeFail: data.webhookOnSmokeFail })
    }
  })
}

async function postWebhook(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  })
  if (!res.ok) {
    throw new Error(`Webhook returned ${res.status}`)
  }
}

/**
 * Notify user on test failure (execution or smoke)
 */
export async function notifyTestFailure({
  userId,
  type = 'execution',
  scenarioName,
  status,
  executionId,
  errorMessage,
  passedSteps,
  totalSteps
}) {
  try {
    const [settings, user] = await Promise.all([
      getNotificationSettings(userId),
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
    ])
    if (!user) return

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const detailUrl = executionId ? `${appUrl}/reports` : appUrl
    const payload = {
      event: type === 'smoke' ? 'smoke_test_failed' : 'execution_failed',
      scenarioName,
      status,
      errorMessage,
      passedSteps,
      totalSteps,
      detailUrl,
      timestamp: new Date().toISOString()
    }

    const sendEmail =
      (type === 'smoke' && settings.emailOnSmokeFail) ||
      (type !== 'smoke' && settings.emailOnFailure)

    const sendWebhook =
      settings.webhookEnabled &&
      settings.webhookUrl &&
      ((type === 'smoke' && settings.webhookOnSmokeFail) ||
        (type !== 'smoke' && settings.webhookOnFailure))

    if (sendEmail) {
      const subject =
        type === 'smoke'
          ? `Smoke test failed: ${scenarioName}`
          : `Test execution failed: ${scenarioName}`
      await sendTestAlertEmail(user.email, subject, payload)
    }

    if (sendWebhook) {
      await postWebhook(settings.webhookUrl, payload)
    }
  } catch (err) {
    console.error('[Notification] Failed:', err.message)
  }
}

/**
 * Notify user after scheduled execution completes with failure
 */
export async function notifyScheduledExecution({ userId, scenarioName, execution }) {
  if (!userId || !execution || execution.status !== 'FAILED') return

  await notifyTestFailure({
    userId,
    type: 'execution',
    scenarioName,
    status: execution.status,
    executionId: execution.id,
    errorMessage: execution.errorMessage,
    passedSteps: execution.passedSteps,
    totalSteps: execution.totalSteps
  })
}

/**
 * Notify user when smoke test batch has failures
 */
export async function notifySmokeTestSummary(userId, summary) {
  if (!userId || !summary?.results?.length) return

  const failed = summary.results.filter((r) => r.status !== 'SMOKE_PASSED')
  if (failed.length === 0) return

  for (const result of failed) {
    await notifyTestFailure({
      userId,
      type: 'smoke',
      scenarioName: result.scenarioName,
      status: result.status,
      errorMessage: result.error || `Smoke test ${result.status}`
    })
  }
}
