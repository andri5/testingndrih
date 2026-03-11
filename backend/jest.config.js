export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { presets: ['@babel/preset-env'] }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
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
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30
    }
  }
}
