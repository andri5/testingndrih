import { looksLikeSqlInjection, findSqlInjectionField } from '../sqlInjectionGuard.js'

describe('sqlInjectionGuard', () => {
  test('detects classic OR payloads', () => {
    expect(looksLikeSqlInjection("' OR '1'='1")).toBe(true)
    expect(looksLikeSqlInjection("' OR 1=1 --")).toBe(true)
  })

  test('detects UNION / DROP', () => {
    expect(looksLikeSqlInjection("' UNION SELECT * FROM users --")).toBe(true)
    expect(looksLikeSqlInjection("'; DROP TABLE users; --")).toBe(true)
  })

  test('allows normal form text', () => {
    expect(looksLikeSqlInjection('Login page smoke test')).toBe(false)
    expect(looksLikeSqlInjection('user@example.com')).toBe(false)
    expect(looksLikeSqlInjection("O'Brien")).toBe(false)
  })

  test('findSqlInjectionField returns first hit', () => {
    const hit = findSqlInjectionField({
      name: 'ok',
      search: "' OR 1=1 --",
    })
    expect(hit?.field).toBe('search')
  })
})
