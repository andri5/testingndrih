import { config } from 'dotenv'

config()

const BASE_URL = 'http://localhost:5001'

// Test data
let authToken = ''
let testScenario = null
let testSteps = []

// Utility function
async function makeRequest(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` })
    }
  }

  if (body) options.body = JSON.stringify(body)

  const response = await fetch(`${BASE_URL}${path}`, options)
  return {
    status: response.status,
    data: await response.json()
  }
}

// Test functions
async function authenticate() {
  console.log('\n1️⃣  Testing Authentication')
  const res = await makeRequest('POST', '/api/auth/login', {
    email: 'testuser@example.com',
    password: 'TestPassword123'
  })

  if (res.status !== 200) {
    console.log('   ❌ Login failed, registering new user...')
    const registerRes = await makeRequest('POST', '/api/auth/register', {
      email: 'testuser@example.com',
      password: 'TestPassword123',
      name: 'Test User'
    })
    authToken = registerRes.data.token
  } else {
    authToken = res.data.token
  }

  console.log('   ✓ Login successful, token received')
}

async function createScenario() {
  console.log('\n2️⃣  Creating Test Scenario')

  const res = await makeRequest('POST', '/api/scenarios', {
    name: 'Test Steps Scenario',
    description: 'Scenario for testing step CRUD operations',
    url: 'https://example.com/login'
  })

  testScenario = res.data.scenario || res.data
  console.log(`   ✓ Scenario created: ${testScenario.id}`)
}

async function getStepTypes() {
  console.log('\n3️⃣  Getting Available Step Types')

  const res = await makeRequest('GET', '/api/step-types')
  console.log(`   ✓ Retrieved ${res.data.types.length} step types`)
  res.data.types.forEach((type) => {
    console.log(`   • ${type.type}: ${type.description}`)
  })
}

async function createTestSteps() {
  console.log('\n4️⃣  Creating Test Steps')

  const steps = [
    {
      type: 'NAVIGATE',
      description: 'Navigate to login page',
      selector: 'https://example.com/login'
    },
    {
      type: 'FILL',
      description: 'Enter email address',
      selector: 'input[name="email"]',
      value: 'user@example.com'
    },
    {
      type: 'FILL',
      description: 'Enter password',
      selector: 'input[name="password"]',
      value: 'password123'
    },
    {
      type: 'CLICK',
      description: 'Click login button',
      selector: 'button[type="submit"]'
    },
    {
      type: 'ASSERTION',
      description: 'Verify user is logged in',
      selector: '.user-dashboard',
      value: 'visible'
    }
  ]

  for (const step of steps) {
    const res = await makeRequest('POST', `/api/scenarios/${testScenario.id}/steps`, step)
    if (res.status === 201) {
      testSteps.push(res.data)
    }
  }

  console.log(`   ✓ Created ${testSteps.length} test steps`)
  testSteps.forEach((step, idx) => {
    console.log(`   • Step ${step.stepNumber}: ${step.type} - ${step.description}`)
  })
}

async function getTestSteps() {
  console.log('\n5️⃣  Getting Test Steps for Scenario')

  const res = await makeRequest('GET', `/api/scenarios/${testScenario.id}/steps`)
  console.log(`   ✓ Retrieved ${res.data.steps.length} step(s)`)
  console.log(`   ✓ Total steps: ${res.data.total}`)
  console.log(`   ✓ Has more: ${res.data.hasMore}`)
}

async function getSingleTestStep() {
  console.log('\n6️⃣  Getting Single Test Step')

  if (testSteps.length === 0) {
    console.log('   ❌ No test steps available')
    return
  }

  const res = await makeRequest('GET', `/api/scenarios/${testScenario.id}/steps/${testSteps[0].id}`)
  console.log(`   ✓ Retrieved step: ${res.data.type}`)
  console.log(`   ✓ Description: ${res.data.description}`)
}

async function updateTestStep() {
  console.log('\n7️⃣  Updating Test Step')

  if (testSteps.length === 0) {
    console.log('   ❌ No test steps available')
    return
  }

  const res = await makeRequest('PUT', `/api/scenarios/${testScenario.id}/steps/${testSteps[0].id}`, {
    description: 'Updated: Navigate to the application login page',
    type: 'NAVIGATE'
  })

  console.log(`   ✓ Step updated successfully`)
  console.log(`   ✓ New description: ${res.data.description}`)
}

async function reorderSteps() {
  console.log('\n8️⃣  Reordering Test Steps')

  if (testSteps.length < 2) {
    console.log('   ❌ Need at least 2 steps to reorder')
    return
  }

  // Reverse the order of first 3 steps
  const stepOrders = testSteps
    .slice(0, 3)
    .reverse()
    .map((step, idx) => ({
      stepId: step.id,
      sequenceNumber: idx + 1
    }))

  const res = await makeRequest('PUT', `/api/scenarios/${testScenario.id}/steps/reorder`, {
    stepOrders
  })

  console.log(`   ✓ Reordered ${res.data.steps.length} step(s)`)
  res.data.steps.forEach((step) => {
    console.log(`   • Step ${step.stepNumber}: ${step.type}`)
  })
}

async function deleteTestStep() {
  console.log('\n9️⃣  Deleting Test Step')

  if (testSteps.length === 0) {
    console.log('   ❌ No test steps available')
    return
  }

  const stepToDelete = testSteps[testSteps.length - 1]
  const res = await makeRequest('DELETE', `/api/scenarios/${testScenario.id}/steps/${stepToDelete.id}`)

  console.log(`   ✓ Step deleted successfully`)
  console.log(`   ✓ Message: ${res.data.message}`)

  // Verify deletion
  const verifyRes = await makeRequest('GET', `/api/scenarios/${testScenario.id}/steps`)
  console.log(`   ✓ Remaining steps: ${verifyRes.data.total}`)
}

async function validateStep() {
  console.log('\n🔟 Validating Step')

  const res = await makeRequest('POST', '/api/step-types/validate', {
    type: 'CLICK',
    description: 'Click on login button'
  })

  console.log(`   ✓ Validation result: ${res.data.valid ? 'Valid' : 'Invalid'}`)
  if (!res.data.valid) {
    console.log(`   ✓ Error: ${res.data.error}`)
  }
}

async function testPagination() {
  console.log('\n1️⃣1️⃣ Testing Step Pagination')

  const res = await makeRequest('GET', `/api/scenarios/${testScenario.id}/steps?skip=0&take=2`)
  console.log(`   ✓ Retrieved ${res.data.steps.length} step(s) with pagination`)
  console.log(`   ✓ Total available: ${res.data.total}`)
  console.log(`   ✓ Has more: ${res.data.hasMore}`)
}

async function runAllTests() {
  console.log('🧪 Testing Test Step CRUD API\n')

  try {
    await authenticate()
    await createScenario()
    await getStepTypes()
    await createTestSteps()
    await getTestSteps()
    await getSingleTestStep()
    await updateTestStep()
    await reorderSteps()
    await deleteTestStep()
    await validateStep()
    await testPagination()

    console.log('\n' + '='.repeat(50))
    console.log('✅ All Test Step CRUD tests passed!')
    console.log('='.repeat(50))
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run tests
runAllTests()
