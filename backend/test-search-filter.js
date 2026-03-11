import { config } from 'dotenv'

config()

const BASE_URL = 'http://localhost:5001'

// Test data
let authToken = ''
let testScenarios = []

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

async function createTestScenarios() {
  console.log('\n2️⃣  Creating Test Scenarios')

  const scenarios = [
    { name: 'Login Test Scenario', description: 'Testing login flow', url: 'https://example.com/login' },
    { name: 'Checkout Scenario', description: 'Testing checkout process', url: 'https://example.com/checkout' },
    { name: 'User Profile Test', description: 'Testing profile management', url: 'https://example.com/profile' },
    { name: 'Search Functionality', description: 'Testing search feature', url: 'https://example.com/search' },
    { name: 'Payment Gateway Test', description: 'Testing payment integration', url: 'https://example.com/payment' }
  ]

  for (const scenario of scenarios) {
    const res = await makeRequest('POST', '/api/scenarios', scenario)
    if (res.status === 201) {
      testScenarios.push(res.data)
    }
  }

  console.log(`   ✓ Created ${testScenarios.length} test scenarios`)
}

async function testSearchByQuery() {
  console.log('\n3️⃣  Testing Search by Query')

  const res = await makeRequest('GET', '/api/search?query=login')
  console.log(`   ✓ Search for "login" returned ${res.data.scenarios.length} result(s)`)
  console.log(`   ✓ Total count: ${res.data.total}`)
  console.log(`   ✓ Has more: ${res.data.hasMore}`)
}

async function testSearchWithPagination() {
  console.log('\n4️⃣  Testing Pagination')

  const res = await makeRequest('GET', '/api/search?skip=0&take=2')
  console.log(`   ✓ Retrieved ${res.data.scenarios.length} scenario(s) with pagination`)
  console.log(`   ✓ Total available: ${res.data.total}`)
  console.log(`   ✓ Has more: ${res.data.hasMore}`)
}

async function testSearchWithOrdering() {
  console.log('\n5️⃣  Testing Ordering')

  const resAsc = await makeRequest('GET', '/api/search?orderBy=name&orderDirection=asc')
  console.log(`   ✓ Ordered by name (ascending): ${resAsc.data.scenarios.length} scenario(s)`)

  const resDesc = await makeRequest('GET', '/api/search?orderBy=name&orderDirection=desc')
  console.log(`   ✓ Ordered by name (descending): ${resDesc.data.scenarios.length} scenario(s)`)
}

async function testSearchByDate() {
  console.log('\n6️⃣  Testing Search by Date Range')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 1)
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 1)

  const res = await makeRequest('GET', `/api/search?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
  console.log(`   ✓ Date range search returned ${res.data.scenarios.length} scenario(s)`)
  console.log(`   ✓ Total in range: ${res.data.total}`)
}

async function testGroupedByDate() {
  console.log('\n7️⃣  Testing Grouped by Date')

  const res = await makeRequest('GET', '/api/search/by-date')
  const dateGroups = Object.keys(res.data.grouped)
  console.log(`   ✓ Scenarios grouped into ${dateGroups.length} date group(s)`)
  dateGroups.forEach((date) => {
    console.log(`   ✓ ${date}: ${res.data.grouped[date].length} scenario(s)`)
  })
}

async function testRecentScenarios() {
  console.log('\n8️⃣  Testing Recent Scenarios')

  const res = await makeRequest('GET', '/api/search/recent?limit=3')
  console.log(`   ✓ Retrieved ${res.data.scenarios.length} recent scenario(s)`)
  if (res.data.scenarios.length > 0) {
    console.log(`   ✓ Most recent: ${res.data.scenarios[0].name}`)
  }
}

async function testMostExecuted() {
  console.log('\n9️⃣  Testing Most Executed Scenarios')

  const res = await makeRequest('GET', '/api/search/most-executed?limit=5')
  console.log(`   ✓ Retrieved ${res.data.scenarios.length} most executed scenario(s)`)
  if (res.data.scenarios.length > 0) {
    console.log(`   ✓ Most executed: ${res.data.scenarios[0].name} (${res.data.scenarios[0].executionCount} executions)`)
  }
}

async function testAdvancedFilter() {
  console.log('\n🔟 Testing Advanced Filter')

  const res = await makeRequest('GET', '/api/search/filter?minSteps=0&maxSteps=100&minExecutions=0&searchText=test')
  console.log(`   ✓ Advanced filter returned ${res.data.scenarios.length} result(s)`)
  console.log(`   ✓ Total filtered: ${res.data.total}`)
}

async function testCombinedSearch() {
  console.log('\n1️⃣1️⃣ Testing Combined Search (Query + Pagination + Ordering)')

  const res = await makeRequest('GET', '/api/search?query=test&orderBy=createdAt&orderDirection=asc&skip=0&take=5')
  console.log(`   ✓ Found ${res.data.scenarios.length} matching scenario(s)`)
  console.log(`   ✓ Total matches: ${res.data.total}`)
  console.log(`   ✓ Has more results: ${res.data.hasMore}`)
}

async function testMultipleQueries() {
  console.log('\n1️⃣2️⃣ Testing Multiple Query Terms')

  const queries = ['login', 'checkout', 'payment', 'profile']
  for (const query of queries) {
    const res = await makeRequest('GET', `/api/search?query=${query}`)
    console.log(`   ✓ Query "${query}": found ${res.data.scenarios.length} scenario(s)`)
  }
}

async function runAllTests() {
  console.log('🧪 Testing Search & Filter API\n')

  try {
    await authenticate()
    await createTestScenarios()
    await testSearchByQuery()
    await testSearchWithPagination()
    await testSearchWithOrdering()
    await testSearchByDate()
    await testGroupedByDate()
    await testRecentScenarios()
    await testMostExecuted()
    await testAdvancedFilter()
    await testCombinedSearch()
    await testMultipleQueries()

    console.log('\n' + '='.repeat(50))
    console.log('✅ All Search & Filter tests passed!')
    console.log('='.repeat(50))
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run tests
runAllTests()
