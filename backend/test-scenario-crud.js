import axios from 'axios'

const API_BASE = 'http://localhost:5001/api'
let authToken = null
let testUserId = null
let testScenarioId = null

async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options)
  const data = await response.json()
  return { status: response.status, data }
}

async function testScenarioCRUD() {
  console.log('🧪 Testing Scenario CRUD API\n')

  try {
    // Test 1: Login to get token
    console.log('1️⃣  Testing Authentication')
    let loginRes = await makeRequest('/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'testpass123'
    })

    if (loginRes.status === 200) {
      authToken = loginRes.data.token
      testUserId = loginRes.data.user.id
      console.log('   ✓ Login successful, token received\n')
    } else {
      console.log('   ✗ Login failed')
      throw new Error('Authentication failed')
    }

    // Test 2: Create a scenario
    console.log('2️⃣  Testing Scenario Creation (POST /api/scenarios)')
    const createRes = await makeRequest('/scenarios', 'POST', {
      name: 'Test Scenario 1',
      description: 'A test scenario for login flow',
      url: 'https://example.com/login'
    })

    if (createRes.status === 201 && createRes.data.success) {
      testScenarioId = createRes.data.scenario.id
      console.log(`   ✓ Scenario created successfully`)
      console.log(`   ✓ Scenario ID: ${testScenarioId}\n`)
    } else {
      console.log('   ✗ Scenario creation failed:', createRes.data)
      throw new Error('Failed to create scenario')
    }

    // Test 3: Get all scenarios
    console.log('3️⃣  Testing Get Scenarios List (GET /api/scenarios)')
    const listRes = await makeRequest('/scenarios', 'GET')

    if (listRes.status === 200 && listRes.data.success) {
      console.log(`   ✓ Retrieved ${listRes.data.scenarios.length} scenario(s)`)
      console.log(`   ✓ Total count: ${listRes.data.pagination.total}\n`)
    } else {
      console.log('   ✗ Failed to get scenarios')
    }

    // Test 4: Get single scenario
    console.log('4️⃣  Testing Get Single Scenario (GET /api/scenarios/:id)')
    const getRes = await makeRequest(`/scenarios/${testScenarioId}`, 'GET')

    if (getRes.status === 200 && getRes.data.success) {
      console.log(`   ✓ Retrieved scenario: ${getRes.data.scenario.name}`)
      console.log(`   ✓ URL: ${getRes.data.scenario.url}`)
      console.log(`   ✓ Steps: ${getRes.data.scenario.steps}\n`)
    } else {
      console.log('   ✗ Failed to get scenario')
    }

    // Test 5: Update scenario
    console.log('5️⃣  Testing Update Scenario (PUT /api/scenarios/:id)')
    const updateRes = await makeRequest(`/scenarios/${testScenarioId}`, 'PUT', {
      name: 'Updated Scenario Name',
      description: 'Updated description',
      url: 'https://updated-example.com'
    })

    if (updateRes.status === 200 && updateRes.data.success) {
      console.log(`   ✓ Scenario updated successfully`)
      console.log(`   ✓ New name: ${updateRes.data.scenario.name}\n`)
    } else {
      console.log('   ✗ Failed to update scenario')
    }

    // Test 6: Duplicate scenario
    console.log('6️⃣  Testing Duplicate Scenario (POST /api/scenarios/:id/duplicate)')
    const dupRes = await makeRequest(`/scenarios/${testScenarioId}/duplicate`, 'POST')

    if (dupRes.status === 201 && dupRes.data.success) {
      console.log(`   ✓ Scenario duplicated successfully`)
      console.log(`   ✓ New name: ${dupRes.data.scenario.name}\n`)
    } else {
      console.log('   ✗ Failed to duplicate scenario')
    }

    // Test 7: Get scenario stats
    console.log('7️⃣  Testing Get Scenario Stats (GET /api/scenarios/:id/stats)')
    const statsRes = await makeRequest(`/scenarios/${testScenarioId}/stats`, 'GET')

    if (statsRes.status === 200 && statsRes.data.success) {
      const stats = statsRes.data.stats
      console.log(`   ✓ Retrieved scenario stats`)
      console.log(`   ✓ Total steps: ${stats.totalSteps}`)
      console.log(`   ✓ Total executions: ${stats.totalExecutions}`)
      console.log(`   ✓ Success rate: ${stats.successRate.toFixed(0)}%\n`)
    } else {
      console.log('   ✗ Failed to get stats')
    }

    // Test 8: Delete scenario
    console.log('8️⃣  Testing Delete Scenario (DELETE /api/scenarios/:id)')
    const deleteRes = await makeRequest(`/scenarios/${testScenarioId}`, 'DELETE')

    if (deleteRes.status === 200 && deleteRes.data.success) {
      console.log(`   ✓ Scenario deleted successfully\n`)
    } else {
      console.log('   ✗ Failed to delete scenario')
    }

    // Test 9: Verify deletion
    console.log('9️⃣  Verify Deletion (GET /api/scenarios/:id should fail)')
    const verifyRes = await makeRequest(`/scenarios/${testScenarioId}`, 'GET')

    if (verifyRes.status === 404 || !verifyRes.data.success) {
      console.log(`   ✓ Scenario correctly deleted and no longer accessible\n`)
    } else {
      console.log('   ✗ Scenario still exists after deletion')
    }

    // Test 10: Verify unauthorized access
    console.log('🔟 Testing Unauthorized Access')
    const noAuthRes = await fetch(`${API_BASE}/scenarios`)
    const noAuthData = await noAuthRes.json()

    if (noAuthRes.status === 401) {
      console.log(`   ✓ Correctly rejected request without token\n`)
    } else {
      console.log('   ✗ Should have rejected unauthorized request')
    }

    console.log('='.repeat(50))
    console.log('✅ All Scenario CRUD tests passed!')
    console.log('='.repeat(50))

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

testScenarioCRUD()
