import base from './jest.config.js'

/** Playwright bridge E2E — requires `npx playwright install chromium` */
export default {
  ...base,
  testPathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/recorderClientDirect.bridge.e2e.test.js'],
  coverageThreshold: undefined,
  collectCoverage: false,
}
