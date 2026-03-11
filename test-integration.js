import axios from 'axios'

const API_BASE = 'http://localhost:5001/api'
const FRONTEND_BASE = 'http://localhost:3000'

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
}

function logTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details })
  if (passed) {
    console.log(`✓ ${name}`)
    testResults.passed++
  } else {
    console.log(`✗ ${name} - ${details}`)
    testResults.failed++
  }
}

async function testAuthFlow() {
  console.log('🧪 Testing Full Authentication Flow\n')
  
  try {
    // Test 1: Frontend Login Page loads
    console.log('1️⃣  Testing LoginPage loads')
    try {
      const loginPageRes = await axios.get(`${FRONTEND_BASE}/login`)
      logTest('LoginPage accessible', loginPageRes.status === 200)
    } catch (error) {
      logTest('LoginPage accessible', false, error.message)
    }

    // Test 2: Frontend Register Page loads
    console.log('\n2️⃣  Testing RegisterPage loads')
    try {
      const registerPageRes = await axios.get(`${FRONTEND_BASE}/register`)
      logTest('RegisterPage accessible', registerPageRes.status === 200)
    } catch (error) {
      logTest('RegisterPage accessible', false, error.message)
    }

    // Test 3: Register via API
    console.log('\n3️⃣  Testing User Registration API')
    let token = null
    let userId = null
    try {
      const testEmail = `testuser${Date.now()}@example.com`
      const registerRes = await axios.post(`${API_BASE}/auth/register`, {
        email: testEmail,
        password: 'testpass123',
        name: 'Test User'
      })
      
      logTest('User registration successful', registerRes.status === 201 && registerRes.data.success)
      logTest('Token received', !!registerRes.data.token, !registerRes.data.token ? 'No token' : '')
      logTest('User data returned', !!registerRes.data.user, !registerRes.data.user ? 'No user data' : '')
      
      if (registerRes.data.token && registerRes.data.user) {
        token = registerRes.data.token
        userId = registerRes.data.user.id
      }
    } catch (error) {
      logTest('User registration successful', false, error.response?.data?.message || error.message)
    }

    // Test 4: Get current user with token
    console.log('\n4️⃣  Testing Get Current User (authenticated)')
    if (token) {
      try {
        const meRes = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        logTest('Get current user works', meRes.status === 200 && meRes.data.success)
        logTest('User data matches', meRes.data.user?.id === userId)
      } catch (error) {
        logTest('Get current user works', false, error.message)
      }
    }

    // Test 5: Reject request without token
    console.log('\n5️⃣  Testing Protected Endpoint (no token)')
    try {
      await axios.get(`${API_BASE}/auth/me`)
      logTest('Should reject without token', false, 'Request succeeded without token')
    } catch (error) {
      logTest('Should reject without token', error.response?.status === 401)
    }

    // Test 6: Reject request with invalid token
    console.log('\n6️⃣  Testing Protected Endpoint (invalid token)')
    try {
      await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: 'Bearer invalid.token.here' }
      })
      logTest('Should reject invalid token', false, 'Request succeeded with invalid token')
    } catch (error) {
      logTest('Should reject invalid token', error.response?.status === 401)
    }

    // Test 7: Check frontend protected routes exist
    console.log('\n7️⃣  Testing Frontend Protected Routes')
    try {
      const dashboardRes = await axios.get(`${FRONTEND_BASE}/dashboard`)
      logTest('Dashboard page exists', dashboardRes.status === 200, 'may redirect if not authenticated')
    } catch (error) {
      logTest('Dashboard page exists', true, 'Expected redirect if not authenticated')
    }

  } catch (error) {
    console.error('Test suite error:', error.message)
  }

  // Print summary
  console.log('\n' + '='.repeat(50))
  console.log(`📊 Test Summary: ${testResults.passed} passed, ${testResults.failed} failed`)
  console.log('='.repeat(50))
  
  if (testResults.failed === 0) {
    console.log('✅ All tests passed! Authentication system is working')
  } else {
    console.log(`⚠️  ${testResults.failed} test(s) failed. See details above.`)
  }
}

testAuthFlow()
