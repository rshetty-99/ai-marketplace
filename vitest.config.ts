import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global setup and teardown
    globalSetup: './tests/setup/vitest-global-setup.ts',
    
    // Setup files
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    
    // Include and exclude patterns
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage',
      'tests/e2e/**',
    ],
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/vitest',
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}',
        'src/types/**',
        'src/**/*.stories.{js,jsx,ts,tsx}',
        'src/**/index.{js,jsx,ts,tsx}',
        '.next/**',
        'coverage/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Critical modules need higher coverage
        'src/lib/auth/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/lib/rbac/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
    
    // Globals
    globals: true,
    
    // Pool options
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    
    // Reporter configuration
    reporter: [
      'default',
      'html',
      'json',
      ['junit', { outputFile: './test-results/vitest-junit.xml' }],
    ],
    outputFile: {
      json: './test-results/vitest-results.json',
      html: './test-results/vitest-report.html',
    },
    
    // Watch mode configuration
    watch: true,
    watchExclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
      'test-results/**',
    ],
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    
    // Snapshot configuration
    resolveSnapshotPath: (testPath, snapExtension) => {
      return path.join(
        path.dirname(testPath),
        '__snapshots__',
        path.basename(testPath) + snapExtension
      );
    },
    
    // Retry configuration
    retry: process.env.CI ? 2 : 0,
    
    // Bail configuration
    bail: process.env.CI ? 5 : 0,
    
    // Sequence configuration
    sequence: {
      hooks: 'stack',
    },
    
    // Inspect configuration
    inspect: false,
    inspectBrk: false,
    
    // Typecheck configuration
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
    
    // CSS handling
    css: {
      modules: {
        classNameStrategy: 'stable',
      },
    },
    
    // API configuration for UI mode
    api: {
      port: 51204,
      host: '127.0.0.1',
      strictPort: false,
    },
    
    // UI configuration
    ui: false, // Enable with --ui flag
    open: false,
    
    // Environment variables
    env: {
      NODE_ENV: 'test',
      VITE_TEST_ENV: 'true',
    },
    
    // Define global variables
    define: {
      __DEV__: true,
      __TEST__: true,
    },
    
    // Benchmark configuration
    benchmark: {
      include: ['tests/benchmarks/**/*.bench.{js,ts,jsx,tsx}'],
      exclude: ['node_modules', 'dist'],
      reporters: ['default'],
    },
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/tests': path.resolve(__dirname, './tests'),
    },
  },
  
  // Define configuration for build
  define: {
    global: 'globalThis',
  },
  
  // Optimizations
  esbuild: {
    target: 'node14',
  },
});