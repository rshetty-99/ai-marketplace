#!/usr/bin/env node

/**
 * Manual Testing Script for Semantic Search
 * 
 * This script tests the semantic search implementation with sample data
 * and provides comprehensive validation of all components.
 * 
 * Usage:
 *   node scripts/test-semantic-search.js [test-suite]
 *   
 * Test Suites:
 *   all            Run all tests (default)
 *   unit           Run unit tests only
 *   api            Test API endpoints
 *   embeddings     Test embedding generation
 *   search         Test search functionality
 *   performance    Run performance tests
 *   
 * Options:
 *   --verbose      Detailed output
 *   --skip-setup   Skip test data setup
 *   --help         Show this help message
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiKey: process.env.TEST_API_KEY || '',
  timeout: 30000,
  verbose: false,
  skipSetup: false,
};

// Test data
const testQueries = [
  {
    name: 'Simple keyword search',
    query: 'machine learning',
    expectedResults: 5,
    expectedCategories: ['machine_learning', 'natural_language_processing'],
  },
  {
    name: 'Semantic intent search',
    query: 'I need AI to analyze documents',
    expectedResults: 3,
    expectedCategories: ['computer_vision', 'natural_language_processing'],
  },
  {
    name: 'Industry-specific search',
    query: 'healthcare AI compliance HIPAA',
    expectedResults: 2,
    filters: {
      industries: ['healthcare'],
      compliance: ['hipaa'],
    },
  },
  {
    name: 'Technology stack search',
    query: 'tensorflow pytorch deep learning',
    expectedResults: 4,
    filters: {
      technologies: ['tensorflow', 'pytorch'],
    },
  },
  {
    name: 'Budget-conscious search',
    query: 'affordable AI for startups',
    expectedResults: 3,
    filters: {
      priceRange: { min: 0, max: 500 },
    },
  },
  {
    name: 'Complex multi-filter search',
    query: 'enterprise computer vision API',
    expectedResults: 2,
    filters: {
      categories: ['computer_vision'],
      providerTypes: ['vendor'],
      features: ['api_access', 'enterprise_support'],
      priceRange: { min: 1000, max: null },
    },
    options: {
      limit: 10,
      threshold: 0.7,
      includeExplanation: true,
    },
  },
];

const testServices = [
  {
    id: 'test-cv-service-1',
    name: 'DocuVision AI',
    description: 'Advanced computer vision service for document processing and analysis. Uses state-of-the-art OCR and machine learning to extract information from invoices, contracts, and forms.',
    category: 'computer_vision',
    subcategory: 'document_processing',
    tags: ['OCR', 'document', 'AI', 'machine learning', 'invoice'],
    features: ['api_access', 'batch_processing', 'real_time', 'custom_training'],
    industries: ['finance', 'healthcare', 'legal'],
    technologies: ['tensorflow', 'opencv', 'tesseract'],
    providerType: 'vendor',
    pricing: { startingPrice: 299, billingCycle: 'monthly' },
    rating: 4.7,
    reviewCount: 127,
    compliance: ['soc2', 'gdpr', 'hipaa'],
    locations: ['north_america', 'europe'],
  },
  {
    id: 'test-nlp-service-1',
    name: 'TextSense Pro',
    description: 'Natural language processing platform for sentiment analysis, text classification, and entity extraction. Perfect for social media monitoring and customer feedback analysis.',
    category: 'natural_language_processing',
    subcategory: 'sentiment_analysis',
    tags: ['NLP', 'sentiment', 'text analysis', 'social media', 'AI'],
    features: ['api_access', 'real_time', 'custom_models', 'multi_language'],
    industries: ['marketing', 'retail', 'media'],
    technologies: ['transformers', 'spacy', 'pytorch'],
    providerType: 'vendor',
    pricing: { startingPrice: 199, billingCycle: 'monthly' },
    rating: 4.5,
    reviewCount: 89,
    compliance: ['soc2', 'gdpr'],
    locations: ['global'],
  },
  {
    id: 'test-ml-service-1',
    name: 'PredictAI Suite',
    description: 'Comprehensive machine learning platform for predictive analytics, demand forecasting, and risk assessment. Enterprise-grade solution with custom model training.',
    category: 'predictive_analytics',
    subcategory: 'demand_forecasting',
    tags: ['predictive analytics', 'forecasting', 'ML', 'enterprise', 'custom models'],
    features: ['enterprise_support', 'custom_training', 'api_access', 'sla_guarantee'],
    industries: ['finance', 'retail', 'manufacturing'],
    technologies: ['scikit_learn', 'xgboost', 'tensorflow'],
    providerType: 'vendor',
    pricing: { startingPrice: 1999, billingCycle: 'monthly' },
    rating: 4.8,
    reviewCount: 156,
    compliance: ['soc2', 'iso27001', 'fedramp'],
    locations: ['north_america', 'europe', 'asia_pacific'],
  },
  {
    id: 'test-startup-service-1',
    name: 'AIQuick Start',
    description: 'Affordable AI solution for startups and small businesses. Quick setup chatbot and automation tools with no coding required.',
    category: 'natural_language_processing',
    subcategory: 'chatbots',
    tags: ['chatbot', 'startup', 'affordable', 'no-code', 'automation'],
    features: ['no_code', 'free_trial', 'easy_setup', 'template_library'],
    industries: ['technology', 'ecommerce', 'services'],
    technologies: ['openai', 'dialogflow'],
    providerType: 'agency',
    pricing: { startingPrice: 49, billingCycle: 'monthly' },
    rating: 4.2,
    reviewCount: 34,
    compliance: ['gdpr'],
    locations: ['global'],
  },
];

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  performance: {},
};

/**
 * Main test runner
 */
async function main() {
  const args = process.argv.slice(2);
  const testSuite = args[0] || 'all';
  
  config.verbose = args.includes('--verbose');
  config.skipSetup = args.includes('--skip-setup');
  
  if (args.includes('--help')) {
    showHelp();
    return;
  }
  
  console.log('🧪 Semantic Search Testing Suite');
  console.log('================================');
  console.log(`Test Suite: ${testSuite}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Verbose: ${config.verbose ? 'Yes' : 'No'}`);
  console.log('');
  
  try {
    // Setup test environment
    if (!config.skipSetup) {
      await setupTestEnvironment();
    }
    
    // Run test suites
    switch (testSuite) {
      case 'all':
        await runAllTests();
        break;
      case 'unit':
        await runUnitTests();
        break;
      case 'api':
        await runApiTests();
        break;
      case 'embeddings':
        await runEmbeddingTests();
        break;
      case 'search':
        await runSearchTests();
        break;
      case 'performance':
        await runPerformanceTests();
        break;
      default:
        console.error(`❌ Unknown test suite: ${testSuite}`);
        showHelp();
        process.exit(1);
    }
    
    // Show results
    showResults();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');
  
  try {
    // Check if server is running
    await makeRequest('GET', '/api/search/semantic/health');
    console.log('✅ Server is running');
    
    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not set - some tests may fail');
    }
    
    if (!process.env.FIREBASE_PROJECT_ID) {
      console.warn('⚠️  FIREBASE_PROJECT_ID not set - some tests may fail');
    }
    
  } catch (error) {
    throw new Error(`Test environment setup failed: ${error.message}`);
  }
}

/**
 * Run all test suites
 */
async function runAllTests() {
  console.log('🚀 Running all test suites...\n');
  
  await runApiTests();
  await runEmbeddingTests();
  await runSearchTests();
  await runPerformanceTests();
}

/**
 * Run unit tests (delegates to Jest)
 */
async function runUnitTests() {
  console.log('🧪 Running unit tests...\n');
  
  try {
    const { spawn } = require('child_process');
    
    const jestProcess = spawn('npm', ['run', 'test:unit', '--', '--testPathPattern=semantic-search'], {
      stdio: 'inherit',
      shell: true,
    });
    
    await new Promise((resolve, reject) => {
      jestProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Unit tests passed');
          resolve();
        } else {
          reject(new Error(`Unit tests failed with code ${code}`));
        }
      });
    });
    
    testResults.passed++;
    
  } catch (error) {
    console.error('❌ Unit tests failed:', error.message);
    testResults.failed++;
    testResults.errors.push(`Unit tests: ${error.message}`);
  }
  
  testResults.total++;
}

/**
 * Test API endpoints
 */
async function runApiTests() {
  console.log('🌐 Testing API endpoints...\n');
  
  // Test health check
  await runTest('Health Check', async () => {
    const response = await makeRequest('GET', '/api/search/semantic/health');
    
    if (!response.healthy) {
      throw new Error(`Health check failed: ${response.message}`);
    }
    
    if (config.verbose) {
      console.log('Health details:', JSON.stringify(response.details, null, 2));
    }
    
    return 'API is healthy';
  });
  
  // Test API documentation
  await runTest('API Documentation', async () => {
    const response = await makeRequest('GET', '/api/search/semantic');
    
    if (!response.name || !response.version) {
      throw new Error('Invalid API documentation response');
    }
    
    return `API version ${response.version}`;
  });
  
  // Test basic search
  await runTest('Basic Search Request', async () => {
    const response = await makeRequest('POST', '/api/search/semantic', {
      query: 'machine learning',
      options: { limit: 5 },
    });
    
    if (!response.success || !response.data) {
      throw new Error(`Search failed: ${response.error?.message || 'Unknown error'}`);
    }
    
    return `Found ${response.data.totalCount} results`;
  });
  
  // Test validation errors
  await runTest('Validation Error Handling', async () => {
    try {
      await makeRequest('POST', '/api/search/semantic', {
        query: '', // Invalid empty query
      });
      throw new Error('Should have returned validation error');
    } catch (error) {
      if (error.message.includes('400')) {
        return 'Validation errors handled correctly';
      }
      throw error;
    }
  });
  
  // Test complex filters
  await runTest('Complex Filter Request', async () => {
    const response = await makeRequest('POST', '/api/search/semantic', {
      query: 'artificial intelligence',
      filters: {
        categories: ['machine_learning'],
        priceRange: { min: 100, max: 1000 },
        minRating: 4.0,
        industries: ['healthcare'],
      },
      options: {
        limit: 10,
        threshold: 0.7,
        includeExplanation: true,
      },
    });
    
    if (!response.success) {
      throw new Error(`Complex search failed: ${response.error?.message}`);
    }
    
    if (config.verbose && response.data.results.length > 0) {
      console.log('Sample result:', JSON.stringify(response.data.results[0], null, 2));
    }
    
    return `Complex search returned ${response.data.totalCount} results`;
  });
}

/**
 * Test embedding functionality
 */
async function runEmbeddingTests() {
  console.log('🧠 Testing embedding functionality...\n');
  
  // Test embedding generation API (if available)
  await runTest('Embedding Generation', async () => {
    // This would test a separate embedding endpoint if we create one
    // For now, we'll test the health check which includes embedding service
    const response = await makeRequest('GET', '/api/search/semantic/health');
    
    if (!response.services?.embedding?.healthy) {
      throw new Error('Embedding service is not healthy');
    }
    
    return 'Embedding service is operational';
  });
}

/**
 * Test search functionality with test queries
 */
async function runSearchTests() {
  console.log('🔍 Testing search functionality...\n');
  
  for (const testQuery of testQueries) {
    await runTest(`Search: ${testQuery.name}`, async () => {
      const requestBody = {
        query: testQuery.query,
        ...(testQuery.filters && { filters: testQuery.filters }),
        ...(testQuery.options && { options: testQuery.options }),
      };
      
      const response = await makeRequest('POST', '/api/search/semantic', requestBody);
      
      if (!response.success) {
        throw new Error(`Search failed: ${response.error?.message}`);
      }
      
      const { data } = response;
      
      // Validate results count
      if (testQuery.expectedResults && data.totalCount < testQuery.expectedResults) {
        console.warn(`⚠️  Expected at least ${testQuery.expectedResults} results, got ${data.totalCount}`);
      }
      
      // Validate categories if specified
      if (testQuery.expectedCategories && data.results.length > 0) {
        const foundCategories = data.results.map(r => r.service.category);
        const hasExpectedCategory = testQuery.expectedCategories.some(cat => 
          foundCategories.includes(cat)
        );
        
        if (!hasExpectedCategory) {
          console.warn(`⚠️  Expected categories ${testQuery.expectedCategories.join(', ')}, found ${[...new Set(foundCategories)].join(', ')}`);
        }
      }
      
      // Log performance metrics
      if (config.verbose && data.performance) {
        console.log(`Performance: ${data.performance.totalTime}ms (vector: ${data.performance.vectorSearchTime}ms, text: ${data.performance.textSearchTime}ms)`);
      }
      
      return `Found ${data.totalCount} results in ${data.performance.totalTime}ms`;
    });
  }
}

/**
 * Run performance tests
 */
async function runPerformanceTests() {
  console.log('⚡ Running performance tests...\n');
  
  const performanceTests = [
    { name: 'Single Search Latency', concurrency: 1, iterations: 10 },
    { name: 'Concurrent Search Load', concurrency: 5, iterations: 5 },
    { name: 'High Concurrency Stress', concurrency: 10, iterations: 3 },
  ];
  
  for (const perfTest of performanceTests) {
    await runTest(`Performance: ${perfTest.name}`, async () => {
      const startTime = Date.now();
      const promises = [];
      
      for (let i = 0; i < perfTest.concurrency; i++) {
        for (let j = 0; j < perfTest.iterations; j++) {
          const testQuery = testQueries[j % testQueries.length];
          const promise = makeRequest('POST', '/api/search/semantic', {
            query: testQuery.query,
            options: { limit: 10 },
          });
          promises.push(promise);
        }
      }
      
      const results = await Promise.allSettled(promises);
      const endTime = Date.now();
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const totalTime = endTime - startTime;
      const avgLatency = totalTime / promises.length;
      const throughput = (promises.length / totalTime) * 1000; // requests per second
      
      // Record performance metrics
      testResults.performance[perfTest.name] = {
        totalRequests: promises.length,
        successful,
        failed,
        totalTime,
        avgLatency,
        throughput,
      };
      
      if (failed > 0) {
        console.warn(`⚠️  ${failed} requests failed`);
      }
      
      return `${successful}/${promises.length} successful, ${avgLatency.toFixed(1)}ms avg, ${throughput.toFixed(1)} req/s`;
    });
  }
}

/**
 * Run a single test with error handling
 */
async function runTest(name, testFunction) {
  testResults.total++;
  
  try {
    const startTime = Date.now();
    const result = await testFunction();
    const duration = Date.now() - startTime;
    
    console.log(`✅ ${name}: ${result} (${duration}ms)`);
    testResults.passed++;
    
  } catch (error) {
    console.error(`❌ ${name}: ${error.message}`);
    testResults.failed++;
    testResults.errors.push(`${name}: ${error.message}`);
    
    if (config.verbose) {
      console.error(`   Stack: ${error.stack}`);
    }
  }
}

/**
 * Make HTTP request to API
 */
async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, config.baseUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? require('https') : require('http');
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'semantic-search-test-client/1.0.0',
      },
      timeout: config.timeout,
    };
    
    if (config.apiKey) {
      options.headers['Authorization'] = `Bearer ${config.apiKey}`;
    }
    
    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${jsonData.error?.message || data}`));
          } else {
            resolve(jsonData);
          }
        } catch (parseError) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

/**
 * Show test results summary
 */
function showResults() {
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (Object.keys(testResults.performance).length > 0) {
    console.log('\n⚡ Performance Results:');
    for (const [name, metrics] of Object.entries(testResults.performance)) {
      console.log(`├── ${name}:`);
      console.log(`│   ├── Avg Latency: ${metrics.avgLatency.toFixed(1)}ms`);
      console.log(`│   ├── Throughput: ${metrics.throughput.toFixed(1)} req/s`);
      console.log(`│   └── Success Rate: ${((metrics.successful / metrics.totalRequests) * 100).toFixed(1)}%`);
    }
  }
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    testResults.errors.forEach(error => {
      console.log(`   └── ${error}`);
    });
  }
  
  const exitCode = testResults.failed > 0 ? 1 : 0;
  console.log(`\n${exitCode === 0 ? '🎉 All tests passed!' : '💥 Some tests failed!'}`);
  
  process.exit(exitCode);
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
🧪 Semantic Search Testing Suite

USAGE:
  node scripts/test-semantic-search.js [test-suite] [options]

TEST SUITES:
  all          Run all tests (default)
  unit         Run unit tests only
  api          Test API endpoints
  embeddings   Test embedding generation
  search       Test search functionality
  performance  Run performance tests

OPTIONS:
  --verbose      Detailed output including response samples
  --skip-setup   Skip test environment setup
  --help         Show this help message

ENVIRONMENT VARIABLES:
  TEST_BASE_URL     Base URL for API tests (default: http://localhost:3000)
  TEST_API_KEY      API key for authenticated requests (optional)
  OPENAI_API_KEY    OpenAI API key (required for embedding tests)
  FIREBASE_PROJECT_ID Firebase project ID (required for search tests)

EXAMPLES:
  # Run all tests
  node scripts/test-semantic-search.js

  # Test only API endpoints with detailed output
  node scripts/test-semantic-search.js api --verbose

  # Run performance tests against production
  TEST_BASE_URL=https://api.example.com node scripts/test-semantic-search.js performance
`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Test interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Test terminated');
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Unexpected error:', error.message);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}