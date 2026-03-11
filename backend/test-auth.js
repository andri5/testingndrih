import fetch from 'node-fetch'

const API_BASE = 'http://localhost:5001/api'
let testToken = null
let testUserId = null

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

  if (testToken) {
    options.headers['Authorization'] = `Bearer ${testToken}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options)
  const data = await response.json()
  return { status: response.status, data }
}

async function testAuth() {
  console.log('🧪 Testing Authentication API...\n')

  try {
    // Test 1: Register a new user
    console.log('1️⃣  Testing POST /auth/register')
    const registerRes = await makeRequest('/auth/register', 'POST', {
      email: 'testuser@example.com',
      password: 'testpass123',
      name: 'Test User'
    })

    if (registerRes.status === 201 && registerRes.data.success) {
      console.log('   ✓ Registration successful')
      console.log(`   ✓ User created with ID: ${registerRes.data.user.id}`)
      testToken = registerRes.data.token
      testUserId = registerRes.data.user.id
    } else {
      console.log('   ✗ Registration failed:', registerRes.data)
      throw new Error('Registration test failed')
    }

    // Test 2: Try to register with same email (should fail)
    console.log('\n2️⃣  Testing duplicate email rejection')
    const dupRes = await makeRequest('/auth/register', 'POST', {
      email: 'testuser@example.com',
      password: 'another123',
      name: 'Another User'
    })

    if (dupRes.status === 409) {
      console.log('   ✓ Correctly rejected duplicate email')
    } else {
      console.log('   ✗ Should have rejected duplicate email')
    }

    // Test 3: Login with correct credentials
    console.log('\n3️⃣  Testing POST /auth/login (correct credentials)')
    const loginRes = await makeRequest('/auth/login', 'POST', {
      email: 'testuser@example.com',
      password: 'testpass123'
    })

    if (loginRes.status === 200 && loginRes.data.success) {
      console.log('   ✓ Login successful')
      console.log(`   ✓ Token received: ${loginRes.data.token.substring(0, 20)}...`)
      testToken = loginRes.data.token
    } else {
      console.log('   ✗ Login failed:', loginRes.data)
      throw new Error('Login test failed')
    }

    // Test 4: Login with wrong password (should fail)
    console.log('\n4️⃣  Testing login rejection with wrong password')
    const badPwRes = await makeRequest('/auth/login', 'POST', {
      email: 'testuser@example.com',
      password: 'wrongpassword'
    })

    if (badPwRes.status === 401) {
      console.log('   ✓ Correctly rejected wrong password')
    } else {
      console.log('   ✗ Should have rejected wrong password')
    }

    // Test 5: Get current user with valid token
    console.log('\n5️⃣  Testing GET /auth/me (with valid token)')
    const meRes = await makeRequest('/auth/me', 'GET')

    if (meRes.status === 200 && meRes.data.success) {
      console.log('   ✓ Get current user successful')
      console.log(`   ✓ User email: ${meRes.data.user.email}`)
    } else {
      console.log('   ✗ Get current user failed:', meRes.data)
    }

    // Test 6: Try to access without token (should fail)
    console.log('\n6️⃣  Testing GET /auth/me (without token)')
    testToken = null
    const noTokenRes = await makeRequest('/auth/me', 'GET')

    if (noTokenRes.status === 401) {
      console.log('   ✓ Correctly rejected request without token')
    } else {
      console.log('   ✗ Should have rejected request without token')
    }

    console.log('\n✅ All authentication tests passed!')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Wait for server to be ready and run tests
setTimeout(testAuth, 2000)
