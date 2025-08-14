module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/catalog',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/sign-in',
        'http://localhost:3000/sign-up',
      ],
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance metrics
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'valid-lang': 'error',
        'meta-viewport': 'error',
        
        // Best practices
        'uses-https': 'error',
        'is-on-https': 'error',
        'uses-http2': 'warn',
        
        // SEO
        'document-title': 'error',
        'meta-description': 'warn',
        'robots-txt': 'warn',
        
        // PWA (Progressive Web App)
        'service-worker': 'off', // We might not have a service worker yet
        'installable-manifest': 'off', // We might not have a web app manifest yet
        
        // Custom performance budgets
        'total-byte-weight': ['warn', { maxNumericValue: 1600000 }], // 1.6MB
        'dom-size': ['warn', { maxNumericValue: 1500 }],
        'bootup-time': ['warn', { maxNumericValue: 2500 }],
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }],
        
        // Network and resource optimization
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'unused-javascript': ['warn', { maxNumericValue: 40000 }],
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'uses-text-compression': 'error',
        'render-blocking-resources': 'warn',
        'efficiently-encode-images': 'warn',
        'modern-image-formats': 'warn',
        
        // Core Web Vitals specific
        'categories.performance': ['error', { minScore: 0.8 }],
        'categories.accessibility': ['error', { minScore: 0.95 }],
        'categories.best-practices': ['error', { minScore: 0.9 }],
        'categories.seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // For CI environments
    },
    server: {
      port: 9001,
      storage: '.lighthouseci',
    },
  },
  
  // Lighthouse configuration
  extends: 'lighthouse:default',
  settings: {
    // Audit categories to run
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    
    // Device emulation
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    
    // Network throttling (simulate slower connections)
    throttlingMethod: 'simulate',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    
    // Additional settings
    disableStorageReset: false,
    clearStorageTypes: ['file_systems', 'shader_cache', 'service_workers', 'cache_storage'],
    
    // Skip certain audits that might not be relevant
    skipAudits: [
      'canonical', // We might not have canonical URLs set up yet
      'robots-txt', // We might not have robots.txt yet
      'structured-data', // We might not have structured data yet
    ],
    
    // Budget configurations for different resource types
    budgets: [
      {
        path: '/*',
        resourceSizes: [
          { resourceType: 'script', budget: 400000 }, // 400KB for JavaScript
          { resourceType: 'image', budget: 200000 },  // 200KB for images
          { resourceType: 'stylesheet', budget: 75000 }, // 75KB for CSS
          { resourceType: 'document', budget: 18000 },   // 18KB for HTML
          { resourceType: 'font', budget: 100000 },      // 100KB for fonts
          { resourceType: 'other', budget: 25000 },      // 25KB for other resources
        ],
        resourceCounts: [
          { resourceType: 'script', budget: 15 },     // Max 15 JS files
          { resourceType: 'stylesheet', budget: 4 },   // Max 4 CSS files
          { resourceType: 'image', budget: 20 },       // Max 20 images
          { resourceType: 'font', budget: 4 },         // Max 4 font files
        ],
      },
    ],
  },
};