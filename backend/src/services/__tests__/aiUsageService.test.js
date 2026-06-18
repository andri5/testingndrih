import {
  assertAiQuota,
  recordAiUsage,
  getAiQuotaStatus,
  AiQuotaError,
  clearAiUsageCache,
} from '../aiUsageService.js'

describe('aiUsageService', () => {
  const userId = 'user-test-1'

  beforeEach(() => {
    clearAiUsageCache()
    process.env.AI_ENABLED = 'true'
    process.env.OPENAI_API_KEY = 'gsk-test'
    process.env.AI_DAILY_LIMIT_PER_USER = '3'
    process.env.AI_HOURLY_LIMIT_PER_USER = '2'
    process.env.AI_GLOBAL_DAILY_LIMIT = '10'
  })

  it('allows requests under quota', () => {
    const status = getAiQuotaStatus(userId)
    expect(status.canUse).toBe(true)
    expect(status.dailyRemaining).toBe(3)
    assertAiQuota(userId)
    recordAiUsage(userId)
    expect(getAiQuotaStatus(userId).dailyRemaining).toBe(2)
  })

  it('blocks when daily user quota exceeded', () => {
    recordAiUsage(userId)
    recordAiUsage(userId)
    recordAiUsage(userId)
    const status = getAiQuotaStatus(userId)
    expect(status.canUse).toBe(false)
    expect(status.blockedReason).toBe('user_daily')
    expect(() => assertAiQuota(userId)).toThrow(AiQuotaError)
  })
})
