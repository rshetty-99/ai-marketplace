import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

// Mock the vector search service
jest.mock('@/lib/ai/semantic-search/vector-search-service', () => ({
  getVectorSearchService: jest.fn(),
}));

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    FIREBASE_PROJECT_ID: 'test-project',
    OPENAI_API_KEY: 'test-api-key',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('/api/search/semantic', () => {
  let mockSearchService: any;

  beforeEach(() => {
    mockSearchService = {
      search: jest.fn(),
      healthCheck: jest.fn(),
    };

    const { getVectorSearchService } = require('@/lib/ai/semantic-search/vector-search-service');
    getVectorSearchService.mockReturnValue(mockSearchService);
  });

  describe('POST endpoint', () => {
    it('should handle valid search request', async () => {
      const mockSearchResponse = {
        success: true,
        data: {
          results: [
            {
              serviceId: 'service-1',
              score: 0.9,
              distance: 0.1,
              service: { id: 'service-1', name: 'AI Service' },
            },
          ],
          totalCount: 1,
          queryMetadata: {
            originalQuery: 'machine learning',
            processedQuery: 'machine learning artificial intelligence',
            queryEmbedding: new Array(1536).fill(0.5),
            intent: { category: 'product_search', confidence: 0.8, entities: {} },
            strategy: { primary: 'hybrid', fallbacks: [], weights: {} },
          },
          performance: {
            totalTime: 150,
            vectorSearchTime: 100,
            textSearchTime: 30,
            filterTime: 10,
            rankingTime: 10,
            documentsScanned: 100,
            cacheStatus: 'miss',
          },
        },
        metadata: {
          requestId: 'test-request-id',
          timestamp: new Date(),
          processingTime: 150,
          version: '1.0.0',
        },
      };

      mockSearchService.search.mockResolvedValue(mockSearchResponse);

      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'machine learning AI services',
          filters: {
            categories: ['machine_learning'],
            priceRange: { min: 100, max: 1000 },
          },
          options: {
            limit: 20,
            threshold: 0.7,
            includeExplanation: true,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.results).toHaveLength(1);
      expect(data.data.totalCount).toBe(1);
      expect(mockSearchService.search).toHaveBeenCalledWith({
        query: 'machine learning AI services',
        filters: {
          categories: ['machine_learning'],
          priceRange: { min: 100, max: 1000 },
        },
        options: {
          limit: 20,
          threshold: 0.7,
          includeExplanation: true,
        },
      });
    });

    it('should handle missing query', async () => {
      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          filters: { categories: ['machine_learning'] },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('empty');
    });

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_JSON');
    });

    it('should handle invalid limit in options', async () => {
      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test',
          options: { limit: 150 }, // Over max limit
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Limit');
    });

    it('should handle invalid threshold', async () => {
      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test',
          options: { threshold: 1.5 }, // Over max threshold
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('Threshold');
    });

    it('should handle invalid price range filters', async () => {
      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test',
          filters: {
            priceRange: { min: 1000, max: 500 }, // min > max
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toContain('priceRange.min cannot be greater than priceRange.max');
    });

    it('should handle search service errors', async () => {
      mockSearchService.search.mockResolvedValue({
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Internal search error',
        },
        metadata: {
          requestId: 'test-request-id',
          timestamp: new Date(),
          processingTime: 0,
          version: '1.0.0',
        },
      });

      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test query',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SEARCH_FAILED');
    });

    it('should handle missing environment variables', async () => {
      process.env.FIREBASE_PROJECT_ID = '';

      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test query',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CONFIGURATION_ERROR');
    });

    it('should handle internal server errors', async () => {
      mockSearchService.search.mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test query',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('GET endpoint', () => {
    it('should return API documentation', async () => {
      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Semantic Search API');
      expect(data.version).toBe('1.0.0');
      expect(data.endpoints).toBeDefined();
    });

    it('should handle health check endpoint', async () => {
      mockSearchService.healthCheck.mockResolvedValue({
        healthy: true,
        message: 'Service is healthy',
        details: { test: true },
      });

      const request = new NextRequest('http://localhost:3000/api/search/semantic/health', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.healthy).toBe(true);
      expect(mockSearchService.healthCheck).toHaveBeenCalled();
    });

    it('should handle unhealthy service', async () => {
      mockSearchService.healthCheck.mockResolvedValue({
        healthy: false,
        message: 'Service is unhealthy',
      });

      const request = new NextRequest('http://localhost:3000/api/search/semantic/health', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.healthy).toBe(false);
    });

    it('should handle missing environment variables in health check', async () => {
      process.env.OPENAI_API_KEY = '';

      const request = new NextRequest('http://localhost:3000/api/search/semantic/health', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.healthy).toBe(false);
      expect(data.details.missingEnvVars).toContain('OPENAI_API_KEY');
    });
  });

  describe('validation functions', () => {
    it('should validate array filters correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test',
          filters: {
            categories: 'invalid', // Should be array
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toContain('categories must be an array');
    });

    it('should validate minRating correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'test',
          filters: {
            minRating: 6, // Should be <= 5
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.message).toContain('minRating must be a number between 0 and 5');
    });

    it('should accept valid complex filters', async () => {
      mockSearchService.search.mockResolvedValue({
        success: true,
        data: { results: [], totalCount: 0 },
        metadata: { requestId: 'test', timestamp: new Date(), processingTime: 0, version: '1.0.0' },
      });

      const request = new NextRequest('http://localhost:3000/api/search/semantic', {
        method: 'POST',
        body: JSON.stringify({
          query: 'machine learning',
          filters: {
            categories: ['machine_learning', 'computer_vision'],
            industries: ['healthcare', 'finance'],
            providerTypes: ['vendor'],
            priceRange: { min: 100, max: 1000 },
            minRating: 4.0,
            locations: ['north_america'],
            technologies: ['tensorflow', 'pytorch'],
            features: ['api_access', 'custom_training'],
            compliance: ['hipaa', 'gdpr'],
          },
          options: {
            limit: 50,
            offset: 0,
            threshold: 0.8,
            distanceMeasure: 'COSINE',
            includeTextSearch: true,
            includeExplanation: true,
            diversify: true,
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});