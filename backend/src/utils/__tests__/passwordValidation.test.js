import { validatePassword } from '../passwordValidation.js'

describe('validatePassword', () => {
  it('rejects empty password', () => {
    const result = validatePassword('')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('Password is required')
  })

  it('rejects weak password with English messages', () => {
    const result = validatePassword('weak')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('Password does not meet requirements')
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'At least 8 characters',
        'At least 1 uppercase letter',
        'At least 1 number',
        'At least 1 special character (!@#$%^&*)',
      ])
    )
  })

  it('accepts a strong password', () => {
    const result = validatePassword('ValidPass123!')
    expect(result.valid).toBe(true)
    expect(result.message).toBeNull()
  })
})
