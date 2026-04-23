#!/usr/bin/env node

/**
 * 🎬 PLAYWRIGHT RECORDER - DEBUG TEST
 * 
 * This script shows raw API responses to diagnose issues
 */

const API_BASE = 'http://localhost:5001/api'

async function apiCall(method, endpoint, body = null, token = null) {
  const url = `${API_BASE}${endpoint}`
  const options = { method, headers: { 'Content-Type': 'application/json' } }
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`
  }
  
  if (body) options.body = JSON.stringify(body)
  
  try {
    const res = await fetch(url, options)
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
    return { status: res.status, data }
  } catch (err) {
    return { status: 0, error: err.message }
  }
}

async function test() {
  console.log('\n🔍 TESTING RAW API RESPONSES\n')
  
  // Test 1: Auth
  console.log('1️⃣  AUTH ENDPOINT')
  const authRes = await apiCall('POST', '/auth/register', {
    email: 'test-' + Date.now() + '@example.com',
    password: 'TestPassword123!',
    name: 'Test User'
  })
  console.log('Status:', authRes.status)
  console.log('Response:', JSON.stringify(authRes.data, null, 2))
  
  if (authRes.status !== 201 && authRes.status !== 200) {
    console.log('❌ Auth failed, stopping here\n')
    return
  }
  
  const token = authRes.data.token
  console.log('Token:', token.slice(0, 30) + '...\n')
  
  // Test 2: Scenario Creation
  console.log('2️⃣  SCENARIO CREATION')
  const scenarioRes = await apiCall('POST', '/scenarios', {
    name: 'Test Scenario ' + Date.now(),
    description: 'Test scenario for recorder',
    url: 'https://example.com'
  }, token)
  console.log('Status:', scenarioRes.status)
  console.log('Response:', JSON.stringify(scenarioRes.data, null, 2))
  
  if (scenarioRes.status !== 201 && scenarioRes.status !== 200) {
    console.log('❌ Scenario creation failed\n')
    return
  }
  
  const scenarioId = scenarioRes.data.scenario?.id || scenarioRes.data.id
  console.log('Scenario ID:', scenarioId, '\n')
  
  // Test 3: Recording Start
  console.log('3️⃣  RECORDING START')
  const startRes = await apiCall('POST', '/recorder/start', {
    scenarioId,
    url: 'https://example.com'
  }, token)
  console.log('Status:', startRes.status)
  console.log('Response:', JSON.stringify(startRes.data, null, 2), '\n')
  
  // Test 4: Recording Status
  console.log('4️⃣  RECORDING STATUS')
  const statusRes = await apiCall('GET', `/recorder/status/${scenarioId}`, null, token)
  console.log('Status:', statusRes.status)
  console.log('Response:', JSON.stringify(statusRes.data, null, 2), '\n')
  
  // Test 5: Recording Stop
  if (startRes.status === 202 || startRes.status === 200) {
    console.log('5️⃣  RECORDING STOP')
    const stopRes = await apiCall('POST', '/recorder/stop', {
      scenarioId
    }, token)
    console.log('Status:', stopRes.status)
    console.log('Response:', JSON.stringify(stopRes.data, null, 2), '\n')
  }
}

test()
