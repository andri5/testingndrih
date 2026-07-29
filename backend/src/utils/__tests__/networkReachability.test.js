import { isPrivateIp, formatFetchNetworkError } from '../networkReachability.js'

describe('isPrivateIp', () => {
  test('detects RFC1918 and loopback', () => {
    expect(isPrivateIp('10.216.218.150')).toBe(true)
    expect(isPrivateIp('192.168.1.1')).toBe(true)
    expect(isPrivateIp('172.16.0.1')).toBe(true)
    expect(isPrivateIp('127.0.0.1')).toBe(true)
    expect(isPrivateIp('169.254.1.1')).toBe(true)
  })

  test('allows public addresses', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false)
    expect(isPrivateIp('1.1.1.1')).toBe(false)
  })
})

describe('formatFetchNetworkError', () => {
  test('maps common network codes', () => {
    expect(formatFetchNetworkError({ cause: { code: 'ENETUNREACH', message: 'x' } })).toMatch(/tidak terjangkau/i)
    expect(formatFetchNetworkError({ message: 'fetch failed' })).toBe('fetch failed')
  })
})
