import { defineConfig, devices } from '@playwright/test'

const baseURL = (process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001').replace(/\/$/, '')
const useExternalBase = !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseURL)

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
    baseURL,
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

  webServer: useExternalBase
    ? undefined
    : {
        command: process.env.CI ? 'npx vite preview --port 3001' : 'npm run dev',
        cwd: '.',
        url: 'http://localhost:3001',
        reuseExistingServer: true,
        timeout: 120000
      },
})
