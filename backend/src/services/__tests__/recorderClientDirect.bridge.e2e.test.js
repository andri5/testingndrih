/**
 * End-to-end: client-direct CSP-safe recording via postMessage bridge.
 * Simulates Start Recording → gate → target inject → click → steps in session.
 */
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
      addresses: ['127.0.0.1'],
    })),
    summarizeTargetReachability: jest.fn(actualSummarize),
  }
})

import http from 'http'
import express from 'express'
import { chromium } from 'playwright'
import { getRecorderScript, recorderService } from '../recorderService.js'
import { recorderController } from '../../controllers/recorderController.js'
import { prisma } from '../../lib/prisma.js'

async function waitFor(predicate, { timeout = 15000, interval = 200 } = {}) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    // eslint-disable-next-line no-await-in-loop
    const value = await predicate()
    if (value) return value
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, interval))
  }
  throw new Error(`waitFor timed out after ${timeout}ms`)
}

describe('client-direct CSP bridge E2E', () => {
  let appServer
  let targetServer
  let appPort
  let targetPort
  let browser

  beforeAll(async () => {
    targetServer = http.createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        // Block connect to recorder origin — forces postMessage bridge (real Garuda-style CSP)
        'Content-Security-Policy':
          "default-src 'self'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src 'self'; style-src 'unsafe-inline'",
      })
      res.end(`<!DOCTYPE html>
<html lang="en"><head><title>Fixture Login</title></head>
<body>
  <h1>Fixture Login</h1>
  <input id="username" name="username" placeholder="user" />
  <button id="login" type="button">Login</button>
</body></html>`)
    })
    await new Promise((resolve) => targetServer.listen(0, '127.0.0.1', resolve))
    targetPort = targetServer.address().port

    const app = express()
    app.set('trust proxy', true)
    app.use(express.json({ limit: '1mb' }))
    app.get('/api/recorder/client-gate', (req, res) => recorderController.clientGate(req, res))
    app.options('/api/recorder/client-step/:scenarioId', (req, res) =>
      recorderController.optionsClientStep(req, res)
    )
    app.post('/api/recorder/client-step/:scenarioId', (req, res) =>
      recorderController.receiveClientStep(req, res)
    )

    appServer = http.createServer(app)
    await new Promise((resolve) => appServer.listen(0, '127.0.0.1', resolve))
    appPort = appServer.address().port

    browser = await chromium.launch({ headless: true })
  }, 90000)

  afterAll(async () => {
    if (browser) await browser.close().catch(() => {})
    if (appServer) await new Promise((resolve) => appServer.close(resolve))
    if (targetServer) await new Promise((resolve) => targetServer.close(resolve))
  })

  beforeEach(() => {
    prisma.scenario = {
      findFirst: jest.fn().mockResolvedValue({
        id: 'scen-bridge-e2e',
        userId: 'user-bridge-e2e',
        url: `http://127.0.0.1:${targetPort}/`,
      }),
    }
  })

  afterEach(async () => {
    try {
      await recorderService.stopRecording('user-bridge-e2e', 'scen-bridge-e2e')
    } catch (_) {
      /* no session */
    }
  })

  test('getRecorderScript uses ACK-based client-direct delivery', () => {
    const script = getRecorderScript('scen-x', { recordToken: 'tok-x' })
    expect(script).toContain('__REC_STEP_ACK__')
    expect(script).toContain('__REC_BRIDGE_READY__')
    expect(script).toContain('__recFlushBridgeQueue')
    expect(script).toContain('__rec_bridge_iframe')
    expect(script).toContain('Connected (direct)')
  })

  test('start → inject → click records steps end-to-end via bridge', async () => {
    const targetUrl = `http://127.0.0.1:${targetPort}/`
    const started = await recorderService.startRecording(
      'user-bridge-e2e',
      'scen-bridge-e2e',
      targetUrl,
      'client-direct'
    )

    expect(started.method).toBe('client-direct')
    expect(started.recordToken).toBeTruthy()
    expect(started.clientGateUrl).toContain('/api/recorder/client-gate?')

    const session = recorderService.findActiveSessionByScenarioId('scen-bridge-e2e')
    const gateUrl =
      `http://127.0.0.1:${appPort}/api/recorder/client-gate?` +
      new URLSearchParams({
        url: targetUrl,
        sessionId: 'scen-bridge-e2e',
        rt: session.recordToken,
      }).toString()

    const context = await browser.newContext()
    const gatePage = await context.newPage()
    await gatePage.goto(gateUrl, { waitUntil: 'domcontentloaded' })
    await gatePage.locator('#openTarget').waitFor({ state: 'visible' })

    const [targetPage] = await Promise.all([
      context.waitForEvent('page'),
      gatePage.click('#openTarget'),
    ])
    await targetPage.waitForLoadState('domcontentloaded')

    const snippet = await gatePage.evaluate(() => {
      const el = document.getElementById('rec-payload')
      return JSON.parse(el.textContent || '""')
    })
    expect(snippet).toContain('__recRecordToken')
    expect(snippet).toContain('__REC_STEP_ACK__')

    await targetPage.addScriptTag({ content: snippet })

    await targetPage.waitForFunction(() => !!document.getElementById('__rec_toolbar'), null, {
      timeout: 10000,
    })

    // Wait for NAVIGATE (and/or bridge ACK) to land in session
    await waitFor(() => recorderService.getStatus('user-bridge-e2e', 'scen-bridge-e2e').stepCount >= 1)

    await targetPage.click('#login')
    await targetPage.fill('#username', 'demo-user')

    await waitFor(() => recorderService.getStatus('user-bridge-e2e', 'scen-bridge-e2e').stepCount >= 2)

    const status = recorderService.getStatus('user-bridge-e2e', 'scen-bridge-e2e')
    expect(status.status).toBe('recording')
    expect(status.stepCount).toBeGreaterThanOrEqual(2)

    const types = (status.steps || []).map((s) => s.type)
    expect(types).toEqual(expect.arrayContaining(['NAVIGATE', 'CLICK']))

    const bridgeText = await gatePage.locator('#bridgeStatus').textContent()
    expect(bridgeText).toMatch(/Bridge OK/i)

    const stopped = await recorderService.stopRecording('user-bridge-e2e', 'scen-bridge-e2e')
    expect(stopped.steps.length).toBeGreaterThanOrEqual(2)

    await context.close()
  }, 90000)

  test('Hubungkan bridge recovers steps when opener is missing (COOP-style)', async () => {
    const targetUrl = `http://127.0.0.1:${targetPort}/`
    await recorderService.startRecording(
      'user-bridge-e2e',
      'scen-bridge-e2e',
      targetUrl,
      'client-direct'
    )
    const session = recorderService.findActiveSessionByScenarioId('scen-bridge-e2e')
    const gateUrl =
      `http://127.0.0.1:${appPort}/api/recorder/client-gate?` +
      new URLSearchParams({
        url: targetUrl,
        sessionId: 'scen-bridge-e2e',
        rt: session.recordToken,
      }).toString()

    const context = await browser.newContext()
    // Open target WITHOUT opener (simulates COOP clearing window.opener)
    const targetPage = await context.newPage()
    await targetPage.goto(targetUrl, { waitUntil: 'domcontentloaded' })

    // Build inject payload the same way the gate does
    const gatePage = await context.newPage()
    await gatePage.goto(gateUrl, { waitUntil: 'domcontentloaded' })
    const snippet = await gatePage.evaluate(() => {
      const el = document.getElementById('rec-payload')
      return JSON.parse(el.textContent || '""')
    })
    await gatePage.close()

    const popupPromise = context.waitForEvent('page')
    await targetPage.addScriptTag({ content: snippet })
    await targetPage.waitForFunction(() => typeof window.__recConnectBridge === 'function', null, {
      timeout: 10000,
    })

    // Auto-connect may already open the bridge; otherwise click Hubungkan path
    let bridgePopup = null
    try {
      bridgePopup = await Promise.race([
        popupPromise,
        targetPage.waitForTimeout
          ? targetPage.waitForTimeout(1800).then(() => null)
          : new Promise((r) => setTimeout(() => r(null), 1800)),
      ])
    } catch (_) {
      bridgePopup = null
    }
    if (!bridgePopup) {
      ;[bridgePopup] = await Promise.all([
        context.waitForEvent('page'),
        targetPage.evaluate(() => window.__recConnectBridge()),
      ])
    }

    await bridgePopup.waitForLoadState('domcontentloaded')
    await targetPage.waitForFunction(() => !!document.getElementById('__rec_toolbar'), null, {
      timeout: 10000,
    })

    await targetPage.click('#login')

    await waitFor(() => recorderService.getStatus('user-bridge-e2e', 'scen-bridge-e2e').stepCount >= 1)

    const status = recorderService.getStatus('user-bridge-e2e', 'scen-bridge-e2e')
    expect(status.stepCount).toBeGreaterThanOrEqual(1)
    expect((status.steps || []).some((s) => s.type === 'CLICK' || s.type === 'NAVIGATE')).toBe(true)

    await context.close()
  }, 90000)
})
