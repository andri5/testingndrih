import { chromium } from 'playwright'
import { getRecorderScript } from './src/services/recorderService.js'

async function test() {
  console.log('=== HEADED browser test with REAL recorder script ===')
  
  const recScript = getRecorderScript()
  console.log('Script length:', recScript.length)

  const steps = []
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({ viewport: null, ignoreHTTPSErrors: true })
  const page = await context.newPage()

  // Console listener (PRIMARY channel)
  page.on('console', (msg) => {
    const text = msg.text()
    if (text.startsWith('__REC__')) {
      try {
        const step = JSON.parse(text.slice(7))
        steps.push(step)
        console.log('>>> CAPTURED:', step.type, '|', step.selector, '|', step.value || '')
      } catch (e) {}
    } else if (text.includes('testingndrih') || text.includes('Recorder')) {
      console.log('INJECT:', text)
    }
  })

  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))

  // Also try exposeFunction as backup
  try {
    await page.exposeFunction('__recordStep', (step) => {
      console.log('>>> VIA EXPOSE:', step.type, '|', step.selector, '|', step.value || '')
      // Check if already captured via console
      if (!steps.find(s => s.timestamp === step.timestamp)) {
        steps.push(step)
      }
    })
  } catch (e) {
    console.log('exposeFunction failed:', e.message)
  }

  // Add init script
  await page.addInitScript(recScript)

  console.log('Navigating...')
  await page.goto('https://giveloop-bzn-app.eramu.cloud/admin/register', {
    waitUntil: 'domcontentloaded',
    timeout: 20000
  })
  console.log('Page loaded:', page.url())

  // Wait for SPA to render
  await page.waitForTimeout(3000)

  // Re-inject
  try {
    await page.evaluate(recScript)
    console.log('Re-injected OK')
  } catch (e) {
    console.log('Re-inject error:', e.message)
  }

  // Check injection
  const injected = await page.evaluate(() => window.__recorderInjected)
  console.log('Injected?', injected)

  // List inputs now (after SPA render)
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
      tag: el.tagName, type: el.type, name: el.name, placeholder: el.placeholder
    }))
  })
  console.log('Inputs after render:', JSON.stringify(inputs))

  // Now simulate user actions programmatically  
  console.log('\n--- Simulating user interaction ---')
  
  // Try to find and interact with inputs
  const allInputs = await page.locator('input:visible').all()
  console.log('Visible inputs:', allInputs.length)
  
  for (let i = 0; i < Math.min(allInputs.length, 3); i++) {
    try {
      const info = await allInputs[i].evaluate(el => `${el.type}|name=${el.name}|ph=${el.placeholder}`)
      console.log(`\nInteracting with input[${i}]: ${info}`)
      
      // Click the input (like a user would)
      await allInputs[i].click()
      await page.waitForTimeout(200)
      
      // Type like a user (keystroke by keystroke)
      await page.keyboard.type('hello' + i, { delay: 80 })
      await page.waitForTimeout(600) // Wait for debounce
      
    } catch (e) {
      console.log(`Error on input[${i}]:`, e.message.substring(0, 80))
    }
  }

  // Click a button if exists
  const buttons = await page.locator('button:visible').all()
  if (buttons.length > 0) {
    console.log('\nClicking first button...')
    try {
      await buttons[0].click()
      await page.waitForTimeout(500)
    } catch (e) {}
  }

  console.log('\n=== FINAL RESULTS ===')
  console.log('Total steps:', steps.length)
  steps.forEach((s, i) => console.log(`  ${i + 1}. ${s.type} | ${s.selector} | ${s.value || ''}`))

  await browser.close()
  process.exit(0)
}

test().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
