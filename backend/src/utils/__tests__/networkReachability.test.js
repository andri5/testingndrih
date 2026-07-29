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

describe('summarizeTargetReachability', () => {
  test('marks private network as internal', async () => {
    const { summarizeTargetReachability } = await import('../networkReachability.js')
    const summary = summarizeTargetReachability({
      privateNetwork: true,
      ok: false,
      reason: 'private_network',
      addresses: ['10.1.2.3'],
      message: 'internal',
    })
    expect(summary.targetKind).toBe('internal')
    expect(summary.reachability.privateNetwork).toBe(true)
  })

  test('marks public DNS as public', async () => {
    const { summarizeTargetReachability } = await import('../networkReachability.js')
    const summary = summarizeTargetReachability({
      privateNetwork: false,
      ok: true,
      addresses: ['1.1.1.1'],
    })
    expect(summary.targetKind).toBe('public')
    expect(summary.reachability.privateNetwork).toBe(false)
  })
})
