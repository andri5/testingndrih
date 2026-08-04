#!/usr/bin/env node
/**
 * Hybrid local agent (P2 — durable queue)
 *
 * Runs on a machine that can reach private/VPN staging URLs.
 * Polls the cloud API for queued jobs, executes Playwright locally, reports back.
 * Results are stored as Execution + StepResult on the server.
 *
 * Usage:
 *   set AGENT_API_URL=https://testsambilngopi.com
 *   set AGENT_TOKEN=tsn_your_api_token
 *   node scripts/local-agent/run.mjs
 *
 * Create an API token in Settings → API Tokens.
 */

import { chromium, firefox, webkit } from 'playwright'

const API_URL = (process.env.AGENT_API_URL || 'http://localhost:5001').replace(/\/$/, '')
const TOKEN = process.env.AGENT_TOKEN || process.env.API_TOKEN || ''
const POLL_MS = Number(process.env.AGENT_POLL_MS || 5000)

if (!TOKEN) {
  console.error('Set AGENT_TOKEN (API token tsn_...) before starting the agent.')
  process.exit(1)
}

const engines = { chromium, firefox, webkit }

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}/api/agent${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || `HTTP ${res.status}`)
  }
  return data
}

async function runSteps(scenario, options = {}) {
  const name = options.browser && engines[options.browser] ? options.browser : 'chromium'
  const browser = await engines[name].launch({
    headless: options.headless !== false,
    args: name === 'chromium' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
  })
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  const results = []

  try {
    if (scenario.url) {
      await page.goto(scenario.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    }

    for (const step of scenario.steps || []) {
      const started = Date.now()
      try {
        switch (step.type) {
          case 'NAVIGATE':
            await page.goto(step.value || scenario.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
            break
          case 'CLICK':
            await page.locator(step.selector).first().click({ timeout: 15000 })
            break
          case 'FILL':
            await page.locator(step.selector).first().fill(step.value || '', { timeout: 15000 })
            break
          case 'WAIT':
            await page.waitForTimeout(Number(step.value) || 1000)
            break
          case 'ASSERTION':
            await page.locator(step.selector).first().waitFor({ state: 'visible', timeout: 15000 })
            break
          default:
            console.warn(`[agent] Skipping unsupported step type: ${step.type}`)
        }
        results.push({ stepId: step.id, status: 'PASSED', duration: Date.now() - started })
      } catch (err) {
        results.push({
          stepId: step.id,
          status: 'FAILED',
          duration: Date.now() - started,
          error: err.message,
        })
        throw err
      }
    }

    return { success: true, result: { passed: results.length, failed: 0, steps: results } }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      result: {
        passed: results.filter((r) => r.status === 'PASSED').length,
        failed: results.filter((r) => r.status === 'FAILED').length,
        steps: results,
      },
    }
  } finally {
    await context.close().catch(() => {})
    await browser.close().catch(() => {})
  }
}

async function loop() {
  console.log(`[agent] Polling ${API_URL} every ${POLL_MS}ms (durable DB queue)`)
  for (;;) {
    try {
      const { job } = await api('/jobs/next')
      if (!job) {
        await new Promise((r) => setTimeout(r, POLL_MS))
        continue
      }
      console.log(
        `[agent] Claimed job ${job.id} → execution ${job.executionId || '?'} (scenario ${job.scenarioId})`
      )
      if (!job.scenario) {
        await api(`/jobs/${job.id}/complete`, {
          method: 'POST',
          body: JSON.stringify({ success: false, error: 'Scenario missing' }),
        })
        continue
      }
      const outcome = await runSteps(job.scenario, job.options || {})
      await api(`/jobs/${job.id}/complete`, {
        method: 'POST',
        body: JSON.stringify(outcome),
      })
      console.log(
        `[agent] Job ${job.id} → ${outcome.success ? 'COMPLETED' : 'FAILED'} (execution ${job.executionId || '?'})`
      )
    } catch (err) {
      console.error(`[agent] Error: ${err.message}`)
      await new Promise((r) => setTimeout(r, POLL_MS))
    }
  }
}

loop()
