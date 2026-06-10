/**
 * Jest Configuration for Integration Tests - Phase 2.2
 * Real API testing against running backend with live database
 */

export default {
  displayName: 'integration',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.integration.test.js'],
  testTimeout: 30000, // 30 second timeout for API calls
  verbose: true,
  collectCoverageFrom: [
    'backend/src/**/*.js',
    '!backend/src/**/index.js',
    '!backend/src/server.js'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  setupFiles: ['<rootDir>/tests/jest-test-env.cjs'],
  setupFilesAfterEnv: [],
  bail: false,
  forceExit: true,
  detectOpenHandles: false
}
