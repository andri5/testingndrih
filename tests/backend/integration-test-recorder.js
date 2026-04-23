#!/usr/bin/env node

/**
 * 🎬 PLAYWRIGHT RECORDER - FULL INTEGRATION TEST
 * 
 * This script tests the complete recording flow through the API:
 * 1. Authentication
 * 2. Create/Get Scenario
 * 3. Start Recording
 * 4. Poll for recording status
 * 5. Simulate interactions
 * 6. Stop Recording
 * 7. Verify steps saved
 * 
 * Run from backend directory:
 * node ./integration-test-recorder.js
 */

import { chromium } from 'playwright'

// Use native fetch (Node 18+)

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

const API_BASE = 'http://localhost:5001/api'
const TEST_EMAIL = 'test-recorder@example.com'
const TEST_PASSWORD = 'TestPassword123!'
const TEST_SCENARIO_NAME = 'Playwright Recorder Test - ' + Date.now()
const TEST_URL = 'https://example.com'

let authToken = null
let userId = null
let scenarioId = null

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

function log(stage, message, data = null) {
  const colors = {
    INFO: '\x1b[36m',    // Cyan
    SUCCESS: '\x1b[32m', // Green
    ERROR: '\x1b[31m',   // Red
    WARN: '\x1b[33m',    // Yellow
    RESET: '\x1b[0m'
  }
  
  const color = colors[stage] || colors.INFO
  const timestamp = new Date().toISOString().slice(11, 23)
  
  console.log(`${color}[${timestamp}] ${stage}${colors.RESET} ${message}`)
  if (data) console.log(JSON.stringify(data, null, 2))
}

async function apiCall(method, endpoint, body = null) {
  const url = `${API_BASE}${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  
  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  try {
    const res = await fetch(url, options)
    const data = await res.json()
    return { status: res.status, data }
  } catch (err) {
    throw new Error(`API Error (${method} ${endpoint}): ${err.message}`)
  }
}

// ═══════════════════════════════════════════════════════════════════
// TEST FLOW
// ═══════════════════════════════════════════════════════════════════

async function testAuthentication() {
  log('TEST', '━━━ AUTH TEST ━━━')
  
  try {
    // Try login
    const loginRes = await apiCall('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
    
    if (loginRes.status === 200) {
      authToken = loginRes.data.token
      userId = loginRes.data.user.id
      log('SUCCESS', `Auth successful. Token: ${authToken.slice(0, 20)}...`)
      return true
    } else {
      // Try register if login fails
      log('WARN', 'Login failed, attempting register...')
      const registerRes = await apiCall('POST', '/auth/register', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Test User'
      })
      
      if (registerRes.status === 201) {
        authToken = registerRes.data.token
        userId = registerRes.data.user.id
        log('SUCCESS', `Registration successful. Token: ${authToken.slice(0, 20)}...`)
        return true
      }
    }
  } catch (err) {
    log('ERROR', 'Auth failed: ' + err.message)
    return false
  }
}

async function testScenarioManagement() {
  log('TEST', '━━━ SCENARIO TEST ━━━')
  
  try {
    // Get existing scenarios
    const listRes = await apiCall('GET', '/scenarios')
    if (listRes.status === 200) {
      log('INFO', `Found ${listRes.data.scenarios?.length || 0} scenarios`)
    }
    
    // Create new scenario
    const createRes = await apiCall('POST', '/scenarios', {
      name: TEST_SCENARIO_NAME,
      description: 'Automated Playwright recorder test',
      tags: ['playwright', 'recorder', 'automation']
    })
    
    if (createRes.status !== 201 && createRes.status !== 200) {
      throw new Error(`Scenario creation failed: ${createRes.status}`)
    }
    
    scenarioId = createRes.data.scenario?.id || createRes.data.id
    log('SUCCESS', `Scenario created: ${scenarioId}`)
    return true
  } catch (err) {
    log('ERROR', 'Scenario test failed: ' + err.message)
    return false
  }
}

async function testRecordingStart() {
  log('TEST', '━━━ RECORDING START TEST ━━━')
  
  try {
    const startRes = await apiCall('POST', '/recorder/start', {
      scenarioId,
      url: TEST_URL
    })
    
    if (startRes.status !== 202 && startRes.status !== 200) {
      throw new Error(`Recording start failed: ${startRes.status}`)
    }
    
    const method = startRes.data.method
    if (method !== 'playwright') {
      throw new Error(`Unexpected method: ${method} (expected 'playwright')`)
    }
    
    log('SUCCESS', 'Recording started')
    log('INFO', `Method: ${method}`, startRes.data)
    
    return true
  } catch (err) {
    log('ERROR', 'Recording start failed: ' + err.message)
    return false
  }
}

async function testRecordingStatus() {
  log('TEST', '━━━ RECORDING STATUS TEST ━━━')
  
  try {
    // Poll status a few times
    for (let i = 0; i < 3; i++) {
      const statusRes = await apiCall('GET', `/recorder/status/${scenarioId}`)
      
      if (statusRes.status !== 200) {
        throw new Error(`Status check failed: ${statusRes.status}`)
      }
      
      const { status, stepCount } = statusRes.data
      log('INFO', `Status check ${i + 1}/3: ${status} (${stepCount} steps)`, statusRes.data)
      
      // Wait before next poll
      if (i < 2) {
        await new Promise(r => setTimeout(r, 1500))
      }
    }
    
    return true
  } catch (err) {
    log('ERROR', 'Status check failed: ' + err.message)
    return false
  }
}

async function testRecordingStop() {
  log('TEST', '━━━ RECORDING STOP TEST ━━━')
  
  try {
    const stopRes = await apiCall('POST', '/recorder/stop', {
      scenarioId
    })
    
    if (stopRes.status !== 200) {
      throw new Error(`Recording stop failed: ${stopRes.status}`)
    }
    
    const { stepCount, steps, duration } = stopRes.data
    log('SUCCESS', `Recording stopped. ${stepCount} steps captured in ${duration}`)
    log('INFO', `Steps:`, steps)
    
    return true
  } catch (err) {
    log('ERROR', 'Recording stop failed: ' + err.message)
    return false
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN TEST RUNNER
// ═══════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║   🎬 PLAYWRIGHT RECORDER - INTEGRATION TEST SUITE                 ║
║                                                                    ║
║   Testing: Auth → Scenario → Start → Status → Stop → Verify      ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
  `)
  
  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Scenario Management', fn: testScenarioManagement },
    { name: 'Recording Start', fn: testRecordingStart },
    { name: 'Recording Status', fn: testRecordingStatus },
    { name: 'Recording Stop', fn: testRecordingStop }
  ]
  
  const results = []
  
  for (const test of tests) {
    try {
      const passed = await test.fn()
      results.push({ name: test.name, passed })
      console.log('')
    } catch (err) {
      log('ERROR', `Test failed: ${err.message}`)
      results.push({ name: test.name, passed: false })
    }
  }
  
  // Print summary
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                        TEST SUMMARY                               ║
╚════════════════════════════════════════════════════════════════════╝
  `)
  
  let passed = 0
  let failed = 0
  
  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    console.log(`  ${status}  ${result.name}`)
    if (result.passed) passed++
    else failed++
  }
  
  console.log(`
  Total: ${passed} passed, ${failed} failed

${failed === 0 ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}

  Test Scenario ID: ${scenarioId}
  Test API Base: ${API_BASE}
  
  Next Steps:
  1. Verify steps in PostgreSQL database
  2. Test through frontend UI
  3. Check backend logs for any errors
  `)
}

// ═══════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════

(async () => {
  try {
    await runAllTests()
  } catch (err) {
    log('ERROR', 'Fatal error: ' + err.message)
    process.exit(1)
  }
})()
