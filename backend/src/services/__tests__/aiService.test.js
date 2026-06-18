import { isAiEnabled, redactSensitiveText } from '../aiService.js'

describe('aiService', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.AI_ENABLED
    delete process.env.OPENAI_API_KEY
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('isAiEnabled', () => {
    it('returns false when AI_ENABLED is not true', () => {
      process.env.OPENAI_API_KEY = 'sk-test'
      expect(isAiEnabled()).toBe(false)
    })

    it('returns false when API key is missing', () => {
      process.env.AI_ENABLED = 'true'
      expect(isAiEnabled()).toBe(false)
    })

    it('returns true when enabled and key is set', () => {
      process.env.AI_ENABLED = 'true'
      process.env.OPENAI_API_KEY = 'sk-test'
      expect(isAiEnabled()).toBe(true)
    })
  })

  describe('redactSensitiveText', () => {
    it('redacts password-like patterns', () => {
      const input = 'login failed password: SuperSecret123'
      expect(redactSensitiveText(input)).toContain('[REDACTED]')
      expect(redactSensitiveText(input)).not.toContain('SuperSecret123')
    })
  })
})
