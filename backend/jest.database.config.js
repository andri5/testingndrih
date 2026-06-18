/** Jest config for database integrity / performance tests. */
export default {
  displayName: 'database',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/jest-test-env.cjs'],
  testMatch: ['**/tests/database/**/*.test.js'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      {
        presets: ['@babel/preset-env'],
        plugins: [],
      },
    ],
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/coverage/'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  coverageReporters: ['text', 'lcov', 'json'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  bail: 0,
}
