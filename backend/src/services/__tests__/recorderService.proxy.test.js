jest.mock('../../lib/prisma.js')
jest.mock('../../utils/networkReachability.js', () => {
  const actualSummarize = (reach) => {
    const privateNetwork = Boolean(reach?.privateNetwork)
    return {
      targetKind: privateNetwork ? 'internal' : 'public',
      reachability: {
        privateNetwork,
        ok: reach?.ok !== false && !privateNetwork,
        reason: reach?.reason || null,
        addresses: Array.isArray(reach?.addresses) ? reach.addresses : [],
        message: reach?.message || null,
      },
    }
  }
  return {
    analyzeTargetReachability: jest.fn(async () => ({
      ok: true,
      reason: null,
      privateNetwork: false,
      addresses: ['93.184.216.34'],
    })),
    summarizeTargetReachability: jest.fn(actualSummarize),
  }
})

import {
  resolveRecordingMode,
  buildProxyRecordingUrl,
  buildClientGateUrl,
  recorderService,
} from '../recorderService.js'
import { analyzeTargetReachability } from '../../utils/networkReachability.js'
import { prisma } from '../../lib/prisma.js'

describe('recorderService recording mode helpers', () => {
  const originalEnv = process.env.RECORDING_MODE

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.RECORDING_MODE
    else process.env.RECORDING_MODE = originalEnv
  })

  test('defaults to client-direct', () => {
    delete process.env.RECORDING_MODE
    expect(resolveRecordingMode()).toBe('client-direct')
  })

  test('respects RECORDING_MODE=playwright', () => {
    process.env.RECORDING_MODE = 'playwright'
    expect(resolveRecordingMode()).toBe('playwright')
  })

  test('explicit proxy wins over env playwright', () => {
    process.env.RECORDING_MODE = 'playwright'
    expect(resolveRecordingMode('proxy')).toBe('proxy')
  })

  test('explicit playwright wins over env proxy', () => {
    process.env.RECORDING_MODE = 'proxy'
    expect(resolveRecordingMode('playwright')).toBe('playwright')
  })

  test('respects RECORDING_MODE=proxy', () => {
    process.env.RECORDING_MODE = 'proxy'
    expect(resolveRecordingMode()).toBe('proxy')
  })

  test('buildProxyRecordingUrl encodes url and session', () => {
    const url = buildProxyRecordingUrl('scen-1', 'https://example.com/path?q=1')
    expect(url).toBe(
      '/api/recorder/proxy?url=' +
        encodeURIComponent('https://example.com/path?q=1') +
        '&sessionId=' +
        encodeURIComponent('scen-1')
    )
  })

  test('buildClientGateUrl includes record token', () => {
    const url = buildClientGateUrl('scen-1', 'https://intranet.example/login', 'tok123')
    expect(url).toContain('/api/recorder/client-gate?')
    expect(url).toContain('sessionId=scen-1')
    expect(url).toContain('rt=tok123')
    expect(url).toContain(encodeURIComponent('https://intranet.example/login'))
  })
})

describe('recorder noise filtering', () => {
  test('filters Google Translate widget steps', async () => {
    analyzeTargetReachability.mockResolvedValueOnce({
      ok: true,
      privateNetwork: false,
      addresses: ['1.1.1.1'],
    })
    prisma.scenario = {
      findFirst: jest.fn().mockResolvedValue({
        id: 'scen-noise',
        userId: 'user-1',
        url: 'https://example.com',
      }),
    }
    const result = await recorderService.startRecording(
      'user-1',
      'scen-noise',
      'https://example.com',
      'proxy'
    )
    expect(result.method).toBe('proxy')
    expect(
      recorderService.addStep('user-1', 'scen-noise', {
        type: 'FILL',
        selector: '[aria-label="Language Translate Widget"]',
        value: '',
        description: 'Select ""',
      })
    ).toBe(true)
    expect(recorderService.getStatus('user-1', 'scen-noise').stepCount).toBe(0)

    expect(
      recorderService.addStep('user-1', 'scen-noise', {
        type: 'FILL',
        selector: '#email',
        value: 'a@b.com',
        description: 'Fill email',
      })
    ).toBe(true)
    expect(recorderService.getStatus('user-1', 'scen-noise').stepCount).toBe(1)

    expect(
      recorderService.addStep('user-1', 'scen-noise', {
        type: 'NAVIGATE',
        value: 'http://localhost:3000/api/recorder/asset?url=http://x',
        description: 'Navigate proxy asset',
      })
    ).toBe(true)
    expect(recorderService.getStatus('user-1', 'scen-noise').stepCount).toBe(1)

    await recorderService.stopRecording('user-1', 'scen-noise')
    expect(resolveRecordingMode('proxy')).toBe('proxy')
  })
})

describe('recorderService.startRecording proxy mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    analyzeTargetReachability.mockResolvedValue({
      ok: true,
      privateNetwork: false,
      addresses: ['93.184.216.34'],
    })
    prisma.scenario = {
      findFirst: jest.fn().mockResolvedValue({
        id: 'scen-1',
        userId: 'user-1',
        url: 'https://example.com',
      }),
    }
  })

  afterEach(async () => {
    try {
      await recorderService.stopRecording('user-1', 'scen-1')
    } catch (_) {
      /* no session */
    }
  })

  test('starts proxy session and returns proxyUrl without launching browser', async () => {
    const result = await recorderService.startRecording(
      'user-1',
      'scen-1',
      'https://the-internet.herokuapp.com/login',
      'proxy'
    )

    expect(result.status).toBe('recording')
    expect(result.method).toBe('proxy')
    expect(result.targetKind).toBe('public')
    expect(result.proxyUrl).toContain('/api/recorder/proxy?')
    expect(result.proxyUrl).toContain(encodeURIComponent('https://the-internet.herokuapp.com/login'))

    const status = recorderService.getStatus('user-1', 'scen-1')
    expect(status.status).toBe('recording')
    expect(status.stepCount).toBe(0)

    expect(recorderService.addStep('user-1', 'scen-1', {
      type: 'CLICK',
      selector: '#login',
      description: 'Click login',
    })).toBe(true)

    expect(recorderService.getStatus('user-1', 'scen-1').stepCount).toBe(1)
  })

  test('defaults to client-direct for public sites', async () => {
    const result = await recorderService.startRecording(
      'user-1',
      'scen-1',
      'https://www.erafone.com/',
      undefined
    )

    expect(result.method).toBe('client-direct')
    expect(result.targetKind).toBe('public')
    expect(result.proxyUrl).toBeNull()
    expect(result.clientGateUrl).toContain('/api/recorder/client-gate?')
  })

  test('uses client-direct when target resolves to private IP', async () => {
    analyzeTargetReachability.mockResolvedValueOnce({
      ok: false,
      reason: 'private_network',
      privateNetwork: true,
      addresses: ['10.216.218.150'],
      message: 'private',
    })

    const result = await recorderService.startRecording(
      'user-1',
      'scen-1',
      'https://test-garuda-fe.kemenkeu.go.id/login',
      'proxy'
    )

    expect(result.method).toBe('client-direct')
    expect(result.targetKind).toBe('internal')
    expect(result.modeForced).toBe(true)
    expect(result.proxyUrl).toBeNull()
    expect(result.clientGateUrl).toContain('/api/recorder/client-gate?')
    expect(result.clientGateUrl).toContain('rt=')

    const session = recorderService.findActiveSessionByScenarioId('scen-1')
    expect(session.recordToken).toBeTruthy()
    expect(
      recorderService.addStepByRecordToken('scen-1', session.recordToken, {
        type: 'CLICK',
        selector: '#login',
        description: 'Click login',
      })
    ).toBe(true)
    expect(recorderService.getStatus('user-1', 'scen-1').stepCount).toBe(1)
  })

  test('probeTarget returns public/internal kind', async () => {
    analyzeTargetReachability.mockResolvedValueOnce({
      ok: true,
      privateNetwork: false,
      addresses: ['8.8.8.8'],
    })
    await expect(recorderService.probeTarget('https://example.com')).resolves.toMatchObject({
      targetKind: 'public',
    })

    analyzeTargetReachability.mockResolvedValueOnce({
      ok: false,
      privateNetwork: true,
      addresses: ['10.0.0.1'],
      reason: 'private_network',
    })
    await expect(recorderService.probeTarget('https://intranet.local/app')).resolves.toMatchObject({
      targetKind: 'internal',
    })
  })

  test('rejects second concurrent recording for same scenario', async () => {
    await recorderService.startRecording('user-1', 'scen-1', 'https://example.com', 'proxy')
    await expect(
      recorderService.startRecording('user-1', 'scen-1', 'https://example.com', 'proxy')
    ).rejects.toThrow(/sudah berjalan/)
  })
})
