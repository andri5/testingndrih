import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120000,

  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30000,
    actionTimeout: 10000
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],

  webServer: process.env.CI ? {
    command: 'npm run dev',
    cwd: '.',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120000
  } : undefined,
})
