import {
  maskSecretValue,
  looksLikeSecretKey,
  redactStepForError,
} from '../secretRedaction.js'

describe('secretRedaction', () => {
  test('detects secret-like keys', () => {
    expect(looksLikeSecretKey('password')).toBe(true)
    expect(looksLikeSecretKey('api_key')).toBe(true)
    expect(looksLikeSecretKey('username')).toBe(false)
  })

  test('masks values', () => {
    expect(maskSecretValue('secret123')).toMatch(/\*\*\*/)
  })

  test('redacts FILL password steps', () => {
    const out = redactStepForError({
      type: 'FILL',
      description: 'Enter password',
      selector: 'input[name=password]',
      value: 'SuperSecret!',
    })
    expect(out.value).not.toBe('SuperSecret!')
    expect(out.value).toMatch(/\*\*\*/)
  })
})
