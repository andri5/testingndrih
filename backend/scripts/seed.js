import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/password.js'
import { resolveRoleForEmail, PRIMARY_ADMIN_EMAIL } from '../src/utils/roles.js'

const prisma = new PrismaClient()

// ─── 10 Comprehensive Test Scenarios ───────────────────────────────────────
const scenarios = [
  {
    name: 'Login Form Test - HerokuApp',
    description: 'Test login flow: fill username & password, submit, verify success message',
    url: 'https://the-internet.herokuapp.com/login',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open login page', selector: null, value: 'https://the-internet.herokuapp.com/login' },
      { stepNumber: 2, type: 'FILL', description: 'Enter username', selector: '#username', value: 'tomsmith' },
      { stepNumber: 3, type: 'FILL', description: 'Enter password', selector: '#password', value: 'SuperSecretPassword!' },
      { stepNumber: 4, type: 'CLICK', description: 'Click Login button', selector: 'button[type="submit"]', value: null },
      { stepNumber: 5, type: 'WAIT', description: 'Wait for page load', selector: null, value: '1500' },
      { stepNumber: 6, type: 'ASSERTION', description: 'Verify secure area text', selector: null, value: 'Secure Area' },
      { stepNumber: 7, type: 'SCREENSHOT', description: 'Capture login success', selector: null, value: null },
    ]
  },
  {
    name: 'Checkbox Toggle Test - HerokuApp',
    description: 'Test checkbox interactions: toggle on/off and verify states',
    url: 'https://the-internet.herokuapp.com/checkboxes',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open checkboxes page', selector: null, value: 'https://the-internet.herokuapp.com/checkboxes' },
      { stepNumber: 2, type: 'ASSERTION', description: 'Verify page title', selector: null, value: 'Checkboxes' },
      { stepNumber: 3, type: 'CLICK', description: 'Toggle checkbox 1', selector: '#checkboxes input:nth-of-type(1)', value: null },
      { stepNumber: 4, type: 'CLICK', description: 'Toggle checkbox 2', selector: '#checkboxes input:nth-of-type(2)', value: null },
      { stepNumber: 5, type: 'SCREENSHOT', description: 'Capture checkbox state', selector: null, value: null },
    ]
  },
  {
    name: 'Dropdown Select Test - HerokuApp',
    description: 'Test dropdown selection and verify selected option',
    url: 'https://the-internet.herokuapp.com/dropdown',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open dropdown page', selector: null, value: 'https://the-internet.herokuapp.com/dropdown' },
      { stepNumber: 2, type: 'ASSERTION', description: 'Verify page loaded', selector: null, value: 'Dropdown List' },
      { stepNumber: 3, type: 'FILL', description: 'Select Option 1', selector: '#dropdown', value: '1' },
      { stepNumber: 4, type: 'WAIT', description: 'Wait after select', selector: null, value: '500' },
      { stepNumber: 5, type: 'FILL', description: 'Select Option 2', selector: '#dropdown', value: '2' },
      { stepNumber: 6, type: 'SCREENSHOT', description: 'Capture dropdown selection', selector: null, value: null },
    ]
  },
  {
    name: 'Dynamic Loading Wait Test - HerokuApp',
    description: 'Test dynamic content loading with explicit wait for element to appear',
    url: 'https://the-internet.herokuapp.com/dynamic_loading/1',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open dynamic loading page', selector: null, value: 'https://the-internet.herokuapp.com/dynamic_loading/1' },
      { stepNumber: 2, type: 'ASSERTION', description: 'Verify page loaded', selector: null, value: 'Example 1' },
      { stepNumber: 3, type: 'CLICK', description: 'Click Start button', selector: '#start button', value: null },
      { stepNumber: 4, type: 'WAIT', description: 'Wait for loading to finish', selector: null, value: '6000' },
      { stepNumber: 5, type: 'ASSERTION', description: 'Verify Hello World text appeared', selector: '#finish', value: 'Hello World!' },
      { stepNumber: 6, type: 'SCREENSHOT', description: 'Capture loaded content', selector: null, value: null },
    ]
  },
  {
    name: 'DemoQA Practice Form',
    description: 'Fill a comprehensive form with text inputs, radio buttons, and verify submission',
    url: 'https://demoqa.com/automation-practice-form',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open practice form', selector: null, value: 'https://demoqa.com/automation-practice-form' },
      { stepNumber: 2, type: 'FILL', description: 'Enter first name', selector: '#firstName', value: 'John' },
      { stepNumber: 3, type: 'FILL', description: 'Enter last name', selector: '#lastName', value: 'Doe' },
      { stepNumber: 4, type: 'FILL', description: 'Enter email', selector: '#userEmail', value: 'john.doe@test.com' },
      { stepNumber: 5, type: 'CLICK', description: 'Select Male gender', selector: 'label[for="gender-radio-1"]', value: null },
      { stepNumber: 6, type: 'FILL', description: 'Enter mobile number', selector: '#userNumber', value: '1234567890' },
      { stepNumber: 7, type: 'SCREENSHOT', description: 'Capture filled form', selector: null, value: null },
    ]
  },
  {
    name: 'Wikipedia Search & Navigate',
    description: 'Search Wikipedia and verify search results appear',
    url: 'https://www.wikipedia.org',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open Wikipedia homepage', selector: null, value: 'https://www.wikipedia.org' },
      { stepNumber: 2, type: 'ASSERTION', description: 'Verify Wikipedia loaded', selector: null, value: 'Wikipedia' },
      { stepNumber: 3, type: 'FILL', description: 'Type search query', selector: '#searchInput', value: 'Playwright testing' },
      { stepNumber: 4, type: 'CLICK', description: 'Click search button', selector: 'button[type="submit"]', value: null },
      { stepNumber: 5, type: 'WAIT', description: 'Wait for search results', selector: null, value: '2000' },
      { stepNumber: 6, type: 'SCREENSHOT', description: 'Capture search results', selector: null, value: null },
    ]
  },
  {
    name: 'SauceDemo E-Commerce Flow',
    description: 'Full e-commerce flow: login, add to cart, verify cart badge',
    url: 'https://www.saucedemo.com',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open SauceDemo', selector: null, value: 'https://www.saucedemo.com' },
      { stepNumber: 2, type: 'FILL', description: 'Enter username', selector: '#user-name', value: 'standard_user' },
      { stepNumber: 3, type: 'FILL', description: 'Enter password', selector: '#password', value: 'secret_sauce' },
      { stepNumber: 4, type: 'CLICK', description: 'Click Login', selector: '#login-button', value: null },
      { stepNumber: 5, type: 'WAIT', description: 'Wait for inventory', selector: null, value: '1500' },
      { stepNumber: 6, type: 'ASSERTION', description: 'Verify inventory page', selector: null, value: 'Products' },
      { stepNumber: 7, type: 'CLICK', description: 'Add Backpack to cart', selector: '#add-to-cart-sauce-labs-backpack', value: null },
      { stepNumber: 8, type: 'ASSERTION', description: 'Verify cart badge shows 1', selector: '.shopping_cart_badge', value: '1' },
      { stepNumber: 9, type: 'CLICK', description: 'Add Bike Light to cart', selector: '#add-to-cart-sauce-labs-bike-light', value: null },
      { stepNumber: 10, type: 'ASSERTION', description: 'Verify cart badge shows 2', selector: '.shopping_cart_badge', value: '2' },
      { stepNumber: 11, type: 'CLICK', description: 'Open cart', selector: '.shopping_cart_link', value: null },
      { stepNumber: 12, type: 'WAIT', description: 'Wait for cart page', selector: null, value: '1000' },
      { stepNumber: 13, type: 'ASSERTION', description: 'Verify cart page', selector: null, value: 'Your Cart' },
      { stepNumber: 14, type: 'SCREENSHOT', description: 'Capture cart contents', selector: null, value: null },
    ]
  },
  {
    name: 'JavaScript Alerts Handling - HerokuApp',
    description: 'Test browser alert/confirm/prompt dialogs',
    url: 'https://the-internet.herokuapp.com/javascript_alerts',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open JS alerts page', selector: null, value: 'https://the-internet.herokuapp.com/javascript_alerts' },
      { stepNumber: 2, type: 'ASSERTION', description: 'Verify page loaded', selector: null, value: 'JavaScript Alerts' },
      { stepNumber: 3, type: 'CLICK', description: 'Trigger JS Alert', selector: 'button[onclick="jsAlert()"]', value: null },
      { stepNumber: 4, type: 'WAIT', description: 'Wait for alert handling', selector: null, value: '1000' },
      { stepNumber: 5, type: 'ASSERTION', description: 'Verify alert result', selector: '#result', value: 'You successfully clicked an alert' },
      { stepNumber: 6, type: 'CLICK', description: 'Trigger JS Confirm', selector: 'button[onclick="jsConfirm()"]', value: null },
      { stepNumber: 7, type: 'WAIT', description: 'Wait for confirm handling', selector: null, value: '1000' },
      { stepNumber: 8, type: 'ASSERTION', description: 'Verify confirm result', selector: '#result', value: 'You clicked: Ok' },
      { stepNumber: 9, type: 'SCREENSHOT', description: 'Capture alert results', selector: null, value: null },
    ]
  },
  {
    name: 'Data Table & Screenshot - HerokuApp',
    description: 'Navigate to tables page, verify table content, capture screenshots',
    url: 'https://the-internet.herokuapp.com/tables',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open tables page', selector: null, value: 'https://the-internet.herokuapp.com/tables' },
      { stepNumber: 2, type: 'ASSERTION', description: 'Verify page loaded', selector: null, value: 'Data Tables' },
      { stepNumber: 3, type: 'ASSERTION', description: 'Verify table header Last Name', selector: '#table1 thead', value: 'Last Name' },
      { stepNumber: 4, type: 'ASSERTION', description: 'Verify Smith exists in table', selector: '#table1', value: 'Smith' },
      { stepNumber: 5, type: 'CLICK', description: 'Sort by Last Name', selector: '#table1 thead tr th:nth-of-type(1) span', value: null },
      { stepNumber: 6, type: 'WAIT', description: 'Wait for sort', selector: null, value: '500' },
      { stepNumber: 7, type: 'SCREENSHOT', description: 'Capture sorted table', selector: null, value: null },
    ]
  },
  {
    name: 'API Health Check',
    description: 'Verify backend API is responding correctly via API_CALL step',
    url: 'http://localhost:5001',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open backend API root', selector: null, value: 'http://localhost:5001/' },
      { stepNumber: 2, type: 'WAIT', description: 'Wait for response', selector: null, value: '1000' },
      { stepNumber: 3, type: 'ASSERTION', description: 'Verify API welcome message', selector: null, value: 'testingndrih' },
      { stepNumber: 4, type: 'SCREENSHOT', description: 'Capture API response', selector: null, value: null },
    ]
  },
]

async function main() {
  try {
    console.log('🌱 Starting database seed...')

    const seedEmail = process.env.SEED_EMAIL || 'admin@testingndrih.local'
    const seedPassword = process.env.SEED_PASSWORD || 'change-me-local-only'

    let user = await prisma.user.findUnique({ where: { email: seedEmail } })

    const seedRole = resolveRoleForEmail(seedEmail)

    if (!user) {
      const hashedPassword = await hashPassword(seedPassword)
      user = await prisma.user.create({
        data: {
          email: seedEmail,
          password: hashedPassword,
          name: 'Admin User',
          role: seedRole,
        },
      })
      console.log('✅ Seed user created:', user.email, `(${seedRole})`)
    } else {
      if (user.role !== seedRole) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: seedRole },
        })
        console.log('✅ Seed user role updated:', user.email, `→ ${seedRole}`)
      } else {
        console.log('✅ Seed user already exists:', user.email, `(${user.role})`)
      }
    }

    // Ensure configured primary admin email always has ADMIN role
    const primaryAdmin = await prisma.user.findUnique({
      where: { email: PRIMARY_ADMIN_EMAIL },
    })
    if (primaryAdmin && primaryAdmin.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: primaryAdmin.id },
        data: { role: 'ADMIN' },
      })
      console.log('✅ Primary admin role set:', PRIMARY_ADMIN_EMAIL)
    }

    let created = 0
    let skipped = 0

    for (const sc of scenarios) {
      const existing = await prisma.scenario.findFirst({
        where: { name: sc.name, userId: user.id }
      })

      if (existing) {
        skipped++
        continue
      }

      const scenario = await prisma.scenario.create({
        data: {
          name: sc.name,
          description: sc.description,
          url: sc.url,
          userId: user.id,
          steps: sc.steps.length
        }
      })

      for (const step of sc.steps) {
        await prisma.testStep.create({
          data: {
            stepNumber: step.stepNumber,
            type: step.type,
            description: step.description,
            selector: step.selector,
            value: step.value,
            scenarioId: scenario.id
          }
        })
      }

      created++
      console.log(`  📝 Created: ${sc.name} (${sc.steps.length} steps)`)
    }

    console.log(`\n✅ Seed complete: ${created} scenarios created, ${skipped} skipped (already exist)`)
    console.log(`📊 Total steps seeded: ${scenarios.reduce((sum, s) => sum + s.steps.length, 0)}`)
  } catch (error) {
    console.error('❌ Seed error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
