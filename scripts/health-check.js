#!/usr/bin/env node
/**
 * Health Check - Verify Testing Environment
 * Checks: Backend server, Frontend server, Database connection
 * Usage: npm run health-check
 */

import fetch from 'node-fetch'
import { prisma } from '../backend/src/lib/prisma.js'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
}

function log(status, message) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏳'
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow
  console.log(`${color}${icon} ${message}${colors.reset}`)
}

async function checkBackendServer() {
  try {
    const res = await fetch('http://localhost:5001/health', { timeout: 5000 })
    if (res.ok) {
      log('pass', 'Backend server running on port 5001')
      return true
    }
  } catch {
    log('fail', 'Backend server NOT running on port 5001')
    console.log(`   ${colors.yellow}→ Start: cd backend && npm run dev${colors.reset}`)
  }
  return false
}

async function checkFrontendServer() {
  try {
    const res = await fetch('http://localhost:3000', { timeout: 5000 })
    if (res.ok || res.status === 200) {
      log('pass', 'Frontend server running on port 3000')
      return true
    }
  } catch {
    log('fail', 'Frontend server NOT running on port 3000')
    console.log(`   ${colors.yellow}→ Start: cd frontend && npm run dev${colors.reset}`)
  }
  return false
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    log('pass', 'Database connected (PostgreSQL)')
    const userCount = await prisma.user.count()
    const scenarioCount = await prisma.scenario.count()
    console.log(`   Users: ${userCount} | Scenarios: ${scenarioCount}`)
    return true
  } catch {
    log('fail', 'Database connection failed')
    console.log(`   ${colors.yellow}→ Ensure PostgreSQL is running (Docker)${colors.reset}`)
    console.log(`   ${colors.yellow}→ Check: docker ps${colors.reset}`)
  }
  return false
}

async function checkTestFrameworks() {
  try {
    await import('../backend/jest.config.js')
    log('pass', 'Jest configured for backend unit tests')
  } catch {
    log('fail', 'Jest not configured')
  }

  try {
    await import('../frontend/playwright.config.js')
    log('pass', 'Playwright configured for frontend E2E tests')
  } catch {
    log('fail', 'Playwright not configured')
  }
}

async function main() {
  console.log(`\n${colors.bold}${colors.blue}🧪 TESTING ENVIRONMENT HEALTH CHECK${colors.reset}\n`)

  const backendReady = await checkBackendServer()
  const frontendReady = await checkFrontendServer()
  const dbReady = await checkDatabase()

  console.log()
  await checkTestFrameworks()

  console.log(`\n${colors.bold}Testing Commands:${colors.reset}`)
  console.log(`  Backend unit tests:  ${colors.yellow}cd backend && npm test${colors.reset}`)
  console.log(`  Frontend E2E tests:  ${colors.yellow}cd frontend && npx playwright test${colors.reset}`)
  console.log(`  Integration tests:   ${colors.yellow}cd backend && npm run test:integration${colors.reset}`)

  if (backendReady && dbReady) {
    console.log(`\n${colors.green}✅ Ready to run backend unit & integration tests${colors.reset}`)
  }
  if (frontendReady && backendReady) {
    console.log(`${colors.green}✅ Ready to run frontend E2E tests${colors.reset}`)
  }

  console.log()
  process.exit(0)
}

main().catch((err) => {
  console.error('Health check error:', err.message)
  process.exit(1)
})
