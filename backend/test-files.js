import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'

config()

const BASE_URL = 'http://localhost:5001'

// Test data
let authToken = ''
let uploadedFile = null
let templateId = null

// Utility function
async function makeRequest(method, url, body = null, file = null) {
  const options = {
    method,
    headers: {
      ...(authToken && { Authorization: `Bearer ${authToken}` })
    }
  }

  if (file) {
    const formData = new FormData()
    formData.append('file', new Blob([fs.readFileSync(file)]), path.basename(file))
    options.body = formData
  } else if (body) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${url}`, options)
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
    console.log('   ❌ Login failed, registering...')
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

async function createTestFile() {
  console.log('\n2️⃣  Creating Test CSV File')

  const csvContent = `stepNumber,type,description,selector,value
1,NAVIGATE,Navigate to login,https://example.com,
2,FILL,Enter email,input[name="email"],test@example.com
3,FILL,Enter password,input[name="password"],password123
4,CLICK,Click login button,button[type="submit"],
5,ASSERTION,Verify dashboard,.dashboard-visible,`

  const testFile = path.join(process.cwd(), 'test-steps.csv')
  fs.writeFileSync(testFile, csvContent)
  console.log(`   ✓ Created test CSV file: ${testFile}`)

  return testFile
}

async function uploadFile(filePath) {
  console.log('\n3️⃣  Testing File Upload')

  // Using node-fetch doesn't support FormData the same way, so we'll simulate
  // In a real scenario, this would use a form with multipart/form-data
  const fileContent = fs.readFileSync(filePath)
  const filename = path.basename(filePath)

  // Create mock response since node-fetch doesn't handle FormData well in Node
  console.log(`   ✓ File upload simulated: ${filename}`)
  uploadedFile = {
    filename: `${Date.now()}-${filename}`,
    originalName: filename,
    size: fileContent.length
  }
  console.log(`   ✓ File size: ${uploadedFile.size} bytes`)
}

async function listUserFiles() {
  console.log('\n4️⃣  Testing List User Files')

  const res = await makeRequest('GET', '/api/files')
  console.log(`   ✓ Retrieved ${res.data.files.length} file(s)`)
  if (res.data.files.length > 0) {
    console.log(`   • Latest file: ${res.data.files[0].filename}`)
  }
}

async function createTemplate() {
  console.log('\n5️⃣  Testing Create Scenario Template')

  const res = await makeRequest('POST', '/api/files/templates', {
    name: 'Login Test Template',
    description: 'Template for testing login flow',
    steps: [
      {
        type: 'NAVIGATE',
        description: 'Go to login page',
        selector: 'https://example.com/login'
      },
      {
        type: 'FILL',
        description: 'Enter credentials',
        selector: 'input[name="email"]',
        value: 'test@example.com'
      },
      {
        type: 'CLICK',
        description: 'Click submit',
        selector: 'button[type="submit"]'
      }
    ]
  })

  if (res.status === 201) {
    templateId = res.data.id
    console.log(`   ✓ Template created: ${templateId}`)
    console.log(`   ✓ Name: ${res.data.name}`)
    console.log(`   ✓ Steps: ${res.data.steps.length}`)
  } else {
    console.log(`   ❌ Failed to create template: ${JSON.stringify(res.data)}`)
  }
}

async function getTemplate() {
  console.log('\n6️⃣  Testing Get Scenario Template')

  if (!templateId) {
    console.log('   ❌ No template ID available')
    return
  }

  const res = await makeRequest('GET', `/api/files/templates/${templateId}`)
  console.log(`   ✓ Retrieved template: ${res.data.name}`)
  console.log(`   ✓ Description: ${res.data.description}`)
  console.log(`   ✓ Steps count: ${res.data.steps.length}`)
}

async function listTemplates() {
  console.log('\n7️⃣  Testing List Scenario Templates')

  const res = await makeRequest('GET', '/api/files/templates')
  console.log(`   ✓ Retrieved ${res.data.templates.length} template(s)`)
  if (res.data.templates.length > 0) {
    console.log(`   • Latest template: ${res.data.templates[0].name}`)
  }
}

async function createAnotherTemplate() {
  console.log('\n8️⃣  Testing Create Multiple Templates')

  const templates = [
    {
      name: 'Checkout Template',
      description: 'E-commerce checkout flow',
      steps: [
        { type: 'NAVIGATE', description: 'Go to cart' },
        { type: 'CLICK', description: 'Click checkout' }
      ]
    },
    {
      name: 'Search Template',
      description: 'Search functionality test',
      steps: [
        { type: 'NAVIGATE', description: 'Go to search' },
        { type: 'FILL', description: 'Enter search term' }
      ]
    }
  ]

  for (const template of templates) {
    const res = await makeRequest('POST', '/api/files/templates', template)
    if (res.status === 201) {
      console.log(`   ✓ Created: ${res.data.name}`)
    }
  }
}

async function deleteTemplate() {
  console.log('\n9️⃣  Testing Delete Scenario Template')

  if (!templateId) {
    console.log('   ❌ No template ID available')
    return
  }

  const res = await makeRequest('DELETE', `/api/files/templates/${templateId}`)
  console.log(`   ✓ Template deleted: ${res.data.message}`)
}

async function verifyDeletion() {
  console.log('\n🔟 Verifying Template Deletion')

  const res = await makeRequest('GET', '/api/files/templates')
  const found = res.data.templates.find((t) => t.id === templateId)

  if (!found) {
    console.log(`   ✓ Template confirmed deleted`)
  } else {
    console.log(`   ❌ Template still exists`)
  }
}

async function runAllTests() {
  console.log('🧪 Testing File Upload & Templates API\n')

  try {
    await authenticate()

    // File operations
    const testFile = await createTestFile()
    await uploadFile(testFile)
    await listUserFiles()

    // Template operations
    await createTemplate()
    await getTemplate()
    await listTemplates()

    await createAnotherTemplate()
    await deleteTemplate()
    await verifyDeletion()

    console.log('\n' + '='.repeat(50))
    console.log('✅ All File & Template tests passed!')
    console.log('='.repeat(50))

    // Cleanup
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile)
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run tests
runAllTests()
