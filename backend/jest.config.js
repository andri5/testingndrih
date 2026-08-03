export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  // Playwright browser E2E — run via `npm run test:e2e-bridge`, not default CI unit suite
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.e2e\\.test\\.js$'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.js$': ['babel-jest', { 
      presets: ['@babel/preset-env'],
      plugins: []
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid|pixelmatch)/)'
  ],
  moduleFileExtensions: ['js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
