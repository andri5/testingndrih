/** Jest config for OWASP / security API tests (requires running backend on :5001). */
export default {
  displayName: 'security',
  testEnvironment: 'node',
  maxWorkers: 1,
  globalSetup: '<rootDir>/tests/security/globalSetup.cjs',
  setupFilesAfterEnv: ['<rootDir>/tests/security/setupEnv.cjs'],
  testMatch: ['**/tests/security/**/*.security.test.js'],
  testTimeout: 60000,
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
  transformIgnorePatterns: ['node_modules/(?!(uuid|pixelmatch)/)'],
  setupFiles: ['<rootDir>/tests/jest-test-env.cjs'],
  collectCoverage: false,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  bail: 0,
}
