import { test } from '@playwright/test'

test('Debug: Inspect dashboard structure', async ({ page }) => {
  console.log('\n=== DEBUGGING DASHBOARD PAGE ===\n')
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
  
  // Login  
  await page.locator('input[type="email"], input[id=email]').first().fill('donkditren@gmail.com')
  await page.locator('input[type="password"], input[id=password]').first().fill('password*1')
  await page.locator('button:has-text("Login"), button:has-text("Sign In")').first().click()
  
  // Wait for login to complete
  await page.waitForFunction(() => localStorage.getItem('authToken'), { timeout: 15000 })
  
  const token = await page.evaluate(() => localStorage.getItem('authToken'))
  console.log('📦 Auth token exists:', !!token)
  
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  
  const currentUrl = page.url()
  console.log(`📍 Current URL: ${currentUrl}`)
  
  // Get page structure info
  const title = await page.title()
  console.log(`📄 Page Title: ${title}`)
  
  // Get main content
  const html = await page.content()
  const bodyText = await page.textContent('body')
  
  console.log(`📝 Body text length: ${bodyText?.length || 0}`)
  console.log(`📝 Body starts with: ${bodyText?.substring(0, 100) || 'EMPTY'}...`)
  
  // Check for common container elements
  const hasMain = await page.locator('main').count() > 0
  const hasDiv = await page.locator('div').count() > 0
  const hasSection = await page.locator('section').count() > 0
  
  console.log(`\n🔍 DOM Elements Found:`)
  console.log(`  - <main> tags: ${hasMain}`)
  console.log(`  - <div> tags: ${hasDiv} (${await page.locator('div').count()})`)
  console.log(`  - <section> tags: ${hasSection}`)
  
  // Check for known dashboard elements
  const h1Count = await page.locator('h1').count()
  const buttonCount = await page.locator('button').count()
  const cardCount = await page.locator('[class*="card"]').count()
  
  console.log(`\n📊 Component Elements:`)
  console.log(`  - H1 headings: ${h1Count}`)
  console.log(`  - Buttons: ${buttonCount}`)
  console.log(`  - Card elements: ${cardCount}`)
  
  // Check for text content
  if (bodyText) {
    const hasScenarios = bodyText.toLowerCase().includes('scenario')
    const hasExecution = bodyText.toLowerCase().includes('execution')
    const hasTest = bodyText.toLowerCase().includes('test')
    const hasDashboard = bodyText.toLowerCase().includes('dashboard')
    
    console.log(`\n📋 Content Check:`)
    console.log(`  - Contains "scenario": ${hasScenarios}`)
    console.log(`  - Contains "execution": ${hasExecution}`)
    console.log(`  - Contains "test": ${hasTest}`)
    console.log(`  - Contains "dashboard": ${hasDashboard}`)
  }
  
  // Check if redirected due to auth error
  if (currentUrl.includes('/login')) {
    console.log('\n⚠️  WARNING: Page redirected to login - auth may have failed')
  }
  
  console.log('\n=== END DEBUG ===\n')
})
