import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    // Add GitHub Actions reporter on CI
    ...(process.env.CI ? [['github']] : []),
    // Add line reporter for terminal output
    ['line'],
  ],
  
  // Shared settings for all tests
  use: {
    // Base URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Global test timeout
    actionTimeout: 10000,
    navigationTimeout: 30000,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
    
    // User agent
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // Accept downloads
    acceptDownloads: true,
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use a consistent user data directory for better test isolation
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor'],
        },
      },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Test against branded browsers
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
      },
    },
    
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome',
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes timeout for server to start
  },
  
  // Test timeout
  timeout: 30000,
  
  // Expect timeout
  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000,
  },
  
  // Global setup and teardown
  globalSetup: require.resolve('./tests/setup/playwright-global-setup.ts'),
  globalTeardown: require.resolve('./tests/setup/playwright-global-teardown.ts'),
  
  // Test output directory
  outputDir: 'test-results/playwright-artifacts',
  
  // Directory with test fixtures
  testFixtures: './tests/fixtures',
  
  // Maximum failures before stopping test run
  maxFailures: process.env.CI ? 5 : undefined,
  
  // Global test environment
  metadata: {
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.0.0',
    ci: !!process.env.CI,
  },
});