import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()
const API_BASE_URL = 'http://localhost:5000/api'

let userToken = null
let userId = null

async function runTests() {
  try {
    console.log('\n=== Qase.io Integration Test Suite ===\n')

    // Test 1: User Registration
    console.log('Test 1: User Registration')
    const registerRes = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `testuser_${Date.now()}@test.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    })
    userToken = registerRes.data.token
    userId = registerRes.data.userId
    console.log('✅ User registered:', registerRes.data.userId)

    // Test 2: Connect Qase
    console.log('\nTest 2: Connect Qase Integration')
    const connectRes = await axios.post(
      `${API_BASE_URL}/qase/connect`,
      {
        apiKey: process.env.QASE_API_KEY || 'YOUR_API_KEY_HERE',
        projectCode: process.env.QASE_PROJECT_CODE || 'AS'
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    )
    console.log('✅ Qase connected:', connectRes.data)

    // Test 3: Get Qase Status
    console.log('\nTest 3: Get Qase Status')
    const statusRes = await axios.get(`${API_BASE_URL}/qase/status`, {
      headers: { Authorization: `Bearer ${userToken}` }
    })
    console.log('✅ Qase status:', statusRes.data)

    // Test 4: Get Project Details
    console.log('\nTest 4: Get Project Details')
    const projectRes = await axios.get(`${API_BASE_URL}/qase/project`, {
      headers: { Authorization: `Bearer ${userToken}` }
    })
    console.log('✅ Project details:', projectRes.data)

    // Test 5: Sync Cases from Qase
    console.log('\nTest 5: Sync Test Cases from Qase')
    const syncRes = await axios.post(
      `${API_BASE_URL}/qase/sync`,
      {},
      { headers: { Authorization: `Bearer ${userToken}` } }
    )
    console.log('✅ Cases synced:', syncRes.data)

    // Test 6: Get Synced Cases
    console.log('\nTest 6: Get Synced Cases')
    const casesRes = await axios.get(`${API_BASE_URL}/qase/cases`, {
      headers: { Authorization: `Bearer ${userToken}` }
    })
    console.log(`✅ Found ${casesRes.data.cases.length} synced cases`)
    if (casesRes.data.cases.length > 0) {
      console.log('Sample case:', casesRes.data.cases[0])
    }

    // Test 7: Create Scenario from Qase Case (if cases exist)
    if (casesRes.data.cases.length > 0) {
      console.log('\nTest 7: Create Scenario from Qase Case')
      const caseId = casesRes.data.cases[0].id
      const scenarioRes = await axios.post(
        `${API_BASE_URL}/qase/create-scenario/${caseId}`,
        {},
        { headers: { Authorization: `Bearer ${userToken}` } }
      )
      console.log('✅ Scenario created:', scenarioRes.data.scenario.id)
    }

    // Test 8: Disconnect Qase
    console.log('\nTest 8: Disconnect Qase Integration')
    const disconnectRes = await axios.post(
      `${API_BASE_URL}/qase/disconnect`,
      {},
      { headers: { Authorization: `Bearer ${userToken}` } }
    )
    console.log('✅ Qase disconnected')

    // Test 9: Verify Disconnection
    console.log('\nTest 9: Verify Disconnection')
    const statusAfterRes = await axios.get(`${API_BASE_URL}/qase/status`, {
      headers: { Authorization: `Bearer ${userToken}` }
    })
    console.log('✅ Status after disconnect:', statusAfterRes.data)

    console.log('\n=== All Tests Passed! ===\n')
  } catch (error) {
    console.error(
      'Test failed:',
      error.response?.data || error.message
    )
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run tests
runTests()
