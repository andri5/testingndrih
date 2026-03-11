import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:5001'
let token = ''

async function test() {
  try {
    const authRes = await fetch(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testuser@example.com', password: 'TestPassword123' })
    })
    const authData = await authRes.json()
    console.log('AUTH Response:', authData)

    token = authData.token

    const scenarioRes = await fetch(BASE_URL + '/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ name: 'Test', description: 'Test', url: 'https://example.com' })
    })
    const scenarioData = await scenarioRes.json()
    console.log('SCENARIO Response:', scenarioData)
    console.log('SCENARIO Status:', scenarioRes.status)
  } catch (e) {
    console.error(e)
  }
}

test()
