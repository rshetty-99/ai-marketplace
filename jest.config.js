const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jest-environment-jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
  },
  
  // Test paths
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/app/**/layout.{js,jsx,ts,tsx}',
    '!src/app/**/loading.{js,jsx,ts,tsx}',
    '!src/app/**/error.{js,jsx,ts,tsx}',
    '!src/app/**/not-found.{js,jsx,ts,tsx}',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Specific thresholds for critical modules
    'src/lib/auth/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/lib/rbac/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/lib/validators/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase|@clerk))',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Collect coverage from untested files
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  
  // Global test setup (disabled for semantic search tests)
  // globalSetup: '<rootDir>/tests/setup/global-setup.js',
  // globalTeardown: '<rootDir>/tests/setup/global-teardown.js',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Watch plugins for better dev experience
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
      },
    ],
  ],
  
  // Snapshot serializers
  // snapshotSerializers: ['@emotion/jest/serializer'], // Commented out as package not available
  
  // Maximum worker processes
  maxWorkers: '50%',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)