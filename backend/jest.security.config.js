module.exports = {
  testEnvironment: 'node',
  testMatch: '**/tests/security/**/*.security.test.js',
  testTimeout: 60000,
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  coverageReporters: ['text', 'lcov', 'json'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  bail: 0
}
