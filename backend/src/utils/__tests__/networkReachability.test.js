import {
  isPrivateIp,
  formatFetchNetworkError,
  formatPlaywrightNavigationError,
  collectExecutionTargetUrls,
  isPrivateNetworkExecutionBlocked,
} from '../networkReachability.js'

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

describe('formatPlaywrightNavigationError', () => {
  test('explains timeout for internal-style failures', () => {
    const msg = formatPlaywrightNavigationError(
      { message: 'page.goto: Timeout 30000ms exceeded.' },
      'http://10.216.67.142:3000/login'
    )
    expect(msg).toMatch(/Timeout membuka halaman/i)
    expect(msg).toMatch(/10\.216\.67\.142/)
    expect(msg).toMatch(/internal|VPN|publik/i)
  })
})

describe('collectExecutionTargetUrls', () => {
  test('collects scenario url and NAVIGATE steps', () => {
    const urls = collectExecutionTargetUrls(
      { url: 'https://example.com' },
      [
        { type: 'NAVIGATE', value: 'http://10.0.0.1/login' },
        { type: 'CLICK', value: 'ignored' },
        { type: 'NAVIGATE', value: 'https://example.com' },
      ]
    )
    expect(urls).toEqual(
      expect.arrayContaining(['https://example.com/', 'http://10.0.0.1/login'])
    )
  })
})

describe('isPrivateNetworkExecutionBlocked', () => {
  const prevNode = process.env.NODE_ENV
  const prevAllow = process.env.ALLOW_PRIVATE_NETWORK_EXECUTION

  afterEach(() => {
    process.env.NODE_ENV = prevNode
    if (prevAllow === undefined) delete process.env.ALLOW_PRIVATE_NETWORK_EXECUTION
    else process.env.ALLOW_PRIVATE_NETWORK_EXECUTION = prevAllow
  })

  test('blocks in production by default', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.ALLOW_PRIVATE_NETWORK_EXECUTION
    expect(isPrivateNetworkExecutionBlocked()).toBe(true)
  })

  test('allows override and non-production', () => {
    process.env.NODE_ENV = 'production'
    process.env.ALLOW_PRIVATE_NETWORK_EXECUTION = 'true'
    expect(isPrivateNetworkExecutionBlocked()).toBe(false)

    delete process.env.ALLOW_PRIVATE_NETWORK_EXECUTION
    process.env.NODE_ENV = 'test'
    expect(isPrivateNetworkExecutionBlocked()).toBe(false)
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

describe('preflightExecutionTargets', () => {
  test('blocks private IP in production', async () => {
    const prevNode = process.env.NODE_ENV
    const prevAllow = process.env.ALLOW_PRIVATE_NETWORK_EXECUTION
    process.env.NODE_ENV = 'production'
    delete process.env.ALLOW_PRIVATE_NETWORK_EXECUTION

    const { preflightExecutionTargets } = await import('../networkReachability.js')
    const result = await preflightExecutionTargets(['http://10.216.67.142:3000/login'])
    expect(result.privateNetwork).toBe(true)
    expect(result.blocked).toBe(true)
    expect(result.code).toBe('PRIVATE_NETWORK')

    process.env.NODE_ENV = prevNode
    if (prevAllow === undefined) delete process.env.ALLOW_PRIVATE_NETWORK_EXECUTION
    else process.env.ALLOW_PRIVATE_NETWORK_EXECUTION = prevAllow
  })
})
