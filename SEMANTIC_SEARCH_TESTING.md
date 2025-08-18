# Semantic Search Testing Guide

This guide provides comprehensive instructions for testing the semantic search implementation before integrating it into the UI.

## 🚀 Quick Start Testing

### Prerequisites

1. **Environment Variables** - Set up your `.env.local` file:
```bash
# Required for all tests
FIREBASE_PROJECT_ID=your-firebase-project-id
OPENAI_API_KEY=your-openai-api-key

# Optional for Firebase integration
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

2. **Dependencies** - Install required packages:
```bash
npm install
```

3. **Build the Project** - Compile TypeScript:
```bash
npm run build
```

### Phase 1: Unit Tests

Run comprehensive unit tests for all semantic search components:

```bash
# Run all unit tests
npm run test:unit

# Run only semantic search unit tests
npm run test:unit -- --testPathPattern=semantic-search

# Run unit tests with coverage
npm run test:unit:coverage
```

**Expected Results:**
- ✅ All utility functions tested (ContentExtractor, QueryProcessor, SimilarityCalculator)
- ✅ Embedding service validation and error handling
- ✅ API endpoint request/response validation
- ✅ Performance monitoring functionality

### Phase 2: Setup Test Data

Create sample services for testing:

```bash
# Preview test data structure (dry run)
node scripts/setup-test-data.js --dry-run

# Create 20 test services
node scripts/setup-test-data.js --count 20

# Create test services with embeddings (requires OpenAI API key)
node scripts/setup-test-data.js --count 20 --with-embeddings

# Clean and recreate test data
node scripts/setup-test-data.js --clean --count 30 --with-embeddings
```

**Expected Results:**
- ✅ Sample services created in Firestore
- ✅ Diverse categories (computer vision, NLP, predictive analytics)
- ✅ Realistic service data with descriptions, tags, pricing
- ✅ Optional: Embeddings generated for all test services

### Phase 3: Start Development Server

```bash
npm run dev
```

The server should start on `http://localhost:3000`

### Phase 4: API Health Check

Verify that all services are operational:

```bash
# Basic health check
curl http://localhost:3000/api/search/semantic/health

# Detailed health check with verbose output
node scripts/test-semantic-search.js api --verbose
```

**Expected Health Check Response:**
```json
{
  "healthy": true,
  "message": "All services operational",
  "services": {
    "vectorSearch": { "healthy": true },
    "embedding": { "healthy": true },
    "firestore": { "healthy": true },
    "openai": { "healthy": true }
  },
  "performance": { ... },
  "configuration": { ... }
}
```

## 🧪 Comprehensive Testing Suites

### 1. API Endpoint Tests

Test all API endpoints and error handling:

```bash
# Test API endpoints
npm run test:semantic:api

# With verbose output
npm run test:semantic:api -- --verbose
```

**What This Tests:**
- ✅ Basic semantic search requests
- ✅ Complex filter combinations
- ✅ Input validation and error handling
- ✅ Health check endpoints
- ✅ Response format validation

### 2. Search Functionality Tests

Test search queries with realistic scenarios:

```bash
# Test search functionality
npm run test:semantic:search

# All search tests with verbose output
npm run test:semantic:search -- --verbose
```

**Test Scenarios:**
- ✅ Simple keyword searches ("machine learning")
- ✅ Semantic intent searches ("I need AI to analyze documents")
- ✅ Industry-specific searches ("healthcare AI compliance HIPAA")
- ✅ Technology stack searches ("tensorflow pytorch deep learning")
- ✅ Budget-conscious searches ("affordable AI for startups")
- ✅ Complex multi-filter searches

### 3. Performance Tests

Validate performance under different load conditions:

```bash
# Run performance tests
npm run test:semantic:performance

# All tests including performance
npm run test:semantic
```

**Performance Metrics:**
- ✅ Single search latency (target: <500ms)
- ✅ Concurrent search handling (5 concurrent users)
- ✅ High concurrency stress test (10+ concurrent users)
- ✅ Throughput measurement (requests per second)

### 4. Embedding Generation Tests

Test the embedding pipeline:

```bash
# Test embedding generation for a few services
npm run embeddings:dry-run

# Generate embeddings for test services
npm run embeddings:generate specific test-service-1,test-service-2,test-service-3

# Process all test services
npm run embeddings:generate all --batch-size 5
```

**Expected Results:**
- ✅ Embeddings generated successfully
- ✅ Content extraction working correctly
- ✅ Cost tracking and token counting
- ✅ Error handling for invalid content

## 🔍 Manual Testing Scenarios

### Test Case 1: Basic Semantic Search

**API Request:**
```bash
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning document processing",
    "options": {
      "limit": 10,
      "includeExplanation": true
    }
  }'
```

**Expected Response:**
- Results containing document processing and ML services
- Semantic similarity scores > 0.7
- Explanations showing why results matched

### Test Case 2: Filtered Search

**API Request:**
```bash
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "AI for healthcare",
    "filters": {
      "industries": ["healthcare"],
      "compliance": ["hipaa"],
      "priceRange": {"min": 100, "max": 1000}
    },
    "options": {
      "limit": 5,
      "threshold": 0.6
    }
  }'
```

**Expected Response:**
- Only healthcare-focused services
- HIPAA compliant services
- Prices within $100-$1000 range
- Relevant semantic matches for "AI for healthcare"

### Test Case 3: Intent-Based Search

**API Request:**
```bash
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "I need affordable automation for my startup",
    "options": {
      "limit": 10,
      "includeExplanation": true
    }
  }'
```

**Expected Response:**
- Services targeting startups
- Affordable pricing tiers
- Automation-focused solutions
- Intent detection showing "specific_need" category

## 📊 Validation Checklist

### ✅ Core Functionality
- [ ] Embedding generation works without errors
- [ ] Vector similarity calculations are accurate
- [ ] Search API returns relevant results
- [ ] Filters properly narrow down results
- [ ] Performance metrics are within acceptable ranges

### ✅ Error Handling
- [ ] Invalid queries return proper error messages
- [ ] Missing environment variables are handled gracefully
- [ ] API rate limits are respected
- [ ] Network failures don't crash the system
- [ ] Malformed requests return validation errors

### ✅ Data Quality
- [ ] Test services have realistic content
- [ ] Embeddings are generated consistently
- [ ] Search results show proper ranking
- [ ] Filters work with test data
- [ ] Multiple categories represented in results

### ✅ Performance
- [ ] Search responses < 1000ms for simple queries
- [ ] Concurrent requests handled without errors
- [ ] Memory usage remains stable during testing
- [ ] No memory leaks during repeated requests
- [ ] Embedding generation completes within reasonable time

## 🐛 Common Issues and Solutions

### Issue: "OpenAI API key not configured"
**Solution:** Set `OPENAI_API_KEY` in your `.env.local` file

### Issue: "Firestore connection failed"
**Solution:** 
1. Verify `FIREBASE_PROJECT_ID` is correct
2. Ensure Firebase project exists and is accessible
3. Check network connectivity

### Issue: "No results found" for valid queries
**Solution:**
1. Ensure test data exists: `node scripts/setup-test-data.js`
2. Generate embeddings: `npm run embeddings:all`
3. Check if services have embeddings in Firestore

### Issue: High search latency (>2000ms)
**Solution:**
1. Check network latency to OpenAI API
2. Verify Firestore performance
3. Reduce batch sizes in configuration
4. Enable caching in production settings

### Issue: "Invalid embedding generated"
**Solution:**
1. Check content extraction for empty/invalid content
2. Verify OpenAI model configuration
3. Ensure content length is within limits

## 📈 Performance Benchmarks

### Acceptable Performance Targets

| Metric | Target | Excellent |
|--------|---------|-----------|
| Search Latency | <1000ms | <500ms |
| Embedding Generation | <3s per service | <1s per service |
| Concurrent Users | 5+ | 20+ |
| Throughput | 10 req/s | 50+ req/s |
| Error Rate | <5% | <1% |

### Performance Testing Commands

```bash
# Quick performance check
npm run test:semantic:performance

# Stress test with custom parameters
TEST_BASE_URL=http://localhost:3000 node scripts/test-semantic-search.js performance --verbose

# Monitor during load testing
# (Run in separate terminal)
curl http://localhost:3000/api/search/semantic/health
```

## 🎯 Success Criteria

Before proceeding to UI integration, ensure:

1. **✅ All Tests Pass**
   - Unit tests: 100% pass rate
   - API tests: All endpoints working
   - Search tests: Relevant results returned
   - Performance tests: Within target metrics

2. **✅ Error Handling**
   - Graceful handling of all error scenarios
   - Proper validation messages
   - No system crashes under load

3. **✅ Data Quality**
   - Test services have realistic content
   - Search results are semantically relevant
   - Filters work as expected

4. **✅ Performance**
   - Search latency under 1000ms
   - Can handle 5+ concurrent users
   - No memory leaks or stability issues

## 🚀 Next Steps

Once all tests pass and validation is complete:

1. **UI Integration**: Update search components to use semantic search API
2. **A/B Testing**: Compare semantic search vs traditional search
3. **User Training**: Update search tips and help documentation
4. **Monitoring**: Set up production monitoring and alerting
5. **Optimization**: Fine-tune based on user feedback and usage patterns

## 📞 Support

If you encounter issues during testing:

1. Check the troubleshooting section above
2. Review logs in the console output
3. Verify environment configuration
4. Test with smaller datasets first
5. Use verbose output for detailed debugging

Happy testing! 🧪✨